'use strict';

/**
 * Common field sets shared by every reusable content-library model
 * (TeamMember, Client, Technology, Tag, Category, Industry, Service, ...).
 * Factory functions (not plain exported objects) because Mongoose schema
 * field defs must not be the same object instance shared across schemas.
 */

// Recency/ranking metadata every library entry needs for the RelationPicker's
// Recent/Most-Used sections — incremented server-side when a project saves a
// reference to the entry (see libraryRouter.factory.js `touchUsage`).
const libraryMetaFields = () => ({
  usageCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date },
  isPinned:   { type: Boolean, default: false },
});

// For libraries identified by a simple bilingual name (TeamMember, Client,
// Technology, Tag, Category, Industry, Service). Testimonial/Award have
// richer identity fields (quote/author, title/org) and use libraryMetaFields
// directly instead.
const namedLibraryFields = () => ({
  name:   { type: String, required: true, trim: true },
  nameAr: { type: String, trim: true },
  slug:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  ...libraryMetaFields(),
});

const librarySchemaOptions = { timestamps: true };

module.exports = { namedLibraryFields, libraryMetaFields, librarySchemaOptions };
