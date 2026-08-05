'use strict';
const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { audit } = require('../utils/auditLogger');
const { slugify } = require('../utils/slugify');

/**
 * Generic CRUD router for a reusable content-library collection (Team,
 * Client, Technology, Tag, Testimonial, Award, Category, Industry, Service).
 * One factory instead of ~9 near-identical hand-written route files — see
 * the CMS normalization plan (`smooth-watching-sundae.md`). Media has its
 * own richer route file since it wraps GridFS uploads.
 *
 * options:
 *   entityName   - singular snake_case label for audit-log action names, e.g. 'team_member'
 *   searchFields - fields matched by the free-text `q` param (case-insensitive substring)
 *   slugSource   - field the auto-slug is derived from (namedLibraryFields models);
 *                  omit for slug-less models (Testimonial/Award)
 *   populate     - optional populate spec applied to list/get/recent/most-used responses
 *   defaultSort  - default Mongoose sort object
 */
const createLibraryRouter = (
  Model,
  { entityName = 'item', searchFields = ['name', 'nameAr'], slugSource, populate, defaultSort = { name: 1 } } = {}
) => {
  const router = express.Router();
  router.use(authenticate, requireAdmin);

  const buildSearchFilter = (q) => {
    if (!q?.trim()) return {};
    const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    return { $or: searchFields.map((f) => ({ [f]: rx })) };
  };

  const ensureUniqueSlug = async (source, excludeId) => {
    const base = slugify(source) || `item-${Date.now()}`;
    let slug = base;
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const clash = await Model.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id');
      if (!clash) return slug;
      n += 1;
      slug = `${base}-${n}`;
    }
  };

  const applyPopulate = (query) => (populate ? query.populate(populate) : query);

  // GET / — search + paginate
  router.get('/', async (req, res) => {
    try {
      const { q, page = 1, limit = 100, sort } = req.query;
      const filter = buildSearchFilter(q);
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(200, Number(limit) || 100);

      const [items, total] = await Promise.all([
        applyPopulate(Model.find(filter))
          .sort(sort ? JSON.parse(sort) : defaultSort)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Model.countDocuments(filter),
      ]);

      res.json({ items, total, page: pageNum, limit: limitNum });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /recent — most recently attached to a project
  router.get('/recent', async (req, res) => {
    try {
      const items = await applyPopulate(Model.find({ lastUsedAt: { $ne: null } }))
        .sort({ lastUsedAt: -1 })
        .limit(Number(req.query.limit) || 8);
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /most-used
  router.get('/most-used', async (req, res) => {
    try {
      const items = await applyPopulate(Model.find({ usageCount: { $gt: 0 } }))
        .sort({ usageCount: -1 })
        .limit(Number(req.query.limit) || 8);
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /:id
  router.get('/:id', async (req, res) => {
    try {
      const item = await applyPopulate(Model.findById(req.params.id));
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST / — create, with inline "+ New" support from the wizard pickers
  router.post('/', async (req, res) => {
    try {
      const data = { ...req.body };
      delete data.slug;
      if (slugSource) data.slug = await ensureUniqueSlug(data[slugSource] || data.name);

      const item = await Model.create(data);
      audit({ req, action: `${entityName}.create`, entityType: Model.modelName, entityId: item._id, after: item.toObject() });
      res.status(201).json({ item });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // PATCH /:id
  router.patch('/:id', async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      const before = item.toObject();

      const data = { ...req.body };
      const renamed = slugSource && data[slugSource] !== undefined && data[slugSource] !== before[slugSource];
      if (renamed) data.slug = await ensureUniqueSlug(data[slugSource], item._id);
      else delete data.slug;

      Object.assign(item, data);
      await item.save();

      audit({ req, action: `${entityName}.update`, entityType: Model.modelName, entityId: item._id, before, after: item.toObject() });
      res.json({ item });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // PATCH /:id/pin — toggle the shared/global pin used by the picker's "Pinned" section
  router.patch('/:id/pin', async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      item.isPinned = !item.isPinned;
      await item.save();
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /:id
  router.delete('/:id', async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      const before = item.toObject();
      await item.deleteOne();
      audit({ req, action: `${entityName}.delete`, entityType: Model.modelName, entityId: item._id, before });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

/**
 * Bumps usageCount/lastUsedAt on library entries whenever a project saves a
 * reference to them — called from portfolio.routes.js on create/update, so
 * Recent/Most-Used stay accurate without every wizard section reimplementing
 * the bump itself.
 */
const touchUsage = async (Model, ids = []) => {
  const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
  if (!list.length) return;
  await Model.updateMany({ _id: { $in: list } }, { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } });
};

module.exports = { createLibraryRouter, touchUsage };
