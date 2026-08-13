'use strict';
const Proposal = require('../../models/proposals/Proposal');
const ProposalClient = require('../../models/proposals/ProposalClient');
const ProposalVersion = require('../../models/proposals/ProposalVersion');
const ProposalTemplate = require('../../models/proposals/ProposalTemplate');
const { buildProposalSlug } = require('../../utils/proposals/slug');
const { buildProposalNumber } = require('../../utils/proposals/proposalNumber');
const { snapshotVersion } = require('./versionHelpers');
const { audit } = require('../../utils/auditLogger');
const htmlImportController = require('./htmlImportController');

const PUBLIC_CLIENT_FIELDS = 'name nameAr company email phone whatsapp country city';

const ensureUniqueSlug = async (baseText, excludeId) => {
  let slug = buildProposalSlug(baseText);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await Proposal.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id');
    if (!clash) return slug;
    slug = buildProposalSlug(baseText);
  }
};

const nextProposalNumber = async () => {
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await Proposal.countDocuments({ createdAt: { $gte: start, $lt: end } });
    const candidate = buildProposalNumber(count + 1 + attempt, year);
    // eslint-disable-next-line no-await-in-loop
    const clash = await Proposal.findOne({ proposalNumber: candidate }).select('_id');
    if (!clash) return candidate;
  }
  return buildProposalNumber(Date.now() % 10000, year); // pathological fallback, should never trigger
};

const PUBLISHED_STATUSES = ['SENT', 'VIEWED', 'CHANGE_REQUESTED', 'ACCEPTED', 'REJECTED'];

// ── List ────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { q, status, type, clientId, page = 1, limit = 20, sort } = req.query;
    const filter = {};
    if (status) filter.status = Array.isArray(status) ? { $in: status } : status;
    if (type) filter.type = type;
    if (clientId) filter.client = clientId;
    if (q?.trim()) {
      const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      filter.$or = [{ proposalNumber: rx }, { 'project.title': rx }, { 'project.titleAr': rx }];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Number(limit) || 20);

    const [items, total] = await Promise.all([
      Proposal.find(filter)
        .populate('client', PUBLIC_CLIENT_FIELDS)
        .sort(sort ? JSON.parse(sort) : { createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Proposal.countDocuments(filter),
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Dashboard stats ────────────────────────────────────────────────────
exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [byStatus, totalValueAgg, monthValueAgg, total, recent] = await Promise.all([
      Proposal.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Proposal.aggregate([
        { $match: { status: { $nin: ['DRAFT', 'ARCHIVED'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.finalPrice' } } },
      ]),
      Proposal.aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: { $nin: ['DRAFT', 'ARCHIVED'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.finalPrice' } } },
      ]),
      Proposal.countDocuments(),
      Proposal.find().populate('client', PUBLIC_CLIENT_FIELDS).sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      totalValue: totalValueAgg[0]?.total || 0,
      monthValue: monthValueAgg[0]?.total || 0,
      recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get one ─────────────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('client');
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    const item = proposal.toObject();
    // Convenience for the editor's ImportedHTMLViewer preview — served via
    // the dedicated frame-safe route (see htmlImportController.serveHtmlAsset
    // for why this can't be the generic /api/media/:id route).
    if (item.type === 'IMPORTED_HTML' && item.htmlAsset?.fileId) {
      item.htmlAssetUrl = htmlImportController.htmlAssetUrl(item.htmlAsset.fileId);
    }
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Create ──────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { client, project } = req.body;
    if (!client) return res.status(400).json({ error: 'client is required' });
    if (!project?.title) return res.status(400).json({ error: 'project.title is required' });

    const clientDoc = await ProposalClient.findById(client);
    if (!clientDoc) return res.status(400).json({ error: 'Client not found' });

    const proposalNumber = await nextProposalNumber();
    const slug = await ensureUniqueSlug(`${project.title}-${clientDoc.name}`);

    const proposal = await Proposal.create({
      ...req.body,
      proposalNumber,
      slug,
      status: 'DRAFT',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    clientDoc.usageCount = (clientDoc.usageCount || 0) + 1;
    clientDoc.lastUsedAt = new Date();
    await clientDoc.save();

    audit({ req, action: 'proposal.create', entityType: 'Proposal', entityId: proposal._id, after: proposal.toObject() });
    res.status(201).json({ item: proposal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Create from template ("Start from Template") ──────────────────────
exports.createFromTemplate = async (req, res) => {
  try {
    const template = await ProposalTemplate.findById(req.params.templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const { client, project } = req.body;
    if (!client) return res.status(400).json({ error: 'client is required' });
    if (!project?.title) return res.status(400).json({ error: 'project.title is required' });

    const clientDoc = await ProposalClient.findById(client);
    if (!clientDoc) return res.status(400).json({ error: 'Client not found' });

    const proposalNumber = await nextProposalNumber();
    const slug = await ensureUniqueSlug(`${project.title}-${clientDoc.name}`);

    const proposal = await Proposal.create({
      client,
      project,
      sections: template.sections,
      pricing: template.defaultPricing,
      timeline: template.defaultTimeline,
      terms: template.defaultTerms,
      branding: template.branding,
      template: template._id,
      proposalNumber,
      slug,
      status: 'DRAFT',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    template.usageCount = (template.usageCount || 0) + 1;
    await template.save();

    audit({ req, action: 'proposal.create_from_template', entityType: 'Proposal', entityId: proposal._id, metadata: { template: template._id } });
    res.status(201).json({ item: proposal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Update ──────────────────────────────────────────────────────────────
// Deliberately excludes 'type' and 'htmlAsset' — those only ever change via
// the dedicated import/replace endpoints (htmlImportController.js), which
// snapshot a version *before* swapping the HTML. Letting them through this
// generic PUT would let an HTML swap slip past versioning entirely.
const EDITABLE_FIELDS = ['client', 'project', 'sections', 'pricing', 'timeline', 'terms', 'branding', 'validityDate', 'notes'];

exports.update = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    const before = proposal.toObject();

    // A proposal the client has already been sent getting real content
    // changes is exactly what versioning exists for — snapshot the
    // pre-edit (i.e. what the client actually saw) state first, so no
    // published version is ever silently overwritten.
    if (PUBLISHED_STATUSES.includes(proposal.status)) {
      await snapshotVersion(proposal, { changeSummary: req.body.changeSummary, userId: req.user._id });
    }

    EDITABLE_FIELDS.forEach((f) => { if (req.body[f] !== undefined) proposal[f] = req.body[f]; });
    proposal.updatedBy = req.user._id;
    await proposal.save();

    audit({ req, action: 'proposal.update', entityType: 'Proposal', entityId: proposal._id, before, after: proposal.toObject() });
    res.json({ item: proposal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Delete ──────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    const before = proposal.toObject();
    await proposal.deleteOne();
    await ProposalVersion.deleteMany({ proposal: proposal._id });
    audit({ req, action: 'proposal.delete', entityType: 'Proposal', entityId: proposal._id, before });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Publish ─────────────────────────────────────────────────────────────
exports.publish = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    if (!proposal.project?.title) return res.status(400).json({ error: 'Proposal is missing a project title' });
    if (proposal.type === 'IMPORTED_HTML' && !proposal.htmlAsset?.fileId) {
      return res.status(400).json({ error: 'Upload an HTML file before publishing this proposal' });
    }

    proposal.status = 'SENT';
    proposal.publishedAt = proposal.publishedAt || new Date();
    proposal.updatedBy = req.user._id;
    await snapshotVersion(proposal, { changeSummary: 'Published', userId: req.user._id });
    await proposal.save();

    audit({ req, action: 'proposal.publish', entityType: 'Proposal', entityId: proposal._id });
    res.json({ item: proposal, publicUrl: `/p/${proposal.slug}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Duplicate ───────────────────────────────────────────────────────────
// Copies scope/pricing/timeline/terms/branding, resets client/number/slug/
// status/dates/views — see the wizard's "Duplicate Proposal" action.
exports.duplicate = async (req, res) => {
  try {
    const source = await Proposal.findById(req.params.id);
    if (!source) return res.status(404).json({ error: 'Not found' });

    const proposalNumber = await nextProposalNumber();
    const slug = await ensureUniqueSlug(`${source.project.title}-copy`);

    const copy = await Proposal.create({
      client: req.body.client || source.client,
      type: source.type,
      project: source.project,
      sections: source.sections,
      pricing: source.pricing,
      timeline: source.timeline,
      terms: source.terms,
      branding: source.branding,
      // IMPORTED_HTML: the new proposal points at the *same* GridFS file —
      // safe to share, the asset is immutable/read-only once uploaded, and
      // "Replace HTML" on one copy creates a version on that proposal only,
      // never mutates the shared file in place.
      htmlAsset: source.htmlAsset,
      notes: source.notes,
      template: source.template,
      proposalNumber,
      slug,
      status: 'DRAFT',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    audit({ req, action: 'proposal.duplicate', entityType: 'Proposal', entityId: copy._id, metadata: { sourceId: source._id } });
    res.status(201).json({ item: copy });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Archive ─────────────────────────────────────────────────────────────
exports.archive = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    proposal.status = 'ARCHIVED';
    proposal.updatedBy = req.user._id;
    await proposal.save();
    audit({ req, action: 'proposal.archive', entityType: 'Proposal', entityId: proposal._id });
    res.json({ item: proposal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Manual status change (e.g. mark REJECTED, extend past EXPIRED) ────
exports.changeStatus = async (req, res) => {
  try {
    const { status, validityDate } = req.body;
    if (!Proposal.STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    const before = { status: proposal.status, validityDate: proposal.validityDate };
    proposal.status = status;
    if (validityDate) proposal.validityDate = validityDate;
    proposal.updatedBy = req.user._id;
    await proposal.save();
    audit({ req, action: 'proposal.status_change', entityType: 'Proposal', entityId: proposal._id, before, after: { status, validityDate } });
    res.json({ item: proposal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Versions ────────────────────────────────────────────────────────────
exports.listVersions = async (req, res) => {
  try {
    const versions = await ProposalVersion.find({ proposal: req.params.id })
      .sort({ versionNumber: -1 })
      .populate('createdBy', 'fullName email');
    res.json({ items: versions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.restoreVersion = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    const version = await ProposalVersion.findOne({ _id: req.params.versionId, proposal: proposal._id });
    if (!version) return res.status(404).json({ error: 'Version not found' });

    // Restoring is itself a reversible edit — snapshot the current (about
    // to be overwritten) state first, so undoing a bad restore is just
    // another restore.
    await snapshotVersion(proposal, { changeSummary: `Restored from v${version.versionNumber}`, userId: req.user._id });

    Object.entries(version.snapshot).forEach(([key, value]) => { proposal[key] = value; });
    proposal.updatedBy = req.user._id;
    await proposal.save();

    audit({ req, action: 'proposal.restore_version', entityType: 'Proposal', entityId: proposal._id, metadata: { versionId: version._id } });
    res.json({ item: proposal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── PDF ─────────────────────────────────────────────────────────────────
exports.downloadPdf = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });

    const { renderProposalPdf } = require('../../services/proposals/pdfService');
    const pdfBuffer = await renderProposalPdf(proposal);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${proposal.proposalNumber}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[proposal pdf]', err.message);
    res.status(500).json({ error: 'Failed to generate PDF. Please try again.' });
  }
};
