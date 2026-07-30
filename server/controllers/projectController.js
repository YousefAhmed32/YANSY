const Project = require('../models/Project');
const File = require('../models/File');
const { MessageThread } = require('../models/Message');
const { createNotification } = require('./notificationController');
const { audit } = require('../utils/auditLogger');
const emailService = require('../utils/emailService');

// Get all projects
exports.getAllProjects = async (req, res, next) => {
  try {
    const { status, phase, client, page = 1, limit = 20 } = req.query;
    const query = {};

    // Users can only see their own projects
    if (req.user.role === 'USER') {
      query.client = req.user._id;
    } else if (client) {
      query.client = client;
    }

    if (status) query.status = status;
    if (phase) query.phase = phase;

    const projects = await Project.find(query)
      .populate('client', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// Get project by ID
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .populate('files')
      .populate('updates.postedBy', 'fullName email avatar');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    if (req.user.role === 'USER' && project.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
};

// Create project (users can create, admin can assign)
exports.createProject = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      client, 
      targetDate,
      budget,
      clientType,
      companyName,
      companySize,
      phoneNumber
    } = req.body;

    // Determine client - users create for themselves, admins can assign
    const clientId = req.user.role === 'ADMIN' && client 
      ? client 
      : req.user._id;

    const projectData = {
      title: title || 'New Project',
      description,
      client: clientId,
      budget,
      clientType,
      status: 'pending',
      progress: 0,
      phase: 'planning'
    };

    if (req.user.role === 'ADMIN') {
      projectData.assignedBy = req.user._id;
    }

    if (targetDate) projectData.targetDate = new Date(targetDate);
    if (companyName) projectData.companyName = companyName;
    if (companySize) projectData.companySize = companySize;

    const project = await Project.create(projectData);

    // Create message thread for this project
    try {
      // Find admin user
      const User = require('../models/User');
      const admin = await User.findOne({ role: 'ADMIN' });
      
      if (admin) {
        await MessageThread.create({
          participants: [clientId, admin._id],
          project: project._id,
          subject: `Project: ${project.title}`,
          status: 'open'
        });
      }
    } catch (threadError) {
      console.error('Failed to create message thread:', threadError);
      // Don't fail project creation if thread creation fails
    }

    const populated = await Project.findById(project._id)
      .populate('client', 'fullName email')
      .populate('assignedBy', 'fullName email');

    // Emit real-time update
    if (req.io) {
      req.io.to(`user:${clientId}`).emit('project-created', { project: populated });
      req.io.emit('admin-project-update', { project: populated });
    }

    // Notify all admins about new project request
    if (req.user.role !== 'ADMIN') {
      try {
        const User = require('../models/User');
        const admins = await User.find({ role: 'ADMIN' }).select('_id');
        for (const admin of admins) {
          await createNotification({
            userId: admin._id,
            type: 'alert',
            title: 'New Project Request',
            message: `${populated.client?.fullName || 'A client'} submitted a new project: "${populated.title}"`,
            link: `/app/admin/project-requests`,
            refType: 'Project',
            refId: populated._id,
            io: req.io,
          });
        }
      } catch (err) {
        // non-critical
      }
    }

    res.status(201).json({ project: populated });
  } catch (error) {
    next(error);
  }
};

// Update project
exports.updateProject = async (req, res, next) => {
  try {
    const { title, description, progress, phase, status, targetDate } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    if (req.user.role === 'USER' && project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (phase) updates.phase = phase;
    if (targetDate) updates.targetDate = new Date(targetDate);

    // Only admins can update progress/status
    if (req.user.role === 'ADMIN') {
      if (progress !== undefined) {
        // Use the model method to update progress and auto-update status
        await project.updateProgress(progress);
      }
      if (status) {
        updates.status = status;
        if (status === 'delivered' && !project.completedDate) {
          updates.completedDate = new Date();
        }
      }
    }

    // Apply other updates
    Object.keys(updates).forEach(key => {
      project[key] = updates[key];
    });

    await project.save();

    const populated = await Project.findById(project._id)
      .populate('client', 'fullName email phoneNumber')
      .populate('assignedBy', 'fullName email')
      .populate('updates.postedBy', 'fullName email')
      .populate('updates.attachments');

    // Emit real-time update
    if (req.io) {
      req.io.to(`user:${populated.client._id}`).emit('project-updated', { project: populated });
      req.io.to(`project:${populated._id}`).emit('project-progress-updated', { project: populated });
      if (req.user.role === 'ADMIN') {
        req.io.emit('admin-project-update', { project: populated });
      }
    }

    // Audit log for admin updates
    if (req.user.role === 'ADMIN') {
      audit({
        req,
        action:     updates.status ? 'project.status_change' : 'project.progress_update',
        entityType: 'Project',
        entityId:   populated._id,
        before:     { status: project.status, progress: project.progress },
        after:      { status: populated.status, progress: populated.progress },
      });
    }

    // Email notification for status changes
    if (req.user.role === 'ADMIN' && updates.status && populated.client?.email) {
      setImmediate(() => {
        emailService.sendProjectStatusChange(populated.client, populated, updates.status).catch(() => {});
      });
    }

    // Create notification for client when admin updates project
    if (req.user.role === 'ADMIN' && populated.client) {
      const statusLabels = {
        pending: 'Pending Review',
        'in-progress': 'In Progress',
        completed: 'Completed',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
      };
      const newStatus = updates.status || project.status;
      await createNotification({
        userId: populated.client._id,
        type: 'project_update',
        title: `Project Updated — ${populated.title}`,
        message: updates.status
          ? `Your project status has been updated to "${statusLabels[updates.status] || updates.status}".`
          : `Your project "${populated.title}" has been updated. Check the latest progress.`,
        link: `/app/projects/${populated._id}`,
        refType: 'Project',
        refId: populated._id,
        io: req.io,
      });
    }

    res.json({ project: populated });
  } catch (error) {
    next(error);
  }
};

// Add project update
exports.addUpdate = async (req, res, next) => {
  try {
    const { title, content, attachments } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Only admins can add updates
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can add project updates' });
    }

    const updateData = {
      title: title || 'Project Update',
      content,
      postedBy: req.user._id,
      attachments: attachments || [],
      createdAt: new Date()
    };

    project.updates.push(updateData);
    await project.save();

    const updated = await Project.findById(project._id)
      .populate('updates.postedBy', 'fullName email')
      .populate('updates.attachments')
      .populate('client', 'fullName email');

    // Emit real-time update
    if (req.io) {
      const latestUpdate = updated.updates[updated.updates.length - 1];
      req.io.to(`user:${updated.client._id}`).emit('project-update-added', {
        project: updated,
        update: latestUpdate
      });
      req.io.to(`project:${updated._id}`).emit('project-update-added', {
        project: updated,
        update: latestUpdate
      });
    }

    // Notify client about new update
    if (updated.client) {
      await createNotification({
        userId: updated.client._id,
        type: 'project_update',
        title: `New Update — ${updated.title}`,
        message: updateData.title ? `"${updateData.title}" — ${updateData.content?.slice(0, 80) || 'A new update has been posted to your project.'}` : 'A new update has been posted to your project.',
        link: `/app/projects/${updated._id}`,
        refType: 'Project',
        refId: updated._id,
        io: req.io,
      });
    }

    res.status(201).json({ project: updated, update: updated.updates[updated.updates.length - 1] });
  } catch (error) {
    next(error);
  }
};

// Add file to project
exports.addFile = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Same ownership rule as getProjectById — a USER may only attach files to
    // their own project, not smuggle references into someone else's.
    if (req.user.role === 'USER' && project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileIds = req.body.fileIds || [];
    project.files.push(...fileIds);
    await project.save();

    const updated = await Project.findById(project._id).populate('files');
    res.json({ project: updated });
  } catch (error) {
    next(error);
  }
};

// Delete project
exports.deleteProject = async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

