const ProjectRequest = require('../models/ProjectRequest');
const { normalizePhone, phoneLooksReasonable } = require('../utils/phone');
const emailService = require('../utils/emailService');
const { createNotification } = require('./notificationController');
const { sendServerEvent } = require('../utils/metaConversionsApi');

// ─── Notify admins on every new lead — in-app + email ──────────────────────
// Fire-and-forget (setImmediate) so a slow/failed email never delays or
// fails the visitor's response. Previously nothing notified the team about
// new leads at all; they had to manually poll the admin panel.
const notifyAdminsOfNewLead = async (request, io) => {
  try {
    const User = require('../models/User');
    const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: { $ne: false } })
      .select('_id email').lean();
    if (!admins.length) return;

    const clientName    = request.fullName || 'A visitor';
    const projectTitle  = `${request.projectType || 'Project'} — ${(request.projectDescription || '').slice(0, 60)}`;

    await Promise.all(admins.map(async (admin) => {
      await createNotification({
        userId: admin._id,
        type: 'alert',
        title: 'New project request',
        message: `${clientName} submitted a new ${request.projectType || ''} request.`.trim(),
        link: '/app/admin/project-requests',
        priority: 'high',
        io,
      });
      if (admin.email) {
        try {
          await emailService.sendAdminNewProjectRequest(admin.email, clientName, projectTitle);
        } catch (emailErr) {
          console.error('Failed to email admin about new lead:', emailErr.message);
        }
      }
    }));
  } catch (err) {
    console.error('Failed to notify admins of new project request:', err.message);
  }
};

// ─── Fire-and-forget: admin notification + Meta server-side Lead event ─────
// Combines the in-app/email notification above with a Meta Conversions API
// call, so lead attribution survives even when the visitor's browser Pixel
// was blocked (ad blockers, Safari ITP, iOS App Tracking Transparency).
// sendServerEvent no-ops on its own when META_PIXEL_ID/META_CAPI_ACCESS_TOKEN
// aren't configured, so this is always safe to call.
const notifyNewLead = (request, req) => {
  notifyAdminsOfNewLead(request, req.io);
  sendServerEvent('Lead', req, { email: request.email, phone: request.phoneNumber }, {
    content_name: request.projectType,
    content_category: request.clientType,
  });
};

// ─── Submit (public) ───────────────────────────────────────────────────────
exports.submitRequest = async (req, res, next) => {
  try {
    const {
      projectType,
      clientType,
      projectDescription,
      referenceUrl,
      tags,
      budgetRange,
      timeline,
      fullName,
      phoneNumber,
      email,
      companyName,
      companySize,
    } = req.body;

    // Required fields
    if (!projectType) {
      return res.status(400).json({ error: 'Project type is required' });
    }

    if (!clientType || !['individual', 'company'].includes(clientType)) {
      return res.status(400).json({ error: 'Valid client type is required' });
    }

    if (!projectDescription || projectDescription.trim().length < 10) {
      return res.status(400).json({ error: 'Project description must be at least 10 characters' });
    }

    if (!budgetRange) {
      return res.status(400).json({ error: 'Budget range is required' });
    }

    if (!timeline) {
      return res.status(400).json({ error: 'Timeline is required' });
    }

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!phoneNumber || !phoneLooksReasonable(phoneNumber)) {
      return res.status(400).json({ error: 'That phone number looks too short or too long — please check the digits' });
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (clientType === 'company') {
      if (!companyName || companyName.trim().length < 2) {
        return res.status(400).json({ error: 'Company name is required for company requests' });
      }
      if (!companySize) {
        return res.status(400).json({ error: 'Company size is required for company requests' });
      }
    }

    // Normalise tags — accept both array and comma-separated string
    const normalisedTags = Array.isArray(tags)
      ? tags
      : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []);

    const projectRequest = await ProjectRequest.create({
      projectType,
      clientType,
      projectDescription: projectDescription.trim(),
      referenceUrl:       referenceUrl ? referenceUrl.trim() : undefined,
      tags:               normalisedTags,
      budgetRange,
      timeline,
      fullName:           fullName.trim(),
      phoneNumber:        normalizePhone(phoneNumber) || phoneNumber.trim(),
      email:              email ? email.trim().toLowerCase() : undefined,
      companyName:        companyName ? companyName.trim() : undefined,
      companySize:        companySize || undefined,
    });

    setImmediate(() => notifyNewLead(projectRequest, req));

    res.status(201).json({
      message: 'Your request has been received. We will contact you within 24 hours.',
      requestId: projectRequest._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Submit (authenticated user) ──────────────────────────────────────────
exports.submitAuthenticatedRequest = async (req, res, next) => {
  try {
    const {
      projectType,
      clientType,
      projectDescription,
      referenceUrl,
      tags,
      budgetRange,
      timeline,
      phoneNumber,
      companyName,
      companySize,
    } = req.body;

    const user = req.user;

    if (!projectType) {
      return res.status(400).json({ error: 'Project type is required' });
    }

    if (!clientType || !['individual', 'company'].includes(clientType)) {
      return res.status(400).json({ error: 'Valid client type is required' });
    }

    if (!projectDescription || projectDescription.trim().length < 10) {
      return res.status(400).json({ error: 'Project description must be at least 10 characters' });
    }

    if (!budgetRange) {
      return res.status(400).json({ error: 'Budget range is required' });
    }

    if (!timeline) {
      return res.status(400).json({ error: 'Timeline is required' });
    }

    if (!phoneNumber || !phoneLooksReasonable(phoneNumber)) {
      return res.status(400).json({ error: 'That phone number looks too short or too long — please check the digits' });
    }

    if (clientType === 'company') {
      if (!companyName || companyName.trim().length < 2) {
        return res.status(400).json({ error: 'Company name is required for company requests' });
      }
      if (!companySize) {
        return res.status(400).json({ error: 'Company size is required for company requests' });
      }
    }

    const normalisedTags = Array.isArray(tags)
      ? tags
      : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []);

    const projectRequest = await ProjectRequest.create({
      projectType,
      clientType,
      projectDescription: projectDescription.trim(),
      referenceUrl:       referenceUrl ? referenceUrl.trim() : undefined,
      tags:               normalisedTags,
      budgetRange,
      timeline,
      fullName:           user.fullName,
      phoneNumber:        normalizePhone(phoneNumber) || phoneNumber.trim(),
      email:              user.email,
      companyName:        companyName ? companyName.trim() : undefined,
      companySize:        companySize || undefined,
      user:               user._id,
    });

    setImmediate(() => notifyNewLead(projectRequest, req));

    res.status(201).json({
      message: 'Your project request has been submitted successfully.',
      requestId: projectRequest._id,
      request: projectRequest,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get user's own requests ───────────────────────────────────────────────
exports.getUserRequests = async (req, res, next) => {
  try {
    const requests = await ProjectRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'fullName email')
      .populate('user', 'fullName email');

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: get all requests ───────────────────────────────────────────────
exports.getAllRequests = async (req, res, next) => {
  try {
    const {
      status,
      clientType,
      budgetRange,
      projectType,
      timeline,
      sortBy    = 'createdAt',
      sortOrder = 'desc',
      page      = 1,
      limit     = 20,
    } = req.query;

    const query = {};
    if (status)      query.status      = status;
    if (clientType)  query.clientType  = clientType;
    if (budgetRange) query.budgetRange = budgetRange;
    if (projectType) query.projectType = projectType;
    if (timeline)    query.timeline    = timeline;

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const requests = await ProjectRequest.find(query)
      .populate('assignedTo', 'fullName email')
      .populate('user', 'fullName email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProjectRequest.countDocuments(query);

    res.json({
      requests,
      totalPages:  Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: get by ID ──────────────────────────────────────────────────────
exports.getRequestById = async (req, res, next) => {
  try {
    const request = await ProjectRequest.findById(req.params.id)
      .populate('assignedTo', 'fullName email')
      .populate('user', 'fullName email');

    if (!request) return res.status(404).json({ error: 'Project request not found' });

    res.json({ request });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: update status / notes ─────────────────────────────────────────
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, assignedTo } = req.body;
    const updates = {};

    if (status && ['new', 'in-progress', 'completed'].includes(status)) {
      updates.status = status;
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes.trim();
    if (assignedTo !== undefined) updates.assignedTo = assignedTo || null;

    const request = await ProjectRequest.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    )
      .populate('assignedTo', 'fullName email')
      .populate('user', 'fullName email');

    if (!request) return res.status(404).json({ error: 'Project request not found' });

    res.json({ request });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: delete ─────────────────────────────────────────────────────────
exports.deleteRequest = async (req, res, next) => {
  try {
    await ProjectRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── AI Chat Lead (public, minimal fields) ────────────────────────────────
exports.submitAiLead = async (req, res, next) => {
  try {
    const { service, name, contact, message, source } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!contact || contact.trim().length < 5) {
      return res.status(400).json({ error: 'Contact is required' });
    }

    const SERVICE_TO_TYPE = {
      'e-commerce store': 'ecommerce',
      'متجر إلكتروني':   'ecommerce',
      'saas platform':    'saas',
      'منصة saas':        'saas',
    };

    const projectType = SERVICE_TO_TYPE[(service || '').toLowerCase()] || 'other';
    const sourceLabel  = source ? source.trim().slice(0, 60) : 'AI Chat Widget';
    const trimmedMessage = message ? message.trim().slice(0, 2000) : '';

    const request = await ProjectRequest.create({
      projectType,
      clientType:         'individual',
      projectDescription: trimmedMessage
        ? `${sourceLabel} — ${trimmedMessage}`
        : `${sourceLabel} — Service: ${service || 'Not specified'}`,
      budgetRange:        'less-than-500',
      timeline:           'flexible',
      fullName:           name.trim(),
      phoneNumber:        contact.trim(),
      email:              /^\S+@\S+\.\S+$/.test(contact.trim()) ? contact.trim().toLowerCase() : undefined,
      tags:               ['ai-chat-lead'],
      adminNotes:         `Source: ${sourceLabel}\nRequested service: ${service || '—'}`,
    });

    setImmediate(() => notifyNewLead(request, req));

    res.status(201).json({
      message: 'Lead received. We will contact you shortly.',
      requestId: request._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: stats ──────────────────────────────────────────────────────────
exports.getRequestStats = async (req, res, next) => {
  try {
    const total = await ProjectRequest.countDocuments();

    const group = (field) =>
      ProjectRequest.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);

    const toMap = (arr) =>
      arr.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {});

    const [byStatus, byClientType, byBudgetRange, byProjectType, byTimeline] = await Promise.all([
      group('status'),
      group('clientType'),
      group('budgetRange'),
      group('projectType'),
      group('timeline'),
    ]);

    res.json({
      total,
      byStatus:      toMap(byStatus),
      byClientType:  toMap(byClientType),
      byBudgetRange: toMap(byBudgetRange),
      byProjectType: toMap(byProjectType),
      byTimeline:    toMap(byTimeline),
    });
  } catch (error) {
    next(error);
  }
};