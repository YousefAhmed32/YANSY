/* ═══════════════════════════════════════════════════════════════
   Curated technology list, reusable stack templates, category-based
   smart suggestions, and codebase auto-detected tech list for the
   Portfolio CMS Technology Manager (TechTagInput.jsx).
   ═══════════════════════════════════════════════════════════════ */

// Predefined quick-add technologies requested by user
export const PRESET_TECHS = [
  'React', 'Vite', 'Next.js', 'Node.js', 'Express.js', 'MongoDB', 'Mongoose',
  'Tailwind CSS', 'TypeScript', 'JavaScript', 'Redux Toolkit', 'JWT', 'REST API',
  'GraphQL', 'Socket.io', 'Stripe', 'Cloudinary', 'Firebase', 'GridFS',
  'Docker', 'Nginx', 'PM2', 'Git', 'GitHub', 'GSAP', 'Framer Motion',
  'Shadcn UI', 'Prisma', 'PostgreSQL', 'MySQL',
];

// Additional popular technologies for autocomplete
export const ALL_KNOWN_TECHS = Array.from(new Set([
  ...PRESET_TECHS,
  'Vue.js', 'Nuxt.js', 'Svelte', 'Redis', 'Drizzle ORM', 'Python', 'FastAPI',
  'Django', 'Flask', 'AWS', 'Vercel', 'Netlify', 'Render', 'Supabase',
  'Firebase Auth', 'Zustand', 'React Query', 'Axios', 'Tailwind',
  'Material UI', 'Chakra UI', 'WebSockets', 'OAuth 2.0',
  'React Native', 'Expo', 'Flutter', 'Dart', 'Kotlin', 'Swift',
  'Google Maps API', 'SendGrid', 'Twilio', 'WhatsApp Business API', 'Recharts', 'D3.js',
]));

// Stack templates
export const STACK_TEMPLATES = [
  {
    name: 'MERN Stack',
    nameAr: 'حزمة MERN',
    tags: ['React', 'Vite', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'REST API', 'Tailwind CSS'],
    color: '#3B82F6',
  },
  {
    name: 'Next.js SaaS',
    nameAr: 'حزمة Next.js SaaS',
    tags: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Stripe', 'Tailwind CSS'],
    color: '#8B5CF6',
  },
  {
    name: 'React Dashboard',
    nameAr: 'لوحة تحكم React',
    tags: ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'Recharts'],
    color: '#EC4899',
  },
  {
    name: 'Mobile App',
    nameAr: 'تطبيق جوال',
    tags: ['React Native', 'Expo', 'TypeScript', 'Redux Toolkit', 'Firebase', 'REST API'],
    color: '#10B981',
  },
  {
    name: 'Realtime & Media',
    nameAr: 'تطبيق الوسائط والتفاعل',
    tags: ['React', 'Node.js', 'Socket.io', 'Cloudinary', 'GridFS', 'Express.js', 'MongoDB', 'Tailwind CSS'],
    color: '#F59E0B',
  },
];

// Smart Suggestions based on Project Category
export const CATEGORY_SUGGESTIONS = {
  'Medical': ['React', 'Node.js', 'MongoDB', 'JWT', 'Cloudinary', 'WhatsApp Business API', 'Tailwind CSS'],
  'Restaurants & Food': ['React', 'Node.js', 'Express.js', 'Socket.io', 'MongoDB', 'Stripe', 'Tailwind CSS'],
  'Educational': ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Prisma', 'AWS', 'Tailwind CSS'],
  'SaaS / Platforms': ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Stripe', 'Redis', 'Tailwind CSS'],
  'E-commerce': ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Stripe', 'Cloudflare', 'Tailwind CSS'],
  'Real Estate': ['Next.js', 'Node.js', 'PostgreSQL', 'Google Maps API', 'Cloudinary', 'Stripe', 'Tailwind CSS'],
  'Hotels & Hospitality': ['React', 'Node.js', 'Express.js', 'MongoDB', 'Stripe', 'JWT', 'Tailwind CSS'],
  'Other': ['React', 'Vite', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS', 'Git'],
};

// Codebase Auto-Detected Technologies (from project package.json dependencies)
export const DETECTED_PROJECT_TECHS = [
  'React', 'Vite', 'Node.js', 'Express.js', 'MongoDB', 'Mongoose',
  'Tailwind CSS', 'TypeScript', 'Redux Toolkit', 'GSAP', 'Framer Motion',
  'Socket.io', 'Stripe', 'Cloudinary', 'GridFS', 'JWT', 'REST API', 'Axios',
];
