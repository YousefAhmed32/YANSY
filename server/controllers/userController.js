const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { audit } = require('../utils/auditLogger');

// Update own profile (authenticated user)
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, brandName, companyName, country, city, businessType, jobRole, website, howFound, primaryGoal } = req.body;
    const updates = {};
    if (fullName)    updates.fullName    = fullName.trim();
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber?.trim() || null;
    if (brandName   !== undefined) updates.brandName   = brandName?.trim()   || null;
    if (companyName !== undefined) updates.companyName = companyName?.trim() || null;
    if (country     !== undefined) updates.country     = country?.trim()     || null;
    if (city        !== undefined) updates.city        = city?.trim()        || null;
    if (businessType !== undefined) updates.businessType = businessType || null;
    if (jobRole     !== undefined) updates.jobRole     = jobRole?.trim()     || null;
    if (website     !== undefined) updates.website     = website?.trim()     || null;
    if (howFound    !== undefined) updates.howFound    = howFound            || null;
    if (primaryGoal !== undefined) updates.primaryGoal = primaryGoal         || null;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Complete onboarding (marks profile as complete)
exports.completeOnboarding = async (req, res, next) => {
  try {
    const {
      phoneNumber, country, city, companyName, brandName,
      businessType, jobRole, website, howFound, primaryGoal,
    } = req.body;

    if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

    const updates = {
      isProfileComplete: true,
      phoneNumber: phoneNumber.trim(),
    };
    if (country)      updates.country      = country.trim();
    if (city)         updates.city         = city.trim();
    if (companyName)  updates.companyName  = companyName.trim();
    if (brandName)    updates.brandName    = brandName.trim();
    if (businessType) updates.businessType = businessType;
    if (jobRole)      updates.jobRole      = jobRole.trim();
    if (website)      updates.website      = website.trim();
    if (howFound)     updates.howFound     = howFound;
    if (primaryGoal)  updates.primaryGoal  = primaryGoal;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Log the onboarding completion
    try {
      const { logActivity } = require('./activityController');
      await logActivity({
        userId: user._id,
        type: 'onboarding_completed',
        description: 'Completed profile onboarding',
        metadata: { phoneNumber: !!phoneNumber, country, businessType },
        req,
      });
    } catch (_) {}

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Change own password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

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
      .skip((page - 1) * limit)
      .lean();

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
    const user = await User.findById(req.params.id).select('fullName email role');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    await User.findByIdAndDelete(req.params.id);

    audit({
      req,
      action:     'user.delete',
      entityType: 'User',
      entityId:   req.params.id,
      before:     { fullName: user.fullName, email: user.email, role: user.role },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Change user role (admin)
exports.changeRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    // Only SUPER_ADMIN can assign SUPER_ADMIN role
    const { ROLE_HIERARCHY } = require('../middleware/auth');
    if (role === 'SUPER_ADMIN' && (ROLE_HIERARCHY[req.user.role] ?? -1) < 3) {
      return res.status(403).json({ error: 'Only SUPER_ADMIN can assign SUPER_ADMIN role.' });
    }

    const before = { role: user.role };
    user.role = role;
    await user.save();

    audit({ req, action: 'user.role_change', entityType: 'User', entityId: user._id, before, after: { role } });
    res.json({ user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

// Export users as CSV (admin)
exports.exportCSV = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();

    // Every user-controlled field (fullName, companyName/brandName, email,
    // phoneNumber) goes through here — a leading =/+/-/@ makes Excel/Sheets
    // treat the cell as a formula, so a registered user with fullName
    // `=HYPERLINK("http://evil.com","x")` would otherwise execute that
    // formula the moment an admin opens the exported CSV. Prefixing with a
    // single quote is the standard OWASP mitigation (forces "text" parsing);
    // always quoting + escaping internal quotes also fixes the separate,
    // pre-existing bug where an unquoted email/phone containing a comma
    // would silently shift every column after it.
    const csvCell = (value) => {
      const str = value === null || value === undefined ? '' : String(value);
      const guarded = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
      return `"${guarded.replace(/"/g, '""')}"`;
    };

    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Company', 'Role', 'Status', 'Created At', 'Last Login'];
    const rows = users.map(u => [
      csvCell(u._id),
      csvCell(u.fullName),
      csvCell(u.email),
      csvCell(u.phoneNumber),
      csvCell(u.companyName || u.brandName),
      csvCell(u.role),
      csvCell(u.isActive ? 'Active' : 'Suspended'),
      csvCell(u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : ''),
      csvCell(u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().split('T')[0] : ''),
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    audit({ req, action: 'user.export', entityType: 'User', entityId: null, after: { count: users.length, role, search } });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Impersonate user — SUPER_ADMIN only
exports.impersonate = async (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const target = await User.findById(req.params.id).select('-password');
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot impersonate yourself.' });
    }

    const token = jwt.sign(
      { userId: target._id, impersonatedBy: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    audit({
      req, action: 'user.impersonate', entityType: 'User', entityId: target._id,
      after: { impersonatedBy: req.user._id, targetEmail: target.email },
    });

    res.json({ token, user: target, message: `Impersonating ${target.fullName || target.email} (1h session)` });
  } catch (error) {
    next(error);
  }
};

// Delete own account (GDPR right to erasure)
exports.deleteOwnAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to confirm account deletion.' });

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password. Account not deleted.' });

    // Cannot delete admin accounts via self-service
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Admin accounts cannot be self-deleted. Contact a super admin.' });
    }

    // Soft-delete: anonymize PII rather than hard-delete to preserve audit trail
    const anonymized = {
      email:       `deleted_${user._id}@yansy.deleted`,
      fullName:    'Deleted User',
      phoneNumber: '0000000000',
      brandName:   null,
      companyName: null,
      isActive:    false,
      password:    'DELETED',
    };

    await User.findByIdAndUpdate(user._id, { $set: anonymized });

    audit({
      req,
      action:     'user.self_delete',
      entityType: 'User',
      entityId:   user._id,
      before:     { email: user.email, fullName: user.fullName },
    });

    res.json({ message: 'Your account has been deleted. We\'re sorry to see you go.' });
  } catch (error) {
    next(error);
  }
};

// Toggle user active status (admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }

    const before = { isActive: user.isActive };
    user.isActive = !user.isActive;
    await user.save();

    audit({
      req,
      action:     user.isActive ? 'user.activate' : 'user.deactivate',
      entityType: 'User',
      entityId:   user._id,
      before,
      after:      { isActive: user.isActive },
    });

    res.json({ user: { _id: user._id, fullName: user.fullName, isActive: user.isActive } });
  } catch (error) {
    next(error);
  }
};

