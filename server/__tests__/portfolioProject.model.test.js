'use strict';
/**
 * Schema-level tests for the Project Origin / Highlights additions (see the
 * v3.4 doc comment in models/PortfolioProject.js). Model instantiation +
 * validateSync only — no live DB, matching every other model test in this
 * suite (see models.test.js).
 */
const mongoose = require('mongoose');
const PortfolioProject = require('../models/PortfolioProject');

const baseFields = () => ({
  title: 'Test Project',
  slug: `test-project-${Math.random().toString(36).slice(2)}`,
  category: new mongoose.Types.ObjectId(),
});

describe('PortfolioProject — projectOrigin', () => {
  it('is unset (undefined) by default — legacy/unclassified projects are unaffected', () => {
    const p = new PortfolioProject(baseFields());
    expect(p.projectOrigin).toBeUndefined();
    const err = p.validateSync();
    expect(err).toBeUndefined();
  });

  it.each(PortfolioProject.PROJECT_ORIGIN_VALUES)('accepts the enum value "%s"', (value) => {
    const p = new PortfolioProject({ ...baseFields(), projectOrigin: value });
    const err = p.validateSync();
    expect(err).toBeUndefined();
    expect(p.projectOrigin).toBe(value);
  });

  it('rejects a value outside the enum', () => {
    const p = new PortfolioProject({ ...baseFields(), projectOrigin: 'madeUpValue' });
    const err = p.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.projectOrigin).toBeDefined();
  });

  it('is independent of deliveryStatus — a self-initiated project can still be live', () => {
    const p = new PortfolioProject({ ...baseFields(), projectOrigin: 'selfInitiated', deliveryStatus: 'live' });
    const err = p.validateSync();
    expect(err).toBeUndefined();
    expect(p.deliveryStatus).toBe('live');
    expect(p.projectOrigin).toBe('selfInitiated');
  });
});

describe('PortfolioProject — highlights', () => {
  it('defaults to an empty array', () => {
    const p = new PortfolioProject(baseFields());
    expect(p.highlights).toEqual([]);
  });

  it('accepts up to 3 items', () => {
    const p = new PortfolioProject({
      ...baseFields(),
      highlights: [{ text: 'One' }, { text: 'Two' }, { text: 'Three' }],
    });
    const err = p.validateSync();
    expect(err).toBeUndefined();
    expect(p.highlights).toHaveLength(3);
  });

  it('rejects more than 3 items', () => {
    const p = new PortfolioProject({
      ...baseFields(),
      highlights: [{ text: 'One' }, { text: 'Two' }, { text: 'Three' }, { text: 'Four' }],
    });
    const err = p.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.highlights).toBeDefined();
  });

  it('enforces max length on each language field', () => {
    const p = new PortfolioProject({
      ...baseFields(),
      highlights: [{ text: 'x'.repeat(PortfolioProject.HIGHLIGHT_TEXT_MAXLEN + 10) }],
    });
    const err = p.validateSync();
    expect(err).toBeDefined();
    expect(err.errors['highlights.0.text']).toBeDefined();
  });

  it('supports bilingual text/textAr independently', () => {
    const p = new PortfolioProject({
      ...baseFields(),
      highlights: [{ text: 'Rebuilt the design system', textAr: 'أعدنا بناء نظام التصميم' }],
    });
    const err = p.validateSync();
    expect(err).toBeUndefined();
    expect(p.highlights[0].text).toBe('Rebuilt the design system');
    expect(p.highlights[0].textAr).toBe('أعدنا بناء نظام التصميم');
  });
});

describe('PortfolioProject — services (pre-existing field, sanity check)', () => {
  it('accepts an array of Service ObjectIds', () => {
    const p = new PortfolioProject({ ...baseFields(), services: [new mongoose.Types.ObjectId()] });
    const err = p.validateSync();
    expect(err).toBeUndefined();
    expect(p.services).toHaveLength(1);
  });
});
