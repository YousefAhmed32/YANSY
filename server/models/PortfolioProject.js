const mongoose = require('mongoose');

const portfolioProjectSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true, trim: true },
    titleAr:       { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['E-commerce', 'Medical', 'Real Estate', 'Restaurants & Food', 'SaaS / Platforms', 'Educational', 'Other'],
    },
    description:   { type: String, required: true },
    descriptionAr: { type: String },
    liveUrl:       { type: String, trim: true },
    coverImage:    { type: String, required: true },   // main image path
    images:        [{ type: String }],                 // up to 5 gallery images
    tags:          [{ type: String }],                 // e.g. ["React","Node.js"]
    featured:      { type: Boolean, default: false },  // show in Home section
    order:         { type: Number, default: 0 },
    isPublished:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PortfolioProject', portfolioProjectSchema);
