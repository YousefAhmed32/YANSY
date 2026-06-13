const { Message, MessageThread } = require('../models/Message');
const { createNotification }    = require('./notificationController');
const { logActivity }           = require('./activityController');

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

// Bump unread counts for all non-sender participants
const bumpUnread = async (thread, senderId) => {
  for (const pid of thread.participants) {
    const id = pid.toString();
    if (id !== senderId.toString()) {
      const current = thread.unreadCounts.get(id) || 0;
      thread.unreadCounts.set(id, current + 1);
    }
  }
};

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
        .skip((page - 1) * limit),
      MessageThread.countDocuments(query),
    ]);

    const userId = req.user._id.toString();
    let enriched = threads.map(t => ({
      ...t.toObject(),
      unreadCount: t.unreadCounts?.get(userId) || 0,
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

    const messages = await Message.find({ threadId: thread._id })
      .populate('sender', 'fullName email role avatar')
      .sort({ createdAt: 1 });

    // Mark read + reset unread counter
    await Message.updateMany(
      { threadId: thread._id, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    const userId = req.user._id.toString();
    thread.unreadCounts.set(userId, 0);
    await thread.save();

    res.json({ thread, messages });
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
      .populate('sender', 'fullName email role avatar');

    // Notify the other side
    if (!isAdmin) {
      await notifyAllAdmins({
        title:    'New support request',
        message:  `${req.user.fullName || 'Customer'}: ${content?.slice(0, 80)}${content?.length > 80 ? '…' : ''}`,
        link:     '/app/messages',
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
        link:     '/app/messages',
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
      .populate('sender', 'fullName email role avatar');

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
        link:     '/app/messages',
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
        link:     '/app/messages',
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
exports.pinThread = async (req, res, next) => {
  try {
    const { pinned = true } = req.body;
    const thread = await MessageThread.findByIdAndUpdate(
      req.params.id,
      { isPinned: pinned },
      { new: true }
    );
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
