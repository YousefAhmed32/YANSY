const express = require('express');
const router = express.Router();
const {
  getBlogPosts,
  getBlogPostBySlug,
  getAllBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} = require('../controllers/blogController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Admin protected routes — declared before the public '/:slug' catch-all
router.get('/admin/all', authenticate, requireAdmin, getAllBlogPostsAdmin);
router.post('/', authenticate, requireAdmin, createBlogPost);
router.put('/:id', authenticate, requireAdmin, updateBlogPost);
router.delete('/:id', authenticate, requireAdmin, deleteBlogPost);

// Public routes
router.get('/', getBlogPosts);
router.get('/:slug', getBlogPostBySlug);

module.exports = router;
