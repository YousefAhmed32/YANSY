'use strict';
const mongoose = require('mongoose');
const { createLibraryRouter } = require('./libraryRouter.factory');
const ProposalClient = require('../models/proposals/ProposalClient');
const ProposalService = require('../models/proposals/ProposalService');
const ProposalTemplate = require('../models/proposals/ProposalTemplate');
const Proposal = require('../models/proposals/Proposal');

/**
 * Mounts the three small reusable-content libraries the Proposal system is
 * built on. Reuses the same `createLibraryRouter` factory the portfolio CMS
 * libraries use (see routes/libraries.routes.js) rather than hand-rolling
 * three near-identical CRUD routers — the admin UI reuses the matching
 * generic AdminLibrary page the same way (see client libraryConfigs.js).
 * Each factory router already applies `authenticate, requireAdmin`
 * internally, so the extra routes added below inherit that guard for free.
 */
const mountProposalLibraryRoutes = (app) => {
  // ── Proposal Clients (recipients) ───────────────────────────────────
  const clientsRouter = createLibraryRouter(ProposalClient, {
    entityName: 'proposal_client',
    searchFields: ['name', 'nameAr', 'company', 'email'],
    slugSource: 'name',
    defaultSort: { createdAt: -1 },
  });

  // Proposal history + aggregate value for the client detail view (§14 of
  // the spec) — not expressible by the generic factory, which only ever
  // touches the one collection it was built for.
  clientsRouter.get('/:id/stats', async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid client id' });
      const clientObjectId = new mongoose.Types.ObjectId(req.params.id);

      const [proposals, totalValueAgg] = await Promise.all([
        Proposal.find({ client: clientObjectId })
          .select('proposalNumber slug project.title status pricing.finalPrice createdAt')
          .sort({ createdAt: -1 }),
        Proposal.aggregate([
          { $match: { client: clientObjectId, status: { $nin: ['DRAFT', 'ARCHIVED'] } } },
          { $group: { _id: null, total: { $sum: '$pricing.finalPrice' } } },
        ]),
      ]);

      res.json({
        proposals,
        proposalCount: proposals.length,
        acceptedCount: proposals.filter((p) => p.status === 'ACCEPTED').length,
        totalValue: totalValueAgg[0]?.total || 0,
        lastActivity: proposals[0]?.createdAt || null,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use('/api/proposal-clients', clientsRouter);

  // ── Proposal Services ───────────────────────────────────────────────
  app.use('/api/proposal-services', createLibraryRouter(ProposalService, {
    entityName: 'proposal_service',
    searchFields: ['name', 'nameAr', 'category'],
    slugSource: 'name',
    defaultSort: { order: 1, name: 1 },
  }));

  // ── Proposal Templates ──────────────────────────────────────────────
  const templatesRouter = createLibraryRouter(ProposalTemplate, {
    entityName: 'proposal_template',
    searchFields: ['name', 'nameAr', 'category'],
    slugSource: 'name',
    defaultSort: { isDefault: -1, name: 1 },
  });

  // "Set as default" needs to unset every other template's flag first — the
  // generic PATCH would happily set isDefault:true on one doc while leaving
  // a stale true on whichever template held it before.
  templatesRouter.patch('/:id/set-default', async (req, res) => {
    try {
      const template = await ProposalTemplate.findById(req.params.id);
      if (!template) return res.status(404).json({ error: 'Not found' });
      await ProposalTemplate.updateMany({ _id: { $ne: template._id } }, { $set: { isDefault: false } });
      template.isDefault = true;
      await template.save();
      res.json({ item: template });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use('/api/proposal-templates', templatesRouter);
};

module.exports = { mountProposalLibraryRoutes };
