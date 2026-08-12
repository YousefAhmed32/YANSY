'use strict';

/**
 * Pure pricing math shared by the Proposal model's pre-save hook and the
 * admin editor's live "automatically calculate totals" preview (mirrored
 * client-side in client/src/utils/proposalPricing.js so the wizard doesn't
 * round-trip to the server on every keystroke — keep the two in sync if
 * this logic ever changes).
 */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const applyAdjustment = (base, amount, type) => {
  const n = Number(amount) || 0;
  return type === 'fixed' ? n : base * (n / 100);
};

const computeFinalPrice = (pricing = {}) => {
  const base = Number(pricing.price) || 0;
  const discountValue = applyAdjustment(base, pricing.discount, pricing.discountType || 'percentage');
  const afterDiscount = Math.max(0, base - discountValue);
  const taxValue = applyAdjustment(afterDiscount, pricing.tax, pricing.taxType || 'percentage');
  return round2(afterDiscount + taxValue);
};

const computeMilestoneAmounts = (pricing = {}) => {
  const finalPrice = computeFinalPrice(pricing);
  const milestones = Array.isArray(pricing.milestones) ? pricing.milestones : [];
  return milestones.map((m) => {
    const plain = m.toObject ? m.toObject() : m;
    const amount = plain.percentage != null
      ? round2(finalPrice * (Number(plain.percentage) / 100))
      : round2(plain.amount);
    return { ...plain, amount };
  });
};

module.exports = { round2, computeFinalPrice, computeMilestoneAmounts };
