const Feedback = require('../models/Feedback');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * Create feedback (public or authenticated)
 */
exports.createFeedback = async (req, res, next) => {
  try {
    const {
      name,
      isAnonymous,
      projectId,
      feedbackType,
      ratings,
      reviewText
    } = req.body;

    // Validation
    if (!ratings || !ratings.quality || !ratings.speed || !ratings.communication || 
        !ratings.professionalism || !ratings.overall) {
      return res.status(400).json({ 
        error: 'All rating categories are required (quality, speed, communication, professionalism, overall)' 
      });
    }

    // Validate ratings are between 1-5
    const ratingValues = Object.values(ratings);
    if (ratingValues.some(r => r < 1 || r > 5 || !Number.isInteger(r))) {
      return res.status(400).json({ 
        error: 'All ratings must be integers between 1 and 5' 
      });
    }

    // Determine user info
    let userId = null;
    let displayName = name || 'Anonymous';
    
    if (req.user) {
      userId = req.user._id;
      displayName = isAnonymous ? 'Anonymous' : (name || req.user.fullName);
    } else {
      // Guest user - name is required if not anonymous
      if (!isAnonymous && !name) {
        return res.status(400).json({ 
          error: 'Name is required for non-anonymous feedback' 
        });
      }
    }

    // Validate project if provided
    if (projectId && feedbackType === 'project') {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if user already submitted feedback for this project
      if (userId) {
        const existingFeedback = await Feedback.findOne({
          userId,
          projectId,
          isDeleted: false
        });
        if (existingFeedback) {
          return res.status(400).json({ 
            error: 'You have already submitted feedback for this project' 
          });
        }
      }
    }

    // Get IP address for rate limiting (guests)
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    // Create feedback
    const feedback = new Feedback({
      userId,
      name: displayName,
      isAnonymous: isAnonymous || false,
      projectId: projectId || null,
      feedbackType: feedbackType || 'general',
      ratings,
      reviewText: reviewText || '',
      ipAddress: userId ? null : ipAddress // Only store IP for guests
    });

    await feedback.save();

    // Populate references
    await feedback.populate('userId', 'fullName email');
    await feedback.populate('projectId', 'title');

    // Check for low satisfaction alert
    const isLowSatisfaction = feedback.isLowSatisfaction();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        _id: feedback._id,
        name: feedback.isAnonymous ? 'Anonymous' : feedback.name,
        ratings: feedback.ratings,
        reviewText: feedback.reviewText,
        feedbackType: feedback.feedbackType,
        projectId: feedback.projectId,
        createdAt: feedback.createdAt
      },
      alert: isLowSatisfaction ? 'Low satisfaction feedback received' : null
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'You have already submitted feedback for this project' 
      });
    }
    next(error);
  }
};

/**
 * Get all feedback (admin only)
 */
exports.getAllFeedback = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      isReviewed,
      isFlagged,
      isHighlighted,
      minRating,
      projectId,
      feedbackType
    } = req.query;

    const query = { isDeleted: false };

    if (isReviewed !== undefined) query.isReviewed = isReviewed === 'true';
    if (isFlagged !== undefined) query.isFlagged = isFlagged === 'true';
    if (isHighlighted !== undefined) query.isHighlighted = isHighlighted === 'true';
    if (projectId) query.projectId = projectId;
    if (feedbackType) query.feedbackType = feedbackType;
    if (minRating) query['ratings.overall'] = { $gte: parseInt(minRating) };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const feedback = await Feedback.find(query)
      .populate('userId', 'fullName email')
      .populate('projectId', 'title')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      feedback,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get feedback statistics (admin only)
 */
exports.getFeedbackStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const query = { isDeleted: false, ...dateQuery };

    // Overall statistics
    const totalFeedback = await Feedback.countDocuments(query);
    
    const allFeedback = await Feedback.find(query);
    
    if (totalFeedback === 0) {
      return res.json({
        totalFeedback: 0,
        averageRatings: {
          quality: 0,
          speed: 0,
          communication: 0,
          professionalism: 0,
          overall: 0
        },
        overallAverage: 0,
        fiveStarPercentage: 0,
        lowSatisfactionCount: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        ratingsOverTime: [],
        byCategory: {
          project: 0,
          general: 0
        }
      });
    }

    // Calculate averages
    const sumRatings = allFeedback.reduce((acc, fb) => {
      acc.quality += fb.ratings.quality;
      acc.speed += fb.ratings.speed;
      acc.communication += fb.ratings.communication;
      acc.professionalism += fb.ratings.professionalism;
      acc.overall += fb.ratings.overall;
      return acc;
    }, { quality: 0, speed: 0, communication: 0, professionalism: 0, overall: 0 });

    const averageRatings = {
      quality: (sumRatings.quality / totalFeedback).toFixed(1),
      speed: (sumRatings.speed / totalFeedback).toFixed(1),
      communication: (sumRatings.communication / totalFeedback).toFixed(1),
      professionalism: (sumRatings.professionalism / totalFeedback).toFixed(1),
      overall: (sumRatings.overall / totalFeedback).toFixed(1)
    };

    // Five-star percentage
    const fiveStarCount = allFeedback.filter(fb => fb.ratings.overall === 5).length;
    const fiveStarPercentage = ((fiveStarCount / totalFeedback) * 100).toFixed(1);

    // Low satisfaction count
    const lowSatisfactionCount = allFeedback.filter(fb => fb.ratings.overall <= 2).length;

    // Distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allFeedback.forEach(fb => {
      distribution[fb.ratings.overall]++;
    });

    // Ratings over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentFeedback = await Feedback.find({
      ...query,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Group by date
    const ratingsOverTime = [];
    const dateMap = new Map();
    
    recentFeedback.forEach(fb => {
      const date = fb.createdAt.toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, count: 0, avgRating: 0, totalRating: 0 });
      }
      const entry = dateMap.get(date);
      entry.count++;
      entry.totalRating += fb.ratings.overall;
      entry.avgRating = (entry.totalRating / entry.count).toFixed(1);
    });

    dateMap.forEach((value) => {
      ratingsOverTime.push({
        date: value.date,
        count: value.count,
        avgRating: parseFloat(value.avgRating)
      });
    });

    // By category
    const byCategory = {
      project: await Feedback.countDocuments({ ...query, feedbackType: 'project' }),
      general: await Feedback.countDocuments({ ...query, feedbackType: 'general' })
    };

    res.json({
      totalFeedback,
      averageRatings,
      overallAverage: averageRatings.overall,
      fiveStarPercentage,
      lowSatisfactionCount,
      distribution,
      ratingsOverTime,
      byCategory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public testimonials (4-5 star reviews, highlighted)
 */
exports.getPublicTestimonials = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const testimonials = await Feedback.find({
      isDeleted: false,
      'ratings.overall': { $gte: 4 },
      $or: [
        { isHighlighted: true },
        { 'ratings.overall': 5 }
      ]
    })
      .populate('projectId', 'title')
      .sort({ isHighlighted: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      testimonials: testimonials.map(t => ({
        _id: t._id,
        name: t.isAnonymous ? 'Anonymous' : t.name,
        ratings: t.ratings,
        reviewText: t.reviewText,
        projectTitle: t.projectId?.title || null,
        feedbackType: t.feedbackType,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update feedback (admin actions)
 */
exports.updateFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isReviewed, isFlagged, isHighlighted, isDeleted, adminNotes } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (isReviewed !== undefined) feedback.isReviewed = isReviewed;
    if (isFlagged !== undefined) feedback.isFlagged = isFlagged;
    if (isHighlighted !== undefined) feedback.isHighlighted = isHighlighted;
    if (isDeleted !== undefined) feedback.isDeleted = isDeleted;
    if (adminNotes !== undefined) feedback.adminNotes = adminNotes;

    await feedback.save();

    await feedback.populate('userId', 'fullName email');
    await feedback.populate('projectId', 'title');

    res.json({
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single feedback by ID (admin)
 */
exports.getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id)
      .populate('userId', 'fullName email')
      .populate('projectId', 'title');

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's projects for feedback form (authenticated users)
 */
exports.getUserProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      client: req.user._id,
      status: { $in: ['in-progress', 'near-completion', 'delivered'] }
    })
      .select('title status')
      .sort({ updatedAt: -1 });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
};

