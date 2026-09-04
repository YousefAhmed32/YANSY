const { Message, MessageThread } = require('../models/Message');
const { createNotification }    = require('./notificationController');
const { logActivity }           = require('./activityController');

// Notification deep-links must land on the interface the recipient actually
// uses — an admin clicking a "customer replied" notification landing on the
// customer-facing /app/messages page (which shows THEIR OWN inbox, not the
// customer's) was a real, silent bug. `?thread=<id>` lets the target page
// auto-select the right conversation instead of guessing the most-recent one.
const customerMessagesLink = (threadId) => `/app/messages?thread=${threadId}`;
const adminMessagesLink    = (threadId) => `/app/admin/messages?thread=${threadId}`;

const THREAD_STATUSES = [
  'open', 'waiting_for_admin', 'waiting_for_customer', 'resolved', 'closed',
  'pending', 'in_progress',  // legacy
];

// Find first available admin/superadmin for customer→support routing
const findSupportAdmin = async () => {
  const User = require('../models/User');
  return User.findOne({ role: { $in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: { $ne: false } })
    .sort({ role: -1 }) // SUPER_ADMIN first
    .lean();
};

// Notify all admins (for customer → support messages)
const notifyAllAdmins = async ({ title, message, link, groupKey, refId, io, priority = 'medium' }) => {
  const User = require('../models/User');
  const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: { $ne: false } })
    .select('_id').lean();
  await Promise.all(admins.map(admin =>
    createNotification({
      userId: admin._id,
      type: 'customer_reply',
      title,
      message,
      link,
      priority,
      groupKey,
      refType: 'Message',
      refId,
      io,
    })
  ));
};

// Bump unread counts for all non-sender participants.
//
// `thread.participants` is sometimes an array of raw ObjectIds (createThread
// builds a brand-new thread from `[req.user._id, recipient]`, never
// populated) and sometimes an array of fully populated User documents
// (sendMessage's `MessageThread.findById(...).populate('participants', ...)`
// — needed there to resolve the reply's recipient). A populated Mongoose
// document's `.toString()` does NOT return its id — it serializes toward a
// long object-ish string — so calling this unconditionally on `pid` broke
// every reply into an *existing* thread with a 500 the instant
// `unreadCounts.set(that huge string, ...)` hit Mongoose's Map key
// validation (which rejects keys containing "."). The message itself had
// already been created by that point, so this crash also meant
// `thread.save()`, the real-time `message-received` broadcast, and the
// recipient's notification never ran for a reply that otherwise looked
// like it worked.
const bumpUnread = async (thread, senderId) => {
  const senderIdStr = senderId.toString();
  for (const p of thread.participants) {
    const id = (p && p._id ? p._id : p).toString();
    if (id !== senderIdStr) {
      const current = thread.unreadCounts.get(id) || 0;
      thread.unreadCounts.set(id, current + 1);
    }
  }
};
exports._bumpUnread = bumpUnread; // exported for unit testing only — see __tests__/messageController.test.js

// ── GET /threads ──────────────────────────────────────────────────────────────
exports.getThreads = async (req, res, next) => {
  try {
    const isAdmin   = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const page      = Math.max(1, parseInt(req.query.page)  || 1);
    const limit     = Math.min(50, parseInt(req.query.limit) || 30);
    const archived  = req.query.archived === 'true';
    const type      = req.query.type;
    const status    = req.query.status;
    const priority  = req.query.priority;
    const unreadOnly= req.query.unread === 'true';
    const assignedToMe = req.query.assigned === 'me';

    // Admins see ALL threads; customers see only their own
    const query = isAdmin
      ? { isArchived: archived }
      : { participants: req.user._id, isArchived: archived };

    if (type)     query.type     = type;
    if (status)   query.status   = status;
    if (priority) query.priority = priority;
    if (isAdmin && assignedToMe) query.assignedTo = req.user._id;

    const [threads, total] = await Promise.all([
      MessageThread.find(query)
        .populate('participants', 'fullName email avatar role companyName phoneNumber customerStatus leadScore plan')
        .populate('project', 'title')
        .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'fullName email role' } })
        .populate('assignedTo', 'fullName email')
        .sort({ isPinned: -1, lastActivity: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      MessageThread.countDocuments(query),
    ]);

    const userId = req.user._id.toString();
    // .lean() already returns plain objects (no .toObject() needed) and
    // serializes the `unreadCounts` Map field as a plain object, not a Map
    // instance — hence the bracket lookup instead of .get().
    let enriched = threads.map(t => ({
      ...t,
      unreadCount: t.unreadCounts?.[userId] || 0,
    }));

    // Filter unread-only client-side (avoids complex query)
    if (unreadOnly) {
      enriched = enriched.filter(t => t.unreadCount > 0);
    }

    res.json({ threads: enriched, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    next(error);
  }
};

// ── GET /threads/:id ──────────────────────────────────────────────────────────
exports.getThread = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    const thread = await MessageThread.findById(req.params.id)
      .populate('participants', 'fullName email avatar role companyName phoneNumber customerStatus leadScore')
      .populate('project', 'title')
      .populate('assignedTo', 'fullName email');

    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    // Customers can only see their own threads
    if (!isAdmin && !thread.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Pagination: default page is the most recent `limit` messages (newest
    // conversations load fast even after a long history accumulates).
    // Pass `before` (an ISO timestamp, e.g. the oldest currently-loaded
    // message's createdAt) to page further back in history.
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const before = req.query.before ? new Date(req.query.before) : null;

    const msgQuery = { threadId: thread._id };
    if (before && !Number.isNaN(before.getTime())) {
      msgQuery.createdAt = { $lt: before };
    }

    const page = await Message.find(msgQuery)
      .populate('sender', 'fullName email role avatar')
      .populate('attachments')
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    const hasMore  = page.length > limit;
    const messages = page.slice(0, limit).reverse(); // oldest → newest for rendering

    // Mark read + reset unread counter — only meaningful on the initial
    // (most-recent) load; paging into older history doesn't affect it.
    if (!before) {
      await Message.updateMany(
        { threadId: thread._id, recipient: req.user._id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      const userId = req.user._id.toString();
      thread.unreadCounts.set(userId, 0);
      await thread.save();

      // Let other participants (the sender) see their message flip to "read"
      // live, without polling.
      if (req.io) {
        req.io.to(`thread:${thread._id}`).emit('thread-read', {
          threadId: thread._id, readBy: req.user._id,
        });
      }
    }

    res.json({ thread, messages, hasMore });
  } catch (error) {
    next(error);
  }
};

// ── GET /projects/:projectId/thread ───────────────────────────────────────────
exports.getThreadByProject = async (req, res, next) => {
  try {
    const thread = await MessageThread.findOne({
      project: req.params.projectId,
      participants: req.user._id,
    })
      .populate('participants', 'fullName email role avatar companyName phoneNumber')
      .populate('project', 'title')
      .populate('assignedTo', 'fullName email');

    if (!thread) return res.status(404).json({ error: 'Thread not found for this project' });

    const messages = await Message.find({ threadId: thread._id })
      .populate('sender', 'fullName email role avatar')
      .populate('attachments')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { threadId: thread._id, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ thread, messages });
  } catch (error) {
    next(error);
  }
};

// ── POST /threads ─────────────────────────────────────────────────────────────
exports.createThread = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const { subject, content, project, attachments, type = 'support', priority = 'medium' } = req.body;
    let { recipient } = req.body;

    // For customers: auto-route to support admin
    if (!isAdmin && !recipient) {
      const admin = await findSupportAdmin();
      if (!admin) return res.status(503).json({ error: 'Support team unavailable' });
      recipient = admin._id;
    }

    if (isAdmin && !recipient) {
      return res.status(400).json({ error: 'Recipient required' });
    }

    if (!(content && content.trim()) && !(Array.isArray(attachments) && attachments.length)) {
      return res.status(400).json({ error: 'Message must have content or at least one attachment' });
    }

    // Check for existing open thread between these participants (no project-specific threads)
    let thread = !project
      ? await MessageThread.findOne({
          participants: { $all: [req.user._id, recipient] },
          isArchived: false,
          status: { $nin: ['resolved', 'closed'] },
        })
      : null;

    if (!thread) {
      let threadSubject = subject || (type === 'support' ? 'Support Request' : `New ${type} conversation`);
      if (project) {
        const Project = require('../models/Project');
        const projectDoc = await Project.findById(project);
        if (projectDoc) threadSubject = `Project: ${projectDoc.title}`;
      }

      thread = await MessageThread.create({
        participants:  [req.user._id, recipient],
        project:       project || null,
        subject:       threadSubject,
        type,
        priority,
        status:        isAdmin ? 'waiting_for_customer' : 'waiting_for_admin',
        unreadCounts:  {},
      });
    }

    const message = await Message.create({
      threadId:    thread._id,
      sender:      req.user._id,
      recipient,
      content,
      attachments: attachments || [],
      project:     project || null,
    });

    await bumpUnread(thread, req.user._id);
    thread.lastMessage  = message._id;
    thread.lastActivity = new Date();
    await thread.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'fullName email role avatar')
      .populate('attachments');

    // Notify the other side
    if (!isAdmin) {
      await notifyAllAdmins({
        title:    'New support request',
        message:  `${req.user.fullName || 'Customer'}: ${content?.slice(0, 80)}${content?.length > 80 ? '…' : ''}`,
        link:     adminMessagesLink(thread._id),
        groupKey: `thread_${thread._id}`,
        refId:    message._id,
        io:       req.io,
        priority: priority === 'urgent' ? 'urgent' : 'high',
      });

      if (req.io) {
        req.io.to('admin_room').emit('new-thread', { threadId: thread._id });
      }
    } else {
      await createNotification({
        userId:   recipient,
        type:     'admin_reply',
        title:    'Message from YANSY Team',
        message:  `${req.user.fullName || 'Support'}: ${content?.slice(0, 80)}${content?.length > 80 ? '…' : ''}`,
        link:     customerMessagesLink(thread._id),
        priority: 'high',
        groupKey: `thread_${thread._id}`,
        refType:  'Message',
        refId:    message._id,
        io:       req.io,
      });
    }

    await logActivity({
      userId:      req.user._id,
      type:        'message_sent',
      description: `Started conversation: ${thread.subject}`,
      metadata:    { threadId: thread._id },
      req,
    });

    const threadPopulated = await MessageThread.findById(thread._id)
      .populate('participants', 'fullName email avatar role companyName phoneNumber')
      .populate('assignedTo', 'fullName email');

    res.status(201).json({ thread: threadPopulated, message: populated });
  } catch (error) {
    next(error);
  }
};

// ── POST /threads/:id/messages ────────────────────────────────────────────────
exports.sendMessage = async (req, res, next) => {
  try {
    const { content, attachments } = req.body;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    const thread = await MessageThread.findById(req.params.id)
      .populate('participants', 'fullName email avatar role companyName phoneNumber');

    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    // Auth check: customers can only message their own threads
    if (!isAdmin && !thread.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!(content && content.trim()) && !(Array.isArray(attachments) && attachments.length)) {
      return res.status(400).json({ error: 'Message must have content or at least one attachment' });
    }

    // Find the other participant
    const recipient = thread.participants.find(
      p => p._id.toString() !== req.user._id.toString()
    );

    const message = await Message.create({
      threadId:    thread._id,
      sender:      req.user._id,
      recipient:   recipient?._id,
      content,
      attachments: attachments || [],
      project:     thread.project,
    });

    await bumpUnread(thread, req.user._id);
    thread.lastMessage  = message._id;
    thread.lastActivity = new Date();

    // Status transitions
    if (isAdmin) {
      thread.status = 'waiting_for_customer';
    } else {
      thread.status = ['resolved', 'closed'].includes(thread.status) ? 'open' : 'waiting_for_admin';
    }
    await thread.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'fullName email role avatar')
      .populate('attachments');

    // Real-time broadcast to thread room
    if (req.io) {
      req.io.to(`thread:${thread._id}`).emit('message-received', {
        ...populated.toObject(),
        threadId: thread._id,
      });
      if (!isAdmin) {
        req.io.to('admin_room').emit('customer-message', { threadId: thread._id });
      }
    }

    // Notifications
    if (!isAdmin) {
      // Notify all admins
      await notifyAllAdmins({
        title:    'Customer replied',
        message:  `${req.user.fullName || 'Customer'}: ${content?.slice(0, 80)}${content?.length > 80 ? '…' : ''}`,
        link:     adminMessagesLink(thread._id),
        groupKey: `thread_${thread._id}`,
        refId:    message._id,
        io:       req.io,
        priority: thread.priority === 'urgent' ? 'urgent' : 'medium',
      });
    } else if (recipient?._id) {
      await createNotification({
        userId:   recipient._id,
        type:     'admin_reply',
        title:    'YANSY Team replied',
        message:  `${req.user.fullName || 'Support'}: ${content?.slice(0, 80)}${content?.length > 80 ? '…' : ''}`,
        link:     customerMessagesLink(thread._id),
        priority: 'high',
        groupKey: `thread_${thread._id}`,
        refType:  'Message',
        refId:    message._id,
        io:       req.io,
      });
    }

    await logActivity({
      userId:      req.user._id,
      type:        'message_sent',
      description: `Replied in: ${thread.subject}`,
      metadata:    { threadId: thread._id, messageId: message._id },
      req,
    });

    res.status(201).json({ message: populated });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /threads/:id/status ─────────────────────────────────────────────────
exports.updateThreadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!THREAD_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const existing = await MessageThread.findById(req.params.id).select('participants');
    if (!existing) return res.status(404).json({ error: 'Thread not found' });
    if (!isAdmin && !existing.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    const thread = await MessageThread.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (req.io) {
      req.io.to(`thread:${thread._id}`).emit('thread-updated', { threadId: thread._id, status });
    }
    res.json({ thread });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /threads/:id/priority ───────────────────────────────────────────────
exports.updateThreadPriority = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { priority } = req.body;
    const thread = await MessageThread.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true }
    );
    res.json({ thread });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /threads/:id/archive ────────────────────────────────────────────────
exports.archiveThread = async (req, res, next) => {
  try {
    const { archived = true } = req.body;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const existing = await MessageThread.findById(req.params.id).select('participants');
    if (!existing) return res.status(404).json({ error: 'Thread not found' });
    if (!isAdmin && !existing.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    const thread = await MessageThread.findByIdAndUpdate(
      req.params.id,
      { isArchived: archived },
      { new: true }
    );
    res.json({ thread });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /threads/:id/pin ────────────────────────────────────────────────────
// Pinning is an admin inbox-triage concept (sorts to top of the admin list) —
// no customer-facing equivalent exists, so unlike status/archive this is
// restricted to admins rather than opened up to thread participants.
exports.pinThread = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { pinned = true } = req.body;
    const thread = await MessageThread.findByIdAndUpdate(
      req.params.id,
      { isPinned: pinned },
      { new: true }
    );
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    res.json({ thread });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /threads/:id/assign ─────────────────────────────────────────────────
exports.assignThread = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { assignedTo } = req.body;
    const thread = await MessageThread.findByIdAndUpdate(
      req.params.id,
      { assignedTo: assignedTo || null },
      { new: true }
    ).populate('assignedTo', 'fullName email');
    res.json({ thread });
  } catch (error) {
    next(error);
  }
};

// ── GET /threads/search ───────────────────────────────────────────────────────
exports.searchThreads = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ threads: [] });

    const baseFilter = isAdmin
      ? { subject: { $regex: q, $options: 'i' } }
      : { participants: req.user._id, subject: { $regex: q, $options: 'i' } };

    const threads = await MessageThread.find(baseFilter)
      .populate('participants', 'fullName email avatar role companyName phoneNumber')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'fullName email' } })
      .sort({ lastActivity: -1 })
      .limit(20);

    res.json({ threads });
  } catch (error) {
    next(error);
  }
};

// ── GET /threads/:id/notes — admin-only internal notes ─────────────────────────
// Never exposed to, or reachable by, a customer — enforced here, not just by
// the UI hiding the panel.
exports.getThreadNotes = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const thread = await MessageThread.findById(req.params.id)
      .select('notes')
      .populate('notes.author', 'fullName email');
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    res.json({ notes: thread.notes || [] });
  } catch (error) {
    next(error);
  }
};

// ── POST /threads/:id/notes ─────────────────────────────────────────────────────
exports.addThreadNote = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ error: 'Note content is required' });

    const thread = await MessageThread.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { content, author: req.user._id, createdAt: new Date() } } },
      { new: true }
    ).populate('notes.author', 'fullName email');
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    res.status(201).json({ notes: thread.notes });
  } catch (error) {
    next(error);
  }
};

// ── POST /attachments — upload a file to attach to the NEXT message the
// caller sends. Two-step (upload, then send-with-attachments) so the
// composer can preview/remove a picked file before it's actually sent, same
// as every chat app. Deliberately NOT scoped to an existing thread id —
// starting a brand-new conversation has no thread yet, and the file isn't
// readable by anyone until it's actually attached to a message in a thread
// they have access to (the upload itself just records `uploadedBy`).
// Reuses the app's single GridFS upload path — no message-specific storage
// logic. ─────────────────────────────────────────────────────────────────────
exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { uploadMedia } = require('../media/media.service');
    const { GENERIC_FILE_MIMES, GENERIC_FILE_MAX_BYTES } = require('../media/mediaConstants');
    const File = require('../models/File');

    const asset = await uploadMedia(req.file.buffer, req.file.originalname, req.file.mimetype, {
      allowedMimes: GENERIC_FILE_MIMES,
      maxSizeBytes: GENERIC_FILE_MAX_BYTES,
    });

    const file = await File.create({
      filename:     asset.publicId,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      url:          asset.url,
      cloudProvider: 'gridfs',
      cloudId:      asset.publicId,
      uploadedBy:   req.user._id,
    });

    res.status(201).json({
      file: {
        _id: file._id, url: file.url, originalName: file.originalName,
        mimeType: file.mimeType, size: file.size,
      },
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};
