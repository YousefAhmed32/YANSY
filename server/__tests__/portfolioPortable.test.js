'use strict';
/**
 * Pure-function tests for the Portfolio portable-JSON import system's
 * server-side pieces (server/utils/portfolioPortable.js). No live DB — the
 * relation resolver is tested against a minimal in-memory fake Model that
 * implements just the two Mongoose query shapes resolveOneRelation actually
 * calls (`findOne({slug})` and `find({$or}).limit(n)`), consistent with
 * this suite's no-live-DB convention (see models.test.js).
 */
const {
  FORMAT_ID, CURRENT_SCHEMA_VERSION, assertSupportedVersion,
  PortablePayloadError, assertSafeShape, assertSafePayloadSize,
  resolveOneRelation, resolveRelations,
} = require('../utils/portfolioPortable');

// ── Fake library Model ──────────────────────────────────────────────────────
class FakeLibraryModel {
  constructor(docs) { this.docs = docs; }
  async findOne(filter) {
    if (filter.slug) return this.docs.find((d) => d.slug === filter.slug) || null;
    return null;
  }
  find(filter) {
    const or = filter.$or || [];
    const matches = this.docs.filter((d) => or.some(([field, re]) => re && re.test(d[field] || '')));
    return { limit: async (n) => matches.slice(0, n) };
  }
}
// $or entries come out as { name: RegExp } | { nameAr: RegExp } objects —
// normalize to [field, RegExp] pairs for the fake's simple matcher.
const wrapFind = (docs) => {
  const model = new FakeLibraryModel(docs);
  const realFind = model.find.bind(model);
  model.find = (filter) => {
    const pairs = (filter.$or || []).map((cond) => Object.entries(cond)[0]);
    return realFind({ $or: pairs });
  };
  return model;
};

describe('portfolioPortable — format/version constants', () => {
  it('exposes the current format id and schema version', () => {
    expect(FORMAT_ID).toBe('yansy-portfolio-project');
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });

  it('accepts the current schema version', () => {
    expect(() => assertSupportedVersion(CURRENT_SCHEMA_VERSION)).not.toThrow();
  });

  it('rejects an unsupported (future) schema version with a 400-shaped error', () => {
    expect.assertions(3);
    try {
      assertSupportedVersion(99);
    } catch (err) {
      expect(err.status).toBe(400);
      expect(err.code).toBe('UNSUPPORTED_SCHEMA_VERSION');
      expect(err.message).toMatch(/99/);
    }
  });
});

describe('portfolioPortable — assertSafeShape', () => {
  it('allows a normal nested object', () => {
    expect(() => assertSafeShape({ a: { b: [1, 2, { c: 'ok' }] } })).not.toThrow();
  });

  it.each(['__proto__', 'constructor', 'prototype'])('rejects the dangerous key "%s"', (key) => {
    expect(() => assertSafeShape({ [key]: {} })).toThrow(PortablePayloadError);
  });

  it('rejects nesting deeper than the limit', () => {
    let obj = { v: 1 };
    for (let i = 0; i < 12; i += 1) obj = { nested: obj };
    expect(() => assertSafeShape(obj)).toThrow(/nested too deeply/);
  });

  it('rejects an oversized array', () => {
    expect(() => assertSafeShape(new Array(500).fill('x'))).toThrow(/too many items/);
  });

  it('rejects an oversized string', () => {
    expect(() => assertSafeShape('x'.repeat(5000))).toThrow(/too long/);
  });
});

describe('portfolioPortable — assertSafePayloadSize', () => {
  it('allows a small payload', () => {
    expect(() => assertSafePayloadSize({ project: { title: 'ok' } })).not.toThrow();
  });

  it('rejects a payload over the size cap', () => {
    const huge = { blob: 'x'.repeat(3 * 1024 * 1024) };
    expect(() => assertSafePayloadSize(huge)).toThrow(/too large/);
  });
});

describe('portfolioPortable — resolveOneRelation', () => {
  const categories = [
    { _id: '1', slug: 'saas-platforms', name: 'SaaS / Platforms', nameAr: 'برمجيات / منصات' },
    { _id: '2', slug: 'e-commerce', name: 'E-commerce', nameAr: 'التجارة الإلكترونية' },
    { _id: '3', slug: 'other-saas', name: 'SaaS Tools', nameAr: 'أدوات SaaS' },
  ];

  it('resolves an exact slug match', async () => {
    const Model = wrapFind(categories);
    const result = await resolveOneRelation(Model, { slug: 'saas-platforms', name: 'SaaS / Platforms' });
    expect(result.status).toBe('resolved');
    expect(result.item.slug).toBe('saas-platforms');
  });

  it('falls back to an unambiguous name match when slug is absent', async () => {
    const Model = wrapFind(categories);
    const result = await resolveOneRelation(Model, { name: 'E-commerce' });
    expect(result.status).toBe('resolved');
    expect(result.item.slug).toBe('e-commerce');
  });

  it('matches on nameAr too', async () => {
    const Model = wrapFind(categories);
    const result = await resolveOneRelation(Model, { nameAr: 'التجارة الإلكترونية' });
    expect(result.status).toBe('resolved');
    expect(result.item.slug).toBe('e-commerce');
  });

  it('returns unresolved when nothing matches', async () => {
    const Model = wrapFind(categories);
    const result = await resolveOneRelation(Model, { name: 'Totally Unknown Category' });
    expect(result.status).toBe('unresolved');
  });

  it('returns unresolved for an empty/missing descriptor', async () => {
    const Model = wrapFind(categories);
    expect((await resolveOneRelation(Model, null)).status).toBe('unresolved');
    expect((await resolveOneRelation(Model, {})).status).toBe('unresolved');
  });

  it('never auto-creates a record — a miss stays a miss', async () => {
    const Model = wrapFind(categories);
    const before = categories.length;
    await resolveOneRelation(Model, { name: 'Brand New Category' });
    expect(categories.length).toBe(before);
  });

  it('reports ambiguous — never silently picks one — when more than one item shares a name', async () => {
    const duplicateName = [
      { _id: 'a', slug: 'design-a', name: 'Design' },
      { _id: 'b', slug: 'design-b', name: 'Design' },
    ];
    const Model = wrapFind(duplicateName);
    const result = await resolveOneRelation(Model, { name: 'Design' });
    expect(result.status).toBe('ambiguous');
    expect(result.candidates).toHaveLength(2);
  });
});

describe('portfolioPortable — resolveRelations', () => {
  it('resolves single and multiple relation fields together', async () => {
    const categoryModel = wrapFind([{ _id: '1', slug: 'saas', name: 'SaaS', nameAr: 'ساس' }]);
    const techModel = wrapFind([
      { _id: 't1', slug: 'nextjs', name: 'Next.js' },
      { _id: 't2', slug: 'nodejs', name: 'Node.js' },
    ]);

    const result = await resolveRelations(
      { category: { Model: categoryModel }, technologies: { Model: techModel, multiple: true } },
      { category: { slug: 'saas' }, technologies: [{ slug: 'nextjs' }, { name: 'Totally Unknown' }] }
    );

    expect(result.category.status).toBe('resolved');
    expect(result.technologies).toHaveLength(2);
    expect(result.technologies[0].status).toBe('resolved');
    expect(result.technologies[1].status).toBe('unresolved');
  });

  it('reports "empty" for a single relation field that was not provided at all', async () => {
    const categoryModel = wrapFind([]);
    const result = await resolveRelations({ category: { Model: categoryModel } }, {});
    expect(result.category.status).toBe('empty');
  });
});
