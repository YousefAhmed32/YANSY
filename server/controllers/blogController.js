const BlogPost = require('../models/BlogPost');
const { audit } = require('../utils/auditLogger');

/**
 * @desc Get published blog posts with pagination, search & category filtering
 * @route GET /api/blog
 * @access Public
 */
const getBlogPosts = async (req, res) => {
  try {
    const { category, search, limit = 10, page = 1, featured } = req.query;

    const query = { published: true };

    if (category && category !== 'All' && category !== 'الكل') {
      query.category = category;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { 'title.en': searchRegex },
        { 'title.ar': searchRegex },
        { 'excerpt.en': searchRegex },
        { 'excerpt.ar': searchRegex },
        { 'tags.en': searchRegex },
        { 'tags.ar': searchRegex },
      ];
    }

    const pageSize = parseInt(limit, 10) || 10;
    const currentPage = parseInt(page, 10) || 1;
    const skip = (currentPage - 1) * pageSize;

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ publishDate: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    return res.json({
      success: true,
      posts,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching blog posts' });
  }
};

/**
 * @desc Get single post by slug (supports EN or AR slug)
 * @route GET /api/blog/:slug
 * @access Public
 */
const getBlogPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await BlogPost.findOne({
      $or: [{ 'slug.en': slug }, { 'slug.ar': slug }],
      published: true,
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Increment view count non-blockingly
    post.views = (post.views || 0) + 1;
    post.save().catch((err) => console.error('Failed to increment post views:', err));

    return res.json({ success: true, post });
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching post' });
  }
};

/**
 * @desc Admin: Get all posts (published + drafts)
 * @route GET /api/blog/admin/all
 * @access Private (Admin)
 */
const getAllBlogPostsAdmin = async (req, res) => {
  try {
    const posts = await BlogPost.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, posts });
  } catch (error) {
    console.error('Error in admin blog posts fetch:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching admin posts' });
  }
};

/**
 * @desc Admin: Create blog post
 * @route POST /api/blog
 * @access Private (Admin)
 */
const createBlogPost = async (req, res) => {
  try {
    const newPost = new BlogPost(req.body);
    await newPost.save();

    audit({
      req,
      action: 'blog.create',
      entityType: 'BlogPost',
      entityId: newPost._id,
      after: { title: newPost.title, slug: newPost.slug, published: newPost.published },
    });

    return res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(400).json({ success: false, message: error.message || 'Error creating post' });
  }
};

/**
 * @desc Admin: Update blog post
 * @route PUT /api/blog/:id
 * @access Private (Admin)
 */
const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const before = await BlogPost.findById(id).lean();
    const updatedPost = await BlogPost.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    audit({
      req,
      action: 'blog.update',
      entityType: 'BlogPost',
      entityId: updatedPost._id,
      before: before ? { title: before.title, published: before.published } : null,
      after: { title: updatedPost.title, published: updatedPost.published },
    });

    return res.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(400).json({ success: false, message: error.message || 'Error updating post' });
  }
};

/**
 * @desc Admin: Delete blog post
 * @route DELETE /api/blog/:id
 * @access Private (Admin)
 */
const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPost = await BlogPost.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    audit({
      req,
      action: 'blog.delete',
      entityType: 'BlogPost',
      entityId: deletedPost._id,
      before: { title: deletedPost.title, slug: deletedPost.slug },
    });

    return res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({ success: false, message: 'Error deleting post' });
  }
};

module.exports = {
  getBlogPosts,
  getBlogPostBySlug,
  getAllBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
};
