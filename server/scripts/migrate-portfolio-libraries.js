'use strict';
/**
 * One-time migration: normalizes embedded portfolio data (team, client,
 * technologies, testimonial, awards, category, industry) into the new
 * reusable content libraries, and rewrites each PortfolioProject document to
 * reference them instead. See the CMS normalization plan for the rationale.
 *
 * Usage:
 *   node server/scripts/migrate-portfolio-libraries.js --dry-run   # report only, no writes
 *   node server/scripts/migrate-portfolio-libraries.js             # backup + real migration
 *
 * Reads/writes the raw `portfolioprojects` collection directly (NOT via the
 * PortfolioProject Mongoose model) because that model's schema has ALREADY
 * been updated to the new reference shape — reading old-shaped documents
 * through it would throw CastErrors (e.g. category "E-commerce" cast to
 * ObjectId). The new library models (TeamMember, Client, ...) are used
 * normally since their schemas match the data being written into them.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TeamMember  = require('../models/TeamMember');
const Client      = require('../models/Client');
const Technology  = require('../models/Technology');
const Testimonial = require('../models/Testimonial');
const Award       = require('../models/Award');
const Category    = require('../models/Category');
const Industry    = require('../models/Industry');
const { slugify } = require('../utils/slugify');

const DRY_RUN = process.argv.includes('--dry-run');
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s) => (s || '').toString().trim().toLowerCase();

// Exact 1:1 map of the old hardcoded enum (client/src/utils/portfolioTaxonomy.js)
// so category migration is a straight lookup, never fuzzy matching.
const LEGACY_CATEGORIES = [
  { name: 'E-commerce',           nameAr: 'التجارة الإلكترونية', icon: 'ShoppingBag' },
  { name: 'Medical',              nameAr: 'طبي',                  icon: 'HeartPulse' },
  { name: 'Real Estate',          nameAr: 'العقارات',             icon: 'Building2' },
  { name: 'Restaurants & Food',   nameAr: 'المطاعم والأغذية',     icon: 'UtensilsCrossed' },
  { name: 'SaaS / Platforms',     nameAr: 'برمجيات / منصات',      icon: 'TrendingUp' },
  { name: 'Educational',          nameAr: 'تعليمي',                icon: 'GraduationCap' },
  { name: 'Hotels & Hospitality', nameAr: 'الفنادق والضيافة',      icon: 'BedDouble' },
  { name: 'Other',                nameAr: 'أخرى',                  icon: 'Sparkles' },
];

const ensureUniqueSlug = async (Model, source, seen) => {
  const base = slugify(source) || `item-${Date.now()}`;
  let slugCandidate = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!seen.has(slugCandidate) && !(await Model.findOne({ slug: slugCandidate }).select('_id'))) {
      seen.add(slugCandidate);
      return slugCandidate;
    }
    n += 1;
    slugCandidate = `${base}-${n}`;
  }
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const rawCollection = mongoose.connection.db.collection('portfolioprojects');

  const projects = await rawCollection.find({}).toArray();
  console.log(`[migrate] Found ${projects.length} portfolio project(s).`);

  if (!DRY_RUN) {
    const backupDir = path.join(__dirname, '..', '..', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `portfolioprojects-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(projects, null, 2));
    console.log(`[migrate] Backed up ${projects.length} document(s) to ${backupPath}`);
  }

  // ── Pre-seed Category (exact 1:1 from the old enum) ──────────────────────
  const categoryByName = new Map();
  const categorySlugsSeen = new Set((await Category.find().select('slug')).map((c) => c.slug));
  for (const [i, def] of LEGACY_CATEGORIES.entries()) {
    let doc = await Category.findOne({ name: def.name });
    if (!doc) {
      const slugValue = await ensureUniqueSlug(Category, def.name, categorySlugsSeen);
      doc = DRY_RUN ? { _id: `[would-create:${slugValue}]`, ...def } : await Category.create({ ...def, slug: slugValue, order: i });
    }
    categoryByName.set(def.name, doc);
  }

  // ── Find-or-create caches for the free-text-matched libraries ───────────
  const industryCache = new Map();
  const clientCache = new Map();
  const technologyCache = new Map();
  const industrySlugsSeen   = new Set((await Industry.find().select('slug')).map((c) => c.slug));
  const clientSlugsSeen     = new Set((await Client.find().select('slug')).map((c) => c.slug));
  const technologySlugsSeen = new Set((await Technology.find().select('slug')).map((c) => c.slug));
  const teamSlugsSeen       = new Set((await TeamMember.find().select('slug')).map((c) => c.slug));

  const findOrCreate = async (Model, cache, slugsSeen, name, extra = {}) => {
    if (!name?.trim()) return { doc: null, created: false };
    const key = norm(name);
    if (cache.has(key)) return { doc: cache.get(key), created: false };
    let doc = await Model.findOne({ name: new RegExp(`^${escapeRx(name.trim())}$`, 'i') });
    let created = false;
    if (!doc) {
      const slugValue = await ensureUniqueSlug(Model, name, slugsSeen);
      doc = DRY_RUN
        ? { _id: `[would-create:${slugValue}]`, name: name.trim() }
        : await Model.create({ name: name.trim(), slug: slugValue, ...extra });
      created = true;
    }
    cache.set(key, doc);
    return { doc, created };
  };

  const report = {
    categoriesSeeded: LEGACY_CATEGORIES.length,
    distinctIndustries: 0, distinctClients: 0, distinctTechnologies: 0,
    teamMembersCreated: 0, testimonialsCreated: 0, awardsCreated: 0,
    projectsMigrated: 0,
    unrecognizedCategories: [],
    ambiguousTeamNames: [], // credited on >1 project — matched by exact name, worth a human glance
  };
  const teamNameCounts = new Map();
  const bulkOps = [];

  for (const project of projects) {
    const update = {};
    const unset = { clientName: '', clientNameAr: '', clientLogo: '', tags: '', testimonial: '' };

    // category — exact 1:1 map, pre-seeded above. Same field name as the old
    // schema (String enum -> ObjectId ref), so an unmigrated value must be
    // explicitly $unset — left in place, the old raw string would fail to
    // cast to ObjectId the next time Mongoose reads or populates it.
    const catDoc = categoryByName.get(project.category);
    if (catDoc) {
      update.category = catDoc._id;
    } else {
      if (project.category) report.unrecognizedCategories.push({ project: project.title, id: project._id, category: project.category });
      unset.category = '';
    }

    // industry — free text, find-or-create. Same field-name-reuse hazard as
    // category above: projects with no industry text must have the field
    // unset, not left holding the old (now-invalid) string type.
    if (project.industry) {
      const { doc } = await findOrCreate(Industry, industryCache, industrySlugsSeen, project.industry);
      if (doc) update.industry = doc._id;
      else unset.industry = '';
    } else {
      unset.industry = '';
    }

    // client — clientName/clientNameAr/clientLogo -> Client ref
    if (project.clientName) {
      const { doc } = await findOrCreate(Client, clientCache, clientSlugsSeen, project.clientName, {
        nameAr: project.clientNameAr, logo: project.clientLogo,
      });
      if (doc) update.client = doc._id;
    }

    // technologies — was the free-text `tags` array
    if (Array.isArray(project.tags) && project.tags.length) {
      const techIds = [];
      for (const t of project.tags) {
        const { doc } = await findOrCreate(Technology, technologyCache, technologySlugsSeen, t);
        if (doc) techIds.push(doc._id);
      }
      update.technologies = techIds;
    }

    // team — embedded { name, role, roleAr, avatar } -> { member, roleOverride, roleArOverride }
    if (Array.isArray(project.team) && project.team.length) {
      const credits = [];
      for (const m of project.team) {
        if (!m.name?.trim()) continue;
        const key = norm(m.name);
        teamNameCounts.set(key, (teamNameCounts.get(key) || 0) + 1);
        // Deliberately NOT cached across projects the same way client/tech
        // are — cache lookups still hit the DB via findOrCreate's own
        // `TeamMember.findOne`, so a name credited on multiple projects
        // still resolves to one shared TeamMember. The teamNameCounts map
        // just flags that overlap for the report below.
        const { doc, created } = await findOrCreate(TeamMember, new Map(), teamSlugsSeen, m.name, {
          position: m.role, positionAr: m.roleAr, avatar: m.avatar,
        });
        if (created) report.teamMembersCreated += 1;
        if (doc) credits.push({ member: doc._id, roleOverride: m.role || undefined, roleArOverride: m.roleAr || undefined });
      }
      update.team = credits;
    }

    // testimonial — single embedded object -> testimonials: [ref]
    if (project.testimonial?.quote?.trim() || project.testimonial?.author?.trim()) {
      const t = project.testimonial;
      if (!DRY_RUN) {
        const doc = await Testimonial.create({
          quote: t.quote || '', quoteAr: t.quoteAr, author: t.author || 'Unknown',
          authorAr: undefined, role: t.role, roleAr: t.roleAr, avatar: t.avatar, audio: t.audio,
        });
        update.testimonials = [doc._id];
      }
      report.testimonialsCreated += 1;
    }

    // awards — embedded array -> Award refs
    if (Array.isArray(project.awards) && project.awards.length) {
      if (!DRY_RUN) {
        const ids = [];
        for (const a of project.awards) {
          const doc = await Award.create({ title: a.title, titleAr: a.titleAr, org: a.org, year: a.year, url: a.url, type: 'award' });
          ids.push(doc._id);
        }
        update.awards = ids;
      }
      report.awardsCreated += project.awards.length;
    }

    if (DRY_RUN) {
      console.log(
        `  • "${project.title}" (${project._id}): ` +
        `category=${update.category ? 'ok' : (project.category ? 'UNRECOGNIZED' : '—')}, ` +
        `industry=${update.industry ? 'ok' : '—'}, client=${update.client ? 'ok' : '—'}, ` +
        `technologies=${(update.technologies || []).length}, team=${(update.team || []).length}, ` +
        `testimonial=${project.testimonial?.quote || project.testimonial?.author ? 'yes' : 'no'}, awards=${(project.awards || []).length}`
      );
    }

    bulkOps.push({ updateOne: { filter: { _id: project._id }, update: { $set: update, $unset: unset } } });
    report.projectsMigrated += 1;
  }

  for (const [name, count] of teamNameCounts.entries()) {
    if (count > 1) report.ambiguousTeamNames.push({ name, creditedOnProjects: count });
  }
  report.distinctIndustries = industryCache.size;
  report.distinctClients = clientCache.size;
  report.distinctTechnologies = technologyCache.size;

  console.log('\n[migrate] ── Report ──────────────────────────────────');
  console.log(JSON.stringify(report, null, 2));
  console.log('[migrate] ────────────────────────────────────────────\n');

  if (DRY_RUN) {
    console.log('[migrate] Dry run complete — no writes made. Review the report above, then re-run without --dry-run to execute.');
  } else {
    if (bulkOps.length) {
      const result = await rawCollection.bulkWrite(bulkOps);
      console.log(`[migrate] Updated ${result.modifiedCount} project document(s).`);
    }
    console.log('[migrate] Migration complete.');
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
