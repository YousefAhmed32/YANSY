'use strict';
const dns                 = require('dns').promises;
const axios                = require('axios');
const multer                 = require('multer');
const cheerio                  = require('cheerio');
const { PDFParse }                 = require('pdf-parse');
const mammoth                      = require('mammoth');
const openai              = require('../utils/openaiService');
const claude               = require('../utils/claudeService');
const mediaService          = require('../media/media.service');
const { IMAGE_ONLY_MIMES, GENERIC_FILE_MAX_BYTES } = require('../media/mediaConstants');
const { logAiCost }          = require('../utils/aiCost');
const knowledge              = require('./knowledgeController');
const SupportConversation = require('../models/SupportConversation');
const SupportTicket       = require('../models/SupportTicket');
const AIRequest           = require('../models/AIRequest');
const AiCostLog            = require('../models/AiCostLog');
const SystemSettings      = require('../models/SystemSettings');

/* ═══════════════════════════════════════════════════════════════════════════
   YANSY AI V2 — Senior Solution Consultant
   ─────────────────────────────────────────────────────────────────────────
   Replaces the old rigid "one scripted question per stage" state machine.
   The model is given a full picture of what's already known and a set of
   consultant PRINCIPLES rather than a per-turn scripted line — it decides,
   per message, whether to ask one thing, bundle two closely-related things,
   infer silently, or move straight to a recommendation. A lightweight
   "known fields" snapshot still prevents re-asking, and a "phase" hint
   (early/shaping/closing) keeps the conversation purposeful without forcing
   a fixed sequence.
   ═══════════════════════════════════════════════════════════════════════ */

// Server-computed (not trusted from the model) — a simple, honest measure of
// how much of the blueprint is actually filled in, used to drive the sidebar's
// completion ring.
// Cumulative merge for persisting the blueprint to the DB — mirrors the
// frontend's mergeIntelligence logic (max for leadScore, latest for scalars,
// replace for arrays since the model already sends them cumulative each turn).
const SCALAR_INTEL_FIELDS = ['leadScore', 'industry', 'projectType', 'businessSummary', 'recommendedSolution', 'complexity', 'priority', 'estimatedTimeline', 'completionPercent', 'customerSegment'];
const ARRAY_INTEL_FIELDS  = ['features', 'techStack', 'integrations', 'pages', 'risks', 'nextSteps'];

const mergeIntelligenceServer = (prev = {}, delta = {}) => {
  const next = { ...(prev || {}) };
  for (const f of SCALAR_INTEL_FIELDS) {
    if (delta[f] !== undefined && delta[f] !== '') next[f] = f === 'leadScore' ? Math.max(prev?.[f] || 0, delta[f]) : delta[f];
  }
  for (const f of ARRAY_INTEL_FIELDS) {
    if (Array.isArray(delta[f]) && delta[f].length) next[f] = delta[f];
  }
  return next;
};

const computeCompletionPercent = (collected = {}, intelligence = {}) => {
  const checks = [
    intelligence.industry, intelligence.projectType, intelligence.businessSummary,
    intelligence.recommendedSolution, intelligence.features?.length,
    intelligence.techStack?.length, intelligence.estimatedTimeline,
    collected.name, (collected.phone || collected.email),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
};

const conversationPhase = (c = {}) => {
  if (c.name && (c.phone || c.email)) return 'closing';   // ready to hand off
  if (c.projectType && c.business)    return 'shaping';    // enough to start recommending
  return 'early';                                          // still discovering
};

// ── Admin-configurable overrides (SystemSettings, category 'ai_chat') ─────────
let _settingsCache = null;
let _settingsCacheAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute — admin edits propagate within a minute, no per-request DB hit

const getChatSettings = async () => {
  const now = Date.now();
  if (_settingsCache && (now - _settingsCacheAt) < CACHE_TTL_MS) return _settingsCache;
  try {
    const s = await SystemSettings.getCategory('ai_chat');
    _settingsCache = {
      welcomeMessageEn: s['aiChat.welcomeMessageEn'] || "Hi, I'm YANSY's solution consultant. Tell me a bit about what you're building — or what's not working with what you have — and I'll help you shape it into a clear plan.",
      welcomeMessageAr: s['aiChat.welcomeMessageAr'] || 'أهلاً، أنا مستشار الحلول لدى يانسي. احكِ لي باختصار عمّا تريد بناءه — وهساعدك تحوّلها لخطة واضحة.',
      tone:             s['aiChat.tone'] || 'confident, warm, senior-consultant — never robotic, never salesy',
      temperature:      typeof s['aiChat.temperature'] === 'number' ? s['aiChat.temperature'] : 0.75,
      model:            s['aiChat.model'] || undefined,
      promptAddendum:   s['aiChat.systemPromptAddendum'] || '',
      whatsappTemplate: s['aiChat.whatsappTemplate'] || "Hi YANSY 👋 I've been chatting with your AI consultant. Here's my project brief:\n\n{{brief}}\n\nI'd like to continue with your team.",
      voiceEnabled:     s['aiChat.voiceEnabled'] !== false,
      voice:            s['aiChat.voice'] || 'alloy',
      ragEnabled:       s['aiChat.ragEnabled'] !== false,
      // Cost Profiles — every expensive capability individually toggleable.
      // "costProfile" is just a label for admin UI presets; the actual gating
      // always reads the individual flags below, so an admin can start from a
      // preset and then override any single capability.
      costProfile:              s['aiChat.costProfile'] || 'balanced',
      visionEnabled:             s['aiChat.visionEnabled'] !== false,
      fileAnalysisEnabled:       s['aiChat.fileAnalysisEnabled'] !== false,
      documentGenerationEnabled: s['aiChat.documentGenerationEnabled'] !== false,
      streamingEnabled:          s['aiChat.streamingEnabled'] !== false,
      memoryEnabled:             s['aiChat.memoryEnabled'] !== false,
      longContextEnabled:        s['aiChat.longContextEnabled'] !== false,
      deepReasoningEnabled:      s['aiChat.deepReasoningEnabled'] !== false,
    };
    _settingsCacheAt = now;
  } catch {
    // DB unreachable — fall back to hardcoded defaults, never break the chat
    _settingsCache = _settingsCache || {
      welcomeMessageEn: "Hi, I'm YANSY's solution consultant. Tell me a bit about what you're building.",
      welcomeMessageAr: 'أهلاً، أنا مستشار الحلول لدى يانسي. احكِ لي عمّا تريد بناءه.',
      tone: 'confident, warm, senior-consultant', temperature: 0.75, model: undefined,
      promptAddendum: '', whatsappTemplate: "Hi YANSY 👋 Here's my project brief:\n\n{{brief}}",
      costProfile: 'balanced', visionEnabled: true, fileAnalysisEnabled: true,
      documentGenerationEnabled: true, streamingEnabled: true, memoryEnabled: true,
      longContextEnabled: true, deepReasoningEnabled: true,
      voiceEnabled: true, voice: 'alloy', ragEnabled: true,
    };
  }
  return _settingsCache;
};

// ── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = (lang, collected = {}, chatSettings, ragContext = '') => {
  const c     = collected || {};
  const isAR  = lang === 'ar';
  const phase = conversationPhase(c);

  const known = Object.entries({
    'Project type':     c.projectType,
    'Key features':     c.features,
    'Business context': c.business,
    'Timeline':         c.timeline,
    'Name':             c.name,
    'Phone/Email':      c.phone || c.email,
  }).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- (nothing yet — this is the opening of the conversation)';

  const phaseGuidance = {
    early:   'This is message 1 (or close to it). Reflect back what you already inferred, give a real one-line recommendation immediately, and in the SAME message ask for whatever single highest-value thing is still missing — bundled with a light ask for their name and phone/WhatsApp or email if it fits naturally. Do not spend a whole message just asking questions with no value given back.',
    shaping: 'You have the core picture. Give a confident, specific recommendation right now, then ask for name + phone/email in the same message if you don\'t have it yet — this should be your last discovery-feeling message before closing.',
    closing: 'You have what you need. Summarize your recommendation clearly and confidently, then hand off to the team — no more questions.',
  }[phase];

  return `You are YANSY's Senior Solution Consultant — the first person a prospective client talks to. You are not a chatbot, a lead-gen script, or an FAQ bot. You are a senior consultant with real product, business, and technical judgment, having a genuine conversation.

## WHO YOU'RE TALKING TO
Business owners and decision-makers (restaurants, clinics, real estate, education, hotels, manufacturing, startups, e-commerce) evaluating whether to work with YANSY. They may be vague, may test you with a hard question, may already know exactly what they want, or may not know what they need yet — meet them wherever they are.

## HOW YOU OPERATE — THIS IS THE MOST IMPORTANT SECTION
You are a lead-qualification consultant, not a discovery workshop. The goal is a qualified WhatsApp handoff in **2-5 messages total**, not a long conversation. Every message should move the qualification forward — never chat for its own sake.
- **Infer, don't interrogate.** If they say "I run a clinic and patients keep no-showing," you already know the industry, a real pain point, and a likely feature (reminders/booking) — don't ask "what industry are you in?" Reflect back what you inferred and confirm it lightly instead of re-asking.
- **Extract everything available from a single message before asking anything.** A message often contains business type, pain point, and urgency at once — pull all of it, don't drip-feed questions for things already stated.
- **Bundle aggressively.** When you genuinely need more, ask for the highest-value missing pieces together in one natural sentence (e.g. name + contact + timeline in one line) — never a numbered list, never more than one message spent purely on questions.
- **Never re-ask what's already known** (see KNOWN SO FAR below).
- **Only ask a question if the answer would change your recommendation or is required for handoff (name, phone/email, project type).** Skip everything else — a nice-to-know detail is not worth a turn.
- **Move to closing as soon as you have project type + one qualifying detail (business context or timeline) + a way to reach them.** Don't keep building the picture past that point — hand off.
- **Keep replies short** — 2-3 sentences, never a wall of text.
- **${phaseGuidance}**
- **Read the customer, adapt the depth, but not the speed.** A one-person startup founder wants speed and low risk. An enterprise/agency buyer expects a sharper, more technical reflection of their situation — but they still get qualified in the same 2-5 messages, not a longer discovery process.

## PRICING — HARD RULE, NO EXCEPTIONS
YANSY does not publish fixed prices — every project is custom-scoped. This applies even if pricing figures appear in the company knowledge below.
- **Never estimate, generate, or state a budget range, a specific number, or a price comparison — in your reply text OR in the structured output.**
- **Never invent or imply pricing**, even a rough one, even when directly pressured.
- If asked about cost, respond warmly and exactly in spirit of: "Every project is unique, so we don't quote a number without understanding it first. Once I have a clear picture, our solution architect puts together the right proposal after a short consultation." Then continue the conversation naturally — don't dwell on it.
- This is a qualification and consultation-booking tool, not a pricing negotiation. Redirect price pressure toward booking the consultation / WhatsApp handoff, never toward a number.

## TONE
${chatSettings?.tone || 'Confident, warm, senior-consultant — never robotic, never salesy.'} ${isAR ? 'اكتب بالعربية، بأسلوب طبيعي واحترافي، وحاكِ لغة المستخدم إذا تحدث بالإنجليزية.' : 'Write in English unless the user writes in Arabic, in which case mirror them.'}

## YANSY TECH — WHAT YOU REPRESENT
- Website: yansytech.com | WhatsApp handoff: +201090385390 | Based in Egypt, serving MENA + global clients
- Builds: websites, e-commerce platforms, SaaS products, mobile apps (iOS/Android), ERP/CRM systems, booking systems, AI integrations, business automation
- What makes YANSY different (use this naturally when relevant, never as a canned pitch): milestone-based payment (never full payment upfront), full code ownership after delivery, direct access to the people building it (no account-manager layer), average delivery around 14 days for a well-scoped project

## INDUSTRY CONTEXT (apply naturally when the industry is clear — don't announce you're doing this)
- Restaurants: online ordering, POS integration, multi-branch, delivery/reservations
- Healthcare/Clinics: appointment booking, no-show reduction, patient records, privacy-first
- Real Estate: listings, virtual tours, lead/CRM pipeline, mortgage tools
- Education: LMS, video, progress tracking, certificates, subscriptions
- Hotels/Hospitality: direct booking (avoiding OTA commissions), PMS integration
- Manufacturing: inventory, production tracking, order management
- Startups/SaaS: multi-tenancy, subscription billing, APIs, analytics
- E-commerce: catalog, checkout, inventory sync, multi-currency

## TIMELINE FRAMEWORK — for structured output only
- Low complexity: simple website/landing → 2-6 weeks
- Medium: standard web app / basic e-commerce → 4-10 weeks
- High: SaaS, complex platform, custom system → 2-5 months
- Enterprise: large-scale, multi-tenant, AI-integrated → 4-12 months

## LEAD SCORE (0-100, for structured output only)
+15 project type known, +15 features/pain point known, +15 business context known, +15 timeline known, +20 name known, +20 phone or email known.

## KNOWN SO FAR — never re-ask any of this
${known}

${chatSettings?.promptAddendum ? `## ADDITIONAL CONTEXT FROM THE TEAM\n${chatSettings.promptAddendum}\n` : ''}
${ragContext ? `## COMPANY KNOWLEDGE — grounded facts, prefer these over assumptions when relevant to what they're asking. EXCEPTION: if any figure below looks like a price, budget, or cost, do NOT repeat it to the user — the pricing rule above always wins, even over this knowledge base.\n${ragContext}\n` : ''}
## MULTIMODAL INPUT
The user may attach images (screenshots, logos, UI, business cards), documents (PDF/Word — already extracted to text below their message), or a website analysis. When an image is attached, actually look at it and give a specific, concrete critique (colors, typography, layout, UX problems, brand impression) — never a generic "nice image" response. When a document excerpt or website analysis is included in their message, treat it as real information they've shared, not something to re-ask about.

## OUTPUT FORMAT — FOLLOW EXACTLY, EVERY TURN
1. Write your natural conversational reply first, in ${isAR ? 'Arabic' : 'English'} (unless the user is writing in the other language — then mirror them).
2. On a new line, write exactly: |||JSON|||
3. On the next line, write ONLY a single valid JSON object — no markdown fences, no commentary:

{"leadScore":<0-100>,"industry":"<string or empty>","projectType":"<string or empty>","businessSummary":"<1-2 sentence plain-language summary of their business/situation, or empty until you actually know enough>","recommendedSolution":"<1-2 sentence recommended approach, or empty until warranted>","features":[<array of specific feature strings inferred or stated so far — cumulative, keep prior ones plus new>],"techStack":[<array of 2-5 concrete technology names appropriate to the project, only once projectType+complexity are reasonably clear>],"integrations":[<array of relevant third-party integrations, e.g. "Stripe", "Google Maps" — only when relevant>],"pages":[<array of 3-8 concrete page/screen names this project would need, e.g. "Home","Booking","Admin Dashboard" — only once projectType is clear enough to name real pages, cumulative>],"complexity":"<Low|Medium|High|Enterprise, or empty if not yet knowable>","priority":"<Low|Medium|High — how urgent this feels to the client (stated urgency, timeline pressure, pain severity), or empty if unclear>","customerSegment":"<Startup|SMB|Enterprise|Agency, or empty if not yet clear — infer from team size, scale, language used (procurement/compliance/stakeholders = Enterprise; reselling to their own clients = Agency; solo/early-stage = Startup; established single business = SMB>","estimatedTimeline":"<e.g. 4-10 weeks, or empty — NEVER a budget or price figure>","risks":[<array of 0-3 short strings — real considerations/open questions for this project, e.g. "Needs Arabic + English content from day one">],"nextSteps":[<array of 1-3 short, concrete next-step strings from YANSY's side>],"collectedFields":{<only NEW fields extracted from THIS message: projectType, features, business, timeline, name, phone, email>},"buttons":[{"icon":"<emoji>","label":"<2-4 words>","msg":"<exact message this would send>"}]}

Rules for the JSON:
- Only fill businessSummary/recommendedSolution/techStack/estimatedTimeline/risks/nextSteps once you genuinely know enough — leave them as empty string/array otherwise. Never fabricate specifics you don't have grounds for.
- Never populate any field with a price, budget, or cost figure — there is no budget field in this schema. If you find yourself wanting to write a dollar amount anywhere, don't.
- features/techStack/integrations/risks/nextSteps are CUMULATIVE across the conversation — include everything still relevant, not just what's new this turn.
- buttons: 2-4 short, genuinely useful quick replies for what THIS specific reply naturally invites next — never a generic fixed menu. Omit entirely (empty array) once in the closing phase if a WhatsApp handoff button already covers it.
- If name AND (phone OR email) are now known, add "leadReady":true inside collectedFields.`;
};

// ── SSE helper ──────────────────────────────────────────────────────────────────
const sse = (res, data) => { try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {} };

// ── AI provider ─────────────────────────────────────────────────────────────────
const aiStream = async ({ system, messages, maxTokens = 600, onChunk, onUsage, temperature = 0.75, model }) => {
  if (openai.isConfigured()) {
    return await openai.stream({ system, messages, maxTokens, temperature, model, onChunk, onUsage });
  }
  if (claude.isConfigured()) {
    const result = await claude.stream({ system, messages, maxTokens, onChunk });
    return result.text;
  }
  throw new Error('NO_AI_PROVIDER');
};

// ── WhatsApp brief builder — the team should never make the client repeat
//    themselves, so this assembles everything collected into one clean,
//    scannable message the moment enough is known. ──────────────────────────
// WhatsApp supports a tiny markdown subset (*bold*, _italic_) — used here so
// the brief the sales team receives actually reads like a formatted document
// instead of a flat list of "Label: value" lines.
const buildWhatsappBrief = (lang, collected = {}, intelligence = {}, template) => {
  const isAR = lang === 'ar';
  const L = (en, ar) => (isAR ? ar : en);
  const sections = [];

  const contactLines = [];
  if (collected.name)              contactLines.push(`${L('Name', 'الاسم')}: ${collected.name}`);
  if (collected.phone || collected.email) contactLines.push(`${L('Contact', 'التواصل')}: ${collected.phone || collected.email}`);
  if (intelligence.customerSegment) contactLines.push(`${L('Segment', 'الفئة')}: ${intelligence.customerSegment}`);
  if (contactLines.length) sections.push(contactLines.join('\n'));

  const projectLines = [];
  if (intelligence.industry) projectLines.push(`${L('Industry', 'القطاع')}: ${intelligence.industry}`);
  if (collected.projectType || intelligence.projectType) projectLines.push(`${L('Type', 'النوع')}: ${collected.projectType || intelligence.projectType}`);
  if (intelligence.complexity) projectLines.push(`${L('Complexity', 'التعقيد')}: ${intelligence.complexity}`);
  if (intelligence.priority)   projectLines.push(`${L('Priority', 'الأولوية')}: ${intelligence.priority}`);
  if (projectLines.length) sections.push(`📋 *${L('Project', 'المشروع')}*\n${projectLines.join('\n')}`);

  if (intelligence.businessSummary) sections.push(`🧭 *${L('Summary', 'الملخص')}*\n${intelligence.businessSummary}`);
  if (intelligence.recommendedSolution) sections.push(`✦ *${L('Recommended Approach', 'الحل الموصى به')}*\n${intelligence.recommendedSolution}`);
  if (intelligence.features?.length) sections.push(`🧩 *${L('Key Features', 'الميزات الرئيسية')}*\n${intelligence.features.map(f => `- ${f}`).join('\n')}`);
  if (intelligence.pages?.length) sections.push(`📄 *${L('Pages', 'الصفحات')}*\n${intelligence.pages.join(', ')}`);
  if (intelligence.techStack?.length || intelligence.integrations?.length) sections.push(`🛠 *${L('Suggested Stack', 'التقنيات المقترحة')}*\n${[...(intelligence.techStack || []), ...(intelligence.integrations || [])].join(', ')}`);

  // No budget/price line by policy — YANSY quotes only after a scoping consultation.
  if (collected.timeline || intelligence.estimatedTimeline) {
    sections.push(`📊 *${L('Timeline', 'الجدول الزمني')}*\n${collected.timeline || intelligence.estimatedTimeline}`);
  }

  if (intelligence.risks?.length) sections.push(`⚠ *${L('Worth Noting', 'اعتبارات مهمة')}*\n${intelligence.risks.map(r => `- ${r}`).join('\n')}`);
  if (intelligence.nextSteps?.length) sections.push(`➜ *${L('Next Steps', 'الخطوات التالية')}*\n${intelligence.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);

  if (!sections.length) return '';
  const brief = sections.join('\n\n');
  const tpl = template || "Hi YANSY 👋 Here's my project brief:\n\n{{brief}}\n\nI'd like to continue with your team.";
  return tpl.replace('{{brief}}', brief);
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
        leadScore:            parsed.leadScore            || 0,
        industry:             parsed.industry             || '',
        projectType:          parsed.projectType           || '',
        businessSummary:      parsed.businessSummary       || '',
        recommendedSolution:  parsed.recommendedSolution   || '',
        features:             Array.isArray(parsed.features)     ? parsed.features     : [],
        techStack:            Array.isArray(parsed.techStack)    ? parsed.techStack    : [],
        integrations:         Array.isArray(parsed.integrations) ? parsed.integrations : [],
        pages:                Array.isArray(parsed.pages)     ? parsed.pages     : [],
        complexity:           parsed.complexity            || '',
        priority:             parsed.priority              || '',
        customerSegment:      parsed.customerSegment       || '',
        estimatedTimeline:    parsed.estimatedTimeline     || '',
        risks:                Array.isArray(parsed.risks)     ? parsed.risks     : [],
        nextSteps:            Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
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
  const { message, history = [], sessionId, lang = 'en', userId, userEmail, collected = {}, attachments = [] } = req.body;
  const isAR = lang === 'ar';

  const typedText = message?.trim() || '';
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  if (!typedText && !hasAttachments) return res.status(400).json({ error: 'Message is required.' });

  // What we show/persist as "what the user said" — attachments get their own
  // preview UI on the frontend, so history stays readable rather than stuffed
  // with extracted document text.
  const displayMessage = typedText || (isAR ? 'أرسل مرفقًا' : 'Sent an attachment');

  res.setHeader('Content-Type',     'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control',    'no-cache');
  res.setHeader('Connection',       'keep-alive');
  res.setHeader('X-Accel-Buffering','no');
  res.flushHeaders?.();

  const chatSettings = await getChatSettings();

  // Build this turn's content: images become real vision parts, documents and
  // website analyses become compact text context appended to the message —
  // all scoped to THIS API call only, never written into persisted history.
  // Vision is gated by Cost Profile — an image attaches fine either way, it
  // just isn't sent to the model for analysis when disabled.
  const imageAttachments = (hasAttachments && chatSettings.visionEnabled) ? attachments.filter(a => a.kind === 'image' && a.url) : [];
  const textAttachments  = hasAttachments ? attachments.filter(a => a.kind !== 'image') : [];

  let textForModel = typedText;
  for (const att of textAttachments) {
    if (att.kind === 'document') {
      textForModel += `\n\n[Attached document "${att.name || 'file'}"]:\n${(att.textExcerpt || '').slice(0, 6000)}`;
    } else if (att.kind === 'website') {
      textForModel += `\n\n[Website analysis for ${att.url}]:\nHeuristics: ${JSON.stringify(att.heuristics || {})}\nCritique: ${att.critique || ''}`;
    }
  }
  if (!textForModel.trim()) textForModel = isAR ? 'من فضلك حلل المرفق.' : 'Please analyze the attachment.';

  const currentTurnContent = imageAttachments.length
    ? [
        { type: 'text', text: textForModel },
        ...imageAttachments.map(img => ({ type: 'image_url', image_url: { url: img.dataUrl || img.url } })),
      ]
    : textForModel;

  // Long Context toggle controls how much history rides along on every turn —
  // the single biggest lever on input-token cost in a multi-turn conversation.
  const historyWindow = chatSettings.longContextEnabled ? 20 : 6;
  const messages = [
    ...history.slice(-historyWindow).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: currentTurnContent },
  ];

  let fullResponse = '';
  let usageInfo = null;

  // Stream to client — suppress everything after |||JSON||| separator
  let chunkBuffer     = '';
  let jsonSepFound    = false;
  const SEP_LEN       = JSON_SEP.length;

  const ragContext = chatSettings.ragEnabled
    ? await knowledge.retrieveContext(typedText || displayMessage).catch(() => '')
    : '';

  // The structured JSON block (features/techStack/pages/risks/nextSteps, all
  // cumulative) grows through a conversation and can get long — 800 was enough
  // for the V2 schema but silently truncated the V3 one mid-JSON (verified via
  // raw-response inspection). Deep Reasoning toggle trades that headroom for cost.
  const replyMaxTokens = chatSettings.deepReasoningEnabled ? 1600 : 700;

  try {
    if (chatSettings.streamingEnabled) {
      fullResponse = await aiStream({
        system:      SYSTEM_PROMPT(lang, collected, chatSettings, ragContext),
        messages,
        maxTokens:   replyMaxTokens,
        temperature: chatSettings.temperature,
        model:       chatSettings.model,
        onUsage:     (u) => { usageInfo = u; },
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
    } else {
      // Streaming disabled by Cost Profile — same SSE wire format (frontend needs
      // no changes), just delivered as one shot instead of token-by-token.
      const result = await openai.complete({
        system: SYSTEM_PROMPT(lang, collected, chatSettings, ragContext),
        messages, maxTokens: replyMaxTokens, temperature: chatSettings.temperature, model: chatSettings.model,
      });
      fullResponse = result.text;
      usageInfo = result.usage;
      const sepIdx = fullResponse.indexOf(JSON_SEP);
      const visible = sepIdx !== -1 ? fullResponse.slice(0, sepIdx) : fullResponse;
      if (visible) sse(res, { type: 'chunk', content: visible });
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

  if (usageInfo) {
    logAiCost({
      sessionId, userId,
      feature: imageAttachments.length ? 'vision' : 'chat',
      model: chatSettings.model || process.env.OPENAI_MODEL,
      inputTokens: usageInfo.prompt_tokens || 0,
      outputTokens: usageInfo.completion_tokens || 0,
    });
  }

  // Background: analyze + persist
  const analysisTimeout = setTimeout(() => {
    sse(res, { type: 'done', metadata: { sessionId } });
    try { res.end(); } catch {}
  }, 10000);

  setImmediate(async () => {
    const mergedForPhase = { ...collected, ...(collectedTags || {}) };
    let metadata = { sessionId, phase: conversationPhase(mergedForPhase) };

    // Surface extracted data to client immediately
    if (collectedTags)  metadata.collected   = collectedTags;
    if (buttons)        metadata.buttons     = buttons;
    if (intelligence)   metadata.intelligence = intelligence;

    try {
      const allMessages = [
        ...history.slice(-12),
        { role: 'user',      content: displayMessage },
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
        { role: 'user',      content: displayMessage },
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

      // Persist the full blueprint (not just the narrow `lead` subset above) —
      // this is what lets a returning user resume on a different device, and
      // what lets admins actually see the AI's full reasoning, not a fragment.
      // Gated by the Memory cost toggle — disabling it saves nothing on LLM
      // tokens (this is DB writes, not API calls) but some admins may still
      // want to run a stateless, no-persistence mode for privacy/compliance.
      if (chatSettings.memoryEnabled) {
        conv.intelligence = mergeIntelligenceServer(conv.intelligence, intelligence || {});
        if (conv.intelligence.customerSegment) conv.customerSegment = conv.intelligence.customerSegment;
        if (imageAttachments.length || textAttachments.length) {
          conv.attachmentsLog = conv.attachmentsLog || [];
          for (const att of [...imageAttachments, ...textAttachments]) {
            conv.attachmentsLog.push({ kind: att.kind, name: att.name || att.url, url: att.url || '' });
          }
        }
      }

      // Build the WhatsApp brief the moment there's enough substance to share —
      // so the client never has to repeat themselves once they hand off.
      if ((mergedCollected.projectType || intelligence?.projectType) && (intelligence?.businessSummary || intelligence?.recommendedSolution || mergedCollected.timeline)) {
        const brief = buildWhatsappBrief(lang, mergedCollected, intelligence || {}, chatSettings.whatsappTemplate);
        if (brief) metadata.whatsappBrief = brief;
      }

      if (metadata.intelligence) {
        metadata.intelligence.completionPercent = computeCompletionPercent(mergedCollected, intelligence || {});
        conv.intelligence.completionPercent = metadata.intelligence.completionPercent;
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

// ── GET /api/support/config — public, admin-configurable widget config ────────
exports.getConfig = async (req, res) => {
  try {
    const s = await getChatSettings();
    res.json({
      welcomeMessage: { en: s.welcomeMessageEn, ar: s.welcomeMessageAr },
      voiceEnabled:   s.voiceEnabled,
      voice:          s.voice,
      visionEnabled:              s.visionEnabled,
      fileAnalysisEnabled:        s.fileAnalysisEnabled,
      documentGenerationEnabled:  s.documentGenerationEnabled,
      memoryEnabled:              s.memoryEnabled,
    });
  } catch {
    res.json({ welcomeMessage: null, voiceEnabled: true, voice: 'alloy', visionEnabled: true, fileAnalysisEnabled: true, documentGenerationEnabled: true, memoryEnabled: true });
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   Multimodal input — file upload (images/PDF/DOCX) + website analysis + TTS
   ═══════════════════════════════════════════════════════════════════════ */

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});
exports.uploadMiddleware = upload.array('files', 5);

// ── POST /api/support/upload ───────────────────────────────────────────────
exports.uploadFiles = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No valid files received. Allowed: images, PDF, Word (.docx).' });

    const chatSettings = await getChatSettings();

    const results = await Promise.all(files.map(async (file) => {
      try {
        if (file.mimetype.startsWith('image/')) {
          const uploaded = await mediaService.uploadMedia(file.buffer, file.originalname, file.mimetype, {
            allowedMimes: IMAGE_ONLY_MIMES,
            maxSizeBytes: GENERIC_FILE_MAX_BYTES,
          });
          // GridFS URLs are always relative (/api/media/:id) — never externally
          // fetchable by OpenAI's servers, unlike the old Cloudinary URLs. So the
          // base64 data URL is now the only way vision analysis can see the image,
          // for every size this endpoint accepts (not just a sub-cap "fast path").
          const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          return { kind: 'image', url: uploaded.url, dataUrl, name: file.originalname };
        }

        // File Analysis toggle: extracted document text becomes chat input context
        // on the next turn — this is the real cost lever, not the local extraction
        // itself (pdf-parse/mammoth run locally, no LLM call). Disabling it still
        // acknowledges the upload, just without feeding its content to the model.
        if (!chatSettings.fileAnalysisEnabled && (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
          return { kind: 'document', subtype: file.mimetype === 'application/pdf' ? 'pdf' : 'docx', name: file.originalname, textExcerpt: '' };
        }

        if (file.mimetype === 'application/pdf') {
          const parser = new PDFParse({ data: file.buffer });
          try {
            const parsed = await parser.getText();
            return { kind: 'document', subtype: 'pdf', name: file.originalname, textExcerpt: (parsed.text || '').trim().slice(0, 8000) };
          } finally {
            parser.destroy().catch(() => {});
          }
        }

        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const parsed = await mammoth.extractRawText({ buffer: file.buffer });
          return { kind: 'document', subtype: 'docx', name: file.originalname, textExcerpt: (parsed.value || '').trim().slice(0, 8000) };
        }

        return { kind: 'error', name: file.originalname, error: 'Unsupported file type.' };
      } catch (e) {
        return { kind: 'error', name: file.originalname, error: 'Could not process this file.' };
      }
    }));

    res.json({ attachments: results });
  } catch {
    res.status(500).json({ error: 'Upload failed.' });
  }
};

// ── SSRF-safe outbound fetch guard for /analyze-url ────────────────────────
const isPrivateOrLoopbackIp = (ip) => {
  if (ip === '::1' || ip === '127.0.0.1') return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;                 // link-local incl. cloud metadata
  if (/^fc00:|^fd00:|^fe80:/i.test(ip)) return true;        // IPv6 unique-local / link-local
  if (ip === '0.0.0.0') return true;
  return false;
};

// ── POST /api/support/analyze-url ──────────────────────────────────────────
// Request routing: cache website analyses by URL so repeated/shared links
// (a visitor pasting their own site, or the same competitor URL from
// multiple visitors) don't re-trigger a full fetch + LLM call every time.
const urlAnalysisCache = new Map(); // url -> { result, expiresAt }
const URL_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

exports.analyzeUrl = async (req, res) => {
  try {
    const { url, lang = 'en', sessionId } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required.' });

    let parsed;
    try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL.' }); }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only http/https URLs are supported.' });
    }
    if (parsed.hostname === 'localhost') {
      return res.status(400).json({ error: 'That URL cannot be analyzed.' });
    }

    const cacheKey = `${parsed.toString()}::${lang}`;
    const cached = urlAnalysisCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.result);
    }

    try {
      const { address } = await dns.lookup(parsed.hostname);
      if (isPrivateOrLoopbackIp(address)) {
        return res.status(400).json({ error: 'That URL cannot be analyzed.' });
      }
    } catch {
      return res.status(400).json({ error: 'Could not resolve that domain.' });
    }

    let html;
    try {
      const response = await axios.get(parsed.toString(), {
        timeout: 8000,
        maxRedirects: 2,
        maxContentLength: 3 * 1024 * 1024,
        headers: { 'User-Agent': 'YANSY-AI-Consultant/1.0 (+https://yansytech.com)' },
        validateStatus: (s) => s < 400,
      });
      html = response.data;
    } catch (e) {
      return res.status(400).json({ error: 'Could not reach that website.' });
    }

    const $ = cheerio.load(typeof html === 'string' ? html : String(html));
    const images = $('img');
    let imagesWithAlt = 0;
    images.each((_, el) => { if ($(el).attr('alt')?.trim()) imagesWithAlt++; });

    const heuristics = {
      title:            $('title').first().text().trim().slice(0, 200) || null,
      metaDescription:  $('meta[name="description"]').attr('content')?.trim().slice(0, 300) || null,
      hasViewportMeta:  $('meta[name="viewport"]').length > 0,
      hasCanonical:     $('link[rel="canonical"]').length > 0,
      hasOgTags:        $('meta[property^="og:"]').length > 0,
      langAttribute:    $('html').attr('lang') || null,
      h1Count:          $('h1').length,
      imageCount:       images.length,
      imagesWithAlt,
      isHttps:          parsed.protocol === 'https:',
      externalScripts:  $('script[src]').length,
      wordCount:        $('body').text().trim().split(/\s+/).filter(Boolean).length,
    };

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);

    let critique = '';
    if (openai.isConfigured()) {
      try {
        const result = await openai.complete({
          system: 'You are a senior UX/SEO/conversion consultant. Be specific and honest, grounded ONLY in the data given — never invent performance/accessibility scores you cannot measure from static HTML. Write 3-5 sentences, plain prose, no markdown headers.',
          messages: [{
            role: 'user',
            content: `Website: ${parsed.toString()}\nMeasured signals: ${JSON.stringify(heuristics)}\nVisible text sample: ${bodyText}\n\nGive a concise, specific critique covering what's working and 2-3 concrete improvements, in ${lang === 'ar' ? 'Arabic' : 'English'}.`,
          }],
          maxTokens: 350,
          temperature: 0.4,
        });
        critique = result.text.trim();
        logAiCost({
          sessionId, feature: 'url_analysis', model: process.env.OPENAI_MODEL,
          inputTokens: result.usage?.prompt_tokens || 0, outputTokens: result.usage?.completion_tokens || 0,
        });
      } catch (e) { console.error('[support:analyze-url]', e.message); }
    }

    const payload = { url: parsed.toString(), heuristics, critique };
    urlAnalysisCache.set(cacheKey, { result: payload, expiresAt: Date.now() + URL_CACHE_TTL_MS });
    if (urlAnalysisCache.size > 500) urlAnalysisCache.delete(urlAnalysisCache.keys().next().value); // simple size cap

    res.json(payload);
  } catch (err) {
    console.error('[support:analyze-url]', err.message);
    res.status(500).json({ error: 'Analysis failed.' });
  }
};

// ── POST /api/support/generate-document ────────────────────────────────────
// Generates a full project document (BRD/FRD/NFRs, user stories, acceptance
// criteria, scope, milestones, architecture, API/DB suggestions, roadmap) from
// everything the conversation has established so far. This is a deliberate,
// user-triggered action rather than something baked into every chat turn —
// a document this size doesn't belong in a streamed reply, and generating it
// unconditionally every turn would be slow and wasteful.
exports.generateDocument = async (req, res) => {
  try {
    const { collected = {}, intelligence = {}, lang = 'en', sessionId } = req.body;
    if (!openai.isConfigured()) return res.status(503).json({ error: 'AI is not configured.' });

    const chatSettings = await getChatSettings();
    if (!chatSettings.documentGenerationEnabled) {
      return res.status(403).json({ error: 'Document generation is currently disabled.' });
    }
    if (!intelligence.projectType && !collected.projectType) {
      return res.status(400).json({ error: 'Not enough project detail yet to generate a document.' });
    }

    const isAR = lang === 'ar';
    const contextBlock = JSON.stringify({ ...collected, ...intelligence }, null, 2);

    const system = `You are a Principal Solution Architect at YANSY Tech producing a formal project document from a discovery conversation. Write in ${isAR ? 'Arabic' : 'English'}. Use clean Markdown (## headers, - bullets, numbered lists) — no code fences around the whole thing. Be concrete and specific to THIS project, never generic filler. Do not invent facts not implied by the context; where something is genuinely unknown, write "To be confirmed" rather than guessing specifics. Never include a budget, price, or cost figure anywhere in this document — YANSY quotes only after a scoping consultation; if scope/cost comes up, write "Pricing: to be confirmed after consultation."

Produce these sections in order:
## Executive Summary
## Business Requirements
## Functional Requirements
## Non-Functional Requirements
## User Stories
(format: "As a [role], I want [capability], so that [benefit]" — 5-8 stories covering the core flows)
## Acceptance Criteria
(bullet list, tied to the user stories above)
## Project Scope
(explicit "In Scope" and "Out of Scope" subsections)
## Milestones
(numbered, each with a one-line deliverable)
## Architecture Overview
(plain-language description of the system's major components and how they interact)
## Suggested API Endpoints
(a short representative list, method + path + purpose)
## Database Suggestions
(key entities/tables and their core fields — not a full schema)
## Recommended Tech Stack
## Roadmap
(phased: Phase 1 / Phase 2 / Phase 3, each with a goal and rough duration)`;

    const result = await openai.complete({
      system,
      messages: [{ role: 'user', content: `Project context so far:\n${contextBlock}` }],
      maxTokens: 6000,
      temperature: 0.5,
      reasoningEffort: 'none', // verified live: without this, the model spends the whole budget "thinking" and returns empty text for a document this long
    });

    logAiCost({
      sessionId, userId: req.user?._id, feature: 'document_generation',
      model: process.env.OPENAI_MODEL,
      inputTokens: result.usage?.prompt_tokens || 0,
      outputTokens: result.usage?.completion_tokens || 0,
    });

    res.json({ document: result.text, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[support:generate-document]', err.message);
    res.status(500).json({ error: 'Document generation failed.' });
  }
};

// ── POST /api/support/tts ──────────────────────────────────────────────────
exports.tts = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required.' });
    if (!openai.isConfigured()) return res.status(503).json({ error: 'Voice is not configured.' });

    const chatSettings = await getChatSettings();
    if (!chatSettings.voiceEnabled) return res.status(403).json({ error: 'Voice is disabled.' });

    const spoken = text.trim().slice(0, 800); // spoken replies should be brief, like a real consultant talking
    const audio = await openai.tts({ text: spoken, voice: chatSettings.voice });

    // TTS is billed per-character, not per-token — logged into the same "input"
    // rate slot; set the pricing table's tts-1 rate as $ per 1M characters.
    logAiCost({
      sessionId: req.body.sessionId, feature: 'tts', model: 'tts-1', inputTokens: spoken.length, outputTokens: 0,
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(audio);
  } catch (err) {
    console.error('[support:tts]', err.message);
    res.status(500).json({ error: 'Voice generation failed.' });
  }
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
      sessionId:      conv.sessionId,
      messages:       conv.messages,
      lead:           conv.lead,
      ticket:         conv.ticket,
      sentiment:      conv.sentiment,
      leadScore:      conv.leadScore,
      requestId:      conv.requestId,
      intelligence:   conv.intelligence || {},
      attachmentsLog: conv.attachmentsLog || [],
    });
  } catch {
    res.status(500).json({ error: 'Failed to load conversation.' });
  }
};

// ── GET /api/support/my-conversation — resume a returning logged-in user's most
//    recent AI conversation on a new device/browser (localStorage alone can't
//    survive that). Requires auth; guests have no server-side identity to resume by. ──
exports.getMyConversation = async (req, res) => {
  try {
    const chatSettings = await getChatSettings();
    if (!chatSettings.memoryEnabled) return res.json({ found: false });

    const conv = await SupportConversation
      .findOne({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    if (!conv) return res.json({ found: false });

    res.json({
      found:          true,
      sessionId:      conv.sessionId,
      messages:       conv.messages,
      lead:           conv.lead,
      leadScore:      conv.leadScore,
      intelligence:   conv.intelligence || {},
      attachmentsLog: conv.attachmentsLog || [],
    });
  } catch {
    res.status(500).json({ error: 'Failed to load your previous conversation.' });
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

// ── Admin: GET /api/support/admin/cost-analytics ──────────────────────────────
exports.adminGetCostAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay   = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const last14Days    = new Date(now); last14Days.setDate(last14Days.getDate() - 13); last14Days.setHours(0, 0, 0, 0);

    const [totals, byFeature, byModel, todayAgg, monthAgg, dailyTrend, qualifiedLeadsMonth, chatSettings] = await Promise.all([
      AiCostLog.aggregate([{ $group: { _id: null, costUSD: { $sum: '$costUSD' }, inputTokens: { $sum: '$inputTokens' }, outputTokens: { $sum: '$outputTokens' }, calls: { $sum: 1 } } }]),
      AiCostLog.aggregate([{ $group: { _id: '$feature', costUSD: { $sum: '$costUSD' }, tokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } }, calls: { $sum: 1 } } }, { $sort: { costUSD: -1 } }]),
      AiCostLog.aggregate([{ $group: { _id: '$model', costUSD: { $sum: '$costUSD' }, tokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } }, calls: { $sum: 1 } } }, { $sort: { costUSD: -1 } }]),
      AiCostLog.aggregate([{ $match: { createdAt: { $gte: startOfDay } } }, { $group: { _id: null, costUSD: { $sum: '$costUSD' }, calls: { $sum: 1 } } }]),
      AiCostLog.aggregate([{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, costUSD: { $sum: '$costUSD' }, calls: { $sum: 1 } } }]),
      AiCostLog.aggregate([
        { $match: { createdAt: { $gte: last14Days } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, costUSD: { $sum: '$costUSD' }, calls: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      SupportConversation.countDocuments({ 'lead.detected': true, 'lead.savedAt': { $gte: startOfMonth } }),
      getChatSettings(),
    ]);

    const monthCostUSD = monthAgg[0]?.costUSD || 0;
    const pricingConfigured = chatSettings && Object.keys(await SystemSettings.get('aiChat.pricingTable', {}) || {}).length > 0;

    res.json({
      totalCostUSD:    totals[0]?.costUSD || 0,
      totalInputTokens: totals[0]?.inputTokens || 0,
      totalOutputTokens: totals[0]?.outputTokens || 0,
      totalCalls:      totals[0]?.calls || 0,
      today:   { costUSD: todayAgg[0]?.costUSD || 0, calls: todayAgg[0]?.calls || 0 },
      thisMonth: { costUSD: monthCostUSD, calls: monthAgg[0]?.calls || 0 },
      byFeature: byFeature.map(f => ({ feature: f._id, costUSD: f.costUSD, tokens: f.tokens, calls: f.calls })),
      byModel:   byModel.map(m => ({ model: m._id || 'unknown', costUSD: m.costUSD, tokens: m.tokens, calls: m.calls })),
      dailyTrend: dailyTrend.map(d => ({ date: d._id, costUSD: d.costUSD, calls: d.calls })),
      qualifiedLeadsThisMonth: qualifiedLeadsMonth,
      costPerQualifiedLeadUSD: qualifiedLeadsMonth > 0 ? +(monthCostUSD / qualifiedLeadsMonth).toFixed(4) : null,
      pricingConfigured, // false = rates are unset; costUSD figures above are all $0 until an admin fills in aiChat.pricingTable
    });
  } catch (err) {
    console.error('[support:cost-analytics]', err.message);
    res.status(500).json({ error: 'Failed to load cost analytics.' });
  }
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
