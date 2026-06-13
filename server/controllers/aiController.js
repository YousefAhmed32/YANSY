'use strict';
const claude   = require('../utils/claudeService');
const AIUsage  = require('../models/AIUsage');
const Project  = require('../models/Project');
const { Message, MessageThread } = require('../models/Message');
const mongoose = require('mongoose');

// ── System prompt (cached via prompt caching) ─────────────────────────────────
const YANSY_SYSTEM = `You are YANSY's AI assistant — an expert digital product consultant embedded inside the YANSY client portal platform. YANSY is a premium digital agency specializing in:
- Web development (React, Next.js, Node.js, full-stack)
- E-commerce platforms (Shopify, custom)
- SaaS platforms and B2B tools
- Mobile applications
- Restaurant, clinic, pharmacy, real estate, and education systems
- Custom enterprise software

Your personality: Professional, warm, direct. Bilingual (English & Arabic). MENA market expertise.

IMPORTANT RULES:
- Never fabricate specific prices or hard deadlines without context
- Always base estimates on the project details provided
- Respond in the same language as the user's input
- Be honest about uncertainty — say "approximately" or "typically" when estimating
- Focus on actionable, practical advice
- Keep responses concise unless a detailed document is explicitly requested`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const handleAIError = (err, res, feature, userId) => {
  console.error(`[ai:${feature}] Error:`, err.message);

  claude.logUsage({
    userId, feature,
    result:    { costUSD: 0, durationMs: 0 },
    success:   false,
    errorCode: err.status ? String(err.status) : 'unknown',
  });

  if (!claude.isConfigured()) {
    return res.status(503).json({
      error: 'AI features are not configured on this server. Add ANTHROPIC_API_KEY to .env',
      code:  'AI_NOT_CONFIGURED',
    });
  }

  if (err.status === 429) {
    return res.status(429).json({ error: 'AI rate limit exceeded upstream. Please try again in a moment.' });
  }

  return res.status(500).json({ error: 'AI request failed. Please try again.' });
};

// ── POST /api/ai/insight ──────────────────────────────────────────────────────
exports.getDashboardInsight = async (req, res, next) => {
  const userId = req.user._id;
  if (!claude.isConfigured()) {
    return res.status(503).json({ error: 'AI_NOT_CONFIGURED', code: 'AI_NOT_CONFIGURED' });
  }

  try {
    // Gather user's actual project data for context
    const projects = await Project.find({ client: userId })
      .select('title status phase progress updatedAt targetDate')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const projectSummary = projects.length === 0
      ? 'No projects yet.'
      : projects.map(p =>
          `- "${p.title}": ${p.status}, ${p.progress}% complete, phase: ${p.phase}${p.targetDate ? `, due ${new Date(p.targetDate).toLocaleDateString()}` : ''}`
        ).join('\n');

    const userContext = `Client: ${req.user.fullName} | Company: ${req.user.companyName || req.user.brandName || 'Not specified'}`;

    const result = await claude.complete({
      system: YANSY_SYSTEM,
      messages: [{
        role: 'user',
        content: `Analyze this client's current project status and give ONE specific, actionable insight or recommendation (2–3 sentences max). Be specific to their situation.

${userContext}

Projects:
${projectSummary}

Respond naturally, as if speaking directly to the client. Don't use bullet points — write a flowing insight.`,
      }],
      maxTokens: 150,
    });

    claude.logUsage({ userId, feature: 'insight', result, metadata: { projectCount: projects.length } });

    res.json({
      insight:  result.text.trim(),
      tokens:   result.usage,
      costUSD:  result.costUSD,
    });
  } catch (err) {
    handleAIError(err, res, 'insight', userId);
  }
};

// ── POST /api/ai/brief ────────────────────────────────────────────────────────
exports.generateBrief = async (req, res, next) => {
  const userId = req.user._id;
  if (!claude.isConfigured()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED', code: 'AI_NOT_CONFIGURED' });

  try {
    const { description, projectType, budget, timeline } = req.body;
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters.' });
    }

    const result = await claude.complete({
      system: YANSY_SYSTEM,
      messages: [{
        role: 'user',
        content: `Transform this rough project idea into a structured professional project brief.

CLIENT INPUT:
- Description: "${description}"
- Project type: ${projectType || 'Not specified'}
- Budget range: ${budget || 'Not specified'}
- Timeline: ${timeline || 'Not specified'}
- Client: ${req.user.fullName} at ${req.user.companyName || req.user.brandName || 'their company'}

Generate a structured project brief with these sections:
1. **Project Overview** (2-3 sentences)
2. **Core Objectives** (3-5 bullet points)
3. **Key Features** (5-8 features)
4. **Target Audience** (who will use this)
5. **Technical Considerations** (platform, integrations, tech requirements)
6. **Success Metrics** (how to measure success)

Keep it professional and specific. Detect the language from the description and respond in the same language.`,
      }],
      maxTokens: 800,
    });

    claude.logUsage({ userId, feature: 'brief', result, metadata: { projectType } });

    res.json({
      brief:   result.text.trim(),
      tokens:  result.usage,
      costUSD: result.costUSD,
    });
  } catch (err) {
    handleAIError(err, res, 'brief', userId);
  }
};

// ── POST /api/ai/estimate ─────────────────────────────────────────────────────
exports.estimateProject = async (req, res, next) => {
  const userId = req.user._id;
  if (!claude.isConfigured()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED', code: 'AI_NOT_CONFIGURED' });

  try {
    const { description, projectType, features } = req.body;
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description is required.' });
    }

    const result = await claude.complete({
      system: YANSY_SYSTEM,
      messages: [{
        role: 'user',
        content: `Provide a realistic project estimate based on this brief.

PROJECT DETAILS:
- Type: ${projectType || 'Web Application'}
- Description: "${description}"
- Key features: ${features || 'Not specified'}

Provide estimates in this JSON format (respond ONLY with valid JSON, no markdown):
{
  "timeline": {
    "min_weeks": <number>,
    "max_weeks": <number>,
    "phases": [
      { "name": "Discovery & Design", "weeks": <number> },
      { "name": "Development", "weeks": <number> },
      { "name": "Testing & Launch", "weeks": <number> }
    ]
  },
  "budget": {
    "min_usd": <number>,
    "max_usd": <number>,
    "breakdown": [
      { "item": "UI/UX Design", "min": <number>, "max": <number> },
      { "item": "Frontend Development", "min": <number>, "max": <number> },
      { "item": "Backend Development", "min": <number>, "max": <number> },
      { "item": "Testing & QA", "min": <number>, "max": <number> }
    ]
  },
  "complexity": "low" | "medium" | "high",
  "team_size": <number>,
  "assumptions": ["<assumption1>", "<assumption2>"],
  "risks": ["<risk1>", "<risk2>"]
}`,
      }],
      maxTokens: 600,
    });

    let estimate;
    try {
      // Extract JSON from response (Claude sometimes wraps in backticks)
      const raw  = result.text.replace(/```json\n?|\n?```/g, '').trim();
      estimate   = JSON.parse(raw);
    } catch {
      // If JSON parse fails, return raw text
      estimate = { raw: result.text.trim() };
    }

    claude.logUsage({ userId, feature: 'estimator', result, metadata: { projectType } });

    res.json({ estimate, tokens: result.usage, costUSD: result.costUSD });
  } catch (err) {
    handleAIError(err, res, 'estimator', userId);
  }
};

// ── POST /api/ai/proposal ─────────────────────────────────────────────────────
exports.generateProposal = async (req, res, next) => {
  const userId = req.user._id;
  if (!claude.isConfigured()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED', code: 'AI_NOT_CONFIGURED' });

  try {
    const { brief, projectType, budget, timeline, clientName, companyName } = req.body;
    if (!brief || brief.trim().length < 20) {
      return res.status(400).json({ error: 'Project brief is required (min 20 characters).' });
    }

    // Use streaming for proposals (they're long)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullText = '';
    let finalResult = null;

    try {
      finalResult = await claude.stream({
        system: YANSY_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate a professional client proposal for the following project.

CLIENT: ${clientName || req.user.fullName} at ${companyName || req.user.companyName || 'their company'}
PROJECT BRIEF: "${brief}"
TYPE: ${projectType || 'Custom Web Application'}
BUDGET RANGE: ${budget || 'To be discussed'}
TIMELINE: ${timeline || 'To be discussed'}
AGENCY: YANSY Tech

Write a complete, professional proposal with these sections:
# Project Proposal — [Project Name]

## Executive Summary
(Brief overview, 2-3 sentences)

## Understanding Your Requirements
(Show you understand their problem/goal)

## Proposed Solution
(What you'll build and why)

## Scope of Work
(Detailed breakdown of deliverables)

## Technical Approach
(Technologies, architecture, approach)

## Project Timeline
(Phased breakdown with weeks)

## Investment
(Budget range and what it includes)

## Why YANSY
(3-4 reasons we're the right team)

## Next Steps
(Clear call to action)

---
*Proposed by YANSY Tech | yansytech.com*

Detect language from the brief and respond in that language. Make it compelling and professional.`,
        }],
        maxTokens: 2000,
        onChunk: (chunk) => {
          fullText += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        },
      });
    } finally {
      res.write(`data: ${JSON.stringify({ done: true, tokens: finalResult?.usage, costUSD: finalResult?.costUSD })}\n\n`);
      res.end();
    }

    claude.logUsage({ userId, feature: 'proposal', result: finalResult, metadata: { projectType } });
  } catch (err) {
    if (!res.headersSent) handleAIError(err, res, 'proposal', userId);
    else res.end();
  }
};

// ── POST /api/ai/project-summary ──────────────────────────────────────────────
exports.summarizeProject = async (req, res, next) => {
  const userId = req.user._id;
  if (!claude.isConfigured()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED', code: 'AI_NOT_CONFIGURED' });

  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId is required.' });

    const project = await Project.findById(projectId)
      .populate('updates.postedBy', 'fullName')
      .lean();

    if (!project) return res.status(404).json({ error: 'Project not found.' });

    // Access check
    if (req.user.role !== 'ADMIN' && project.client.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updatesText = project.updates?.length
      ? project.updates.map(u =>
          `[${new Date(u.createdAt).toLocaleDateString()}] ${u.title}: ${u.content}`
        ).join('\n')
      : 'No updates posted yet.';

    const result = await claude.complete({
      system: YANSY_SYSTEM,
      messages: [{
        role: 'user',
        content: `Summarize this project's current status and all updates in a clear, client-friendly format.

PROJECT: "${project.title}"
STATUS: ${project.status} | PHASE: ${project.phase} | PROGRESS: ${project.progress}%
TARGET DATE: ${project.targetDate ? new Date(project.targetDate).toLocaleDateString() : 'Not set'}

UPDATES (chronological):
${updatesText}

Write a 3-5 sentence executive summary that:
1. States current status clearly
2. Highlights key progress made
3. Notes what's coming next
4. Mentions any important dates

Keep it professional and reassuring.`,
      }],
      maxTokens: 300,
    });

    claude.logUsage({ userId, feature: 'project_summary', result, metadata: { projectId } });

    res.json({ summary: result.text.trim(), tokens: result.usage, costUSD: result.costUSD });
  } catch (err) {
    handleAIError(err, res, 'project_summary', userId);
  }
};

// ── POST /api/ai/message-summary ──────────────────────────────────────────────
exports.summarizeMessages = async (req, res, next) => {
  const userId = req.user._id;
  if (!claude.isConfigured()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED', code: 'AI_NOT_CONFIGURED' });

  try {
    const { threadId } = req.body;
    if (!threadId) return res.status(400).json({ error: 'threadId is required.' });

    const thread = await MessageThread.findById(threadId).lean();
    if (!thread) return res.status(404).json({ error: 'Thread not found.' });

    // Access check
    const isParticipant = thread.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const messages = await Message.find({ threadId })
      .populate('sender', 'fullName role')
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    if (messages.length === 0) {
      return res.json({ summary: 'No messages in this conversation yet.' });
    }

    const conversationText = messages
      .map(m => `[${m.sender?.role === 'ADMIN' ? 'YANSY Team' : m.sender?.fullName || 'Client'}]: ${m.content}`)
      .join('\n');

    const result = await claude.complete({
      system: YANSY_SYSTEM,
      messages: [{
        role: 'user',
        content: `Summarize this conversation thread in 2-3 sentences. Focus on:
1. The main topic discussed
2. Any decisions made or action items agreed upon
3. Outstanding questions or next steps

CONVERSATION:
${conversationText}

Write a concise TL;DR. Detect language and respond in the same language.`,
      }],
      maxTokens: 200,
    });

    claude.logUsage({ userId, feature: 'message_summary', result, metadata: { threadId, messageCount: messages.length } });

    res.json({ summary: result.text.trim(), messageCount: messages.length, tokens: result.usage, costUSD: result.costUSD });
  } catch (err) {
    handleAIError(err, res, 'message_summary', userId);
  }
};

// ── POST /api/ai/onboarding ───────────────────────────────────────────────────
exports.onboardingAssistant = async (req, res, next) => {
  const userId = req.user._id;
  if (!claude.isConfigured()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED', code: 'AI_NOT_CONFIGURED' });

  try {
    const { message, history = [], step = 0 } = req.body;

    const systemPrompt = `${YANSY_SYSTEM}

You are helping a new client complete their onboarding by guiding them through 4 steps to create their first project request:
1. What they want to build (project type and description)
2. Timeline expectations
3. Budget range
4. Key requirements and goals

Keep responses short (2-3 sentences). Ask ONE focused question at a time. Be encouraging and professional.
When you have enough information for all 4 steps, respond with a JSON object like:
{"complete": true, "data": {"description": "...", "type": "...", "budget": "...", "timeline": "..."}}`;

    const messages = [
      ...(history || []),
      { role: 'user', content: message || 'Hello, I want to start a project.' },
    ];

    const result = await claude.complete({
      system: systemPrompt,
      messages,
      maxTokens: 250,
    });

    // Check if Claude signaled completion
    let isComplete = false;
    let completionData = null;
    try {
      const parsed = JSON.parse(result.text.trim());
      if (parsed.complete) { isComplete = true; completionData = parsed.data; }
    } catch { /* not JSON — normal conversation */ }

    claude.logUsage({ userId, feature: 'onboarding', result, metadata: { step } });

    res.json({
      reply:          isComplete ? null : result.text.trim(),
      isComplete,
      completionData,
      tokens:         result.usage,
      costUSD:        result.costUSD,
    });
  } catch (err) {
    handleAIError(err, res, 'onboarding', userId);
  }
};

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
// Public-facing chat widget (replaces hardcoded responses in AIChatWidget)
exports.chat = async (req, res, next) => {
  // Chat is NOT plan-gated on the public site — it's for lead generation
  // But we still rate-limit by IP to prevent abuse
  if (!claude.isConfigured()) {
    return res.json({
      reply: "Hi! I'm YANSY's assistant. I'm here to help you find the right digital solution. What are you looking to build?",
      fallback: true,
    });
  }

  try {
    const { message, history = [], lang = 'en' } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });

    const isAR = lang === 'ar';

    const chatSystem = `${YANSY_SYSTEM}

You are the YANSY website chat assistant helping visitors discover our services and decide to work with us.
Your goal: Qualify the lead by understanding what they want to build, then guide them to start a project or contact us.

KEEP RESPONSES:
- Short (2-4 sentences max)
- Warm and professional
- In ${isAR ? 'Arabic' : 'English'}
- Focused on moving them toward starting a project

After 3-4 exchanges, suggest either:
1. Starting a project (link to /start-project)
2. Contacting via WhatsApp (+201090385390)

Available services: Websites, E-commerce, SaaS platforms, Mobile apps, Booking systems, Custom systems.`;

    const messages = [
      ...(history || []),
      { role: 'user', content: message.trim() },
    ];

    const result = await claude.complete({
      system: chatSystem,
      messages,
      maxTokens: 200,
    });

    // Log with anonymous user context
    if (req.user) {
      claude.logUsage({ userId: req.user._id, feature: 'chat', result });
    }

    res.json({
      reply:   result.text.trim(),
      tokens:  result.usage,
      costUSD: result.costUSD,
    });
  } catch (err) {
    // Fallback for chat — never fail hard on the public site
    res.json({
      reply: lang === 'ar'
        ? 'شكراً لتواصلك! فريقنا سيسعد بمساعدتك. كيف يمكنني مساعدتك؟'
        : "Thanks for reaching out! Our team would love to help. What are you looking to build?",
      fallback: true,
    });
  }
};

// ── GET /api/ai/admin/insights ────────────────────────────────────────────────
exports.getAdminInsights = async (req, res, next) => {
  if (!claude.isConfigured()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED', code: 'AI_NOT_CONFIGURED' });

  try {
    // Gather platform stats for context
    const User         = require('../models/User');
    const Subscription = require('../models/Subscription');

    const [
      totalUsers, activeProjects, pendingProjects,
      totalSubs, activeSubCount, totalCostToday,
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments({ status: 'in-progress' }),
      Project.countDocuments({ status: 'pending' }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: { $in: ['active', 'trialing'] } }),
      AIUsage.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
        { $group: { _id: null, totalCost: { $sum: '$estimatedCostUSD' }, totalReqs: { $sum: 1 } } },
      ]),
    ]);

    const todayStats = totalCostToday[0] || { totalCost: 0, totalReqs: 0 };

    const result = await claude.complete({
      system: YANSY_SYSTEM,
      messages: [{
        role: 'user',
        content: `You are analyzing the YANSY platform health for the admin team. Provide 3 specific, actionable insights.

PLATFORM STATS:
- Total users: ${totalUsers}
- Active subscriptions: ${activeSubCount} / ${totalSubs} total
- Projects in progress: ${activeProjects}
- Projects pending review: ${pendingProjects}
- AI requests today: ${todayStats.totalReqs} ($${todayStats.totalCost.toFixed(4)} spent)

Generate exactly 3 insights in this JSON format:
[
  { "title": "...", "insight": "...", "action": "...", "priority": "high|medium|low" },
  { "title": "...", "insight": "...", "action": "...", "priority": "high|medium|low" },
  { "title": "...", "insight": "...", "action": "...", "priority": "high|medium|low" }
]

Respond ONLY with valid JSON array.`,
      }],
      maxTokens: 500,
    });

    let insights;
    try {
      const raw = result.text.replace(/```json\n?|\n?```/g, '').trim();
      insights  = JSON.parse(raw);
    } catch {
      insights = [{ title: 'Analysis Complete', insight: result.text.trim(), action: 'Review manually', priority: 'medium' }];
    }

    claude.logUsage({ userId: req.user._id, feature: 'admin_insights', result });

    res.json({ insights, platformStats: { totalUsers, activeProjects, pendingProjects, activeSubCount, todayStats }, tokens: result.usage, costUSD: result.costUSD });
  } catch (err) {
    handleAIError(err, res, 'admin_insights', req.user._id);
  }
};

// ── GET /api/ai/admin/usage ───────────────────────────────────────────────────
exports.getAdminUsage = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const { feature, userId, startDate, endDate } = req.query;

    const query = {};
    if (feature)   query.feature = feature;
    if (userId)    query.user    = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)   query.createdAt.$lte = new Date(endDate);
    }

    const [records, total, aggregates] = await Promise.all([
      AIUsage.find(query)
        .populate('user', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      AIUsage.countDocuments(query),
      AIUsage.aggregate([
        { $match: query },
        { $group: {
          _id:              null,
          totalRequests:    { $sum: 1 },
          successCount:     { $sum: { $cond: ['$success', 1, 0] } },
          totalInputTokens: { $sum: '$inputTokens'  },
          totalOutputTokens:{ $sum: '$outputTokens' },
          totalCostUSD:     { $sum: '$estimatedCostUSD' },
        }},
      ]),
    ]);

    res.json({
      records,
      total,
      totalPages:  Math.ceil(total / limit),
      currentPage: page,
      aggregates:  aggregates[0] || { totalRequests: 0, totalCostUSD: 0 },
    });
  } catch (err) { next(err); }
};

// ── GET /api/ai/usage/me ──────────────────────────────────────────────────────
exports.getMyUsage = async (req, res, next) => {
  try {
    const usedToday = await AIUsage.dailyCount(req.user._id);
    const stats     = await AIUsage.userStats(req.user._id);

    const Subscription = require('../models/Subscription');
    const sub = await Subscription.findOne({ user: req.user._id }).populate('plan', 'name').lean();
    const planName = sub?.plan?.name || 'FREE';

    const DAILY_LIMITS = { FREE: 0, PROFESSIONAL: 20, ENTERPRISE: 100 };
    const limit = req.user.role === 'ADMIN' ? Infinity : (DAILY_LIMITS[planName] || 0);

    res.json({
      usedToday,
      limit: limit === Infinity ? null : limit,
      planName,
      stats: stats[0] || { totalRequests: 0, totalCostUSD: 0 },
    });
  } catch (err) { next(err); }
};
