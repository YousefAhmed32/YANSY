// ── Demo project generator — shared builder ──────────────────────────────────
//
// Each category file (lms.js, saas.js, ...) exports a declarative "content
// pack": fully-written bilingual case-study copy plus a small pool of client
// identities. `buildDemoProject` turns a pack into the exact shape
// PortfolioWizard's form state expects, so a category file never has to know
// about the wizard, the schema, or React at all — just write good copy.
//
// Narrative fields may reference {client}/{clientAr}/{location}/{locationAr}
// tokens; the builder substitutes the randomly-picked client identity so the
// deep writing stays singular per category while the surface identity still
// varies between generations.
//
// `tags` intentionally carries both the tech stack AND category/SEO keywords
// — the schema has one string[] field that doubles as both (see
// PortfolioProject.js: "tags: doubles as tech-stack display"), so packs
// combine them into one curated list rather than inventing a second field.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const tpl = (str, vars) => {
  if (typeof str !== 'string') return str;
  return Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v ?? ''), str);
};

const tplDeep = (value, vars) => {
  if (typeof value === 'string') return tpl(value, vars);
  if (Array.isArray(value)) return value.map((v) => tplDeep(v, vars));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, tplDeep(v, vars)]));
  }
  return value;
};

export const buildDemoProject = (pack) => {
  const client = pick(pack.clients);
  const year = new Date().getFullYear() - pick([0, 0, 1]);

  const vars = {
    client: client.name,
    clientAr: client.nameAr,
    location: client.location,
    locationAr: client.locationAr,
  };
  const t = (v) => tplDeep(v, vars);

  const blocks = [
    { type: 'heading', level: 2, text: 'Business Value', textAr: 'القيمة التجارية' },
    { type: 'paragraph', text: t(pack.businessValue), textAr: t(pack.businessValueAr) },
    pack.highlightStats?.length ? { type: 'statRow', stats: pack.highlightStats } : null,
    { type: 'heading', level: 2, text: "What We'd Improve Next", textAr: 'ما الذي سنطوره لاحقًا' },
    { type: 'paragraph', text: t(pack.futureImprovements), textAr: t(pack.futureImprovementsAr) },
    { type: 'heading', level: 3, text: 'Suggested Gallery Shots', textAr: 'لقطات مقترحة للمعرض' },
    {
      type: 'paragraph',
      text: pack.gallerySuggestions.map((g, i) => `${i + 1}. ${g.caption}`).join('\n'),
      textAr: pack.gallerySuggestions.map((g, i) => `${i + 1}. ${g.captionAr}`).join('\n'),
    },
  ].filter(Boolean);

  return {
    title: t(pack.titleTemplate), titleAr: t(pack.titleTemplateAr),
    tagline: t(pack.tagline), taglineAr: t(pack.taglineAr),
    category: pack.category, industry: pack.industry,
    clientName: client.name, clientNameAr: client.nameAr,
    location: client.location, locationAr: client.locationAr,
    confidential: false, private: false,

    description: t(pack.description), descriptionAr: t(pack.descriptionAr),

    myRole: pack.myRole, myRoleAr: pack.myRoleAr,
    goals: t(pack.goals), goalsAr: t(pack.goalsAr),
    painPoints: t(pack.painPoints), painPointsAr: t(pack.painPointsAr),
    challenge: t(pack.challenge), challengeAr: t(pack.challengeAr),
    solution: t(pack.solution), solutionAr: t(pack.solutionAr),
    process: t(pack.process), processAr: t(pack.processAr),
    results: t(pack.results), resultsAr: t(pack.resultsAr),

    metrics: pack.metrics,
    performanceMetrics: pack.performanceMetrics,
    testimonial: {
      quote: t(pack.testimonial.quote), quoteAr: t(pack.testimonial.quoteAr),
      author: pack.testimonial.author, role: pack.testimonial.role, roleAr: pack.testimonial.roleAr,
    },
    faqs: pack.faqs,
    awards: [],
    team: pack.team,
    blocks,

    tags: pack.tags,
    duration: pack.duration,
    teamSize: pack.teamSize,
    year,
    launchDate: new Date(year, pick([1, 3, 5, 7, 9, 11]), pick([4, 12, 19, 26])).toISOString(),

    metaTitle: t(pack.metaTitle),
    metaDescription: t(pack.metaDescription),
    status: 'draft',
  };
};
