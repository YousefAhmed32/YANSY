'use strict';
const cheerio = require('cheerio');

/**
 * Sanitizer + structural inspector for imported proposal HTML documents
 * (Proposal Management System — "Import HTML Proposal").
 *
 * Unlike svgSanitizer.js, this deliberately does NOT strip <script> tags or
 * inline event handlers — an imported proposal may legitimately rely on
 * presentation JavaScript (scroll reveals, etc.), and the real security
 * boundary here isn't "no script survives sanitization" — it's that the
 * document is only ever rendered inside a sandboxed iframe
 * (`sandbox="allow-scripts"`, deliberately without `allow-same-origin` /
 * `allow-top-navigation` / `allow-popups` / `allow-forms` — see the
 * client's ImportedHTMLViewer.jsx) where any script it runs has no access
 * to the parent admin app, its cookies, its localStorage, or top-level
 * navigation, regardless of what the script tries to do.
 *
 * What this DOES strip is the small set of constructs that are dangerous
 * independent of the iframe sandbox, or actively work against it:
 *   - <meta http-equiv="refresh"> — can redirect the sandboxed frame itself
 *     on a timer, unrelated to top-navigation.
 *   - <base> — silently redefines the resolution base for every relative
 *     URL in the document; more likely to break/hijack asset paths than to
 *     serve any legitimate purpose in a hosted, self-contained proposal.
 *   - javascript: URIs on href/action/formaction — the one navigation
 *     vector sandboxing alone doesn't neutralize on its own without also
 *     disabling normal link clicks.
 */

const HTML_LOOKS_LIKE_RE = /<\s*(html|body|head|!doctype)\b/i;

const looksLikeHtml = (buffer) => HTML_LOOKS_LIKE_RE.test(buffer.slice(0, 4096).toString('utf8'));

const META_REFRESH_RE = /<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi;
const BASE_TAG_RE = /<base\b[^>]*>/gi;
const JS_URI_ATTR_RE = /\s+(href|action|formaction)\s*=\s*("(\s*javascript:[^"]*)"|'(\s*javascript:[^']*)')/gi;

const sanitizeHtml = (buffer) => {
  const text = buffer.toString('utf8');
  if (!HTML_LOOKS_LIKE_RE.test(text)) {
    const err = new Error('File does not look like a valid HTML document.');
    err.status = 400;
    throw err;
  }

  const cleaned = text
    .replace(META_REFRESH_RE, '')
    .replace(BASE_TAG_RE, '')
    .replace(JS_URI_ATTR_RE, '');

  return Buffer.from(cleaned, 'utf8');
};

/**
 * Non-blocking heads-up for the admin, surfaced in the upload response and
 * the editor preview — never blocks the upload, just flags the two most
 * common reasons an imported proposal renders differently once hosted than
 * it did on the designer's own machine.
 */
const inspectWarnings = (html, isRTL = true) => {
  const warnings = [];
  let $;
  try {
    $ = cheerio.load(html, { decodeEntities: false });
  } catch (_) {
    return warnings; // best-effort only — a parse hiccup here must never block the upload
  }

  const isRelative = (url) => url && !/^(https?:)?\/\//i.test(url) && !url.startsWith('data:') && !url.startsWith('#');

  let relativeAssetCount = 0;
  let externalResourceCount = 0;

  $('img[src], script[src], link[href], source[src]').each((_, el) => {
    const url = $(el).attr('src') || $(el).attr('href');
    if (!url) return;
    if (isRelative(url)) relativeAssetCount += 1;
    else if (/^https?:\/\//i.test(url)) externalResourceCount += 1;
  });

  if (relativeAssetCount > 0) {
    warnings.push(isRTL
      ? `يعتمد الملف على ${relativeAssetCount} ملفًا محليًا بمسار نسبي (صور/خطوط/سكربتات) لن يظهر بعد الرفع — فقط الصور المضمّنة (base64) أو الروابط الخارجية الكاملة ستعمل.`
      : `This file references ${relativeAssetCount} local asset(s) by relative path — those won't load once hosted. Only embedded (base64) images or full external URLs will display correctly.`);
  }
  if (externalResourceCount > 3) {
    warnings.push(isRTL
      ? `يعتمد الملف على ${externalResourceCount} مصدرًا خارجيًا (خطوط/صور/سكربتات) — قد يتأثر شكل العرض إذا توقف أحد هذه المصادر عن العمل مستقبلًا.`
      : `This file relies on ${externalResourceCount} external resources (fonts/images/scripts) — the proposal's appearance depends on those staying available.`);
  }

  const hasFixedWidth = /width\s*:\s*\d{3,}px/i.test(html);
  const hasResponsiveHints = /@media|max-width\s*:\s*\d+/i.test(html);
  if (hasFixedWidth && !hasResponsiveHints) {
    warnings.push(isRTL
      ? 'يبدو أن التصميم بعرض ثابت بدون قواعد استجابة (media queries) — راجع المعاينة على مقاس الموبايل قبل النشر.'
      : 'This design appears to use fixed widths with no responsive media queries — check the mobile preview before publishing.');
  }

  return warnings;
};

module.exports = { sanitizeHtml, looksLikeHtml, inspectWarnings };
