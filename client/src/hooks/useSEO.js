/**
 * useSEO — Per-page metadata + structured data injection
 *
 * Updates document.title, meta tags, canonical, and JSON-LD dynamically.
 * Works with Googlebot, Bingbot, and all modern AI search crawlers.
 *
 * Usage:
 *   useSEO({
 *     title: 'Services | YANSY Tech',
 *     description: 'We build websites, e-commerce stores, and SaaS platforms.',
 *     keywords: 'web development, SaaS, e-commerce',
 *     canonical: 'https://yansytech.com/services',
 *     schema: { "@context": "https://schema.org", "@type": "WebPage", ... },
 *   });
 */
import { useEffect } from 'react';

const BASE_TITLE        = 'YANSY TECH';
const BASE_URL          = 'https://yansytech.com';
const DEFAULT_OG_IMAGE  = `${BASE_URL}/assets/image/logo/logoweb9.png`;
const PAGE_SCHEMA_ID    = 'yansy-page-schema-ld';

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
    const fullTitle = title
      ? `${title} | ${BASE_TITLE}`
      : `${BASE_TITLE} | Premium Digital Product Studio`;

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

    return () => {
      removeSchema();
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogLocale, canonical, schema, noIndex]);
};
