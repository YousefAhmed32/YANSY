'use strict';
const mongoose = require('mongoose');
const { namedLibraryFields, librarySchemaOptions } = require('./shared/libraryFields');

// New reusable library (Phase 1 of the Design Showcase work — see
// PROJECT_REVIEW.md §2/§3). Mirrors Category.js exactly (same bilingual
// name/slug + icon/order/isActive shape, same generic CRUD router) plus one
// extra flag:
//
//   isConceptType — marks a type (seeded true only for "UI/UX Concept") as
//   one whose projects have no real client engagement or live product. The
//   admin wizard and public detail page use this single flag — not a
//   hardcoded slug string — to decide whether to hide Client/Live URL/KPIs/
//   Testimonials/Awards/Results. Keeping it as admin-editable library data
//   (rather than a code constant) means a future type ("Branding Concept",
//   "Personal Project", ...) gets the same behavior just by ticking the
//   switch when it's created — no code change required.
const projectTypeSchema = new mongoose.Schema(
  {
    ...namedLibraryFields(),
    icon:          { type: String, trim: true },
    order:         { type: Number, default: 0 },
    isActive:      { type: Boolean, default: true },
    isConceptType: { type: Boolean, default: false },
  },
  librarySchemaOptions
);

projectTypeSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('ProjectType', projectTypeSchema);
