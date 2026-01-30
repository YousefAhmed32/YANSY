# YANSY Homepage - Execution Fixes
**Ready-to-Paste Copy & Code Changes**

---

## 1️⃣ HERO SECTION - EXACT CHANGES

### Current (Lines 308-321):
```jsx
<h1>YANSY</h1>
<p>We build digital products that matter</p>
```

### VERSION A: بدون أرقام (No Numbers)

**Replace with:**
```jsx
{/* Micro-credentials - Add before h1 */}
<p className="text-sm md:text-base font-light text-white/60 mb-8 tracking-widest uppercase opacity-0" ref={(el) => (textsRef.current[0.5] = el)}>
  Trusted by growing companies • Since 2020
</p>

<h1 ref={(el) => (textsRef.current[0] = el)} className="text-8xl md:text-9xl lg:text-[13rem] font-light tracking-tight mb-6 opacity-0">
  YANSY
</h1>

{/* Main tagline */}
<p ref={(el) => (textsRef.current[1] = el)} className="text-2xl md:text-3xl lg:text-4xl font-light text-white/70 mb-8 opacity-0">
  Full-stack product development for companies ready to scale
</p>

{/* Value prop - Add after tagline */}
<p ref={(el) => (textsRef.current[1.5] = el)} className="text-lg md:text-xl font-light text-white/50 mb-12 max-w-3xl mx-auto opacity-0">
  We build digital products that drive measurable business growth through strategic development, enterprise-grade engineering, and user-centered design.
</p>

{/* CTAs - Add after value prop */}
<div className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0" ref={(el) => (textsRef.current[1.6] = el)}>
  <a href="#contact" className="px-12 py-4 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500">
    Schedule Discovery Call
  </a>
  <a href="#work" className="px-12 py-4 border border-white/20 text-white text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500">
    View Our Work
  </a>
</div>
```

### VERSION B: بأرقام مرنة (Flexible Numbers)

**Replace with:**
```jsx
{/* Micro-credentials */}
<p className="text-sm md:text-base font-light text-white/60 mb-8 tracking-widest uppercase opacity-0" ref={(el) => (textsRef.current[0.5] = el)}>
  Trusted by 50+ companies • 4+ years experience
</p>

<h1 ref={(el) => (textsRef.current[0] = el)} className="text-8xl md:text-9xl lg:text-[13rem] font-light tracking-tight mb-6 opacity-0">
  YANSY
</h1>

<p ref={(el) => (textsRef.current[1] = el)} className="text-2xl md:text-3xl lg:text-4xl font-light text-white/70 mb-8 opacity-0">
  Full-stack product development for companies ready to scale
</p>

<p ref={(el) => (textsRef.current[1.5] = el)} className="text-lg md:text-xl font-light text-white/50 mb-12 max-w-3xl mx-auto opacity-0">
  We build digital products that drive measurable business growth through strategic development, enterprise-grade engineering, and user-centered design.
</p>

{/* CTAs */}
<div className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0" ref={(el) => (textsRef.current[1.6] = el)}>
  <a href="#contact" className="px-12 py-4 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500">
    Schedule Discovery Call
  </a>
  <a href="#work" className="px-12 py-4 border border-white/20 text-white text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500">
    View Our Work
  </a>
</div>
```

**Animation Update Required:**
Add to heroTl timeline (around line 38):
```jsx
heroTl
  .fromTo(textsRef.current[0.5], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 })
  .fromTo(heroTitle, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
  .fromTo(heroSubtitle, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
  .fromTo(textsRef.current[1.5], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
  .fromTo(textsRef.current[1.6], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
  // ... rest of existing animation
```

---

## 2️⃣ TRUST WITHOUT FAKE PROOF

### Replace Clients Section (Lines 770-806)

**Option A: Technologies We Use**
```jsx
{/* ========== TECHNOLOGIES WE USE ========== */}
<section
  ref={(el) => (sectionsRef.current[7] = el)}
  className="min-h-screen flex items-center px-4 py-32 bg-black"
>
  <div className="max-w-7xl mx-auto w-full">
    <h2 className="text-6xl md:text-7xl lg:text-8xl font-light mb-32 tracking-tight">
      Built with
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-16 gap-y-20">
      <div ref={(el) => (clientsRef.current[0] = el)} className="opacity-0">
        <div className="text-3xl md:text-4xl font-light text-white/30">React</div>
      </div>
      <div ref={(el) => (clientsRef.current[1] = el)} className="opacity-0">
        <div className="text-3xl md:text-4xl font-light text-white/30">Node.js</div>
      </div>
      <div ref={(el) => (clientsRef.current[2] = el)} className="opacity-0">
        <div className="text-3xl md:text-4xl font-light text-white/30">TypeScript</div>
      </div>
      <div ref={(el) => (clientsRef.current[3] = el)} className="opacity-0">
        <div className="text-3xl md:text-4xl font-light text-white/30">PostgreSQL</div>
      </div>
      <div ref={(el) => (clientsRef.current[4] = el)} className="opacity-0">
        <div className="text-3xl md:text-4xl font-light text-white/30">AWS</div>
      </div>
      <div ref={(el) => (clientsRef.current[5] = el)} className="opacity-0">
        <div className="text-3xl md:text-4xl font-light text-white/30">Docker</div>
      </div>
      <div ref={(el) => (clientsRef.current[6] = el)} className="opacity-0">
        <div className="text-3xl md:text-4xl font-light text-white/30">GraphQL</div>
      </div>
      <div ref={(el) => (clientsRef.current[7] = el)} className="opacity-0">
        <div className="text-3xl md:text-4xl font-light text-white/30">Next.js</div>
      </div>
    </div>
  </div>
</section>
```

**Option B: Remove Entirely**
- Delete lines 770-806
- Remove clientsRef from useRef (line 17)
- Remove clients animation (lines 215-234)

---

## 3️⃣ TEAM SECTION - DECISION & FIX

**DECISION: Keep but rewrite for company-first positioning**

### Replace Lines 373-436:

```jsx
{/* ========== TEAM SECTION ========== */}
<section
  ref={(el) => (sectionsRef.current[2] = el)}
  className="min-h-screen flex flex-col items-center px-4 py-32 bg-black"
>
  <div className="max-w-6xl mx-auto w-full text-center">
    <h2 className="text-5xl md:text-6xl lg:text-7xl font-light mb-8 tracking-tight leading-tight text-white/90">
      Built by specialists
    </h2>
    
    <p className="text-xl md:text-2xl font-light text-white/50 mb-24 max-w-3xl mx-auto">
      Our team combines deep expertise across product strategy, design, and engineering. We focus on quality over scale — senior talent delivering enterprise-grade solutions for growing companies.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
      {/* Keep existing team member cards - no changes to structure */}
      <div
        ref={(el) => (teamRef.current[0] = el)}
        className="opacity-0 transform transition duration-700 hover:scale-105"
      >
        <div className="relative aspect-[1/1] w-full overflow-hidden rounded-full mb-6 group shadow-lg shadow-black/30">
          <img
            src="/assets/image/p2.png"
            alt="Sara Ahmed"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 rounded-full opacity-0 group-hover:opacity-100 transition duration-500" />
        </div>
        <h3 className="text-2xl md:text-3xl font-semibold mb-1 text-white/90">Sara Ahmed</h3>
        <p className="text-lg font-light text-white/50 tracking-wide uppercase">Chief Creative Officer</p>
      </div>

      {/* Team Member 2 - same structure */}
      <div
        ref={(el) => (teamRef.current[1] = el)}
        className="opacity-0 transform transition duration-700 hover:scale-105"
      >
        <div className="relative aspect-[1/1] w-full overflow-hidden rounded-full mb-6 group shadow-lg shadow-black/30">
          <img
            src="/assets/image/p1.png"
            alt="Yousef Ahmed"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 rounded-full opacity-0 group-hover:opacity-100 transition duration-500" />
        </div>
        <h3 className="text-2xl md:text-3xl font-semibold mb-1 text-white/90">Yousef Ahmed</h3>
        <p className="text-lg font-light text-white/50 tracking-wide uppercase">Lead Software Engineer</p>
      </div>

      {/* Team Member 3 - same structure */}
      <div
        ref={(el) => (teamRef.current[2] = el)}
        className="opacity-0 transform transition duration-700 hover:scale-105"
      >
        <div className="relative aspect-[1/1] w-full overflow-hidden rounded-full mb-6 group shadow-lg shadow-black/30">
          <img
            src="/assets/image/p3.png"
            alt="Mahmoud Ali"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 rounded-full opacity-0 group-hover:opacity-100 transition duration-500" />
        </div>
        <h3 className="text-2xl md:text-3xl font-semibold mb-1 text-white/90">Mahmoud Ali</h3>
        <p className="text-lg font-light text-white/50 tracking-wide uppercase">Head of Design</p>
      </div>
    </div>
  </div>
</section>
```

**Change:** Line 380: "The Minds Behind Our Work" → "Built by specialists"  
**Add:** New paragraph after headline (lines shown above)

---

## 4️⃣ CASE STUDIES - AUTHORITY MODE

### Template for Each Project:

**Structure:**
- Problem (1 sentence)
- Solution (2-3 sentences)
- Impact (qualitative outcomes, no fake numbers)

### WORK 1 - Nexus Commerce (Lines 500-547)

**Replace description (lines 513-520):**
```jsx
<p
  data-work-desc
  className="text-xl font-light text-white/50 leading-relaxed opacity-0"
>
  A growing e-commerce brand needed a platform that could handle rapid scale without performance degradation. We architected a headless commerce solution with microservices infrastructure, enabling seamless third-party integrations and real-time inventory management. The platform now supports high-traffic periods, maintains sub-second load times, and provides a foundation for long-term growth.
</p>
```

### WORK 2 - Vault Analytics (Lines 583-590)

**Replace description:**
```jsx
<p
  data-work-desc
  className="text-xl font-light text-white/50 leading-relaxed opacity-0"
>
  A B2B SaaS company required a data platform that could process complex analytics while remaining intuitive for non-technical users. We built a scalable architecture with real-time data processing, custom visualization components, and role-based access controls. The platform enables teams to make data-driven decisions faster, with enterprise-grade security and compliance built-in from day one.
</p>
```

### WORK 3 - Aria Studio (Lines 607-613)

**Replace description:**
```jsx
<p
  data-work-desc
  className="text-xl font-light text-white/50 leading-relaxed opacity-0"
>
  A creative agency needed a digital workspace that streamlined collaboration across distributed teams while maintaining a premium user experience. We designed and developed a unified platform with real-time collaboration features, intuitive project management, and seamless file sharing. The platform reduces friction in creative workflows and enables teams to deliver higher-quality work more efficiently.
</p>
```

---

## 5️⃣ CTA SYSTEM - PRACTICAL SETUP

### Total CTAs: 5

**1. Hero Section (Primary + Secondary)**
- Primary: "Schedule Discovery Call" (gold border)
- Secondary: "View Our Work" (white border)
- Location: Below hero value prop

**2. After Case Studies Section**
- Text: "Schedule a Discovery Call →"
- Location: After line 638, before Pinned Narrative
- Style: Gold border, centered

**3. Floating/Sticky CTA**
- Text: "Get Started"
- Location: Fixed bottom-right
- Style: Gold background, black text

**4. Contact Section (Multiple Options)**
- Primary: "Schedule a Call" (gold border)
- Secondary: "Send Email" (white border)
- Tertiary: "WhatsApp" (white border)

**5. Services Section (Optional)**
- Add "Learn More →" link to each service card

### Contact Section Rewrite (Lines 889-907)

**Replace entire section:**
```jsx
{/* ========== CONTACT / WHATSAPP CTA ========== */}
<section id="contact" className="min-h-screen flex items-center justify-center bg-black px-4 py-32">
  <div className="text-center max-w-5xl mx-auto">
    <h2 className="text-7xl md:text-8xl lg:text-[10rem] font-light mb-12 tracking-tight leading-none">
      Let's talk
    </h2>
    
    <p className="text-2xl md:text-3xl font-light text-white/60 mb-8 leading-relaxed">
      Ready to discuss your project?
    </p>
    <p className="text-lg md:text-xl font-light text-white/40 mb-16">
      Book a 30-minute discovery call to explore how we can help. We respond within 24 hours.
    </p>
    
    {/* Multiple contact options */}
    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
      <a
        href="https://calendly.com/yansy/discovery"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-12 py-5 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500"
      >
        Schedule a Call
      </a>
      
      <a
        href="mailto:hello@yansy.com"
        className="inline-block px-12 py-5 border border-white/20 text-white text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500"
      >
        Send Email
      </a>
      
      <a
        href="https://api.whatsapp.com/send/?phone=201090385390&text=Hello%2C%20I%27d%20like%20to%20discuss%20a%20project%20with%20YANSY.&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-12 py-5 border border-white/20 text-white text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500"
      >
        WhatsApp
      </a>
    </div>
    
    {/* Trust signals */}
    <div className="flex flex-wrap justify-center gap-8 text-sm text-white/40">
      <span>✓ Free consultation</span>
      <span>✓ No obligation</span>
      <span>✓ Response within 24h</span>
    </div>
  </div>
</section>
```

### Add Floating CTA (After Header, Line 290)

**Insert after `<Header />`:**
```jsx
{/* Floating CTA */}
<div className="fixed bottom-8 right-8 z-50 hidden md:block">
  <a
    href="#contact"
    className="flex items-center gap-3 px-6 py-4 bg-[#d4af37] text-black text-sm font-light tracking-widest uppercase hover:bg-white transition-all duration-300 shadow-lg"
  >
    <span>Get Started</span>
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </a>
</div>
```

### Add CTA After Case Studies (After Line 638)

**Insert before Pinned Narrative Section:**
```jsx
{/* CTA after case studies */}
<div className="text-center mt-32">
  <a
    href="#contact"
    className="inline-block px-12 py-5 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500"
  >
    Schedule a Discovery Call →
  </a>
</div>
```

---

## 6️⃣ EDITORIAL SECTION - COPY FIX

### Replace Lines 341-366:

```jsx
<h2
  ref={(el) => (textsRef.current[2] = el)}
  className="text-7xl md:text-8xl lg:text-[9rem] font-light tracking-tight leading-[0.95] opacity-0"
>
  We deliver measurable
  <br />
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-white">
    business outcomes.
  </span>
</h2>

<p
  ref={(el) => (textsRef.current[3] = el)}
  className="max-w-3xl text-2xl md:text-3xl font-light text-white/50 leading-relaxed opacity-0"
>
  Through strategic product development, enterprise-grade engineering, and user-centered design, we build digital products that drive growth, efficiency, and competitive advantage for medium and large enterprises.
</p>

<p
  ref={(el) => (textsRef.current[4] = el)}
  className="text-xl md:text-2xl font-light text-white/35 opacity-0"
>
  Product Strategy | Enterprise Engineering | UX/UI Design | Growth Optimization
</p>
```

**Changes:**
- Line 345: "We don't just build" → "We deliver measurable"
- Line 348: "digital experiences" → "business outcomes"
- Line 356-358: Replace abstract copy with business-focused copy
- Line 365: "Strategy. Design. Engineering." → "Product Strategy | Enterprise Engineering | UX/UI Design | Growth Optimization"

---

## 7️⃣ WHAT NOT TO CHANGE

### Keep These Animations:
- ✅ Hero scroll-triggered pin animation (lines 27-44)
- ✅ Editorial text fade-in (lines 51-66)
- ✅ Team stagger animation (lines 72-87)
- ✅ Side-by-side slide animations (lines 96-128)
- ✅ Case studies scroll animations (lines 134-159)
- ✅ Pinned narrative timeline (lines 168-190)
- ✅ Horizontal scroll section (lines 201-212)
- ✅ Split screen animations (lines 242-257)
- ✅ Services grid stagger (lines 265-280)

### Keep These Visual Elements:
- ✅ Black background with gold accents (#d4af37)
- ✅ Large typography scales (13rem hero)
- ✅ Light font weights
- ✅ Gold gradient accents
- ✅ Section spacing (py-40, py-32)
- ✅ Image overlays and gradients
- ✅ Rounded corners on images

### Keep These Sections:
- ✅ Hero section structure
- ✅ Editorial section layout
- ✅ Side-by-side section
- ✅ Case studies grid layout
- ✅ Pinned narrative section
- ✅ Horizontal scroll section
- ✅ Split screen section
- ✅ Services grid structure

### Only Change:
- ❌ Copy/text content
- ❌ CTA buttons and links
- ❌ Client section (replace or remove)
- ❌ Team section headline + intro paragraph
- ❌ Contact section structure

---

## 8️⃣ ADD SECTION IDs FOR NAVIGATION

**Add to sections:**
- Line 293: `<section id="hero" ...>`
- Line 327: `<section id="about" ...>` (editorial section)
- Line 483: `<section id="work" ...>` (case studies)
- Line 889: `<section id="contact" ...>` (already added above)

---

## 9️⃣ QUICK REFERENCE - ALL COPY CHANGES

### Hero Tagline:
**From:** "We build digital products that matter"  
**To:** "Full-stack product development for companies ready to scale"

### Editorial Headline:
**From:** "We don't just build digital experiences"  
**To:** "We deliver measurable business outcomes"

### Editorial Copy:
**From:** "We shape perception, emotion, and identity"  
**To:** "Through strategic product development, enterprise-grade engineering, and user-centered design, we build digital products that drive growth, efficiency, and competitive advantage"

### Team Headline:
**From:** "The Minds Behind Our Work"  
**To:** "Built by specialists"

### Contact Copy:
**From:** "We don't do forms. We do conversations."  
**To:** "Ready to discuss your project? Book a 30-minute discovery call to explore how we can help."

### WhatsApp CTA:
**From:** "Start on WhatsApp"  
**To:** "WhatsApp" (as part of multiple options)

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Replace hero section copy (choose Version A or B)
- [ ] Update hero animations for new elements
- [ ] Replace clients section (choose Option A or B)
- [ ] Rewrite team section headline + intro
- [ ] Update all 3 case study descriptions
- [ ] Replace editorial section copy
- [ ] Rewrite contact section
- [ ] Add floating CTA button
- [ ] Add CTA after case studies
- [ ] Add section IDs (hero, about, work, contact)
- [ ] Test all links and CTAs
- [ ] Verify animations still work

---

**Ready to implement. All copy is production-ready.**

