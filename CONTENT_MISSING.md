# CONTENT_MISSING.md

Content gaps identified while closing out the industries/trust/conversion audit. Nothing here blocks the current build — it's the backlog for the next content pass.

---

## Pages the original brief asked for that don't exist yet

The full brief called for a much larger site (per-category project pages, a dedicated Industries deep-dive per vertical, expanded Services sub-pages). This session shipped the highest-leverage pieces; the rest is listed here so it isn't silently dropped.

### 1. Per-category deep project pages (15 categories)
Brief asked for: Restaurant, Clinic, Academy, LMS, Real Estate, Hotel, Interior Design, Ecommerce, Corporate Website, Landing Page, ERP, CRM, Booking System, Portfolio Website — each with its own Hero / Gallery / Features / Business Problems / Solutions / Technology / Timeline / FAQ / CTA.
- **Current state:** The new `/industries` page covers 8 of these verticals at a *summary* card level (problem + 4 solution bullets + link to one matching case study), not full dedicated pages.
- **Why not built now:** Each of the 15 would be a ~400-600 line page with its own copy, gallery, and FAQ — roughly equivalent to building 15 more `ServiceDetail.jsx`-sized pages. That's a multi-week content + dev effort, not a same-session addition.
- **Recommended next step:** Prioritize the 3-4 highest-inquiry verticals (ask the business: which industries generate the most WhatsApp leads today?) and build those as full pages first, reusing `ServiceDetail.jsx`'s section structure as a template.

### 2. Additional Services not yet on `/services`
Brief listed: Website Development, UI/UX, ERP, CRM, Booking, SaaS, Mobile Apps, AI Integration, Automation, Maintenance, Hosting, SEO, Performance Optimization.
- **Current state:** `client/src/data/services.js` has 7 services (web-development, saas-development, ecommerce-development, mobile-app-development, ui-ux-design, enterprise-software, product-strategy). ERP/CRM/Booking are currently folded into "enterprise-software" rather than broken out.
- **Missing as standalone service pages:** AI Integration, Automation (partially covered by home `Solutions.jsx` card #7 "Process Automation" but no dedicated `/services/:slug` page), Maintenance, Hosting, SEO, Performance Optimization.
- **Recommended next step:** Decide whether these are separate paid services worth their own landing page (better for SEO long-tail keywords like "website maintenance Egypt") or sub-sections of existing service pages.

### 3. Industries page — 4th vertical categories the brief named but this session didn't add a full card for
Brief also named: Interior Design firms, Corporate websites, Landing pages, Portfolio websites — these are more "output types" than "industries" and were intentionally left off the `/industries` grid (which is organized by client vertical, not deliverable type). Worth a decision: should `/industries` also list deliverable-type entries, or should those live only on `/services`?

---

## Missing supporting content (smaller items)

### 4. Author photos for blog posts
- 30 posts in `client/src/data/blogPosts.js`, zero author photos (flagged in the file's own header comment before this session).

### 5. Testimonial photos
- `client/src/components/Testimonials.jsx` — check whether client photos exist or are initials/avatars only. Real photos (with permission) build more trust than initials.

### 6. Team / About page
- No `/about` page exists as a standalone route — footer links to `/#about` which doesn't currently anchor to a dedicated About section, and Header nav has no "About" item. If leadership wants a "meet the team" trust page (headshots, bios, years of experience), it doesn't exist yet.

### 7. Hotels & Hospitality portfolio category
- `client/src/pages/Portfolio.jsx`'s `CATEGORIES` filter list (admin-facing, backend-driven) doesn't have a distinct "Hotels & Hospitality" pill — hotel projects would currently fall under "Other". Case Studies and Industries pages already have full Hotel coverage; Portfolio's category list is the one place still missing it.

### 8. Case study cross-linking
- The 3 new case studies (Platterly, LearnSphere, StayLuxe) link forward to 2 related existing case studies each, but the existing 6 case studies' `relatedStudies` arrays weren't updated to link back to the new 3. Not broken (each case study page still shows its own 2 related links), just not fully bidirectional — a nice-to-have polish item.

---

## Known non-blocking backend/admin item

### 9. AdminPortfolio.jsx dark theme
While fixing a gold-button bug in this file, it became apparent `client/src/pages/AdminPortfolio.jsx` still uses dark-theme Tailwind classes (`text-white/90`, `border-white/10`, etc.) — contradicting the "fully migrated to light TK tokens" claim from a prior session. This is an internal admin tool (not visitor-facing), so it wasn't in scope to fully re-theme this session, but it should be revisited so the admin panel is visually consistent with the rest of the app.
