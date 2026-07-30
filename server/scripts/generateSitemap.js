'use strict';
/**
 * Regenerates the portfolio-items block of the built sitemap.xml from live,
 * published PortfolioProject data. Portfolio is the one content type on the
 * site that's admin-managed rather than a static data file, so unlike the
 * rest of sitemap.xml (hand-authored, edited rarely) it needs to be
 * refreshed on every deploy or it silently drifts out of date the moment an
 * admin publishes new case work.
 *
 * Run AFTER `npm run build` (so client/dist/sitemap.xml exists — Vite just
 * copies client/public/sitemap.xml verbatim) and BEFORE rsyncing dist/ to
 * the web root. See deploy/deploy.sh.
 *
 * Only ever writes to the BUILD OUTPUT (client/dist/sitemap.xml), never to
 * the source file in client/public/ — that stays hand-authored and under
 * version control; this script's output is a build artifact regenerated
 * fresh on every deploy.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PortfolioProject = require('../models/PortfolioProject');

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://yansytech.com';
const SITEMAP_PATH = path.join(__dirname, '..', '..', 'client', 'dist', 'sitemap.xml');
const START_MARKER = '<!-- PORTFOLIO_ITEMS_START -->';
const END_MARKER = '<!-- PORTFOLIO_ITEMS_END -->';

const escapeXml = (str) =>
  String(str).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const buildUrlEntry = (project) => {
  const loc = `${SITE_ORIGIN}/portfolio/${escapeXml(project.slug)}`;
  const lastmod = (project.updatedAt || project.createdAt || new Date()).toISOString().split('T')[0];
  return (
    `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.75</priority>` +
    `<xhtml:link rel="alternate" hreflang="en" href="${loc}"/>` +
    `<xhtml:link rel="alternate" hreflang="ar" href="${loc}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/></url>`
  );
};

const run = async () => {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`[generateSitemap] ${SITEMAP_PATH} not found — run "npm run build" in client/ first.`);
    process.exit(1);
  }

  const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const startIdx = sitemap.indexOf(START_MARKER);
  const endIdx = sitemap.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error('[generateSitemap] Injection markers not found in sitemap.xml — skipping (base sitemap left untouched).');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

  const projects = await PortfolioProject.find({ status: 'published', private: { $ne: true } })
    .select('slug updatedAt createdAt')
    .lean();

  const entries = projects.map(buildUrlEntry).join('\n');
  const before = sitemap.slice(0, startIdx + START_MARKER.length);
  const after = sitemap.slice(endIdx);
  const updated = `${before}\n${entries}\n  ${after}`;

  fs.writeFileSync(SITEMAP_PATH, updated, 'utf8');
  console.log(`[generateSitemap] Wrote ${projects.length} portfolio URL(s) into ${SITEMAP_PATH}`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('[generateSitemap] Failed:', err.message);
  process.exit(1);
});
