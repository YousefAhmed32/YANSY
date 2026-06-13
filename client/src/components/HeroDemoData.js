/**
 * HeroDemoData — Business Core Ecosystem
 * Gen-3: pure canvas data definitions
 * All coordinates in design space (W0 × H0)
 */

// Design canvas dimensions
export const W0 = 520;
export const H0 = 455;

// Core position in design space
export const CORE = { x: 260, y: 210 };

/**
 * Business system nodes.
 * x, y  — position in design space
 * rgb   — [r,g,b] for glow + orb color
 * r     — orb radius in design-space pixels
 * po    — pulse offset (radians) — each node has its own breathing phase
 */
export const NODES = [
  { id: 'website',   label: 'Website',          x: 298, y: 72,  rgb: [147, 197, 253], r: 8,  po: 0.00 },
  { id: 'mobile',    label: 'Mobile App',        x: 398, y: 119, rgb: [196, 181, 253], r: 7,  po: 0.80 },
  { id: 'crm',       label: 'CRM',               x: 424, y: 255, rgb: [252, 165, 165], r: 8,  po: 1.60 },
  { id: 'booking',   label: 'Booking',            x: 327, y: 353, rgb: [110, 231, 183], r: 7,  po: 2.40 },
  { id: 'revenue',   label: 'Revenue Engine',     x: 197, y: 344, rgb: [212, 175, 55],  r: 10, po: 3.20 },
  { id: 'analytics', label: 'Analytics',          x: 113, y: 258, rgb: [252, 211, 77],  r: 7,  po: 4.00 },
  { id: 'ai',        label: 'AI Automation',      x: 105, y: 154, rgb: [96,  165, 250], r: 9,  po: 4.80 },
  { id: 'journey',   label: 'Customer Journey',   x: 157, y: 87,  rgb: [255, 225, 180], r: 7,  po: 5.60 },
];

/**
 * Floating proof items — appear and dissolve in the atmosphere.
 * x, y   — design-space anchor
 * phase  — position in the 0–1 fade cycle (staggered so 2–3 visible simultaneously)
 */
export const PROOF = [
  { text: '+50 Clients',   x: 218, y: 112, phase: 0.00 },
  { text: '+120 Projects', x: 440, y: 194, phase: 0.28 },
  { text: '4.9 ★ Rating',  x: 260, y: 428, phase: 0.55 },
  { text: '$2M+ Revenue',  x: 72,  y: 308, phase: 0.82 },
];
