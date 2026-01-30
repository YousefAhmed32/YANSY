const { Message, MessageThread } = require('../models/Message');

// Get all threads for user
exports.getThreads = async (req, res, next) => {
  try {
    const threads = await MessageThread.find({
      participants: req.user._id
    })
      .populate('participants', 'fullName email')
      .populate('project', 'title')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    res.json({ threads });
  } catch (error) {
    next(error);
  }
};

// Get thread by ID with messages
exports.getThread = async (req, res, next) => {
  try {
    const thread = await MessageThread.findById(req.params.id)
      .populate('participants', 'fullName email')
      .populate('project', 'title');

    if (!thread || !thread.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const messages = await Message.find({ threadId: thread._id })
      .populate('sender', 'fullName email role')
      .populate('attachments')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { threadId: thread._id, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ thread, messages });
  } catch (error) {
    next(error);
  }
};

// Get thread by project ID
exports.getThreadByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    const thread = await MessageThread.findOne({
      project: projectId,
      participants: req.user._id
    })
      .populate('participants', 'fullName email role')
      .populate('project', 'title');

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found for this project' });
    }

    const messages = await Message.find({ threadId: thread._id })
      .populate('sender', 'fullName email role')
      .populate('attachments')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { threadId: thread._id, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ thread, messages });
  } catch (error) {
    next(error);
  }
};

// Create thread and send message
exports.createThread = async (req, res, next) => {
  try {
    const { recipient, subject, content, project, attachments } = req.body;

    // Find or create thread
    let thread = await MessageThread.findOne({
      participants: { $all: [req.user._id, recipient] },
      project: project || null
    });

    if (!thread) {
      // If project exists, get project title for subject
      let threadSubject = subject || 'New Conversation';
      if (project) {
        const Project = require('../models/Project');
        const projectDoc = await Project.findById(project);
        if (projectDoc) {
          threadSubject = `Project: ${projectDoc.title}`;
        }
      }
      
      thread = await MessageThread.create({
        participants: [req.user._id, recipient],
        project: project || null,
        subject: threadSubject
      });
    }

    // Create message
    const message = await Message.create({
      threadId: thread._id,
      sender: req.user._id,
      recipient,
      content,
      attachments: attachments || [],
      project: project || null
    });

    // Update thread
    thread.lastMessage = message._id;
    thread.lastActivity = new Date();
    thread.status = 'open';
    await thread.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'fullName email role')
      .populate('attachments');

    res.status(201).json({ thread, message: populated });
  } catch (error) {
    next(error);
  }
};

// Send message in existing thread
exports.sendMessage = async (req, res, next) => {
  try {
    const { content, attachments } = req.body;
    const thread = await MessageThread.findById(req.params.id);

    if (!thread || !thread.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const recipient = thread.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    const message = await Message.create({
      threadId: thread._id,
      sender: req.user._id,
      recipient,
      content,
      attachments: attachments || [],
      project: thread.project
    });

    thread.lastMessage = message._id;
    thread.lastActivity = new Date();
    thread.status = 'replied';
    await thread.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'fullName email role')
      .populate('attachments');

    // Emit real-time message
    if (req.io) {
      req.io.to(`thread:${thread._id}`).emit('message-received', { message: populated });
      req.io.to(`user:${recipient}`).emit('notification', {
        type: 'new-message',
        message: populated
      });
      if (thread.project) {
        req.io.to(`project:${thread.project}`).emit('project-message', { message: populated });
      }
    }

    res.status(201).json({ message: populated });
  } catch (error) {
    next(error);
  }
};

// Update thread status
exports.updateThreadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const thread = await MessageThread.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({ thread });
  } catch (error) {
    next(error);
  }
};

