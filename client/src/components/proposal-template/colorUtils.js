// Converts a "#RRGGBB" branding color into the "R G B" space-separated
// triplet format proposalTemplate.css expects for its `rgb(var(--x))`
// tokens. Falls back to the brand default blue on anything unparseable —
// never lets a bad hex value (or an unset field) break the page.
export const hexToRgbTriplet = (hex, fallback = '37 99 235') => {
  if (!hex) return fallback;
  const m = String(hex).trim().replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return fallback;
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16));
  return `${r} ${g} ${b}`;
};

// Cheap darken for the "ink" variant used on accent text/labels — a flat
// multiply toward black, good enough for a UI accent, not color-managed.
export const darkenTriplet = (hex, amount = 0.18) => {
  if (!hex) return null;
  const m = String(hex).trim().replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  const [r, g, b] = m.slice(1).map((h) => Math.round(parseInt(h, 16) * (1 - amount)));
  return `${r} ${g} ${b}`;
};
