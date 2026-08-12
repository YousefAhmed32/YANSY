'use strict';

/**
 * Renders a proposal to PDF using a genuine headless-Chromium print
 * pipeline (`page.pdf()`) — selectable text, the print stylesheet's page
 * breaks honored — never a rasterized screenshot. Puppeteer's `page.pdf()`
 * emulates `@media print` by default, so the same stylesheet the browser's
 * own File → Print → Save as PDF would use is what renders here too.
 *
 * Two proposal types, two render paths:
 *   DYNAMIC        — navigates to the real public `/p/:slug` page (the
 *                     React ProposalRenderer), exactly as before.
 *   IMPORTED_HTML  — loads the uploaded HTML document's own bytes directly
 *                     via `page.setContent()` instead of navigating to a
 *                     URL. This prints the *exact* original document
 *                     natively (its own fonts/RTL/page-break CSS apply
 *                     untouched) and sidesteps the reliability problems of
 *                     asking Puppeteer to paginate a page that itself
 *                     contains a nested sandboxed iframe.
 */
let puppeteer;
try { puppeteer = require('puppeteer'); } catch (_) { puppeteer = null; }

const gridfs = require('../../media/gridfsRepository');

let browserPromise = null;
const getBrowser = () => {
  if (!puppeteer) {
    throw new Error("PDF generation requires the 'puppeteer' package — run `npm install puppeteer` in /server.");
  }
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: 'new',
        // --no-sandbox is required in most containerized/VPS deployments
        // (no unprivileged user namespaces available); safe here since the
        // only content ever loaded is our own public proposal route or a
        // proposal's own already-sanitized HTML bytes.
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      .catch((err) => { browserPromise = null; throw err; }); // let a failed launch retry next call instead of caching the rejection forever
  }
  return browserPromise;
};

const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].replace(/\/$/, '');

const PDF_OPTIONS = {
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
};

// Reads the imported HTML document's raw bytes straight out of GridFS —
// same process, no extra network hop, and sidesteps any ambiguity about
// which origin serves the API in a given deployment.
const readImportedHtml = async (fileId) => {
  const stream = gridfs.openDownloadStream(fileId);
  const chunks = [];
  await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', resolve);
    stream.on('error', reject);
  });
  return Buffer.concat(chunks).toString('utf8');
};

const renderProposalPdf = async (proposalOrSlug) => {
  // Defensive backward-compat: earlier versions of this function took a
  // bare slug string.
  const proposal = typeof proposalOrSlug === 'string' ? { type: 'DYNAMIC', slug: proposalOrSlug } : proposalOrSlug;

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 1600 });

    if (proposal.type === 'IMPORTED_HTML') {
      const fileId = proposal.htmlAsset?.fileId;
      if (!fileId) throw new Error('This proposal has no HTML file uploaded yet.');
      const html = await readImportedHtml(fileId);
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    } else {
      await page.goto(`${PUBLIC_SITE_URL}/p/${proposal.slug}`, { waitUntil: 'networkidle0', timeout: 30000 });
    }

    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    return await page.pdf(PDF_OPTIONS);
  } finally {
    await page.close();
  }
};

// Closed on graceful shutdown (see server.js) so a long-lived Chromium
// process never outlives the Node process that spawned it.
const closeBrowser = async () => {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch (_) { /* already gone */ }
  browserPromise = null;
};

module.exports = { renderProposalPdf, closeBrowser };
