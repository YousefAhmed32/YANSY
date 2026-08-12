// Mirrors server/utils/proposals/pricing.js exactly — kept as a client-side
// copy so the wizard's "automatically calculate totals" preview (spec §4,
// Step 4) doesn't need a round-trip to the server on every keystroke. If the
// server-side formula ever changes, update both.
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const applyAdjustment = (base, amount, type) => {
  const n = Number(amount) || 0;
  return type === 'fixed' ? n : base * (n / 100);
};

export const computeFinalPrice = (pricing = {}) => {
  const base = Number(pricing.price) || 0;
  const discountValue = applyAdjustment(base, pricing.discount, pricing.discountType || 'percentage');
  const afterDiscount = Math.max(0, base - discountValue);
  const taxValue = applyAdjustment(afterDiscount, pricing.tax, pricing.taxType || 'percentage');
  return round2(afterDiscount + taxValue);
};

export const computeMilestoneAmount = (percentage, finalPrice) => round2(finalPrice * (Number(percentage) / 100));
