/* ═══════════════════════════════════════════════════════════════
   YANSY TECH — Case Studies Data
   TODO: Replace placeholder images with real YANSYTECH assets.
   ═══════════════════════════════════════════════════════════════ */

export const CASE_STUDIES = [
  /* ──────────────────────────────────────────────────────────────
     1. NexusRealty — Real Estate Platform
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'nexusrealty',
    title: 'NexusRealty',
    category: 'Real Estate · Web Development',
    tagline: 'From paper listings to a full digital platform generating 3x more leads',
    industry: 'Real Estate',
    service: 'web-development',
    duration: '10 weeks',
    year: '2024',
    color: '#d4af37',
    // TODO: Replace with real YANSYTECH asset
    heroImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
    // TODO: Replace with real YANSYTECH asset
    mockupImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    results: [
      { metric: '3x', label: 'Lead Generation' },
      { metric: '60%', label: 'Admin Time Reduced' },
      { metric: '2.1s', label: 'Page Load Time' },
      { metric: '4.8★', label: 'Agent Satisfaction' },
    ],
    excerpt: 'NexusRealty was managing 200+ property listings through spreadsheets and manual WhatsApp communication. We built a full digital platform that transformed their operations and tripled their qualified leads in 6 months.',
    challenge: {
      title: 'Manual Processes Limiting Growth',
      body: 'NexusRealty had 8 agents managing 200+ active property listings through a combination of spreadsheets, WhatsApp groups, and a basic WordPress site that hadn\'t been updated since 2019. Leads came through a contact form that sent emails — which were frequently lost. There was no way to know which listings were generating interest, which agents were performing, or how leads were converting.',
      points: [
        'Property listings scattered across spreadsheets, WhatsApp, and an outdated website',
        'No lead tracking — high-value inquiries fell through the cracks',
        'Agents spending 40% of their time on manual administrative tasks',
        'No mobile capability — agents couldn\'t access the system in the field',
        'Zero data on which listings, neighborhoods, or price points performed best',
      ],
    },
    strategy: {
      title: 'A Unified Digital Platform',
      body: 'We proposed a complete digital transformation: a customer-facing property portal with advanced search and virtual tours, combined with an internal agent CRM for lead management, listing administration, and performance analytics. The entire system designed for mobile-first use.',
    },
    uxProcess: {
      title: 'Research-Led Design',
      body: 'We interviewed 6 agents and 10 recent property buyers to understand their actual workflows and frustrations. The agents needed a system they could use one-handed while showing a property. The buyers needed better filtering and instant contact options. Both groups became our primary design drivers.',
    },
    stack: ['Next.js', 'Node.js', 'PostgreSQL', 'Google Maps API', 'Cloudinary', 'Stripe', 'SendGrid'],
    keyDecisions: [
      { title: 'Server-Side Rendering for SEO', desc: 'Property listings are rendered server-side for maximum Google indexing. Each property has its own SEO-optimized URL, structured data, and OpenGraph image.' },
      { title: 'Real-Time Lead Distribution', desc: 'WebSocket-based lead routing automatically assigns new inquiries to agents based on their listed properties and current load. No email, no delays.' },
      { title: 'Progressive Image Loading', desc: 'Property photos use progressive loading with blur placeholders. Average page weight reduced from 3.8MB to 0.9MB without visible quality reduction.' },
    ],
    outcome: 'Within 6 months of launch, NexusRealty had tripled their qualified lead volume. Agent administrative time dropped 60% — from 16 hours per week to 6 hours. The platform indexed over 300 property pages on Google, bringing organic traffic for the first time. The team expanded from 8 to 14 agents to handle the increased volume.',
    testimonial: {
      quote: 'We went from managing everything in WhatsApp groups to having a real business system. Our leads tripled and our team actually has time to sell now.',
      name: 'Ahmed Khalil',
      role: 'Managing Director, NexusRealty',
    },
    relatedServices: ['web-development', 'enterprise-software'],
    relatedStudies: ['opsflow', 'sprintstore'],
  },

  /* ──────────────────────────────────────────────────────────────
     2. VaultAnalytics — SaaS Dashboard
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'vaultanalytics',
    title: 'VaultAnalytics',
    category: 'FinTech · SaaS Development',
    tagline: 'A financial data SaaS that reached 10,000 users in 90 days',
    industry: 'FinTech / SaaS',
    service: 'saas-development',
    duration: '14 weeks',
    year: '2024',
    color: '#6366f1',
    // TODO: Replace with real YANSYTECH asset
    heroImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
    // TODO: Replace with real YANSYTECH asset
    mockupImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    results: [
      { metric: '10K', label: 'Users in 90 Days' },
      { metric: '4.9★', label: 'App Store Rating' },
      { metric: '$42K', label: 'MRR at Month 3' },
      { metric: '12%',  label: 'Monthly Churn' },
    ],
    excerpt: 'VaultAnalytics needed a SaaS platform that could handle complex financial data visualization for individual investors — powerful enough for professionals, simple enough for beginners. We built it in 14 weeks.',
    challenge: {
      title: 'Complex Data, Simple Experience',
      body: 'The founders had validated their concept with a spreadsheet-based prototype that 500 beta users were actively using. The challenge was turning that into a production SaaS — with real-time market data integration, subscription billing, a portfolio tracking engine, and an interface that didn\'t require an MBA to understand.',
      points: [
        'Existing solution was a complex Excel template — zero scalability',
        'Real-time market data API integration was technically complex',
        'Subscription pricing model needed trials, upgrades, and annual billing',
        'Users ranged from complete beginners to professional traders — one UI had to serve both',
        'Regulatory considerations for financial data display in MENA markets',
      ],
    },
    strategy: {
      title: 'Progressive Complexity Architecture',
      body: 'We designed a progressive disclosure UX — simple portfolio overview for beginners with deeper analytical tools discoverable as users grow. The subscription model was designed for expansion revenue: starter tier with core tracking, professional tier with real-time alerts and advanced charting, enterprise tier with API access.',
    },
    uxProcess: {
      title: 'User Segmentation-Led Design',
      body: 'We identified two primary user segments: the casual investor tracking a few stocks, and the active trader monitoring real-time positions. We designed separate dashboard views optimized for each use case, with a smart default that adapts based on portfolio complexity.',
    },
    stack: ['React', 'D3.js', 'Node.js', 'PostgreSQL', 'Redis', 'WebSockets', 'Stripe', 'Alpha Vantage API'],
    keyDecisions: [
      { title: 'WebSocket for Real-Time Data', desc: 'Market data pushed via WebSocket connection — users see live price changes without polling. Redis pub/sub handles data distribution to all active sessions.' },
      { title: 'Row-Level Security in PostgreSQL', desc: 'Every query is filtered by user ID at the database level — impossible to accidentally expose one user\'s financial data to another.' },
      { title: 'Feature Flags for Tier Management', desc: 'A feature flag system controls feature access by subscription tier — makes it trivial to adjust what each plan includes without code changes.' },
    ],
    outcome: 'VaultAnalytics launched on Product Hunt and ranked #2 Product of the Day. 10,000 users registered within 90 days. By month 3, MRR reached $42,000 with a conversion rate from free to paid of 8.4%. The platform has since expanded to support institutional clients with a dedicated enterprise tier.',
    testimonial: {
      quote: 'YANSY TECH didn\'t just build our product — they helped us think through the architecture decisions that made it scalable from day one. We couldn\'t have launched as fast or as cleanly without them.',
      name: 'Omar Elsayed',
      role: 'Co-Founder & CEO, VaultAnalytics',
    },
    relatedServices: ['saas-development', 'ui-ux-design'],
    relatedStudies: ['opsflow', 'bookease'],
  },

  /* ──────────────────────────────────────────────────────────────
     3. SprintStore — E-Commerce Platform
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'sprintstore',
    title: 'SprintStore',
    category: 'E-Commerce · Next.js',
    tagline: 'A custom e-commerce platform that achieved 40% higher conversion than Shopify',
    industry: 'E-Commerce',
    service: 'ecommerce-development',
    duration: '8 weeks',
    year: '2024',
    color: '#10b981',
    // TODO: Replace with real YANSYTECH asset
    heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
    // TODO: Replace with real YANSYTECH asset
    mockupImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
    results: [
      { metric: '+40%', label: 'Conversion Rate' },
      { metric: '2x',   label: 'Revenue in 90 Days' },
      { metric: '1.8s', label: 'Load Time (from 5.2s)' },
      { metric: '-62%', label: 'Cart Abandonment' },
    ],
    excerpt: 'SprintStore was losing customers to a 5-second Shopify store and a checkout that required account creation. We rebuilt on Next.js with a guest checkout flow and cut load time by 65% — resulting in 40% higher conversion.',
    challenge: {
      title: 'Shopify Throttling Growth',
      body: 'SprintStore had been on Shopify for 2 years. As their product catalog grew to 800+ SKUs, the theme became progressively slower. Their flagship theme — with its heavy JavaScript and third-party app integrations — was loading in 5.2 seconds on mobile. Combined with a forced account-creation checkout flow, cart abandonment had climbed to 78%.',
      points: [
        'Page load time of 5.2 seconds on mobile — losing customers before they see products',
        'Forced account creation in checkout — 40% of users abandoned at this step alone',
        'No control over checkout flow design — Shopify\'s locked checkout layout',
        'Monthly Shopify Plus fees increasing without commensurate value',
        'Product variant complexity (size, color, bundle) difficult to manage in Shopify admin',
      ],
    },
    strategy: {
      title: 'Custom Performance-First E-Commerce',
      body: 'We migrated SprintStore to a custom Next.js frontend with a Node.js backend and PostgreSQL database. The checkout was custom-built with guest checkout as the primary flow, requiring only email for order tracking. All 800+ SKUs migrated without data loss.',
    },
    uxProcess: {
      title: 'Checkout Flow Optimization',
      body: 'We audited session recordings from the Shopify store to identify every drop-off point. The checkout redesign was based on 8 specific friction points identified in the data. The new flow goes from cart to order confirmation in 4 steps with no account requirement.',
    },
    stack: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Stripe', 'Cloudflare', 'Algolia', 'Redis'],
    keyDecisions: [
      { title: 'Static Generation for Product Pages', desc: 'Every product page is statically generated at build time — loads instantly from Cloudflare\'s edge network. No server render time for the critical product experience.' },
      { title: 'Guest Checkout as Default', desc: 'Account creation removed from the checkout critical path. Email collected for order updates. Accounts offered post-purchase as a convenience, not a gate.' },
      { title: 'Algolia for Search', desc: 'Site search powered by Algolia for instant, typo-tolerant product discovery. Search-to-purchase conversion 3x higher than category browsing.' },
    ],
    outcome: 'Six weeks after launch, SprintStore\'s conversion rate had increased 40% — from 1.8% to 2.52%. Mobile conversion specifically jumped 61%. Cart abandonment dropped from 78% to 29%. Revenue doubled within 90 days. The reduced infrastructure cost also eliminated $2,400/month in Shopify Plus and app fees.',
    testimonial: {
      quote: 'The load time improvement alone would have been worth it. The conversion rate increase was beyond what we expected. We effectively doubled our business without increasing traffic.',
      name: 'Karim Ibrahim',
      role: 'Founder, SprintStore',
    },
    relatedServices: ['ecommerce-development', 'web-development'],
    relatedStudies: ['nexusrealty', 'bookease'],
  },

  /* ──────────────────────────────────────────────────────────────
     4. BookEase — Booking System
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'bookease',
    title: 'BookEase',
    category: 'Healthcare · Booking System',
    tagline: 'A medical clinic booking system that eliminated 80% of no-shows',
    industry: 'Healthcare',
    service: 'enterprise-software',
    duration: '7 weeks',
    year: '2023',
    color: '#f59e0b',
    // TODO: Replace with real YANSYTECH asset
    heroImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
    // TODO: Replace with real YANSYTECH asset
    mockupImage: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80',
    results: [
      { metric: '-80%', label: 'No-Show Rate' },
      { metric: '5x',   label: 'Online Bookings' },
      { metric: '3h',   label: 'Admin Time Saved/Day' },
      { metric: '4.9★', label: 'Patient Satisfaction' },
    ],
    excerpt: 'A medical clinic was losing 35% of appointments to no-shows managed through phone calls and a paper diary. We built a booking system with automated reminders that reduced no-shows by 80% and freed the reception team from hours of manual follow-up.',
    challenge: {
      title: 'Paper Diaries and Missed Appointments',
      body: 'A specialized medical clinic with 4 doctors was managing all appointments via phone calls and a paper diary. The reception team spent 3 hours per day manually calling to confirm appointments and following up on cancellations. No-show rate was 35% — empty appointment slots that generated no revenue.',
      points: [
        '35% no-show rate costing $4,000+ per month in lost revenue',
        'Reception team spending 3 hours/day on manual appointment calls',
        'No online booking — all scheduling required a phone call during business hours',
        'No visibility into appointment utilization — which doctors had gaps, when',
        'Patient records kept in physical files — no searchable history',
      ],
    },
    strategy: {
      title: 'Automated Intelligent Booking',
      body: 'We built a multi-channel booking system: a patient-facing web app for self-booking, an SMS/WhatsApp reminder system with intelligent scheduling, and an admin dashboard for the reception team to manage appointments, patients, and doctors\' calendars.',
    },
    uxProcess: {
      title: 'Patient-Centered Design',
      body: 'We recruited 8 clinic patients for user testing of the booking flow prototype. The target demographic skewed 45+, which informed our typography choices (larger text, higher contrast), the simple 3-step booking flow, and the decision to support WhatsApp reminders as a primary channel over email.',
    },
    stack: ['React', 'Node.js', 'PostgreSQL', 'Twilio (SMS)', 'WhatsApp Business API', 'Google Calendar API'],
    keyDecisions: [
      { title: 'WhatsApp as Primary Reminder Channel', desc: 'WhatsApp has near-100% open rates in MENA vs. ~20% for email. We integrated WhatsApp Business API for appointment confirmations, 24h reminders, and 2h reminders.' },
      { title: 'Intelligent Slot Presentation', desc: 'The booking interface shows patients only the next available slots, organized by doctor preference. Complex calendar logic is hidden behind a simple 3-tap booking experience.' },
      { title: 'Two-Way Confirmation', desc: 'Reminders require patient confirmation via WhatsApp reply. Unconfirmed appointments at T-4h are automatically moved to a "at-risk" queue for reception to contact.' },
    ],
    outcome: 'No-show rate dropped from 35% to 7% within the first month — an immediate $3,200/month revenue recovery. Online self-bookings grew to represent 70% of all appointments, reducing reception call volume by 85%. The 3 hours per day of manual calling was eliminated. Patient satisfaction scores improved as wait times decreased from better schedule utilization.',
    testimonial: {
      quote: 'We couldn\'t believe how much time we were wasting on phone calls. Now the system handles everything automatically. Our doctors are fully booked and our no-shows are almost gone.',
      name: 'Dr. Nour Hassan',
      role: 'Clinic Director, BookEase',
    },
    relatedServices: ['enterprise-software', 'web-development'],
    relatedStudies: ['nexusrealty', 'opsflow'],
  },

  /* ──────────────────────────────────────────────────────────────
     5. OpsFlow — ERP Platform
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'opsflow',
    title: 'OpsFlow',
    category: 'Manufacturing · Enterprise Software',
    tagline: 'A custom ERP that improved operational efficiency by 35% in 6 months',
    industry: 'Manufacturing & Distribution',
    service: 'enterprise-software',
    duration: '20 weeks',
    year: '2024',
    color: '#8b5cf6',
    // TODO: Replace with real YANSYTECH asset
    heroImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
    // TODO: Replace with real YANSYTECH asset
    mockupImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    results: [
      { metric: '35%',  label: 'Operational Efficiency' },
      { metric: '90%',  label: 'Manual Entry Eliminated' },
      { metric: '6 wk', label: 'Inventory Visibility' },
      { metric: '€180K', label: 'Year 1 Cost Savings' },
    ],
    excerpt: 'A manufacturing company was running operations across 5 disconnected systems. We built a unified ERP that eliminated manual data entry between systems, provided real-time inventory visibility, and saved €180,000 in operational costs in the first year.',
    challenge: {
      title: 'Five Disconnected Systems',
      body: 'OpsFlow (name changed for confidentiality) was a mid-sized manufacturing company running production planning in Excel, inventory in a legacy system from 2011, order management in QuickBooks, logistics coordination over WhatsApp, and customer management in an outdated CRM. Every data point existed in multiple systems, manually entered multiple times, always slightly inconsistent.',
      points: [
        '5 disconnected systems — production, inventory, orders, logistics, CRM',
        '40% of staff time spent on data entry and reconciliation between systems',
        'Inventory data always out of date — stock outs discovered after orders committed',
        'Production planning done in Excel — no real-time capacity visibility',
        'WhatsApp-based logistics coordination — no audit trail, no accountability',
      ],
    },
    strategy: {
      title: 'Unified Operations Platform',
      body: 'We designed a centralized ERP system built around the company\'s specific manufacturing and distribution workflow. The key architectural decision was to identify the system of record for each data domain and build automated synchronization, eliminating manual re-entry.',
    },
    uxProcess: {
      title: 'Role-Based Interface Design',
      body: 'We mapped 7 user roles — warehouse manager, production planner, sales rep, logistics coordinator, finance team, management, and admin. Each role received a purpose-built dashboard showing only what they need to execute their daily tasks. Information overload was the enemy we fought hardest.',
    },
    stack: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'WebSockets', 'Docker', 'QuickBooks API', 'TypeScript'],
    keyDecisions: [
      { title: 'Real-Time Inventory Engine', desc: 'Inventory levels update in real-time via WebSocket events triggered by production completions, shipment receipts, and sales orders. Stock-outs now predicted 6 weeks in advance via demand forecasting.' },
      { title: 'QuickBooks Bidirectional Sync', desc: 'Rather than replacing the existing accounting setup, we built a bidirectional sync with QuickBooks — orders flow in, invoices flow out, reconciliation automated. Zero manual accounting data entry.' },
      { title: 'Phased Migration', desc: 'We migrated one business function at a time over 5 months, running the old and new systems in parallel for each function before switching. Zero business disruption during the transition.' },
    ],
    outcome: 'Operational efficiency improved 35% within 6 months — measured by output per employee hour. Manual data entry was reduced by 90%. Inventory visibility window extended from "current day" to 6-week forecasting. Total cost savings in year 1, including reduced labor and eliminated software licensing, calculated at €180,000.',
    testimonial: {
      quote: 'We didn\'t realize how much time we were losing until we saw how the new system worked. The ROI was clear within the first 3 months.',
      name: 'Hani Mansour',
      role: 'COO, OpsFlow',
    },
    relatedServices: ['enterprise-software', 'saas-development'],
    relatedStudies: ['vaultanalytics', 'nexusrealty'],
  },

  /* ──────────────────────────────────────────────────────────────
     6. MoveIt — Mobile Application
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'moveit',
    title: 'MoveIt',
    category: 'Logistics · Mobile App',
    tagline: 'A last-mile delivery app that reached 50,000 downloads in 6 months',
    industry: 'Logistics & Delivery',
    service: 'mobile-app-development',
    duration: '16 weeks',
    year: '2024',
    color: '#ec4899',
    // TODO: Replace with real YANSYTECH asset
    heroImage: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=1200&q=80',
    // TODO: Replace with real YANSYTECH asset
    mockupImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    results: [
      { metric: '50K',  label: 'Downloads in 6 Months' },
      { metric: '4.7★', label: 'App Store Rating' },
      { metric: '8min', label: 'Average Pickup Time' },
      { metric: '+320%', label: 'Driver Revenue' },
    ],
    excerpt: 'MoveIt is a last-mile delivery platform connecting senders with nearby drivers. We built the iOS and Android apps, the driver app, the dispatcher dashboard, and the backend — all in 16 weeks.',
    challenge: {
      title: 'Building a Two-Sided Marketplace App',
      body: 'MoveIt\'s founders had a clear concept — an Uber for last-mile delivery — and 3 months of runway to prove the model. The technical challenge was significant: two separate mobile apps (sender and driver), real-time location tracking, dynamic pricing, payment processing, and a dispatcher dashboard for managing the operation. Everything had to work first-time on launch day.',
      points: [
        'Two distinct user types — senders and drivers — requiring separate app experiences',
        'Real-time location tracking with sub-5-second update frequency',
        'Dynamic pricing based on distance, demand, and time of day',
        'In-app payment processing with escrow and driver payout logic',
        '3-month runway — scope discipline was existential',
      ],
    },
    strategy: {
      title: 'MVP-Focused Two-App Architecture',
      body: 'We scoped aggressively — two focused apps (sender and driver) sharing a single React Native codebase where possible. The core loop: request → match → track → pay. Everything else was deferred to v2. We delivered a working beta in 8 weeks and the full launch in 16.',
    },
    uxProcess: {
      title: 'Context-Appropriate Design',
      body: 'Drivers use the app while driving or handling packages — one-handed, in sunlight, time-pressured. Every driver screen was tested for legibility in direct sunlight and operated with one thumb. The sender experience prioritized clear delivery confirmation and tracking over feature density.',
    },
    stack: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Google Maps API', 'Stripe Connect', 'Firebase'],
    keyDecisions: [
      { title: 'Shared Codebase, Separate Experiences', desc: 'One React Native codebase powers both apps with role-based routing. Business logic, API clients, and state management are shared. UI components are role-specific. Maintenance cost halved.' },
      { title: 'WebSocket for Real-Time Tracking', desc: 'Driver location updates pushed via WebSocket at 3-second intervals. Location data processed in a separate service to isolate the real-time load from the main API.' },
      { title: 'Stripe Connect for Driver Payouts', desc: 'Stripe Connect handles the escrow model — customer charged at order creation, funds held, released to driver on delivery confirmation. Driver KYC handled by Stripe.' },
    ],
    outcome: 'MoveIt launched in Cairo with 200 beta drivers and 500 users on day 1. Within 6 months, 50,000 users had downloaded the app and the driver fleet had grown to 1,200. The 4.7-star rating on both stores indicated strong product-market fit. Driver income increased an average of 320% compared to their previous logistics employment.',
    testimonial: {
      quote: 'YANSY TECH built what we needed and cut the features we didn\'t. We launched on time, on budget, and the product actually worked. That\'s rarer than it should be.',
      name: 'Yasmin Farouk',
      role: 'Co-Founder, MoveIt',
    },
    relatedServices: ['mobile-app-development', 'saas-development'],
    relatedStudies: ['bookease', 'vaultanalytics'],
  },
];

export const getCaseStudyBySlug = (slug) => CASE_STUDIES.find(c => c.slug === slug) || null;
export const getAllCaseStudySlugs = () => CASE_STUDIES.map(c => c.slug);
export const getFeaturedCaseStudies = (n = 3) => CASE_STUDIES.slice(0, n);
