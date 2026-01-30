const ProjectRequest = require('../models/ProjectRequest');

// Submit a new project request as authenticated user (post-login)
exports.submitAuthenticatedRequest = async (req, res, next) => {
  try {
    const {
      clientType,
      projectDescription,
      budgetRange,
      phoneNumber,
      companyName,
      companySize
    } = req.body;

    const user = req.user;

    // Validation
    if (!clientType || !['individual', 'company'].includes(clientType)) {
      return res.status(400).json({ error: 'Valid client type is required' });
    }

    if (!projectDescription || projectDescription.trim().length < 10) {
      return res.status(400).json({ error: 'Project description must be at least 10 characters' });
    }

    if (!budgetRange) {
      return res.status(400).json({ error: 'Budget range is required' });
    }

    if (!phoneNumber || phoneNumber.trim().length < 5) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    // Validate company fields if client type is company
    if (clientType === 'company') {
      if (!companyName || companyName.trim().length < 2) {
        return res.status(400).json({ error: 'Company name is required for company requests' });
      }
      if (!companySize) {
        return res.status(400).json({ error: 'Company size is required for company requests' });
      }
    }

    // Create project request linked to user
    const projectRequest = await ProjectRequest.create({
      clientType,
      projectDescription: projectDescription.trim(),
      budgetRange,
      fullName: user.fullName,
      phoneNumber: phoneNumber.trim(),
      email: user.email,
      companyName: companyName ? companyName.trim() : undefined,
      companySize: companySize || undefined,
      user: user._id // Link to authenticated user
    });

    res.status(201).json({
      message: 'Your project request has been submitted successfully.',
      requestId: projectRequest._id,
      request: projectRequest
    });
  } catch (error) {
    next(error);
  }
};

// Get user's project requests
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

// Submit a new project request (public endpoint)
exports.submitRequest = async (req, res, next) => {
  try {
    const {
      clientType,
      projectDescription,
      budgetRange,
      fullName,
      phoneNumber,
      email,
      companyName,
      companySize
    } = req.body;

    // Validation
    if (!clientType || !['individual', 'company'].includes(clientType)) {
      return res.status(400).json({ error: 'Valid client type is required' });
    }

    if (!projectDescription || projectDescription.trim().length < 10) {
      return res.status(400).json({ error: 'Project description must be at least 10 characters' });
    }

    if (!budgetRange) {
      return res.status(400).json({ error: 'Budget range is required' });
    }

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!phoneNumber || phoneNumber.trim().length < 5) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    // Email is optional, but if provided, validate format
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate company fields if client type is company
    if (clientType === 'company') {
      if (!companyName || companyName.trim().length < 2) {
        return res.status(400).json({ error: 'Company name is required for company requests' });
      }
      if (!companySize) {
        return res.status(400).json({ error: 'Company size is required for company requests' });
      }
    }

    // Create project request
    const projectRequest = await ProjectRequest.create({
      clientType,
      projectDescription: projectDescription.trim(),
      budgetRange,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      companyName: companyName ? companyName.trim() : undefined,
      companySize: companySize || undefined
    });

    res.status(201).json({
      message: 'Your request has been received. We will contact you within 24 hours.',
      requestId: projectRequest._id
    });
  } catch (error) {
    next(error);
  }
};

// Get all project requests (admin only)
exports.getAllRequests = async (req, res, next) => {
  try {
    const {
      status,
      clientType,
      budgetRange,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (clientType) query.clientType = clientType;
    if (budgetRange) query.budgetRange = budgetRange;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const requests = await ProjectRequest.find(query)
      .populate('assignedTo', 'fullName email')
      .populate('user', 'fullName email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProjectRequest.countDocuments(query);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    next(error);
  }
};

// Get request by ID (admin only)
exports.getRequestById = async (req, res, next) => {
  try {
    const request = await ProjectRequest.findById(req.params.id)
      .populate('assignedTo', 'fullName email')
      .populate('user', 'fullName email');

    if (!request) {
      return res.status(404).json({ error: 'Project request not found' });
    }

    res.json({ request });
  } catch (error) {
    next(error);
  }
};

// Update request status (admin only)
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, assignedTo } = req.body;

    const updates = {};

    if (status && ['new', 'in-progress', 'completed'].includes(status)) {
      updates.status = status;
    }

    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes.trim();
    }

    if (assignedTo !== undefined) {
      updates.assignedTo = assignedTo || null;
    }

    const request = await ProjectRequest.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('assignedTo', 'fullName email')
     .populate('user', 'fullName email');

    if (!request) {
      return res.status(404).json({ error: 'Project request not found' });
    }

    res.json({ request });
  } catch (error) {
    next(error);
  }
};

// Delete request (admin only)
exports.deleteRequest = async (req, res, next) => {
  try {
    await ProjectRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get request statistics (admin only)
exports.getRequestStats = async (req, res, next) => {
  try {
    const total = await ProjectRequest.countDocuments();
    const byStatus = await ProjectRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    const byClientType = await ProjectRequest.aggregate([
      {
        $group: {
          _id: '$clientType',
          count: { $sum: 1 }
        }
      }
    ]);
    const byBudgetRange = await ProjectRequest.aggregate([
      {
        $group: {
          _id: '$budgetRange',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byClientType: byClientType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byBudgetRange: byBudgetRange.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
};

