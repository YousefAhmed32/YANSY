/* ═══════════════════════════════════════════════════════════════
   YANSY TECH — Service Pages Data
   Single source of truth for all 7 core service pages.
   ═══════════════════════════════════════════════════════════════ */

export const SERVICES = [
  /* ──────────────────────────────────────────────────────────────
     1. WEB DEVELOPMENT
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'web-development',
    title: 'Web Development',
    metaTitle: 'Web Development Agency | YANSY TECH',
    metaDescription: 'YANSY TECH builds high-performance websites that convert visitors into customers. Custom React & Next.js development with SEO optimization, speed, and enterprise-grade quality.',
    keywords: 'web development agency Egypt, website development company, React web development, Next.js development, custom website development, professional web development',
    color: '#d4af37',
    icon: '⬡',
    tagline: 'Strategy · Design · Engineering',
    hero: {
      badge: 'Web Development',
      h1: 'Web Development That Converts',
      h1Gradient: 'Visitors Into Customers',
      sub: 'We build fast, beautiful, and conversion-optimized websites that work as your hardest-working salesperson — 24 hours a day, 7 days a week.',
      stats: [
        { num: '50+', label: 'Sites Launched' },
        { num: '98%', label: 'Client Satisfaction' },
        { num: '3x',  label: 'Average Traffic Lift' },
        { num: '24h', label: 'Response Guarantee' },
      ],
    },
    problem: {
      title: 'Most Websites Fail to Generate Business',
      body: 'You invested in a website but it sits there collecting dust — no leads, no calls, no conversions. The problem is rarely the design. It\'s the strategy. Most web development agencies build pretty websites, not business tools. They optimize for aesthetics, not outcomes.',
      points: [
        'Slow page load times that kill conversions (53% of users abandon after 3 seconds)',
        'Poor SEO structure that keeps you invisible on Google',
        'No clear user journey — visitors don\'t know what to do next',
        'Mobile experience that feels like an afterthought',
        'No conversion tracking — you can\'t improve what you can\'t measure',
      ],
    },
    solution: {
      title: 'Websites Built for Business Outcomes',
      body: 'YANSY TECH approaches every web project as a business problem first, not a design problem. We start by understanding your customers, your conversion goals, and your competitive landscape. Then we build a website that works.',
      points: [
        'Performance-first development — every site scores 90+ on Lighthouse',
        'SEO-optimized architecture from day one — proper H1 hierarchy, meta, schema',
        'Conversion-focused UX — tested user journeys with clear CTAs',
        'Mobile-first responsive design — perfect on every device',
        'Analytics and conversion tracking built in — you always know what\'s working',
      ],
    },
    process: [
      { step: 1, title: 'Discovery & Strategy', desc: 'We research your market, competitors, and target customers. We define clear conversion goals before writing a single line of code.' },
      { step: 2, title: 'Architecture & Design', desc: 'We design the information architecture, user flows, and visual design in Figma. You approve every screen before development begins.' },
      { step: 3, title: 'Development & Engineering', desc: 'We build with React or Next.js — clean, maintainable, and fast code. Every component is tested for performance and accessibility.' },
      { step: 4, title: 'SEO & Performance', desc: 'We implement technical SEO, structured data, meta tags, and performance optimization. Target: 90+ Lighthouse on all four categories.' },
      { step: 5, title: 'Launch & Handover', desc: 'We deploy to your hosting, set up analytics, and hand over complete documentation. Plus 30 days of free post-launch support.' },
    ],
    benefits: [
      { icon: '⚡', title: 'Lightning Fast', desc: 'Sub-2-second load times. Optimized images, code splitting, and edge CDN delivery for maximum speed.' },
      { icon: '🔍', title: 'SEO Ready', desc: 'Built for search engines from the ground up. Structured data, semantic HTML, and technical SEO best practices.' },
      { icon: '📱', title: 'Mobile Perfect', desc: 'Flawless experience on every device. Mobile-first design that converts on the screen your customers actually use.' },
      { icon: '♿', title: 'Accessible', desc: 'WCAG 2.1 AA compliant. Your website works for everyone, including users with disabilities.' },
      { icon: '🔒', title: 'Secure', desc: 'HTTPS enforced, XSS protection, CSRF prevention, and security headers configured correctly from day one.' },
      { icon: '📈', title: 'Conversion Optimized', desc: 'Strategic CTAs, social proof placement, and trust signals engineered to turn visitors into leads.' },
    ],
    stack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Vercel', 'Cloudflare'],
    faq: [
      { q: 'How long does a website take to build?', a: 'A standard informational website takes 2–3 weeks. A complex site with custom features, CMS integration, or e-commerce functionality typically takes 4–8 weeks. We provide a precise timeline after the initial consultation.' },
      { q: 'Do you build with WordPress or custom code?', a: 'We primarily build with React and Next.js for maximum performance and flexibility. For content-heavy sites where clients want self-editing capability, we integrate Sanity CMS or similar headless CMS systems — not WordPress, which we consider too slow and insecure for modern web standards.' },
      { q: 'Will I be able to update the content myself?', a: 'Yes. For sites that need content management, we integrate a user-friendly CMS so you can update text, images, and blog posts without touching code. We train you on the system and provide documentation.' },
      { q: 'Do you handle hosting and domain setup?', a: 'Yes. We can manage the full technical setup — domain configuration, hosting, SSL certificate, CDN, and email setup. We recommend Vercel or Cloudflare Pages for the best performance.' },
      { q: 'What happens if I need changes after the site launches?', a: 'We offer 30 days of free minor adjustments post-launch. For ongoing updates and maintenance, we offer monthly retainer packages starting from $299/month.' },
      { q: 'Can you redesign my existing website?', a: 'Absolutely. Redesign projects are a significant part of our work. We typically do a full audit of your existing site, identify what\'s working and what\'s not, then design and build an improved version.' },
    ],
    caseStudies: ['nexusrealty', 'sprintstore'],
  },

  /* ──────────────────────────────────────────────────────────────
     2. SAAS DEVELOPMENT
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'saas-development',
    title: 'SaaS Development',
    metaTitle: 'SaaS Development Company | Build Your SaaS Product | YANSY TECH',
    metaDescription: 'YANSY TECH builds end-to-end SaaS platforms — from MVP to scalable multi-tenant product. Authentication, billing, dashboards, and everything in between. Free consultation.',
    keywords: 'SaaS development company, SaaS platform development, build SaaS product, MVP development, SaaS startup development Egypt, software as a service development',
    color: '#6366f1',
    icon: '◈',
    tagline: 'MVP · Scale · Iterate',
    hero: {
      badge: 'SaaS Development',
      h1: 'Build a SaaS That Scales',
      h1Gradient: 'From Idea to Product',
      sub: 'We engineer complete SaaS platforms — authentication, billing, multi-tenancy, analytics, and dashboards. You focus on your market. We build the product.',
      stats: [
        { num: '15+', label: 'SaaS Products Built' },
        { num: '4–8w', label: 'MVP Timeline' },
        { num: '100%', label: 'Code Ownership' },
        { num: '24h',  label: 'Support Guarantee' },
      ],
    },
    problem: {
      title: 'Building SaaS Is More Complex Than It Looks',
      body: 'Most founders underestimate the engineering complexity of a real SaaS product. Authentication, subscription billing, team management, multi-tenancy, usage limits, webhooks, audit logs — each layer adds weeks of development. Getting it wrong early means expensive rewrites later.',
      points: [
        'Authentication alone takes weeks — password reset, OAuth, MFA, session management',
        'Subscription billing with Stripe is 3–4x more complex than it appears',
        'Multi-tenant data isolation is a critical security concern',
        'Premature scaling choices lead to expensive infrastructure rewrites',
        'Poor API design creates tech debt that slows every future feature',
      ],
    },
    solution: {
      title: 'A Production-Ready SaaS Architecture from Day One',
      body: 'YANSY TECH has built over 15 SaaS products. We\'ve solved every layer of the complexity stack and we bring that accumulated knowledge to every project. You get a production-ready architecture without the expensive trial and error.',
      points: [
        'Auth system with JWT, OAuth (Google, GitHub), MFA, and session management',
        'Stripe billing with subscriptions, usage-based pricing, trials, and invoicing',
        'Multi-tenant architecture with proper data isolation per organization',
        'Role-based access control (RBAC) for team management',
        'Admin dashboard with user management, analytics, and audit logs',
        'API documentation generated automatically',
      ],
    },
    process: [
      { step: 1, title: 'Product Discovery', desc: 'We map your user journeys, define the MVP feature set, and identify the riskiest assumptions to validate first. We help you build the right thing, not everything.' },
      { step: 2, title: 'Architecture Design', desc: 'We design the database schema, API structure, authentication flow, and billing integration before writing code. Architecture decisions made now save months later.' },
      { step: 3, title: 'MVP Development', desc: 'We build your MVP in focused 2-week sprints. Core features first, polish second. You review working software at the end of each sprint.' },
      { step: 4, title: 'Billing & Auth Integration', desc: 'We integrate Stripe, configure subscription tiers, implement team management, and build the admin panel. The commercial layer that makes it a real business.' },
      { step: 5, title: 'Performance & Security Audit', desc: 'Before launch, we conduct a full security review — SQL injection, XSS, CSRF, rate limiting, data isolation. We also performance-test at scale.' },
      { step: 6, title: 'Launch & Iteration', desc: 'We deploy to production, set up monitoring, and establish the sprint cadence for your post-launch feature roadmap.' },
    ],
    benefits: [
      { icon: '🔐', title: 'Auth & Security', desc: 'Complete auth system with JWT, OAuth, MFA, password reset, and session management. Security-first from day one.' },
      { icon: '💳', title: 'Billing Ready', desc: 'Stripe integration with subscriptions, trials, usage billing, dunning management, and customer portal.' },
      { icon: '🏢', title: 'Multi-Tenancy', desc: 'Proper data isolation between organizations. Each customer\'s data stays completely separate and secure.' },
      { icon: '👥', title: 'Team Management', desc: 'Invite members, assign roles, manage permissions. RBAC system that scales with your product.' },
      { icon: '📊', title: 'Analytics Built-In', desc: 'Usage tracking, feature flags, and business metrics from day one. Know exactly how customers use your product.' },
      { icon: '📖', title: 'Clean API', desc: 'RESTful API with proper versioning, rate limiting, webhooks, and auto-generated documentation.' },
    ],
    stack: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'Stripe', 'TypeScript', 'Docker'],
    faq: [
      { q: 'How long does it take to build a SaaS MVP?', a: 'A focused MVP with core features typically takes 6–10 weeks. This includes authentication, billing, the main feature set, and a basic admin dashboard. Scope determines timeline — we scope precisely in the discovery phase.' },
      { q: 'What does the billing integration include?', a: 'We integrate Stripe with subscription creation and management, trial periods, coupon codes, invoice generation, dunning management (failed payment recovery), and the customer billing portal. We also set up your webhook handling for all billing events.' },
      { q: 'Can you build on top of an existing codebase?', a: 'Yes. We review existing code, document the architecture, identify technical debt, and continue development from there. We\'ve taken over many partially-built SaaS products.' },
      { q: 'Do I need a technical co-founder to work with you?', a: 'No. We work directly with non-technical founders. We translate business requirements into technical decisions and explain tradeoffs in plain language. Many of our clients are business people, not engineers.' },
      { q: 'What happens after we launch — who maintains the product?', a: 'We offer ongoing development retainers for post-launch iteration. We continue building features, fixing bugs, and improving performance. Pricing depends on the monthly sprint volume you need.' },
      { q: 'Do you sign NDAs?', a: 'Yes, always. We sign a mutual NDA before sharing any project details. Your business idea and codebase are fully confidential.' },
    ],
    caseStudies: ['vaultanalytics', 'opsflow'],
  },

  /* ──────────────────────────────────────────────────────────────
     3. E-COMMERCE DEVELOPMENT
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'ecommerce-development',
    title: 'E-Commerce Development',
    metaTitle: 'E-Commerce Development Company | YANSY TECH',
    metaDescription: 'Custom e-commerce development by YANSY TECH. Faster than Shopify, more flexible than WooCommerce. Multi-currency, inventory management, and conversion-optimized checkout.',
    keywords: 'e-commerce development Egypt, online store development, custom e-commerce, ecommerce agency, online shop development, Shopify alternative, headless commerce',
    color: '#10b981',
    icon: '◇',
    tagline: 'Performance · Conversion · Growth',
    hero: {
      badge: 'E-Commerce Development',
      h1: 'E-Commerce That Sells',
      h1Gradient: 'More, Every Day',
      sub: 'Custom online stores engineered for maximum conversion. Faster loading, better UX, and checkout flows that don\'t leak customers.',
      stats: [
        { num: '+40%', label: 'Average CVR Lift' },
        { num: '2.1s',  label: 'Target Load Time' },
        { num: '20+',  label: 'Stores Built' },
        { num: '100%', label: 'Mobile Optimized' },
      ],
    },
    problem: {
      title: 'Generic Platforms Are Costing You Revenue',
      body: 'Shopify and WooCommerce get you online fast. But as your store grows, you hit ceilings: slow load times from bloated themes, limited checkout customization, poor mobile performance, and add-on costs that stack up. Generic stores look generic — and generic doesn\'t convert.',
      points: [
        'Shopify themes load in 4–6 seconds — you lose 20% of customers per second of delay',
        'Limited checkout customization means you can\'t optimize your most critical conversion step',
        'Platform fees eat into margin as you scale',
        'Competitor stores look identical to yours',
        'Integration limitations create workflow gaps that cost time and money',
      ],
    },
    solution: {
      title: 'A Custom Store Built for Conversion',
      body: 'We build custom e-commerce platforms with Next.js and headless architecture. Your store loads in under 2 seconds, has a conversion-optimized checkout flow, and can integrate with any payment provider, ERP, or warehouse system you need.',
      points: [
        'Sub-2-second load times with Next.js and Cloudflare CDN',
        'Custom checkout flow optimized for your specific product category and customer type',
        'Multi-currency and multi-language support out of the box',
        'Deep integration with payment gateways, shipping APIs, and inventory systems',
        'Admin panel built exactly for your workflow — no unnecessary complexity',
      ],
    },
    process: [
      { step: 1, title: 'Store Strategy', desc: 'We analyze your product catalog, target customer, and competitors. We define the conversion strategy before designing a single screen.' },
      { step: 2, title: 'UX & Design', desc: 'We design the product pages, category pages, cart, and checkout flow optimized for your specific customer behavior patterns.' },
      { step: 3, title: 'Development', desc: 'We build the frontend with Next.js for maximum performance and the backend with Node.js. Every component optimized for speed and conversion.' },
      { step: 4, title: 'Payment Integration', desc: 'We integrate your chosen payment providers — Stripe, PayPal, Fawry, PayMob, or others. Multi-currency and installment options if needed.' },
      { step: 5, title: 'Inventory & Operations', desc: 'We build or integrate the inventory management system, order processing workflow, and any third-party integrations (ERP, shipping, accounting).' },
      { step: 6, title: 'SEO & Analytics', desc: 'Product and category page SEO, structured data for rich results, and full analytics setup to track revenue, conversion rates, and customer lifetime value.' },
    ],
    benefits: [
      { icon: '⚡', title: 'Sub-2s Load Time', desc: 'Next.js with static generation and edge CDN delivers your store pages in under 2 seconds globally.' },
      { icon: '💳', title: 'Any Payment Provider', desc: 'Stripe, PayPal, Fawry, PayMob, bank transfer, installments — we integrate whatever your customers prefer.' },
      { icon: '🌍', title: 'Multi-Currency', desc: 'Sell globally with automatic currency detection and conversion. Prices display in the customer\'s local currency.' },
      { icon: '📦', title: 'Inventory Management', desc: 'Real-time stock tracking, low-stock alerts, variant management, and supplier integration.' },
      { icon: '🔍', title: 'E-Commerce SEO', desc: 'Structured data for rich results, canonical URLs, and category page optimization for Google Shopping.' },
      { icon: '📊', title: 'Revenue Analytics', desc: 'Full funnel analytics — acquisition, product performance, cart abandonment, and customer LTV.' },
    ],
    stack: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Stripe', 'Cloudflare', 'Redis', 'TypeScript'],
    faq: [
      { q: 'Why not just use Shopify?', a: 'Shopify is excellent for simple stores. Once you need custom checkout flows, complex integrations, multi-warehouse inventory, or maximum performance, custom development outperforms Shopify significantly. We\'ve migrated many Shopify stores to custom platforms with 40%+ conversion rate improvements.' },
      { q: 'Can you migrate my existing store to a custom platform?', a: 'Yes. We handle full data migrations — products, customer data, order history, reviews — from Shopify, WooCommerce, or Magento. No data is lost in the migration process.' },
      { q: 'Which payment gateways do you integrate?', a: 'We integrate any payment gateway. Most common in our region: Stripe, PayPal, Fawry, PayMob, Accept (AMAN). We also support buy-now-pay-later integrations for markets where installments are expected.' },
      { q: 'Can customers track their orders?', a: 'Yes. We build complete order management with customer-facing order tracking, email notifications at each status change, and optional SMS notifications. We integrate with major shipping carriers for real-time tracking.' },
      { q: 'Do you build the admin panel too?', a: 'Yes. Every custom store includes a complete admin panel — product management, order processing, inventory tracking, customer management, discount codes, and analytics dashboards.' },
      { q: 'How long does an e-commerce store take to build?', a: 'A standard product catalog store takes 4–6 weeks. A complex store with custom checkout, multi-warehouse, or marketplace features takes 8–14 weeks. We scope precisely after reviewing your requirements.' },
    ],
    caseStudies: ['sprintstore', 'nexusrealty'],
  },

  /* ──────────────────────────────────────────────────────────────
     4. MOBILE APP DEVELOPMENT
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'mobile-app-development',
    title: 'Mobile App Development',
    metaTitle: 'Mobile App Development — iOS & Android | YANSY TECH',
    metaDescription: 'React Native mobile app development for iOS and Android. YANSY TECH builds high-performance cross-platform apps with native UX quality. Free consultation.',
    keywords: 'mobile app development Egypt, React Native development, iOS Android app development, cross-platform app, mobile application development, startup mobile app',
    color: '#f59e0b',
    icon: '▣',
    tagline: 'iOS · Android · One Codebase',
    hero: {
      badge: 'Mobile App Development',
      h1: 'Mobile Apps That Feel Native',
      h1Gradient: 'On Both iOS & Android',
      sub: 'React Native development that delivers native-quality user experiences without the cost of maintaining two separate codebases.',
      stats: [
        { num: '10+',  label: 'Apps Shipped' },
        { num: '2-in-1', label: 'iOS & Android' },
        { num: '60fps', label: 'Animation Target' },
        { num: '6–12w', label: 'MVP Timeline' },
      ],
    },
    problem: {
      title: 'Native Development Costs Are Prohibitive for Most Businesses',
      body: 'Building separate iOS and Android apps means two codebases, two development teams, and twice the maintenance cost. But cross-platform frameworks often sacrifice performance and feel cheap. It\'s a false dilemma — there\'s a better way.',
      points: [
        'Maintaining separate iOS/Android codebases doubles your development cost',
        'Cross-platform apps built poorly feel sluggish and unpolished',
        'App Store optimization is neglected by most development agencies',
        'Integration with device features (camera, GPS, notifications) often poorly implemented',
        'Post-launch maintenance and OS updates frequently ignored',
      ],
    },
    solution: {
      title: 'Native Performance Without Native Cost',
      body: 'We build with React Native — the same framework used by Facebook, Shopify, and Airbnb. One codebase, two platforms, near-native performance. We\'ve shipped 10+ apps across the App Store and Google Play with an average rating of 4.7.',
      points: [
        'Shared codebase for iOS and Android — 60–70% cost reduction vs. native',
        'Native UI components for platform-appropriate look and feel',
        'Smooth 60fps animations and gesture handling',
        'Full access to device APIs — camera, GPS, push notifications, biometrics',
        'App Store and Play Store optimization for discovery and downloads',
      ],
    },
    process: [
      { step: 1, title: 'Product Definition', desc: 'We define the app\'s core user flows, feature set, and technical requirements. We identify what MVP looks like vs. the full vision.' },
      { step: 2, title: 'UI/UX Design', desc: 'We design every screen in Figma following iOS and Android design guidelines. Interactive prototypes for stakeholder approval before development.' },
      { step: 3, title: 'Development', desc: 'Sprints of 2 weeks with testable builds delivered after each sprint. You see real progress on real devices throughout development.' },
      { step: 4, title: 'Backend Integration', desc: 'We build or integrate the backend API that powers your app — authentication, data storage, push notifications, analytics, and payments.' },
      { step: 5, title: 'Testing & QA', desc: 'Testing on physical devices — multiple iPhone and Android models. We test performance, accessibility, offline behavior, and edge cases.' },
      { step: 6, title: 'App Store Launch', desc: 'We prepare all App Store and Play Store assets — screenshots, descriptions, keywords — and manage the submission process. We have experience navigating review rejections.' },
    ],
    benefits: [
      { icon: '📱', title: 'iOS & Android', desc: 'One codebase that runs on both platforms. Consistent experience with platform-specific UI adjustments where appropriate.' },
      { icon: '⚡', title: 'Native Performance', desc: '60fps animations, fast startup, and smooth gesture handling that feels indistinguishable from native.' },
      { icon: '🔔', title: 'Push Notifications', desc: 'Targeted push notification system with deep linking, notification history, and user preference management.' },
      { icon: '💳', title: 'In-App Purchases', desc: 'Subscription billing and one-time purchases via Apple Pay and Google Pay. Compliant with App Store policies.' },
      { icon: '📶', title: 'Offline Support', desc: 'Apps that work without internet and sync intelligently when connection is restored.' },
      { icon: '🔐', title: 'Biometric Auth', desc: 'Face ID, Touch ID, and fingerprint login for the security-conscious user base.' },
    ],
    stack: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'Firebase', 'Expo', 'Redux Toolkit', 'Stripe'],
    faq: [
      { q: 'Will my app work on both iPhone and Android?', a: 'Yes. We build with React Native which produces native apps for both iOS (iPhone, iPad) and Android. One codebase, two fully functional platforms.' },
      { q: 'How is React Native different from Flutter or Cordova?', a: 'React Native renders actual native UI components, unlike Cordova which renders in a WebView. Unlike Flutter, React Native uses native components rather than a custom rendering engine. The result is better platform consistency and integration with native device features.' },
      { q: 'How long does it take to build a mobile app?', a: 'An MVP mobile app typically takes 8–12 weeks. This includes design, development, backend, and App Store submission. More complex apps with advanced features take 12–20 weeks.' },
      { q: 'Do you handle the App Store submission?', a: 'Yes. We prepare all required assets (screenshots, descriptions, keywords, privacy policy) and manage the submission process. We also handle rejection appeals when they occur — which we\'ve navigated many times.' },
      { q: 'Can you build the backend for the app as well?', a: 'Absolutely. Every app project includes backend development. We build RESTful APIs with Node.js and your choice of database, or integrate with your existing backend.' },
      { q: 'What if Apple or Google releases an OS update that breaks the app?', a: 'This is covered by our maintenance retainers. We monitor for OS updates and compatibility issues and address them proactively. This is a service you cannot afford to skip.' },
    ],
    caseStudies: ['moveit', 'bookease'],
  },

  /* ──────────────────────────────────────────────────────────────
     5. UI/UX DESIGN
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'ui-ux-design',
    title: 'UI/UX Design',
    metaTitle: 'UI/UX Design Agency | Product Design | YANSY TECH',
    metaDescription: 'Research-driven UI/UX design that converts. YANSY TECH designs digital products, SaaS interfaces, mobile apps, and enterprise dashboards. Free design consultation.',
    keywords: 'UI UX design agency Egypt, product design agency, UX design services, SaaS UI design, user experience design, interface design, Figma design agency',
    color: '#ec4899',
    icon: '◉',
    tagline: 'Research · Design · Validate',
    hero: {
      badge: 'UI/UX Design',
      h1: 'Design That Drives',
      h1Gradient: 'Business Results',
      sub: 'Beautiful is not enough. We design interfaces that guide users toward the actions that grow your business — backed by research, tested with real users.',
      stats: [
        { num: '50+',  label: 'Products Designed' },
        { num: '+35%', label: 'Avg CVR Improvement' },
        { num: '48h',  label: 'First Prototype' },
        { num: '100%', label: 'Figma Delivery' },
      ],
    },
    problem: {
      title: 'Beautiful Design That Nobody Uses',
      body: 'Most design agencies optimize for design awards, not business metrics. They produce stunning portfolios filled with interfaces that look incredible in screenshots but fail when real users try to complete real tasks. Usability is not an accident — it\'s engineered.',
      points: [
        'Interfaces that confuse users, increasing support tickets and churn',
        'Onboarding flows that abandon users before they reach the \'aha moment\'',
        'Dashboards that overwhelm with information nobody asked for',
        'Mobile experiences designed on desktop, untested on actual phones',
        'Design systems that break when a third developer touches the code',
      ],
    },
    solution: {
      title: 'Research-Driven Design That Converts',
      body: 'We start every design project with user research — understanding the jobs-to-be-done, the points of friction, and the mental models of the people who will actually use this product. Every design decision is backed by evidence, not aesthetic preference.',
      points: [
        'User research and competitive analysis before any pixel is placed',
        'Information architecture designed for the actual user workflow',
        'Conversion-focused layout — attention hierarchy, visual weight, CTA placement',
        'Interactive prototypes tested with real users before development',
        'Complete design system for consistent, scalable product design',
      ],
    },
    process: [
      { step: 1, title: 'Discovery & Research', desc: 'We interview target users, analyze competitors, and audit the existing product (if any). We\'re looking for the real problem to solve, not the stated one.' },
      { step: 2, title: 'Information Architecture', desc: 'We map the product structure — how features connect, what the navigation looks like, how users move through the product to complete their goals.' },
      { step: 3, title: 'Wireframes', desc: 'Lo-fi wireframes to establish layout, hierarchy, and user flows. Fast to produce, fast to change. We validate the structure before adding visual design.' },
      { step: 4, title: 'Visual Design', desc: 'High-fidelity mockups in Figma with your brand system applied. Typography, color, spacing, and animation principles defined.' },
      { step: 5, title: 'Prototype & Test', desc: 'Interactive Figma prototypes shared with target users. We observe how they navigate, where they get stuck, and what they misunderstand. Then we iterate.' },
      { step: 6, title: 'Design System & Handoff', desc: 'Complete design system with components, tokens, and interaction specs. Clean developer handoff with every state documented.' },
    ],
    benefits: [
      { icon: '🔬', title: 'User Research', desc: 'We validate assumptions with real users before designing. No guessing — evidence-based design decisions.' },
      { icon: '🗂️', title: 'Design System', desc: 'A complete component library that keeps your product visually consistent as it grows and teams change.' },
      { icon: '📐', title: 'Dev-Ready Specs', desc: 'Every screen delivered with spacing, typography, color tokens, and interaction states — ready for developers.' },
      { icon: '📱', title: 'Mobile-First', desc: 'We design for mobile first, then adapt to desktop. Not the other way around.' },
      { icon: '♿', title: 'Accessible', desc: 'WCAG 2.1 AA compliance — contrast ratios, touch target sizes, and screen reader compatibility.' },
      { icon: '⚡', title: 'Fast Prototyping', desc: 'Interactive prototypes in Figma delivered in 48–72 hours. Test before you build.' },
    ],
    stack: ['Figma', 'Framer', 'Adobe XD', 'Principle', 'Maze (user testing)', 'Lottie'],
    faq: [
      { q: 'What\'s the difference between UI and UX?', a: 'UX (User Experience) is the overall experience of using a product — how easy it is to accomplish tasks, how intuitive navigation is, how fast it is. UI (User Interface) is the visual layer — colors, typography, components, and layout. Great products need both. We design both.' },
      { q: 'Do you provide the design files to the development team?', a: 'Yes. We deliver complete Figma files with organized components, design tokens, and developer-ready specifications. We can also participate in design review sessions with your development team.' },
      { q: 'Can you improve an existing product\'s design?', a: 'Absolutely. Redesign and UX improvement projects are a major part of our work. We start with a UX audit to identify the highest-impact issues, then prioritize improvements by potential business impact.' },
      { q: 'Do you do user testing?', a: 'Yes. We conduct moderated user testing sessions (we recruit users matching your target demographic) and unmoderated testing with tools like Maze. Testing happens at the prototype stage — before development begins.' },
      { q: 'What deliverables do I get?', a: 'For a typical project: user research report, information architecture map, wireframes, high-fidelity mockups, interactive prototype, design system, and a developer handoff file with specifications for every screen.' },
      { q: 'Can you design both the web and mobile app?', a: 'Yes. We design across all platforms — web applications, iOS apps, Android apps, and desktop software. We adapt the design system for each platform\'s specific conventions.' },
    ],
    caseStudies: ['vaultanalytics', 'moveit'],
  },

  /* ──────────────────────────────────────────────────────────────
     6. ENTERPRISE SOFTWARE
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'enterprise-software',
    title: 'Enterprise Software Development',
    metaTitle: 'Enterprise Software Development | Custom ERP & CRM | YANSY TECH',
    metaDescription: 'Custom enterprise software development — CRMs, ERPs, internal tools, and business automation systems. YANSY TECH builds scalable software for complex business operations.',
    keywords: 'enterprise software development Egypt, custom ERP development, CRM development, business software, internal tools, enterprise system development, digital transformation',
    color: '#8b5cf6',
    icon: '▦',
    tagline: 'Complex Problems · Elegant Solutions',
    hero: {
      badge: 'Enterprise Software',
      h1: 'Custom Software for',
      h1Gradient: 'Complex Business Operations',
      sub: 'Off-the-shelf software wasn\'t built for your business. We build the exact system you need — integrated, scalable, and owned by you.',
      stats: [
        { num: '10+',  label: 'Enterprise Systems Built' },
        { num: '35%',  label: 'Avg Efficiency Gain' },
        { num: '100%', label: 'Source Code Owned' },
        { num: '0',    label: 'Vendor Lock-in' },
      ],
    },
    problem: {
      title: 'Off-The-Shelf Software Is Forcing You Into Its Workflow',
      body: 'Generic CRMs, ERPs, and project management tools are built for a hypothetical average business. They don\'t fit your specific operations, so you spend money on customizations that never quite work, training staff on unintuitive systems, and maintaining manual workarounds for the gaps.',
      points: [
        'Monthly SaaS fees that grow without limit as your team scales',
        'Forcing your processes to fit the software\'s assumptions instead of the reverse',
        'Data trapped in vendor systems — difficult to export, analyze, or migrate',
        'Integration limitations between multiple tools create manual data entry',
        'Support from vendors who don\'t understand your specific business context',
      ],
    },
    solution: {
      title: 'Software Built Exactly for Your Business',
      body: 'We build custom enterprise software that maps precisely to how your business operates. You own the code. You own the data. You control the roadmap. And you never pay a per-seat license to a vendor again.',
      points: [
        'Complete system design based on your specific workflows and data model',
        'Integration with your existing tools — accounting software, payment systems, logistics APIs',
        'Role-based access control — employees see only what they need',
        'Real-time dashboards and reporting built for your KPIs, not generic templates',
        'Mobile access for field teams and managers on the go',
      ],
    },
    process: [
      { step: 1, title: 'Business Analysis', desc: 'We interview your team members who will use the system — not just management. We map every current workflow and identify where manual processes, spreadsheets, and workarounds indicate software gaps.' },
      { step: 2, title: 'System Design', desc: 'We design the data model, user roles, business logic, and integration architecture. We produce a detailed technical specification reviewed and approved before development.' },
      { step: 3, title: 'Phased Development', desc: 'We build in phases — the highest-priority workflows first. You start using the system in production with real data before the full system is complete.' },
      { step: 4, title: 'Integration', desc: 'We connect your new system to existing tools — accounting software, email, payment processors, logistics APIs, government APIs if needed.' },
      { step: 5, title: 'Training & Rollout', desc: 'We train your team, produce user documentation, and manage the go-live process. We run parallel with your existing system until confidence is established.' },
      { step: 6, title: 'Ongoing Development', desc: 'As your business evolves, your software evolves with it. We maintain and extend the system on a development retainer.' },
    ],
    benefits: [
      { icon: '🔧', title: 'Built for You', desc: 'Every feature, every screen, every workflow designed specifically for your business — not a generic template.' },
      { icon: '🔗', title: 'Deep Integration', desc: 'Connects to any API — accounting, payment, logistics, government systems, communication platforms.' },
      { icon: '📊', title: 'Custom Reports', desc: 'Dashboards and reports built for the exact KPIs your management team needs. Real data, right format.' },
      { icon: '🔐', title: 'Role-Based Access', desc: 'Granular permission control — employees see only what their role requires. Audit logs for all actions.' },
      { icon: '📱', title: 'Mobile Access', desc: 'Field teams, sales staff, and managers can access the system on any device, anywhere.' },
      { icon: '💰', title: 'Zero Licensing Fees', desc: 'One development investment, no ongoing per-seat licensing. Your cost is fixed, not variable with growth.' },
    ],
    stack: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'WebSockets', 'TypeScript', 'REST APIs'],
    faq: [
      { q: 'How is custom software development priced?', a: 'Custom enterprise systems are quoted per project after the discovery phase. Pricing depends on the scope, number of user roles, integrations required, and timeline. We provide a fixed-price quote for each phase — no open-ended billing.' },
      { q: 'How long does an enterprise system take to build?', a: 'A mid-complexity enterprise system (CRM or internal tool) typically takes 12–20 weeks. A full ERP covering multiple business functions takes 20–40 weeks, built in phases.' },
      { q: 'Can you replace our existing spreadsheet-based system?', a: 'This is one of the most common enterprise projects we take on. We analyze your current spreadsheets, understand the data model and business rules embedded in them, and build a proper software system that eliminates manual data management.' },
      { q: 'Will the system integrate with our accounting software?', a: 'Yes. We integrate with common accounting platforms (QuickBooks, Xero, Odoo, SAP) and custom accounting systems. We build bidirectional sync where needed — orders, invoices, and financial data flow between systems automatically.' },
      { q: 'Who owns the code?', a: 'You do, 100%. After final delivery, you receive the complete source code, database schema, deployment configuration, and documentation. We have no ongoing hold on your system.' },
      { q: 'Can you add AI features to the enterprise system?', a: 'Yes. We integrate AI capabilities — document processing, intelligent search, prediction models, and chatbots — using OpenAI, Anthropic, and custom ML models where appropriate.' },
    ],
    caseStudies: ['opsflow', 'nexusrealty'],
  },

  /* ──────────────────────────────────────────────────────────────
     7. PRODUCT STRATEGY
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'product-strategy',
    title: 'Product Strategy',
    metaTitle: 'Product Strategy Consultancy | Digital Product Strategy | YANSY TECH',
    metaDescription: 'Product strategy consultancy for startups and enterprises. Define your MVP, validate your market, and build a product roadmap before spending on development. YANSY TECH.',
    keywords: 'product strategy consultancy, digital product strategy, startup product development, MVP strategy, product roadmap, product discovery, tech startup strategy',
    color: '#0ea5e9',
    icon: '◈',
    tagline: 'Discover · Validate · Roadmap',
    hero: {
      badge: 'Product Strategy',
      h1: 'Build the Right Product',
      h1Gradient: 'Before You Build It',
      sub: 'Strategy before code. We help you define what to build, who it\'s for, and how to get to market — before you spend a dollar on development.',
      stats: [
        { num: '3x',   label: 'Avg Funding Increase Post-Strategy' },
        { num: '2wk',  label: 'Sprint Cadence' },
        { num: '100%', label: 'Strategy-Led Launches' },
        { num: '80%',  label: 'Features Cut = Money Saved' },
      ],
    },
    problem: {
      title: 'Most Products Fail Before They Launch',
      body: 'The number one reason startups fail is building a product nobody wants. The second is running out of money building the wrong version of the right product. Product strategy exists to solve both problems — before development begins.',
      points: [
        'Building features based on assumptions instead of validated customer needs',
        'Scope creep driven by founders with too many ideas and no filter',
        'Launching with a product too complex for first-time users to understand',
        'Competing in markets without understanding what actually differentiates you',
        'No measurable definition of success — you can\'t know if you\'re winning',
      ],
    },
    solution: {
      title: 'A Validated Product Strategy Before You Write Code',
      body: 'We conduct deep customer discovery, market analysis, and competitive research. We map the user journey, define the MVP, and build a prioritized roadmap. The output is a strategy document and technical specification ready for development.',
      points: [
        'Customer discovery interviews — 10–20 target users',
        'Market sizing and competitive landscape analysis',
        'Jobs-to-be-done framework to define the real problem being solved',
        'MVP definition — the minimum feature set that delivers core value',
        'Prioritized product roadmap with sprint-ready user stories',
      ],
    },
    process: [
      { step: 1, title: 'Problem Discovery', desc: 'We interview potential users to understand their real pain points — not what they say they want, but what jobs they\'re trying to accomplish. This is the foundation of product strategy.' },
      { step: 2, title: 'Market Analysis', desc: 'We analyze the competitive landscape — who are the incumbents, what do they miss, where is the opening for your product. We quantify the addressable market.' },
      { step: 3, title: 'Product Definition', desc: 'We define the product concept and test it with target users before any design begins. Concept testing eliminates expensive pivots after launch.' },
      { step: 4, title: 'MVP Scoping', desc: 'We define the exact feature set for the MVP — everything that is necessary to test the core hypothesis, nothing that is not. The MVP is not a small version of the product; it\'s the product at its most essential.' },
      { step: 5, title: 'Roadmap & Metrics', desc: 'We produce a sprint-ready product roadmap with user stories, acceptance criteria, and OKRs. You know what you\'re building for the next 12 months and how you\'ll measure success.' },
      { step: 6, title: 'Development Briefing', desc: 'We produce a technical specification that development teams (ours or yours) can execute against. Architecture recommendations, technology choices, and integration requirements included.' },
    ],
    benefits: [
      { icon: '🎯', title: 'Validated Concept', desc: 'Test your idea with real users before spending on development. Kill bad ideas cheaply.' },
      { icon: '✂️', title: 'MVP Clarity', desc: 'Know exactly what to build first and what to cut. 80% of features can wait.' },
      { icon: '🗺️', title: 'Clear Roadmap', desc: '12-month product roadmap with prioritized features and measurable milestones.' },
      { icon: '📊', title: 'Success Metrics', desc: 'OKRs and KPIs defined upfront. You know what winning looks like before you start.' },
      { icon: '💡', title: 'Investor Ready', desc: 'Strategy documentation that communicates product vision and market opportunity clearly to investors.' },
      { icon: '⚡', title: 'Faster Development', desc: 'Well-defined strategy means development teams move faster with less rework and fewer pivots.' },
    ],
    stack: ['Figma (prototyping)', 'Notion (documentation)', 'Miro (workshops)', 'Linear (roadmap)'],
    faq: [
      { q: 'What do I get at the end of a product strategy engagement?', a: 'You receive: customer research report, competitive analysis, product concept definition, MVP feature specification, prioritized roadmap for 12 months, OKRs and success metrics, technical architecture recommendations, and a development-ready technical specification.' },
      { q: 'How long does a product strategy engagement take?', a: 'A standard product strategy engagement takes 3–4 weeks. This includes customer interviews, market research, concept testing, and producing all deliverables. Some clients extend the engagement for ongoing product leadership.' },
      { q: 'Can you do product strategy for an existing product, not just a new one?', a: 'Yes. This is actually more common. If you have a product that\'s growing slower than expected or heading in the wrong direction, a product strategy reset — involving user research, competitive analysis, and roadmap restructuring — can be transformative.' },
      { q: 'Do you continue as the development partner after the strategy phase?', a: 'Many clients engage YANSY TECH for both strategy and development. We\'re well-positioned to do both because the strategy team transitions the requirements directly to the development team. But the strategy deliverables are yours — you can use any development partner you choose.' },
      { q: 'How do you decide what belongs in the MVP?', a: 'We use the jobs-to-be-done framework: identify the one core job your product does for users, then include only the features necessary to do that job. Everything else — even if interesting — goes on the backlog. An MVP is not a smaller version of your vision; it\'s the product at its most essential.' },
      { q: 'Can product strategy help with investor presentations?', a: 'Significantly. Investors want to see that you understand your market, have validated your assumptions, and have a clear path to revenue. Our strategy documentation maps directly onto what Series A investors expect to see.' },
    ],
    caseStudies: ['vaultanalytics', 'opsflow'],
  },
];

export const getServiceBySlug = (slug) => SERVICES.find(s => s.slug === slug) || null;
export const getAllServiceSlugs = () => SERVICES.map(s => s.slug);
