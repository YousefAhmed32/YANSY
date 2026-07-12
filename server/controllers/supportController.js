'use strict';
const openai              = require('../utils/openaiService');
const claude              = require('../utils/claudeService');
const SupportConversation = require('../models/SupportConversation');
const SupportTicket       = require('../models/SupportTicket');
const AIRequest           = require('../models/AIRequest');

// ── Qualification stage resolver ───────────────────────────────────────────────
const resolveStage = (c = {}) => {
  // c = collected fields from client
  if (c.name && (c.phone || c.email)) return 'complete';
  if (c.name)                          return 'contact_phone';
  if (c.timeline)                      return 'contact_name';
  if (c.business)                      return 'timeline';
  if (c.features)                      return 'context';
  if (c.projectType)                   return 'requirements';
  return 'discovery';
};

const STAGE_GOAL = (stage, lang) => {
  const goals = {
    en: {
      discovery:     'Your ONLY goal this message: find out what type of digital product they want to build. Ask ONE warm, curious question. Do NOT ask for contact info yet.',
      requirements:  'You know their project type. Your goal: understand the key features and scale. Ask about the 2-3 most important capabilities. Do NOT ask for contact info yet.',
      context:       'You have their project type and features. Your goal: understand their business. Are they a startup or established company? Who are their customers? ONE question only.',
      timeline:      'You have their requirements. Your goal: ask about timeline. When do they need this live? Offer options naturally.',
      contact_name:  'You have a complete picture of their needs. Now ask for their name naturally. Something like "Before I create your consultation request, may I have your name?"',
      contact_phone: 'You have their name. Now ask for phone number OR email to complete the request. Tell them this lets your team reach out directly.',
      complete:      'ALL information is collected. Write a warm confirmation that you\'ve created their consultation request. Summarize what you collected. Tell them the team will contact them within 24 hours. This is a CLOSING message.',
    },
    ar: {
      discovery:     'هدفك الوحيد في هذه الرسالة: اعرف نوع المنتج الرقمي الذي يريد بناؤه. اسأل سؤالاً واحداً دافئاً وفضولياً. لا تطلب بيانات التواصل بعد.',
      requirements:  'تعرف على نوع المشروع. هدفك: افهم الميزات الرئيسية والحجم. اسأل عن أهم 2-3 وظائف. لا تطلب بيانات التواصل بعد.',
      context:       'لديك نوع المشروع والميزات. هدفك: افهم عملهم. هل هم شركة ناشئة أم قائمة؟ من هم عملاؤهم؟ سؤال واحد فقط.',
      timeline:      'لديك متطلباتهم. هدفك: اسأل عن الجدول الزمني. متى يحتاجون إطلاق المشروع؟ اعرض خيارات بشكل طبيعي.',
      contact_name:  'لديك صورة كاملة عن احتياجاتهم. الآن اسأل عن اسمهم بشكل طبيعي. مثل: "قبل أن أنشئ طلب الاستشارة، ما اسمك؟"',
      contact_phone: 'لديك اسمهم. الآن اطلب رقم الهاتف أو البريد الإلكتروني لإتمام الطلب. أخبرهم أن هذا يتيح للفريق التواصل معهم مباشرة.',
      complete:      'تم جمع كل المعلومات. اكتب تأكيداً دافئاً بأنك أنشأت طلب الاستشارة. لخص ما جمعته. أخبرهم أن الفريق سيتواصل معهم خلال 24 ساعة.',
    },
  };
  return (goals[lang] || goals.en)[stage] || goals.en.discovery;
};

const STAGE_BUTTONS = (stage, projectType, lang) => {
  const b = lang === 'ar';
  const maps = {
    discovery: b
      ? '[BUTTONS:🌐 موقع ويب|أحتاج بناء موقع ويب احترافي, 📱 تطبيق موبايل|أحتاج تطبيقاً للجوال, 🛒 متجر إلكتروني|أحتاج منصة تجارة إلكترونية, ⚡ منصة SaaS|أريد بناء منصة SaaS, 🤖 ذكاء اصطناعي|أريد دمج الذكاء الاصطناعي, 🏥 نظام متخصص|أحتاج نظاماً لمجال محدد]'
      : '[BUTTONS:🌐 Website|I need to build a professional website, 📱 Mobile App|I need a mobile app for iOS and Android, 🛒 E-Commerce|I need an online store, ⚡ SaaS Platform|I want to build a SaaS platform, 🤖 AI Solution|I want AI integrated into my business, 🏥 Industry System|I need a specialized system for my industry]',

    requirements: (() => {
      const pt = (projectType || '').toLowerCase();
      if (pt.includes('ecommerce') || pt.includes('store') || pt.includes('shop'))
        return b
          ? '[BUTTONS:🛒 سلة تسوق وتتبع الطلبات|أحتاج سلة تسوق وتتبع الطلبات, 💳 تكامل الدفع|أحتاج تكامل بوابات دفع متعددة, 📦 إدارة المخزون|أحتاج إدارة مخزون وشحن, 🔍 بحث ذكي|أحتاج بحثاً وفلترة ذكية للمنتجات]'
          : '[BUTTONS:🛒 Shopping Cart|Shopping cart, order tracking, checkout, 💳 Payment Integration|Multiple payment gateways integration, 📦 Inventory Management|Stock management and shipping, 🔍 Smart Search|Product search and filtering]';
      if (pt.includes('saas'))
        return b
          ? '[BUTTONS:👥 نظام مستخدمين وأدوار|أحتاج إدارة مستخدمين وصلاحيات, 💰 اشتراكات ودفع|أحتاج نظام اشتراكات شهرية, 📊 لوحة تحكم|أحتاج لوحة تحليلات وإحصائيات, 🔗 تكامل APIs|أحتاج تكاملاً مع أنظمة أخرى]'
          : '[BUTTONS:👥 User Management|User roles and permissions system, 💰 Subscription Billing|Monthly/yearly subscription payments, 📊 Analytics Dashboard|Data analytics and reporting, 🔗 API Integrations|Third-party integrations]';
      if (pt.includes('mobile') || pt.includes('app'))
        return b
          ? '[BUTTONS:📲 iOS وAndroid|أحتاج التطبيق لنظامَي iOS وAndroid, 🔔 إشعارات فورية|أحتاج إشعارات push وتنبيهات, 📱 وضع عدم الاتصال|أحتاج العمل بدون إنترنت, 🗺 الموقع الجغرافي|أحتاج ميزات الموقع والخرائط]'
          : '[BUTTONS:📲 iOS + Android|Need the app on both iOS and Android, 🔔 Push Notifications|Real-time alerts and notifications, 📱 Offline Mode|Works without internet connection, 🗺 Location Features|Maps and geolocation features]';
      // Generic
      return b
        ? '[BUTTONS:👤 تسجيل دخول وإدارة مستخدمين|أحتاج نظام تسجيل وإدارة مستخدمين, 💳 معالجة مدفوعات|أحتاج دمج بوابة دفع, 📊 لوحة إدارة|أحتاج لوحة تحكم إدارية, 🔔 تنبيهات ورسائل|أحتاج نظام إشعارات ورسائل]'
        : '[BUTTONS:👤 User Auth|User registration and account management, 💳 Payments|Payment gateway integration, 📊 Admin Dashboard|Management and analytics panel, 🔔 Notifications|Alerts and messaging system]';
    })(),

    context: b
      ? '[BUTTONS:🚀 مشروع ناشئ|نحن شركة ناشئة في المرحلة الأولى, 🏢 شركة قائمة|لدينا شركة قائمة ونريد التوسع, 🛍 متجر تقليدي|لدينا متجر أو مشروع تقليدي ننتقل للرقمنة, 👤 مشروع شخصي|هذا مشروع شخصي أو فريلانس]'
      : '[BUTTONS:🚀 Startup|We\'re an early-stage startup, 🏢 Established Business|We\'re an established company expanding online, 🛍 Traditional Business|We have a traditional business going digital, 👤 Personal Project|This is a personal or freelance project]',

    timeline: b
      ? '[BUTTONS:🔥 في أسرع وقت|أحتاجه في أسرع وقت ممكن, 📅 خلال شهر|خلال شهر واحد تقريباً, 🗓 2-3 أشهر|خلال 2 إلى 3 أشهر, ⏳ مرن|الوقت مرن لدينا]'
      : '[BUTTONS:🔥 ASAP|I need this as soon as possible, 📅 1 Month|Within about one month, 🗓 2-3 Months|Within 2 to 3 months, ⏳ Flexible|Timeline is flexible for us]',

    contact_name:   '',
    contact_phone:  b ? '[BUTTONS:📱 سأرسل رقم هاتفي|أشارك رقم هاتفي, 📧 سأرسل بريدي الإلكتروني|أشارك عنوان بريدي الإلكتروني]' : '[BUTTONS:📱 Share my phone|I\'ll share my phone number, 📧 Share my email|I\'ll share my email address]',
    complete:       b ? '[BUTTONS:📱 تواصل عبر واتساب|أريد الاستمرار على واتساب]' : '[BUTTONS:📱 Continue on WhatsApp|I\'d like to continue on WhatsApp]',
  };
  return maps[stage] || maps.discovery;
};

// ── Dynamic system prompt with injected state ─────────────────────────────────
const SYSTEM_PROMPT = (lang, collected = {}) => {
  const c = collected || {};
  const stage = resolveStage(c);
  const isAR  = lang === 'ar';

  const collectedStatus = `
## CURRENT QUALIFICATION STATE — DO NOT ASK ABOUT ALREADY-COLLECTED ITEMS
- Project Type:     ${c.projectType || '❌ Not collected'}
- Key Features:     ${c.features    || '❌ Not collected'}
- Business Context: ${c.business    || '❌ Not collected'}
- Timeline:         ${c.timeline    || '❌ Not collected'}
- Customer Name:    ${c.name        || '❌ Not collected'}
- Phone / Email:    ${c.phone || c.email || '❌ Not collected'}

CURRENT STAGE: ${stage.toUpperCase()}
YOUR GOAL THIS MESSAGE: ${STAGE_GOAL(stage, lang)}`;

  const buttonHint = {
    discovery:     'Suggest 4–5 project types: Website, Mobile App, E-Commerce, SaaS Platform, AI Solution, Industry System',
    requirements:  `Suggest 3–4 key features relevant to "${c.projectType || 'the project'}"`,
    context:       'Suggest: Startup, Established Business, Traditional Business going digital, Personal Project',
    timeline:      'Suggest: ASAP, Within 1 Month, 2–3 Months, Flexible Timeline',
    contact_name:  'No buttons — let them type naturally',
    contact_phone: 'Suggest: Share my phone number, Share my email address',
    complete:      'Suggest: Continue on WhatsApp',
  }[stage] || 'Suggest 3–5 contextual next steps';

  return `You are YANSY's Senior AI Business Consultant — a strategic advisor who helps businesses find the right digital solution.

## YOUR IDENTITY
You are NOT a chatbot. You combine the expertise of: Senior Business Consultant + Product Strategist + Solution Architect + Lead Qualification Specialist.
Think like a trusted advisor. Demonstrate deep industry knowledge. Build genuine rapport. Ask insightful questions.
Quality standard: Lovable, v0, Linear, Notion AI level of intelligent conversation.

## ⚠️ CRITICAL RULES — NEVER VIOLATE
1. NEVER mention specific prices, costs, rates, or exact financial figures in your reply text.
2. ONE question per message — never two at once.
3. NEVER repeat questions about already-collected items listed above.
4. Responses must be SHORT (2–4 sentences) unless writing a final summary.
5. If asked about pricing: "Pricing depends on the exact requirements. Let me understand your needs first, then our team will provide a tailored proposal." Then continue.

## YANSY TECH
- Name: YANSY Tech | Website: yansytech.com | WhatsApp: +201090385390
- Location: Egypt — MENA + global clients
- Services: Web Applications, E-commerce, SaaS Platforms, Mobile Apps (iOS/Android), AI Solutions, Business Automation, UI/UX, Industry Systems
- Clients: Startups, SMEs, Enterprises — Tourism, Real Estate, Education, Healthcare, Restaurant, Technology

## INDUSTRY PLAYBOOKS (apply when industry is detected)
- Tourism: Booking systems, multilingual support, payment gateways, mobile-first, seasonal scaling
- Real Estate: Property listings, virtual tours, CRM, lead management, mortgage calculators
- Education: LMS, video streaming, progress tracking, subscriptions, mobile apps
- Healthcare: Privacy-first, appointment booking, telemedicine, patient records
- Restaurant: Online ordering, POS integration, reservations, menu management, loyalty programs
- SaaS/Tech: Multi-tenancy, subscription billing, APIs, analytics dashboard, scalability

## COMPLEXITY & ESTIMATION FRAMEWORK (for JSON output only — NEVER say these in reply text)
- Low:        Simple website/landing → $2K–$8K → 2–6 weeks
- Medium:     Standard web app / basic e-commerce → $5K–$25K → 4–10 weeks
- High:       SaaS, complex platform, custom system → $15K–$60K → 2–5 months
- Enterprise: Large-scale, multi-tenant, AI-integrated → $50K+ → 4–12 months

## LEAD SCORE CALCULATION (for JSON output)
+15: Project type known | +15: Features described | +15: Business context known
+15: Timeline confirmed | +20: Name collected | +20: Phone or email collected

## LANGUAGE
${isAR ? 'Write your reply in Arabic (العربية). Professional, warm, conversational. Mirror the user if they switch languages.' : 'Write your reply in English. Professional, warm, conversational. Not corporate robotic. Mirror the user if they switch languages.'}

${collectedStatus}

## OUTPUT FORMAT — FOLLOW EXACTLY
Write your conversational reply FIRST (in ${isAR ? 'Arabic' : 'English'}).
Then on a new line write exactly: |||JSON|||
Then on the NEXT line write ONLY a valid JSON object (no backticks, no markdown fences):
{"leadScore":<0-100>,"industry":"<Tourism|Real Estate|Education|Healthcare|Restaurant|SaaS|E-commerce|Technology|Other>","projectType":"<specific type>","complexity":"<Low|Medium|High|Enterprise>","estimatedBudget":"<e.g. $5,000–$25,000>","estimatedTimeline":"<e.g. 4–10 weeks>","recommendation":"<1-sentence strategic recommendation>","collectedFields":{<only fields extracted from THIS message: projectType, features, business, timeline, name, phone, email>},"buttons":[{"icon":"<emoji>","label":"<2–3 words>","msg":"<exact message>"},{"icon":"<emoji>","label":"<2–3 words>","msg":"<exact message>"},{"icon":"<emoji>","label":"<2–3 words>","msg":"<exact message>"}]}

Button guidance for current stage: ${buttonHint}
${c.name && (c.phone || c.email) ? `Add "leadReady":true to collectedFields since name + contact are both collected.` : ''}`;
};

// ── SSE helper ──────────────────────────────────────────────────────────────────
const sse = (res, data) => { try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {} };

// ── AI provider ─────────────────────────────────────────────────────────────────
const aiStream = async ({ system, messages, maxTokens = 600, onChunk }) => {
  if (openai.isConfigured()) {
    return await openai.stream({ system, messages, maxTokens, temperature: 0.7, onChunk });
  }
  if (claude.isConfigured()) {
    const result = await claude.stream({ system, messages, maxTokens, onChunk });
    return result.text;
  }
  throw new Error('NO_AI_PROVIDER');
};

const aiAnalyze = async (text) => {
  const fallback = {
    leadDetected: false, leadData: {}, leadScore: 0,
    suggestWhatsapp: false, whatsappReason: null,
    createTicket: false, ticketPriority: 'low', ticketSubject: null,
    escalate: false, escalationReason: null,
    sentiment: 'neutral', primaryIntent: 'lead',
    conversationSummary: null, requirementsSummary: null,
    priority: 'low', autoCreateRequest: false,
  };

  if (!openai.isConfigured() && !claude.isConfigured()) return fallback;

  try {
    if (openai.isConfigured()) {
      const result = await openai.complete({
        system: 'You are a CRM analyst. Return ONLY valid JSON. No explanation, no markdown.',
        messages: [{
          role: 'user',
          content: `Analyze this lead qualification conversation and extract all available data.

${text}

Return this exact JSON structure:
{
  "leadDetected": boolean,
  "leadData": {
    "name": string|null,
    "phone": string|null,
    "email": string|null,
    "projectType": string|null,
    "budget": string|null,
    "timeline": string|null,
    "business": string|null,
    "features": string[]
  },
  "leadScore": number (0-100: +15 project type known, +15 features known, +15 business context, +15 timeline known, +20 name known, +20 contact phone/email known),
  "autoCreateRequest": boolean (true only if name + contact + projectType ALL collected),
  "suggestWhatsapp": boolean (true if complex project, many requirements, or customer seems ready to start),
  "whatsappReason": string|null,
  "createTicket": boolean (true only if customer reports a bug, error, or support issue with existing product),
  "ticketPriority": "low"|"medium"|"high"|"critical",
  "ticketSubject": string|null,
  "escalate": boolean,
  "escalationReason": string|null,
  "sentiment": "positive"|"neutral"|"frustrated"|"urgent",
  "primaryIntent": "lead"|"support"|"inquiry"|"complaint"|"other",
  "priority": "low"|"medium"|"high"|"critical",
  "conversationSummary": string,
  "requirementsSummary": string|null
}`,
        }],
        maxTokens: 500,
        temperature: 0.1,
        jsonMode: true,
      });
      return { ...fallback, ...JSON.parse(result.text) };
    }
    if (claude.isConfigured()) {
      const result = await claude.complete({
        system: 'Return ONLY valid JSON.',
        messages: [{ role: 'user', content: `Analyze: ${text}\n\nReturn JSON with leadDetected, leadScore(0-100), sentiment, primaryIntent, conversationSummary. Minimal.` }],
        maxTokens: 300,
      });
      try { return { ...fallback, ...JSON.parse(result.text.replace(/```json\n?|\n?```/g, '').trim()) }; } catch {}
    }
  } catch {}
  return fallback;
};

// ── Response parser — handles new JSON format + legacy tag fallback ───────────
const JSON_SEP = '|||JSON|||';

const parseAIResponse = (fullResponse) => {
  const sepIdx = fullResponse.indexOf(JSON_SEP);

  // ── New JSON format ────────────────────────────────────────────────────────
  if (sepIdx !== -1) {
    const cleanResponse = fullResponse.slice(0, sepIdx).trim();
    const jsonStr       = fullResponse.slice(sepIdx + JSON_SEP.length).trim();

    let intelligence = null;
    let collectedTags = null;
    let buttons = null;
    let leadTag = null;

    try {
      const parsed = JSON.parse(jsonStr);

      intelligence = {
        leadScore:         parsed.leadScore         || 0,
        industry:          parsed.industry          || '',
        projectType:       parsed.projectType       || '',
        complexity:        parsed.complexity        || '',
        estimatedBudget:   parsed.estimatedBudget   || '',
        estimatedTimeline: parsed.estimatedTimeline || '',
        recommendation:    parsed.recommendation    || '',
      };

      const cf = parsed.collectedFields || {};
      const cfKeys = Object.keys(cf).filter(k => k !== 'leadReady' && cf[k]);
      if (cfKeys.length) {
        collectedTags = {};
        cfKeys.forEach(k => { collectedTags[k] = cf[k]; });
      }

      if (Array.isArray(parsed.buttons) && parsed.buttons.length) {
        buttons = parsed.buttons.filter(b => b.icon && b.label && b.msg);
      }

      if (cf.leadReady && cf.name && (cf.phone || cf.email)) {
        leadTag = {
          name:        cf.name        || '',
          phone:       cf.phone       || '',
          email:       cf.email       || '',
          projectType: cf.projectType || '',
          timeline:    cf.timeline    || '',
          features:    cf.features    || '',
        };
      }
    } catch { /* JSON parse failed — return what we have */ }

    return { cleanResponse, intelligence, collectedTags, buttons, leadTag };
  }

  // ── Legacy tag fallback ────────────────────────────────────────────────────
  const leadMatch = fullResponse.match(/\[LEAD_READY:\s*([^\]]+)\]/);
  let leadTag = null;
  if (leadMatch) {
    const pairs = {};
    [...leadMatch[1].matchAll(/(\w+)="([^"]*)"/g)].forEach(m => { pairs[m[1]] = m[2]; });
    if (Object.keys(pairs).length) leadTag = pairs;
  }

  const collectedTags = (() => {
    const result = {};
    for (const m of fullResponse.matchAll(/\[COLLECTED:(\w+)="([^"]*)"\]/g)) {
      if (m[2]) result[m[1]] = m[2];
    }
    return Object.keys(result).length ? result : null;
  })();

  const buttons = (() => {
    const m = fullResponse.match(/\[BUTTONS:([^\]]+)\]/);
    if (!m) return null;
    return m[1].split(',').map(b => {
      const [rawLabel, msg] = b.split('|').map(s => s.trim());
      if (!rawLabel || !msg) return null;
      const em = rawLabel.match(/^([\p{Emoji}]+)\s*(.*)/u);
      return em ? { icon: em[1].trim(), label: em[2].trim(), msg } : { icon: '', label: rawLabel, msg };
    }).filter(Boolean);
  })();

  const cleanResponse = fullResponse
    .replace(/\[LEAD_READY:[^\]]+\]/g, '')
    .replace(/\[COLLECTED:[^\]]+\]/g, '')
    .replace(/\[BUTTONS:[^\]]+\]/g, '')
    .trim();

  return { cleanResponse, intelligence: null, collectedTags, buttons, leadTag };
};

// ── Request ID generator ──────────────────────────────────────────────────────
const genRequestId = () => `REQ-${Date.now().toString(36).toUpperCase().slice(-6)}`;

// ── POST /api/support/chat ─────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  const { message, history = [], sessionId, lang = 'en', userId, userEmail, collected = {} } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });

  res.setHeader('Content-Type',     'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control',    'no-cache');
  res.setHeader('Connection',       'keep-alive');
  res.setHeader('X-Accel-Buffering','no');
  res.flushHeaders?.();

  const messages = [
    ...history.slice(-20).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message.trim() },
  ];

  let fullResponse = '';

  // Stream to client — suppress everything after |||JSON||| separator
  let chunkBuffer     = '';
  let jsonSepFound    = false;
  const SEP_LEN       = JSON_SEP.length;

  try {
    fullResponse = await aiStream({
      system:    SYSTEM_PROMPT(lang, collected),
      messages,
      maxTokens: 800,
      onChunk:   (chunk) => {
        if (jsonSepFound) return;
        chunkBuffer += chunk;
        const sepIdx = chunkBuffer.indexOf(JSON_SEP);
        if (sepIdx !== -1) {
          jsonSepFound = true;
          const safe = chunkBuffer.slice(0, sepIdx);
          if (safe) sse(res, { type: 'chunk', content: safe });
        } else {
          // Keep last (SEP_LEN-1) chars buffered in case separator spans chunks
          if (chunkBuffer.length > SEP_LEN - 1) {
            const toSend = chunkBuffer.slice(0, -(SEP_LEN - 1));
            sse(res, { type: 'chunk', content: toSend });
            chunkBuffer = chunkBuffer.slice(-(SEP_LEN - 1));
          }
        }
      },
    });
    // Flush any remaining buffer if separator was never found
    if (!jsonSepFound && chunkBuffer) {
      sse(res, { type: 'chunk', content: chunkBuffer });
    }
  } catch (err) {
    const noProvider = err.message === 'NO_AI_PROVIDER';
    sse(res, {
      type: 'chunk',
      content: lang === 'ar'
        ? (noProvider ? 'مرحباً! أنا مستشار YANSY. أخبرني عن مشروعك.' : 'عذراً، خطأ مؤقت. تواصل معنا: wa.me/201090385390')
        : (noProvider ? "Hi! I'm YANSY's business consultant. Tell me about your project." : 'Sorry, temporary error. Reach us: wa.me/201090385390'),
    });
    sse(res, { type: 'done', metadata: {} });
    return res.end();
  }

  // Parse full response (JSON format + legacy tag fallback)
  const { cleanResponse, intelligence, collectedTags, buttons, leadTag } = parseAIResponse(fullResponse);

  // Patch the streamed content with the clean reply (JSON already filtered from stream)
  sse(res, { type: 'patch', content: cleanResponse });

  // Background: analyze + persist
  const analysisTimeout = setTimeout(() => {
    sse(res, { type: 'done', metadata: { sessionId } });
    try { res.end(); } catch {}
  }, 10000);

  setImmediate(async () => {
    let metadata = { sessionId, stage: resolveStage({ ...collected, ...(collectedTags || {}) }) };

    // Surface extracted data to client immediately
    if (collectedTags)  metadata.collected   = collectedTags;
    if (buttons)        metadata.buttons     = buttons;
    if (intelligence)   metadata.intelligence = intelligence;

    try {
      const allMessages = [
        ...history.slice(-12),
        { role: 'user',      content: message.trim() },
        { role: 'assistant', content: cleanResponse },
      ];

      const convText = allMessages
        .map(m => `${m.role === 'user' ? 'Customer' : 'AI'}: ${m.content}`)
        .join('\n');

      const [analysis, conversation] = await Promise.all([
        aiAnalyze(convText),
        sessionId
          ? SupportConversation.findOne({ sessionId }).catch(() => null)
          : Promise.resolve(null),
      ]);

      const ua = req.get('User-Agent') || '';
      const browserInfo = {
        browser: ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Other',
        os:      ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Android') ? 'Android' : ua.includes('iOS') ? 'iOS' : 'Other',
        device:  ua.includes('Mobile') ? 'Mobile' : 'Desktop',
      };

      const conv = conversation || new SupportConversation({
        sessionId:   sessionId || undefined,
        lang,
        ip:          req.ip,
        userAgent:   ua,
        browserInfo,
        userId:      userId    || null,
        userEmail:   userEmail || null,
        userType:    userId ? 'registered' : 'guest',
      });

      conv.messages.push(
        { role: 'user',      content: message.trim() },
        { role: 'assistant', content: cleanResponse  },
      );

      conv.sentiment           = analysis.sentiment     || 'neutral';
      conv.primaryIntent       = analysis.primaryIntent || 'lead';
      conv.conversationSummary = analysis.conversationSummary || conv.conversationSummary;
      conv.priority            = analysis.priority      || conv.priority || 'low';

      const bestScore = Math.max(intelligence?.leadScore || 0, analysis.leadScore || 0);
      if (bestScore > (conv.leadScore || 0)) conv.leadScore = bestScore;

      // Merge lead data from all sources: analysis + LEAD_READY tag + COLLECTED tags + client-side collected
      const mergedCollected = { ...collected, ...(collectedTags || {}) };
      const ld = { ...analysis.leadData, ...(leadTag || {}) };
      const hasContact = (ld.phone || ld.email || mergedCollected.phone || mergedCollected.email) &&
                         (ld.name  || mergedCollected.name);

      const prevLead = conv.lead || {};
      const newLead = {
        detected:    hasContact || prevLead.detected || false,
        name:        ld.name        || mergedCollected.name     || prevLead.name,
        phone:       ld.phone       || mergedCollected.phone    || prevLead.phone,
        email:       ld.email       || mergedCollected.email    || prevLead.email,
        business:    ld.business    || mergedCollected.business || prevLead.business,
        timeline:    ld.timeline    || mergedCollected.timeline || prevLead.timeline,
        projectType: ld.projectType || mergedCollected.projectType || prevLead.projectType,
        features:    ld.features?.join(', ') || mergedCollected.features || prevLead.features,
        requirementsSummary: analysis.requirementsSummary || prevLead.requirementsSummary,
        goals:       prevLead.goals,
        savedAt:     hasContact ? (prevLead.savedAt || new Date()) : prevLead.savedAt,
      };
      conv.lead = newLead;

      if (hasContact) {
        metadata.leadDetected = true;
        metadata.leadScore    = conv.leadScore;
      }

      // Auto-create AIRequest when qualification complete
      if ((analysis.autoCreateRequest || (leadTag && hasContact)) && !conv.requestId) {
        try {
          const reqData = newLead;

          // Generate AI recommendation
          let aiRec = null;
          try {
            const score = conv.leadScore || 0;
            if      (score >= 80) aiRec = `High-value lead. ${reqData.projectType || 'Project'} with strong buying intent. Recommend immediate callback.`;
            else if (score >= 60) aiRec = `Qualified lead. ${reqData.projectType || 'Project'} request. Recommend outreach within 24 hours.`;
            else                  aiRec = `New lead for ${reqData.projectType || 'project'}. Recommend standard follow-up.`;
          } catch {}

          const aiReq = await AIRequest.create({
            name:                reqData.name,
            phone:               reqData.phone        || null,
            email:               reqData.email        || null,
            company:             reqData.business     || null,
            projectType:         reqData.projectType  || null,
            features:            Array.isArray(reqData.features) ? reqData.features.join(', ') : (reqData.features || null),
            business:            reqData.business     || null,
            timeline:            reqData.timeline     || null,
            goals:               reqData.goals        || null,
            requirementsSummary: reqData.requirementsSummary || analysis.requirementsSummary || null,
            leadScore:           conv.leadScore        || 0,
            conversationSummary: analysis.conversationSummary || conv.conversationSummary || null,
            sentiment:           analysis.sentiment   || 'neutral',
            priority:            conv.leadScore >= 80 ? 'high' : conv.leadScore >= 60 ? 'medium' : 'low',
            aiRecommendation:    aiRec,
            conversationId:      conv._id             || null,
            sessionId:           conv.sessionId       || null,
            userId:              userId               || null,
            userType:            userId ? 'registered' : 'guest',
            browserInfo:         conv.browserInfo     || undefined,
            ip:                  conv.ip              || null,
            adminNotes:          `Score: ${conv.leadScore}/100 · Session: ${conv.sessionId}`,
          });

          conv.requestId          = aiReq._id.toString();
          metadata.requestCreated = true;
          metadata.requestData    = {
            id:           aiReq.requestCode,
            customerName: reqData.name,
            projectType:  reqData.projectType,
            phone:        reqData.phone,
            email:        reqData.email,
            timeline:     reqData.timeline,
            features:     Array.isArray(reqData.features) ? reqData.features.join(', ') : reqData.features,
          };
        } catch (re) {
          console.error('[support:request]', re.message);
        }
      }

      // Auto-ticket
      if (analysis.createTicket && !conv.ticket) {
        try {
          const ticket = await SupportTicket.create({
            conversationId: conv._id,
            customer: { name: conv.lead?.name || 'Anonymous', email: conv.lead?.email || null, phone: conv.lead?.phone || null, userId: userId || null, userType: userId ? 'registered' : 'guest' },
            subject:              analysis.ticketSubject || 'Support Request via AI',
            summary:              cleanResponse.slice(0, 500),
            priority:             analysis.ticketPriority || 'medium',
            projectType:          conv.lead?.projectType || null,
            conversationSnapshot: allMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          });
          conv.ticket           = ticket._id;
          metadata.ticketId     = ticket.ticketId;
          metadata.ticketStatus = 'open';
        } catch (te) { console.error('[support:ticket]', te.message); }
      }

      // Escalation
      if (analysis.escalate && !conv.escalation?.needed) {
        conv.escalation = { needed: true, priority: analysis.ticketPriority || 'high', reason: analysis.escalationReason || 'AI escalation', flaggedAt: new Date() };
        metadata.escalate = true;
      }

      if (analysis.suggestWhatsapp && !conv.whatsappSuggested) {
        conv.whatsappSuggested   = true;
        metadata.suggestWhatsapp = true;
        metadata.whatsappReason  = analysis.whatsappReason;
      }

      await conv.save().catch(e => console.error('[support:save]', e.message));
      metadata.sessionId = conv.sessionId;

    } catch (err) {
      console.error('[support:analysis]', err.message);
    } finally {
      clearTimeout(analysisTimeout);
      sse(res, { type: 'done', metadata });
      try { res.end(); } catch {}
    }
  });
};

// ── GET /api/support/conversation/:sessionId ──────────────────────────────────
exports.getConversation = async (req, res) => {
  try {
    const conv = await SupportConversation
      .findOne({ sessionId: req.params.sessionId })
      .populate('ticket', 'ticketId status priority')
      .lean();

    if (!conv) return res.json({ messages: [], sessionId: req.params.sessionId });

    res.json({
      sessionId: conv.sessionId,
      messages:  conv.messages,
      lead:      conv.lead,
      ticket:    conv.ticket,
      sentiment: conv.sentiment,
      leadScore: conv.leadScore,
      requestId: conv.requestId,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load conversation.' });
  }
};

// ── Admin: GET /api/support/admin/conversations ───────────────────────────────
exports.adminGetConversations = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const { search, intent, sentiment, hasLead, userType } = req.query;

    const query = { isArchived: false };
    if (intent)             query.primaryIntent    = intent;
    if (sentiment)          query.sentiment        = sentiment;
    if (userType)           query.userType         = userType;
    if (hasLead === 'true') query['lead.detected'] = true;
    if (search) {
      query.$or = [
        { 'lead.name':  { $regex: search, $options: 'i' } },
        { 'lead.email': { $regex: search, $options: 'i' } },
        { 'lead.phone': { $regex: search, $options: 'i' } },
        { userEmail:    { $regex: search, $options: 'i' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      SupportConversation.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'fullName email')
        .populate('ticket', 'ticketId status priority')
        .lean(),
      SupportConversation.countDocuments(query),
    ]);

    res.json({ conversations, total, page, totalPages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ error: 'Failed to load conversations.' }); }
};

// ── Admin: GET /api/support/admin/conversation/:id ───────────────────────────
exports.adminGetConversation = async (req, res) => {
  try {
    const conv = await SupportConversation.findById(req.params.id)
      .populate('userId', 'fullName email')
      .populate('ticket', 'ticketId status priority')
      .lean();
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    res.json({ conversation: conv });
  } catch { res.status(500).json({ error: 'Failed to load conversation.' }); }
};

// ── Admin: PATCH /api/support/admin/conversation/:id ─────────────────────────
exports.adminUpdateConversation = async (req, res) => {
  try {
    const { isRead, isArchived, adminNotes } = req.body;
    const conv = await SupportConversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    if (typeof isRead     !== 'undefined') conv.isRead     = isRead;
    if (typeof isArchived !== 'undefined') conv.isArchived = isArchived;
    if (adminNotes !== undefined)          conv.adminNotes = adminNotes;
    await conv.save();
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to update conversation.' }); }
};

// ── Admin: GET /api/support/admin/leads ──────────────────────────────────────
exports.adminGetLeads = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const { search, userType, minScore, projectType } = req.query;

    const query = { 'lead.detected': true, isArchived: false };
    if (userType)    query.userType              = userType;
    if (projectType) query['lead.projectType']   = { $regex: projectType, $options: 'i' };
    if (minScore)    query.leadScore             = { $gte: parseInt(minScore) };
    if (search) {
      query.$or = [
        { 'lead.name':     { $regex: search, $options: 'i' } },
        { 'lead.email':    { $regex: search, $options: 'i' } },
        { 'lead.phone':    { $regex: search, $options: 'i' } },
        { 'lead.business': { $regex: search, $options: 'i' } },
      ];
    }

    const [leads, total] = await Promise.all([
      SupportConversation.find(query)
        .select('sessionId lead leadScore priority sentiment userType userId userEmail createdAt updatedAt requestId ticket conversationSummary messages')
        .sort({ leadScore: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'fullName email')
        .populate('ticket', 'ticketId status')
        .lean(),
      SupportConversation.countDocuments(query),
    ]);

    res.json({ leads, total, page, totalPages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ error: 'Failed to load leads.' }); }
};

// ── Admin: GET /api/support/admin/escalations ─────────────────────────────────
exports.adminGetEscalations = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const query = { 'escalation.needed': true, isArchived: false };

    const [escalations, total] = await Promise.all([
      SupportConversation.find(query)
        .sort({ 'escalation.flaggedAt': -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'fullName email')
        .populate('ticket', 'ticketId status priority')
        .lean(),
      SupportConversation.countDocuments(query),
    ]);

    res.json({ escalations, total, page, totalPages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ error: 'Failed to load escalations.' }); }
};

// ── Admin: GET /api/support/admin/tickets ─────────────────────────────────────
exports.adminGetTickets = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const { status, priority, search, userType } = req.query;

    const query = {};
    if (status)   query.status               = status;
    if (priority) query.priority             = priority;
    if (userType) query['customer.userType'] = userType;
    if (search) {
      query.$or = [
        { ticketId:         { $regex: search, $options: 'i' } },
        { subject:          { $regex: search, $options: 'i' } },
        { 'customer.name':  { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('assignedTo', 'fullName email')
        .lean(),
      SupportTicket.countDocuments(query),
    ]);

    res.json({ tickets, total, page, totalPages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ error: 'Failed to load tickets.' }); }
};

// ── Admin: GET /api/support/admin/ticket/:id ──────────────────────────────────
exports.adminGetTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('assignedTo', 'fullName email')
      .populate('notes.addedBy', 'fullName')
      .lean();
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    const conversation = ticket.conversationId
      ? await SupportConversation.findById(ticket.conversationId)
          .select('messages lead sentiment leadScore conversationSummary')
          .lean()
      : null;

    res.json({ ticket, conversation });
  } catch { res.status(500).json({ error: 'Failed to load ticket.' }); }
};

// ── Admin: PATCH /api/support/admin/ticket/:id ────────────────────────────────
exports.adminUpdateTicket = async (req, res) => {
  try {
    const { status, priority, assignedTo, note } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    if (status)     { ticket.status   = status;   if (status === 'resolved') ticket.resolvedAt = new Date(); if (status === 'closed') ticket.closedAt = new Date(); }
    if (priority)   ticket.priority   = priority;
    if (assignedTo) ticket.assignedTo = assignedTo;
    if (note?.trim()) ticket.notes.push({ content: note.trim(), addedBy: req.user._id });

    await ticket.save();
    res.json({ ticket });
  } catch { res.status(500).json({ error: 'Failed to update ticket.' }); }
};

// ── Admin: GET /api/support/admin/analytics ───────────────────────────────────
exports.adminGetAnalytics = async (req, res) => {
  try {
    const now   = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const week  = new Date(now); week.setDate(week.getDate() - 7);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [
      totalConversations, leadsTotal, leadsMonth, leadsWeek,
      ticketsTotal, ticketsOpen, ticketsCritical,
      sentimentAgg, intentAgg, convWeek, convToday,
      registeredConvs, guestConvs, escalationsTotal, unreadCount,
    ] = await Promise.all([
      SupportConversation.countDocuments({ isArchived: false }),
      SupportConversation.countDocuments({ 'lead.detected': true }),
      SupportConversation.countDocuments({ 'lead.savedAt': { $gte: month } }),
      SupportConversation.countDocuments({ 'lead.savedAt': { $gte: week } }),
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      SupportTicket.countDocuments({ priority: 'critical', status: { $ne: 'closed' } }),
      SupportConversation.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$sentiment', count: { $sum: 1 } } }]),
      SupportConversation.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$primaryIntent', count: { $sum: 1 } } }]),
      SupportConversation.countDocuments({ createdAt: { $gte: week } }),
      SupportConversation.countDocuments({ createdAt: { $gte: today } }),
      SupportConversation.countDocuments({ userType: 'registered' }),
      SupportConversation.countDocuments({ userType: 'guest' }),
      SupportConversation.countDocuments({ 'escalation.needed': true, isArchived: false }),
      SupportConversation.countDocuments({ isRead: false, isArchived: false }),
    ]);

    const avgScore = await SupportConversation.aggregate([
      { $match: { 'lead.detected': true } },
      { $group: { _id: null, avg: { $avg: '$leadScore' } } },
    ]);

    res.json({
      totalConversations, convWeek, convToday,
      leadsTotal, leadsMonth, leadsWeek,
      ticketsTotal, ticketsOpen, ticketsCritical,
      escalationsTotal, unreadCount,
      registeredConvs, guestConvs,
      avgLeadScore:   Math.round(avgScore[0]?.avg || 0),
      conversionRate: totalConversations > 0 ? +((leadsTotal / totalConversations) * 100).toFixed(1) : 0,
      sentiment: Object.fromEntries(sentimentAgg.map(s => [s._id || 'unknown', s.count])),
      intent:    Object.fromEntries(intentAgg.map(i => [i._id    || 'unknown', i.count])),
    });
  } catch { res.status(500).json({ error: 'Failed to load analytics.' }); }
};

// ── Admin: GET /api/support/admin/requests ────────────────────────────────────
exports.adminGetRequests = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const { search, status, priority, userType } = req.query;

    const query = {};
    if (status)   query.status   = status;
    if (priority) query.priority = priority;
    if (userType) query.userType = userType;
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { email:       { $regex: search, $options: 'i' } },
        { phone:       { $regex: search, $options: 'i' } },
        { projectType: { $regex: search, $options: 'i' } },
        { company:     { $regex: search, $options: 'i' } },
        { requestCode: { $regex: search, $options: 'i' } },
      ];
    }

    const [requests, total] = await Promise.all([
      AIRequest.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'fullName email')
        .populate('assignedTo', 'fullName email')
        .lean(),
      AIRequest.countDocuments(query),
    ]);

    res.json({ requests, total, page, totalPages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ error: 'Failed to load requests.' }); }
};

// ── Admin: GET /api/support/admin/request/:id ─────────────────────────────────
exports.adminGetRequest = async (req, res) => {
  try {
    const request = await AIRequest.findById(req.params.id)
      .populate('userId',     'fullName email')
      .populate('assignedTo', 'fullName email')
      .populate('notes.addedBy', 'fullName')
      .lean();
    if (!request) return res.status(404).json({ error: 'Request not found.' });

    const conversation = request.conversationId
      ? await SupportConversation.findById(request.conversationId)
          .select('messages lead sentiment leadScore conversationSummary sessionId')
          .lean()
      : null;

    res.json({ request, conversation });
  } catch { res.status(500).json({ error: 'Failed to load request.' }); }
};

// ── Admin: PATCH /api/support/admin/request/:id ───────────────────────────────
exports.adminUpdateRequest = async (req, res) => {
  try {
    const { status, priority, assignedTo, note, adminNotes, isRead } = req.body;
    const request = await AIRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found.' });

    if (status) {
      request.status = status;
      if (status === 'contacted'     && !request.contactedAt)    request.contactedAt    = new Date();
      if (status === 'proposal_sent' && !request.proposalSentAt) request.proposalSentAt = new Date();
      if (['won','lost'].includes(status) && !request.closedAt)  request.closedAt       = new Date();
    }
    if (priority)   request.priority   = priority;
    if (assignedTo) request.assignedTo = assignedTo;
    if (typeof isRead !== 'undefined') request.isRead = isRead;
    if (adminNotes !== undefined)      request.adminNotes = adminNotes;
    if (note?.trim()) request.notes.push({ content: note.trim(), addedBy: req.user._id });

    await request.save();
    res.json({ request });
  } catch { res.status(500).json({ error: 'Failed to update request.' }); }
};
