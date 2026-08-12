'use strict';
const Proposal = require('../../models/proposals/Proposal');

let geoip = null;
try { geoip = require('geoip-lite'); } catch (_) { /* optional */ }
let UAParser = null;
try { ({ UAParser } = require('ua-parser-js')); } catch (_) {
  try { UAParser = require('ua-parser-js'); } catch (_) { /* optional */ }
}

const NOT_PUBLIC_STATUSES = ['DRAFT', 'ARCHIVED'];

// Fields intentionally excluded from the public payload: createdBy/updatedBy
// (internal user refs), viewLog (device/browser history — analytics data,
// not something the visitor needs), notes (private admin note), and the
// client's private CRM fields beyond name/company.
const toPublicProposal = (proposal, client) => {
  const base = {
    type: proposal.type,
    proposalNumber: proposal.proposalNumber,
    slug: proposal.slug,
    project: proposal.project,
    branding: proposal.branding,
    status: proposal.status,
    validityDate: proposal.validityDate,
    publishedAt: proposal.publishedAt,
    client: client ? { name: client.name, nameAr: client.nameAr, company: client.company } : null,
  };

  if (proposal.type === 'IMPORTED_HTML') {
    // The hosted document itself is served by the existing generic
    // /api/media/:id route (see media/media.routes.js) — no proposal
    // sections/pricing/timeline/terms to expose for this type.
    return { ...base, htmlAssetUrl: proposal.htmlAsset?.fileId ? `/api/media/${proposal.htmlAsset.fileId}` : null };
  }

  return {
    ...base,
    sections: (proposal.sections || [])
      .filter((s) => !s.isHidden)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
    // "Sell the scope, discuss the number in the meeting" — hidePriceFromClient
    // strips every number but keeps the payment-schedule *shape* so a
    // 'pricing' renderer section can still show something meaningful.
    pricing: proposal.pricing?.hidePriceFromClient
      ? { hidePriceFromClient: true, paymentScheduleType: proposal.pricing.paymentScheduleType }
      : proposal.pricing,
    timeline: proposal.timeline,
    terms: proposal.terms,
  };
};

const isExpired = (proposal) => proposal.validityDate && new Date(proposal.validityDate) < new Date();

// ── GET /api/public/proposals/:slug ────────────────────────────────────
exports.getBySlug = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ slug: req.params.slug }).populate('client');
    if (!proposal || NOT_PUBLIC_STATUSES.includes(proposal.status)) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (isExpired(proposal) && proposal.status !== 'EXPIRED') {
      proposal.status = 'EXPIRED';
      await proposal.save();
    }

    if (proposal.status === 'EXPIRED') {
      return res.json({
        expired: true,
        item: {
          project: { title: proposal.project.title, titleAr: proposal.project.titleAr },
          branding: proposal.branding,
          validityDate: proposal.validityDate,
        },
      });
    }

    res.json({ item: toPublicProposal(proposal, proposal.client) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/public/proposals/:slug/view ──────────────────────────────
// Fired once by the client page after a successful fetch. Separate from
// getBySlug so an admin previewing the proposal (or a retried fetch) never
// inflates the view count — only the dedicated call does.
exports.recordView = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ slug: req.params.slug });
    if (!proposal || NOT_PUBLIC_STATUSES.includes(proposal.status)) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    if (proposal.status === 'EXPIRED') return res.json({ ok: true, status: proposal.status });

    let device = null, browser = null, os = null;
    if (UAParser) {
      try {
        const parsed = new UAParser(req.headers['user-agent']).getResult();
        device = parsed.device?.type || 'desktop';
        browser = parsed.browser?.name || null;
        os = parsed.os?.name || null;
      } catch (_) { /* best-effort only — never block the view on a UA-parse failure */ }
    }

    // Country only — coarse and non-identifying. The IP itself is used for
    // this single lookup and then discarded, never persisted.
    let country = null;
    if (geoip) {
      try {
        const ip = (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '').trim();
        const geo = ip ? geoip.lookup(ip) : null;
        country = geo?.country || null;
      } catch (_) { /* best-effort only */ }
    }

    const now = new Date();
    if (!proposal.firstViewedAt) proposal.firstViewedAt = now;
    proposal.lastViewedAt = now;
    proposal.viewCount = (proposal.viewCount || 0) + 1;
    proposal.viewLog.push({ viewedAt: now, device, browser, os, country });
    if (proposal.viewLog.length > 200) proposal.viewLog = proposal.viewLog.slice(-200); // cap unbounded growth

    if (proposal.status === 'SENT') proposal.status = 'VIEWED';

    await proposal.save();
    res.json({ ok: true, status: proposal.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/public/proposals/:slug/accept ────────────────────────────
exports.accept = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: 'Name and email are required' });

    const proposal = await Proposal.findOne({ slug: req.params.slug });
    if (!proposal || NOT_PUBLIC_STATUSES.includes(proposal.status)) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status === 'EXPIRED') return res.status(410).json({ error: 'This proposal has expired' });

    proposal.status = 'ACCEPTED';
    proposal.clientResponse = {
      type: 'accepted', name: name.trim(), email: email.trim(),
      message: message?.trim() || '', respondedAt: new Date(),
    };
    await proposal.save();

    res.json({ ok: true, status: proposal.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/public/proposals/:slug/pdf ────────────────────────────────
exports.downloadPdf = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ slug: req.params.slug });
    if (!proposal || NOT_PUBLIC_STATUSES.includes(proposal.status)) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status === 'EXPIRED') return res.status(410).json({ error: 'This proposal has expired' });

    const { renderProposalPdf } = require('../../services/proposals/pdfService');
    const pdfBuffer = await renderProposalPdf(proposal);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${proposal.proposalNumber}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[public proposal pdf]', err.message);
    res.status(500).json({ error: 'Failed to generate PDF. Please try again.' });
  }
};

// ── POST /api/public/proposals/:slug/request-changes ───────────────────
exports.requestChanges = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const proposal = await Proposal.findOne({ slug: req.params.slug });
    if (!proposal || NOT_PUBLIC_STATUSES.includes(proposal.status)) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status === 'EXPIRED') return res.status(410).json({ error: 'This proposal has expired' });

    proposal.status = 'CHANGE_REQUESTED';
    proposal.clientResponse = {
      type: 'change_requested', name: name.trim(), email: email.trim(),
      message: message.trim(), respondedAt: new Date(),
    };
    await proposal.save();

    res.json({ ok: true, status: proposal.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
