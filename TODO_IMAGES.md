# TODO_IMAGES.md

Every image below is currently a temporary stock/placeholder. Nothing is blocked on missing art — the site ships with these placeholders until real assets are generated or photographed. This list is the backlog for swapping them out.

---

## Priority: HIGH — New Case Studies (added this session)

These three case studies were added to close industry-coverage gaps (Restaurant, Academy, Hotel) and currently use Unsplash stock photos with `// TODO: Replace with real YANSYTECH asset` comments in `client/src/data/caseStudies.js`.

### 1. Platterly (Restaurant) — hero image
- **File path:** `client/src/data/caseStudies.js` → `platterly.heroImage`
- **Suggested final path:** `/public/images/case-studies/platterly-hero.webp`
- **Dimensions:** 1600×1200 (4:3, used at 1200×675 display)
- **Prompt:** "A modern restaurant kitchen display system (KDS) screen mounted above a stainless steel pass, showing color-coded order tickets, warm ambient restaurant lighting in the background, blue and white UI accents, photorealistic, shallow depth of field"
- **Style:** Photorealistic, warm restaurant lighting, blue/white UI overlay
- **Priority:** HIGH

### 2. Platterly — mockup image
- **Suggested final path:** `/public/images/case-studies/platterly-mockup.webp`
- **Dimensions:** 1200×900
- **Prompt:** "A tablet POS device on a restaurant counter showing an order-taking interface, blue and white minimal UI, Arabic and English menu items visible, clean modern restaurant branding"
- **Priority:** HIGH

### 3. LearnSphere (Academy) — hero image
- **Suggested final path:** `/public/images/case-studies/learnsphere-hero.webp`
- **Dimensions:** 1600×1200
- **Prompt:** "A student watching an online course video lesson on a laptop, clean LMS interface with progress bar and course modules sidebar visible, blue and white enterprise SaaS design, bright modern study space"
- **Priority:** HIGH

### 4. LearnSphere — mockup image
- **Suggested final path:** `/public/images/case-studies/learnsphere-mockup.webp`
- **Dimensions:** 1200×900
- **Prompt:** "A close-up of a course certificate being generated on screen, blue and white academic branding, clean minimal UI, professional certification design"
- **Priority:** HIGH

### 5. StayLuxe (Hotel) — hero image
- **Suggested final path:** `/public/images/case-studies/stayluxe-hero.webp`
- **Dimensions:** 1600×1200
- **Prompt:** "A boutique hotel front desk with a receptionist using a modern property-management-system dashboard on a monitor, warm hospitality lighting, blue and white software UI accent, photorealistic"
- **Priority:** HIGH

### 6. StayLuxe — mockup image
- **Suggested final path:** `/public/images/case-studies/stayluxe-mockup.webp`
- **Dimensions:** 1200×900
- **Prompt:** "A direct hotel booking website shown on a laptop screen on a hotel lobby table, blue and white minimal design, room availability calendar visible"
- **Priority:** HIGH

---

## Priority: HIGH — Industries Page (new, `/industries`)

The new `client/src/pages/Industries.jsx` currently uses inline SVG line icons only (no photography) — this was a deliberate choice to avoid blocking on missing art. Adding a hero visual would strengthen the page.

### 7. Industries hero banner
- **Section:** Industries page hero
- **Suggested final path:** `/public/images/industries-hero.webp`
- **Dimensions:** 1920×800 (wide banner)
- **Prompt:** "A grid collage of 8 different small business environments — restaurant kitchen, medical clinic reception, classroom, real estate office, hotel lobby, factory floor, startup office, e-commerce warehouse — each with a subtle blue UI overlay, cohesive photographic style, enterprise SaaS aesthetic"
- **Style:** Photorealistic collage, blue/white overlay treatment
- **Priority:** MEDIUM (page functions fully without it)

---

## Priority: MEDIUM — Pre-Existing Gaps (found during this session's audit, not newly introduced)

### 8. All 6 original case studies (NexusRealty, VaultAnalytics, SprintStore, BookEase, OpsFlow, MoveIt)
- **Location:** `client/src/data/caseStudies.js` — every `heroImage`/`mockupImage` field
- **Current state:** Unsplash stock photos, each already flagged with `// TODO: Replace with real YANSYTECH asset`
- **Action needed:** Replace with real client screenshots/mockups once available, or commissioned photorealistic renders per project
- **Priority:** MEDIUM (site fully functional, but authenticity/trust improves with real work samples)

### 9. Blog post images (30 posts)
- **Location:** `client/src/data/blogPosts.js`
- **Current state:** Stock images, file header flags `TODO: Add real author photos and replace stock images`
- **Action needed:** Real author headshots (currently none) + topical cover images
- **Priority:** LOW-MEDIUM

### 10. Portfolio category imagery
- **Location:** `client/src/pages/Portfolio.jsx` — data-driven from backend admin uploads, not static
- **Action needed:** No code action — admin should upload real project screenshots via `/app/admin/portfolio`. Consider tagging existing "Other" category items into more specific categories (Hotels & Hospitality has no dedicated Portfolio category pill yet — see CONTENT_MISSING.md).
- **Priority:** LOW (data-entry task, not a dev task)

---

## Notes on placeholder convention used in this codebase

This project's existing convention (established before this session, in `caseStudies.js` and `blogPosts.js`) is to use real Unsplash stock photo URLs as placeholders — not "IMAGE REQUIRED" text cards — so the site never looks visibly broken or unfinished to a visitor. This session's new content (Platterly, LearnSphere, StayLuxe) follows the same established convention for consistency. All Unsplash placeholders are tagged with `// TODO: Replace with real YANSYTECH asset` comments so they're easy to grep and swap later:

```
grep -rn "TODO: Replace with real YANSYTECH asset" client/src/data/
```
