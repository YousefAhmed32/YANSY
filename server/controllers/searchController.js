'use strict';
const Project          = require('../models/Project');
const { Message }      = require('../models/Message');
const PortfolioProject = require('../models/PortfolioProject');
const User             = require('../models/User');

exports.globalSearch = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
    }

    const query   = q.trim();
    const isAdmin = req.user.role === 'ADMIN';
    const userId  = req.user._id;
    const lim     = Math.min(parseInt(limit), 10);

    const searchRegex = { $regex: query, $options: 'i' };

    // Run all searches in parallel
    const [projects, portfolioItems, messages, users] = await Promise.all([
      Project.find({
        ...(isAdmin ? {} : { client: userId }),
        $or: [{ title: searchRegex }, { description: searchRegex }],
      })
        .select('title status progress updatedAt')
        .limit(lim)
        .lean(),

      PortfolioProject.find({
        isPublished: true,
        $or: [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }],
      })
        .select('title category coverImage')
        .limit(lim)
        .lean(),

      // Messages: only messages where user is participant
      Message.find({
        $or: [
          { sender: userId },
          { recipient: userId },
        ],
        content: searchRegex,
      })
        .select('content createdAt sender recipient')
        .populate('sender', 'fullName')
        .limit(lim)
        .lean(),

      // Users: admin only
      ...(isAdmin ? [
        User.find({
          $or: [
            { fullName: searchRegex },
            { email: searchRegex },
            { companyName: searchRegex },
          ],
        })
          .select('fullName email role companyName brandName')
          .limit(lim)
          .lean()
      ] : [Promise.resolve([])]),
    ]);

    const results = {
      projects: projects.map(p => ({
        _id:   p._id,
        type:  'project',
        title: p.title,
        subtitle: p.status,
        meta:  `${p.progress}% complete`,
        link:  `/app/projects/${p._id}`,
        updatedAt: p.updatedAt,
      })),
      portfolio: portfolioItems.map(p => ({
        _id:   p._id,
        type:  'portfolio',
        title: p.title,
        subtitle: p.category,
        image: p.coverImage,
        link:  `/portfolio/${p._id}`,
      })),
      messages: messages.map(m => ({
        _id:     m._id,
        type:    'message',
        title:   `Message from ${m.sender?.fullName || 'Team'}`,
        subtitle: m.content?.slice(0, 80),
        link:    '/app/messages',
        createdAt: m.createdAt,
      })),
      ...(isAdmin ? {
        users: users.map(u => ({
          _id:   u._id,
          type:  'user',
          title: u.fullName,
          subtitle: u.email,
          meta:  u.role,
          link:  `/app/admin/users`,
        })),
      } : {}),
    };

    const totalCount =
      results.projects.length +
      results.portfolio.length +
      results.messages.length +
      (results.users?.length || 0);

    res.json({ results, totalCount, query });
  } catch (error) {
    next(error);
  }
};
