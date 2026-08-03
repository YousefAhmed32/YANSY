const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    slug: {
      en: { type: String, required: true, lowercase: true, trim: true },
      ar: { type: String, required: true, lowercase: true, trim: true },
    },
    title: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    excerpt: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    content: {
      en: { type: mongoose.Schema.Types.Mixed, required: true },
      ar: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    seoTitle: {
      en: { type: String },
      ar: { type: String },
    },
    seoDescription: {
      en: { type: String },
      ar: { type: String },
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    tags: {
      en: [{ type: String }],
      ar: [{ type: String }],
    },
    author: {
      name: { type: String, default: 'YANSY Tech Team' },
      nameAr: { type: String, default: 'فريق يانسي تك' },
      role: { type: String, default: 'Senior Software Architect' },
      roleAr: { type: String, default: 'خبير تطوير برمجيات' },
      avatar: { type: String, default: '/placeholders/author-default.webp' },
    },
    coverImage: {
      type: String,
      default: '/placeholders/blog-default.webp',
    },
    readTime: {
      en: { type: Number, default: 5 },
      ar: { type: Number, default: 5 },
    },
    views: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

blogPostSchema.index({ 'slug.en': 1 });
blogPostSchema.index({ 'slug.ar': 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
