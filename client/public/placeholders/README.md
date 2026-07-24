# Placeholder Images

Drop real photography here to instantly replace the generated branded
placeholders — no code changes required anywhere in the app.

## Lookup order (`CaseStudyVisual` component)

For a case study with `slug: 'nexusrealty'` and `industryKey: 'real-estate'`,
the component tries, in order, and falls back to a generated on-brand
placeholder if none exist:

1. `case-studies/nexusrealty.jpg` — a specific image for that one project
2. `industries/real-estate.jpg` — a shared image for the whole industry
3. Generated placeholder (dark gradient + grid + industry icon + brand mark)

## Expected filenames — `industries/`

- `real-estate.jpg`
- `fintech-saas.jpg`
- `ecommerce.jpg`
- `healthcare.jpg`
- `manufacturing.jpg`
- `logistics.jpg`
- `restaurants.jpg`
- `education.jpg`
- `hospitality.jpg`

## Expected filenames — `case-studies/`

One file per case study `slug` from `client/src/data/caseStudies.js`
(e.g. `nexusrealty.jpg`, `vaultanalytics.jpg`, `sprintstore.jpg`, ...).
Takes priority over the industry-level image when present.

Recommended: `.jpg` or `.webp`, ~1600px wide, 16:9-ish crop (the component
covers/crops to fit any container).
