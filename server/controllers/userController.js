const User = require('../models/User');

// Get all users (admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive, avatar } = req.body;
    const updates = {};

    if (role && req.user.role === 'ADMIN') updates.role = role;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Get client details with all projects (admin only)
exports.getClientDetails = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const clientId = req.params.id;

    const client = await User.findById(clientId).select('-password');
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get all projects for this client
    const projects = await Project.find({ client: clientId })
      .populate('assignedBy', 'fullName email')
      .sort({ updatedAt: -1 });

    // Calculate stats
    const totalProjects = projects.length;
    const projectsByStatus = {
      pending: projects.filter(p => p.status === 'pending').length,
      'in-progress': projects.filter(p => p.status === 'in-progress').length,
      'near-completion': projects.filter(p => p.status === 'near-completion').length,
      delivered: projects.filter(p => p.status === 'delivered').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length
    };

    // Get last activity (most recent project update)
    let lastActivity = client.updatedAt;
    if (projects.length > 0) {
      const mostRecentProject = projects[0];
      if (mostRecentProject.updatedAt > lastActivity) {
        lastActivity = mostRecentProject.updatedAt;
      }
    }

    res.json({
      client: {
        ...client.toObject(),
        totalProjects,
        projectsByStatus,
        lastActivity
      },
      projects
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

