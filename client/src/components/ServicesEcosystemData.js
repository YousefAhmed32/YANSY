/**
 * ServicesEcosystem — design-space data
 * Canvas W0 × H0, hexagonal arrangement of 6 YANSY service nodes.
 */

export const W0 = 560;
export const H0 = 480;
export const CORE = { x: 280, y: 228 };

const _rad = d => d * Math.PI / 180;
const _HEX = 152;
const _hp  = a => ({
  x: CORE.x + _HEX * Math.cos(_rad(a)),
  y: CORE.y + _HEX * Math.sin(_rad(a)),
});

/**
 * Six service nodes in a perfect hexagonal arrangement.
 * po — individual pulse phase offset (radians)
 */
export const NODES = [
  { id: 'websites',  label: 'Websites',        sublabel: '+35% more leads',    ..._hp(-90),  rgb: [96,  165, 250], r: 11, po: 0.00 },
  { id: 'ecommerce', label: 'E-Commerce',       sublabel: '+40% checkout',      ..._hp(-30),  rgb: [167, 139, 250], r: 10, po: 1.05 },
  { id: 'saas',      label: 'SaaS Platforms',   sublabel: 'MVP in 6 weeks',     ..._hp(30),   rgb: [212, 175,  55], r: 12, po: 2.09 },
  { id: 'mobile',    label: 'Mobile Apps',      sublabel: 'iOS + Android',      ..._hp(90),   rgb: [ 52, 211, 153], r: 10, po: 3.14 },
  { id: 'booking',   label: 'Booking Systems',  sublabel: '80% fewer no-shows', ..._hp(150),  rgb: [251, 146,  60], r: 10, po: 4.19 },
  { id: 'crm',       label: 'CRM / ERP',        sublabel: '60% admin saved',    ..._hp(-150), rgb: [244, 114, 182], r: 10, po: 5.24 },
];

/**
 * Flow particles per connection:
 * 5 outward (node colour) + 3 inward (gold — return signal).
 */
export const mkFlowParticles = () => [
  ...Array.from({ length: 5 }, (_, i) => ({
    dir: 1, offset: i / 5,       speed: 0.090 + Math.random() * 0.045, size: 0.90 + Math.random() * 0.55,
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    dir: -1, offset: i / 3 + 0.08, speed: 0.070 + Math.random() * 0.035, size: 0.60 + Math.random() * 0.40,
  })),
];

/** Ambient drifting background particles. */
export const mkBgParticles = (n = 40) =>
  Array.from({ length: n }, () => ({
    x:    Math.random() * W0,
    y:    Math.random() * H0,
    vx:   (Math.random() - 0.5) * 0.14,
    vy:   -(Math.random() * 0.085 + 0.02),
    a:    Math.random() * 0.20 + 0.05,
    r:    Math.random() * 0.80 + 0.30,
    gold: Math.random() > 0.45,
  }));
