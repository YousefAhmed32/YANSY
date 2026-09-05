'use strict';
const Project = require('../models/Project');
const { createNotification } = require('./notificationController');

// Helper to verify user is project client or admin
const canAccessProject = (project, user) => {
  if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) return true;
  return project.client && project.client.toString() === user._id.toString();
};

/**
 * Team submits deliverable for client review
 * POST /api/projects/:id/milestones/:mId/submit-deliverable
 */
exports.submitDeliverable = async (req, res, next) => {
  try {
    const { id, mId } = req.params;
    const { name, url, notes } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'Deliverable URL is required' });
    }

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const milestone = project.milestones.id(mId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    milestone.deliverables.push({
      name: name?.trim() || `Deliverable — ${milestone.title}`,
      url:  url.trim(),
      notes: notes?.trim() || '',
      submittedAt: new Date(),
    });

    milestone.status = 'ready_for_review';
    await project.save();

    // Notify client
    if (project.client) {
      createNotification({
        userId: project.client,
        type: 'alert',
        title: 'Deliverable Ready for Review',
        message: `Milestone "${milestone.title}" has deliverables ready for your review and approval.`,
        link: `/app/projects/${project._id}`,
        priority: 'high',
        io: req.io,
      });
    }

    res.json({ message: 'Deliverable submitted successfully', project });
  } catch (err) {
    next(err);
  }
};

/**
 * Client approves milestone
 * POST /api/projects/:id/milestones/:mId/approve
 */
exports.approveMilestone = async (req, res, next) => {
  try {
    const { id, mId } = req.params;
    const { notes } = req.body;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ error: 'Not authorized to approve this project milestone' });
    }

    const milestone = project.milestones.id(mId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    milestone.status = 'approved';
    milestone.clientReview = {
      status: 'approved',
      notes: notes?.trim() || '',
      respondedAt: new Date(),
    };

    // Calculate progress based on approved milestones
    const totalMilestones = project.milestones.length;
    const approvedCount   = project.milestones.filter(m => m.status === 'approved').length;
    project.progress      = totalMilestones > 0 ? Math.round((approvedCount / totalMilestones) * 100) : 100;

    // Check if next milestone exists and unlock it
    const mIndex = project.milestones.findIndex(m => m._id.toString() === mId);
    if (mIndex >= 0 && mIndex + 1 < totalMilestones) {
      const nextM = project.milestones[mIndex + 1];
      if (nextM.status === 'pending') {
        nextM.status = 'in_progress';
      }
    }

    // If all milestones approved, mark project completed and set 30-day warranty
    if (approvedCount === totalMilestones) {
      project.status = 'delivered';
      project.phase  = 'completed';
      project.completedDate     = new Date();
      project.warrantyStartDate = new Date();
      project.warrantyEndDate   = new Date(Date.now() + 30 * 86400000); // 30 days
    }

    await project.save();

    // Notify assigned team or admins
    setImmediate(async () => {
      try {
        const User = require('../models/User');
        const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id');
        admins.forEach(admin => {
          createNotification({
            userId: admin._id,
            type: 'alert',
            title: 'Milestone Approved by Client',
            message: `Client approved milestone "${milestone.title}" on project "${project.title}".`,
            link: `/app/admin/projects`,
            priority: 'high',
            io: req.io,
          });
        });
      } catch (err) {
        console.error('Notification error:', err.message);
      }
    });

    res.json({ message: 'Milestone approved successfully', project });
  } catch (err) {
    next(err);
  }
};

/**
 * Client requests revision on milestone
 * POST /api/projects/:id/milestones/:mId/request-revision
 */
exports.requestRevision = async (req, res, next) => {
  try {
    const { id, mId } = req.params;
    const { notes } = req.body;

    if (!notes || notes.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide detailed revision notes' });
    }

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const milestone = project.milestones.id(mId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    milestone.status = 'revision_requested';
    milestone.revisionsUsed = (milestone.revisionsUsed || 0) + 1;
    milestone.clientReview = {
      status: 'revision_requested',
      notes: notes.trim(),
      respondedAt: new Date(),
    };

    await project.save();

    // Notify admins
    setImmediate(async () => {
      try {
        const User = require('../models/User');
        const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id');
        admins.forEach(admin => {
          createNotification({
            userId: admin._id,
            type: 'alert',
            title: 'Milestone Revision Requested',
            message: `Client requested revisions on milestone "${milestone.title}". Notes: ${notes.slice(0, 100)}`,
            link: `/app/admin/projects`,
            priority: 'high',
            io: req.io,
          });
        });
      } catch (err) {
        console.error('Notification error:', err.message);
      }
    });

    res.json({ message: 'Revision request submitted', project });
  } catch (err) {
    next(err);
  }
};

/**
 * Scope Change Orders (Out-of-scope requests)
 * POST /api/projects/:id/change-requests
 */
exports.createChangeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priceImpact, timelineDaysImpact, notes } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.changeRequests.push({
      title: title.trim(),
      description: description.trim(),
      priceImpact: Number(priceImpact) || 0,
      timelineDaysImpact: Number(timelineDaysImpact) || 0,
      status: 'pending_client_approval',
      requestedBy: req.user.role === 'CLIENT' ? 'client' : 'team',
      notes: notes?.trim() || '',
      createdAt: new Date(),
    });

    await project.save();

    // Alert client
    if (project.client && req.user.role !== 'CLIENT') {
      createNotification({
        userId: project.client,
        type: 'alert',
        title: 'New Scope Change Order',
        message: `A change order ("${title}") has been quoted for your review.`,
        link: `/app/projects/${project._id}`,
        priority: 'high',
        io: req.io,
      });
    }

    res.status(201).json({ message: 'Change request created', project });
  } catch (err) {
    next(err);
  }
};

/**
 * Client responds to Change Order (Approve or Decline)
 * POST /api/projects/:id/change-requests/:crId/respond
 */
exports.respondToChangeRequest = async (req, res, next) => {
  try {
    const { id, crId } = req.params;
    const { action, notes } = req.body; // 'approved' | 'declined'

    if (!['approved', 'declined'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approved or declined' });
    }

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const cr = project.changeRequests.id(crId);
    if (!cr) return res.status(404).json({ error: 'Change request not found' });

    cr.status = action;
    cr.notes  = notes ? `${cr.notes || ''}\nClient note: ${notes.trim()}`.trim() : cr.notes;
    if (action === 'approved') {
      cr.approvedAt = new Date();
      // Increase project budget by change order amount
      project.budgetAmount = (project.budgetAmount || 0) + (cr.priceImpact || 0);
    }

    await project.save();

    res.json({ message: `Change order ${action}`, project });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Project Resource URLs (Staging, Figma, Production)
 * PATCH /api/projects/:id/urls
 */
exports.updateProjectUrls = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stagingUrl, figmaUrl, productionUrl } = req.body;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (stagingUrl !== undefined)    project.stagingUrl = stagingUrl.trim();
    if (figmaUrl !== undefined)      project.figmaUrl = figmaUrl.trim();
    if (productionUrl !== undefined) project.productionUrl = productionUrl.trim();

    await project.save();
    res.json({ message: 'Project URLs updated', project });
  } catch (err) {
    next(err);
  }
};
