'use strict';

/**
 * Renders a proposal to PDF by navigating a headless Chromium instance to
 * its real public page and using the browser's own print-to-PDF pipeline
 * (`page.pdf()`). This is a genuine vector PDF — selectable text, the print
 * stylesheet's page breaks honored — not a rasterized screenshot embedded
 * in a PDF wrapper. Puppeteer's `page.pdf()` emulates `@media print` by
 * default, so the same print stylesheet the browser's own
 * File → Print → Save as PDF would use is what renders here too.
 */
let puppeteer;
try { puppeteer = require('puppeteer'); } catch (_) { puppeteer = null; }

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
        // only page ever loaded is our own public proposal route.
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      .catch((err) => { browserPromise = null; throw err; }); // let a failed launch retry next call instead of caching the rejection forever
  }
  return browserPromise;
};

const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].replace(/\/$/, '');

const renderProposalPdf = async (slug) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 1600 });
    await page.goto(`${PUBLIC_SITE_URL}/p/${slug}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => document.fonts?.ready).catch(() => {});

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });
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
