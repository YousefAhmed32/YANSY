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

// ─── Admin: update status / notes / pipeline fields ───────────────────────
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost', 'in-progress', 'completed'];

exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, assignedTo, priority, estimatedValue, nextFollowUpDate, lossReason, stageNote } = req.body;
    const updates = {};

    if (status && VALID_STATUSES.includes(status)) {
      updates.status = status;
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes.trim();
    if (assignedTo !== undefined) updates.assignedTo = assignedTo || null;
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) updates.priority = priority;
    if (estimatedValue !== undefined) updates.estimatedValue = Math.max(0, Number(estimatedValue) || 0);
    if (nextFollowUpDate !== undefined) updates.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
    if (lossReason !== undefined) updates.lossReason = lossReason ? lossReason.trim() : null;

    const pushOp = {};
    if (status) {
      pushOp.stageHistory = {
        stage:   status,
        movedAt: new Date(),
        movedBy: req.user?._id || null,
        note:    stageNote ? stageNote.trim() : '',
      };
    }

    const updateDoc = { $set: updates };
    if (pushOp.stageHistory) updateDoc.$push = pushOp;

    const request = await ProjectRequest.findByIdAndUpdate(
      req.params.id,
      updateDoc,
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

// ─── Admin: Sales Pipeline Board Data ───────────────────────────────────────
exports.getPipeline = async (req, res, next) => {
  try {
    const stages = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost'];
    const now = new Date();

    const [allLeads, overdueCount] = await Promise.all([
      ProjectRequest.find()
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'fullName email')
        .populate('user', 'fullName email')
        .lean(),
      ProjectRequest.countDocuments({
        status: { $in: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiating'] },
        nextFollowUpDate: { $lt: now },
      }),
    ]);

    const pipeline = {};
    stages.forEach(s => {
      pipeline[s] = {
        key:   s,
        leads: [],
        totalValue: 0,
      };
    });

    allLeads.forEach(lead => {
      // Map old status 'in-progress' to 'negotiating', 'completed' to 'won'
      let stageKey = lead.status;
      if (stageKey === 'in-progress') stageKey = 'negotiating';
      if (stageKey === 'completed')   stageKey = 'won';
      if (!pipeline[stageKey]) stageKey = 'new';

      const isOverdue = lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) < now && !['won', 'lost'].includes(stageKey);
      const enrichedLead = { ...lead, isOverdue };

      pipeline[stageKey].leads.push(enrichedLead);
      pipeline[stageKey].totalValue += (Number(lead.estimatedValue) || 0);
    });

    res.json({
      pipeline,
      stages,
      overdueCount,
      totalLeads: allLeads.length,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Public: Magic Link Brief Retrieval ────────────────────────────────────
exports.getBriefByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token || token.trim().length < 8) {
      return res.status(400).json({ error: 'Valid brief token is required' });
    }

    const request = await ProjectRequest.findOne({ magicToken: token.trim() })
      .select('fullName email phoneNumber projectType projectDescription budgetRange timeline referenceUrl tags briefData status createdAt')
      .lean();

    if (!request) {
      return res.status(404).json({ error: 'Brief not found or link has expired' });
    }

    res.json({ brief: request });
  } catch (error) {
    next(error);
  }
};

// ─── Public: Magic Link Brief Update / Enrichment ──────────────────────────
exports.updateBriefByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { projectDescription, budgetRange, timeline, referenceUrl, tags, briefData } = req.body;

    const request = await ProjectRequest.findOne({ magicToken: token.trim() });
    if (!request) {
      return res.status(404).json({ error: 'Brief not found or link has expired' });
    }

    if (projectDescription) request.projectDescription = projectDescription.trim();
    if (budgetRange) request.budgetRange = budgetRange;
    if (timeline) request.timeline = timeline;
    if (referenceUrl !== undefined) request.referenceUrl = referenceUrl ? referenceUrl.trim() : undefined;
    if (Array.isArray(tags)) request.tags = tags;
    if (briefData && typeof briefData === 'object') {
      request.briefData = { ...(request.briefData || {}), ...briefData };
    }

    // Auto-advance status if it was still 'new'
    if (request.status === 'new') {
      request.status = 'qualified';
      request.stageHistory.push({
        stage:   'qualified',
        movedAt: new Date(),
        note:    'Client enriched project brief via magic link',
      });
    }

    await request.save();

    setImmediate(async () => {
      try {
        const User = require('../models/User');
        const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id');
        admins.forEach(admin => {
          createNotification({
            userId: admin._id,
            type: 'alert',
            title: 'Client Updated Brief',
            message: `${request.fullName} just completed additional project brief details.`,
            link: '/app/admin/project-requests',
            priority: 'medium',
            io: req.io,
          });
        });
      } catch (err) {
        console.error('Failed to dispatch brief update alert:', err.message);
      }
    });

    res.json({
      message: 'Brief updated successfully',
      brief: request,
    });
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

// ─── AI Chat / Homepage Lead (public, minimal fields) ──────────────────────────
const normalizeServiceToType = (svc) => {
  if (!svc) return 'other';
  const s = String(svc).toLowerCase();
  if (s.includes('e-commerce') || s.includes('ecommerce') || s.includes('تجارة') || s.includes('متجر')) return 'ecommerce';
  if (s.includes('saas') || s.includes('منصة') || s.includes('web app') || s.includes('تطبيق ويب')) return 'saas';
  if (s.includes('mobile') || s.includes('موبايل') || s.includes('تطبيق')) return 'mobile';
  if (s.includes('erp') || s.includes('crm')) return 'erp';
  if (s.includes('booking') || s.includes('حجز') || s.includes('جدولة')) return 'booking';
  if (s.includes('automation') || s.includes('أتمتة')) return 'automation';
  if (s.includes('website') || s.includes('landing') || s.includes('موقع') || s.includes('صفحة هبوط')) return 'website';
  if (s.includes('clinic') || s.includes('عياد')) return 'clinic';
  if (s.includes('restaurant') || s.includes('مطعم')) return 'restaurant';
  if (s.includes('pharmacy') || s.includes('صيدل')) return 'pharmacy';
  if (s.includes('realestate') || s.includes('عقار')) return 'realestate';
  if (s.includes('education') || s.includes('تعليم')) return 'education';
  if (s.includes('delivery') || s.includes('توصيل')) return 'delivery';
  return 'other';
};

exports.submitAiLead = async (req, res, next) => {
  try {
    const { service, message, source } = req.body;
    const name = (req.body.name || req.body.clientName || req.body.fullName || '').trim();
    const contact = (req.body.contact || req.body.email || req.body.phone || req.body.phoneNumber || '').trim();

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!contact || contact.length < 5) {
      return res.status(400).json({ error: 'Contact is required' });
    }

    const projectType = normalizeServiceToType(service);
    const sourceLabel = source ? source.trim().slice(0, 60) : 'Lead Capture';
    const trimmedMessage = message ? message.trim().slice(0, 2000) : '';

    const cleanContact = contact.trim();
    const isEmail = /^\S+@\S+\.\S+$/.test(cleanContact);
    const email = isEmail ? cleanContact.toLowerCase() : undefined;
    const phoneNumber = !isEmail ? cleanContact : '';

    const sourceTag = source
      ? source.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      : 'quick-lead';

    const request = await ProjectRequest.create({
      projectType,
      clientType:         'unknown',
      projectDescription: trimmedMessage
        ? `${sourceLabel} — ${trimmedMessage}`
        : `${sourceLabel} — Service: ${service || 'Not specified'}`,
      budgetRange:        'unknown',
      timeline:           'unknown',
      fullName:           name.trim(),
      phoneNumber:        phoneNumber || '',
      email:              email,
      tags:               [sourceTag],
      adminNotes:         `Source: ${sourceLabel}\nRequested service: ${service || '—'}\nOriginal contact field: ${cleanContact}`,
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