/**
 * useSEO — Per-page metadata + structured data injection
 *
 * Updates document.title, meta tags, canonical, and JSON-LD dynamically.
 * Works with Googlebot, Bingbot, and all modern AI search crawlers.
 *
 * Usage:
 *   useSEO({
 *     title: 'Portfolio | YANSY Tech',
 *     description: 'We build websites, e-commerce stores, and SaaS platforms.',
 *     keywords: 'web development, SaaS, e-commerce',
 *     canonical: 'https://yansytech.com/portfolio',
 *     schema: { "@context": "https://schema.org", "@type": "WebPage", ... },
 *   });
 */
import { useEffect } from 'react';

const BASE_TITLE        = 'YANSY TECH';
const BASE_URL          = 'https://yansytech.com';
const DEFAULT_OG_IMAGE  = `${BASE_URL}/assets/image/logo/og-yansytech-1200x630.png`;
const PAGE_SCHEMA_ID    = 'yansy-page-schema-ld';
const DEFAULT_TITLE       = `${BASE_TITLE} | Premium Digital Product Studio — Websites, E-commerce & SaaS`;
const DEFAULT_DESCRIPTION = 'YANSY TECH is a premium digital product studio. We build enterprise-grade websites, e-commerce platforms, SaaS products, booking systems, and custom software.';

const setMeta = (attr, name, content) => {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (url) => {
  if (!url) return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
};

const injectSchema = (schema) => {
  const existing = document.getElementById(PAGE_SCHEMA_ID);
  if (existing) existing.remove();
  if (!schema) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = PAGE_SCHEMA_ID;
  script.textContent = JSON.stringify(schema, null, 0);
  document.head.appendChild(script);
};

const removeSchema = () => {
  const el = document.getElementById(PAGE_SCHEMA_ID);
  if (el) el.remove();
};

export const useSEO = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogLocale,
  canonical,
  schema,
  noIndex = false,
} = {}) => {
  useEffect(() => {
    // Every caller already composes its own full title (e.g. "Contact Us | YANSY TECH") —
    // appending BASE_TITLE again here used to double up the brand name in every page's
    // <title>/OG tag site-wide ("Contact Us | YANSY TECH | YANSY TECH"). Use title as-is.
    const fullTitle = title || `${BASE_TITLE} | Premium Digital Product Studio`;

    /* Page title */
    document.title = fullTitle;

    /* Basic meta */
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    if (keywords) setMeta('name', 'keywords', keywords);

    /* Open Graph */
    setMeta('property', 'og:title',       ogTitle || fullTitle);
    setMeta('property', 'og:description', ogDescription || description);
    setMeta('property', 'og:image',       ogImage || DEFAULT_OG_IMAGE);
    setMeta('property', 'og:url',         canonical || `${BASE_URL}/`);
    if (ogLocale) setMeta('property', 'og:locale', ogLocale);

    /* Twitter Card */
    setMeta('name', 'twitter:title',       ogTitle || fullTitle);
    setMeta('name', 'twitter:description', ogDescription || description);
    setMeta('name', 'twitter:image',       ogImage || DEFAULT_OG_IMAGE);

    /* Canonical */
    setCanonical(canonical);

    /* Page-level structured data */
    injectSchema(schema);

    // Every setter above only ever writes a value forward — nothing reset the
    // previous route's title/description/OG/canonical when the next route
    // called useSEO({}) or didn't call it at all, so stale metadata (and even
    // a stale canonical URL) leaked across navigations. Restore site defaults
    // on unmount so the next page starts clean unless it sets its own values.
    return () => {
      removeSchema();
      document.title = DEFAULT_TITLE;
      setMeta('name', 'description', DEFAULT_DESCRIPTION);
      setMeta('name', 'robots', 'index, follow, max-image-preview:large');
      setMeta('property', 'og:title', DEFAULT_TITLE);
      setMeta('property', 'og:description', DEFAULT_DESCRIPTION);
      setMeta('property', 'og:image', DEFAULT_OG_IMAGE);
      setMeta('property', 'og:url', `${BASE_URL}/`);
      setMeta('name', 'twitter:title', DEFAULT_TITLE);
      setMeta('name', 'twitter:description', DEFAULT_DESCRIPTION);
      setMeta('name', 'twitter:image', DEFAULT_OG_IMAGE);
      setCanonical(`${BASE_URL}/`);
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogLocale, canonical, schema, noIndex]);
};
