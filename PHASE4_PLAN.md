# YANSY — Phase 4: AI Layer
> Audit + Implementation Plan
> Date: 2026-05-29

---

## FAKE AI AUDIT — FINDINGS

### FINDING 1: `AIInsightCard` in Dashboard.jsx [CRITICAL — FAKE]
**Location**: `client/src/pages/Dashboard.jsx:230–266`
**Labeled**: "AI Insight" with Sparkles icon
**Reality**: Pure if/else logic counting project numbers
```javascript
// THIS IS NOT AI — it's a template string switcher:
if (inProgress > 0) insight = `You have ${inProgress} project...`;
else if (pending > 0) insight = `${pending} project...`;
else insight = "Your workspace is up to date.";
```
**Action**: Replace with real Claude API call.

---

### FINDING 2: `AIChatWidget.jsx` [CRITICAL — FAKE]
**Location**: `client/src/components/AIChatWidget.jsx`
**Labeled**: "YANSY AI" with robot emoji, shows "● Online now"
**Reality**: Scripted 4-step lead qualification form with hardcoded responses
```javascript
// THIS IS NOT AI — it's a fixed state machine:
const getAIMessage = (step, data, lang) => {
  switch (step) {
    case 'greeting': return "Hi there! I'm YANSY's AI assistant...";
    case 'service':  return `Great choice! ✨ ${data.service}...`;
    // Hardcoded for every step
  }
};
```
**Action**: Integrate Claude API for dynamic, contextual conversation. Keep the lead-gen flow structure but power it with real Claude responses.

---

### FINDING 3: Sparkles Icons (Decorative — Not AI)
**Locations**: AddProject.jsx:4,258,331,565; StartProject.jsx:4,239,442,661; ProjectRequestForm.jsx:3,529,596,1028
**Reality**: Purely decorative. Not fake AI — just icons used as visual accents.
**Action**: Leave as-is. Decorative use of Sparkles icon is fine.

---

### FINDING 4: No AI Backend Exists
**Reality**: Zero AI routes, models, or LLM API calls in the entire server codebase.
**All of the following are MISSING entirely**:
- Claude/OpenAI API integration
- AI usage tracking
- AI rate limiting
- AI admin controls
- Cost tracking

---

## ARCHITECTURE DESIGN

### Tech Stack Choice: Claude API via @anthropic-ai/sdk
- Model: `claude-sonnet-4-6` (latest Sonnet, best cost/quality balance)
- Prompt caching on system prompts (saves 90% cost on repeated calls)
- Streaming for long-form generation (proposals, summaries)
- Context: YANSY is a digital agency platform for the MENA market

### Data Models

#### AIUsage Model
```javascript
{
  user:         ObjectId → User,
  feature:      'insight' | 'brief' | 'estimator' | 'proposal' | 'summary' | 'message_summary' | 'admin_insights' | 'onboarding' | 'chat',
  model:        string,  // 'claude-sonnet-4-6'
  inputTokens:  number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheWriteTokens: number,
  estimatedCostUSD: number,
  durationMs:   number,
  success:      boolean,
  errorCode:    string,
  metadata:     Mixed,   // feature-specific context
  createdAt:    Date,
}
```

### Rate Limits by Plan
| Plan | Daily AI Requests | Notes |
|---|---|---|
| FREE | 0 | Feature gated entirely |
| PROFESSIONAL | 20/day | Insight, brief, estimator, summary |
| ENTERPRISE | 100/day | All features |
| ADMIN | Unlimited | All features |

### Cost Model (claude-sonnet-4-6)
- Input: $3.00 / 1M tokens
- Output: $15.00 / 1M tokens
- Cache reads: $0.30 / 1M tokens (90% savings)
- Cache writes: $3.75 / 1M tokens

### API Endpoints (10 new endpoints)

```
POST /api/ai/insight          — Auth + PRO: Real-time dashboard AI insight
POST /api/ai/brief            — Auth + PRO: Generate project brief from rough description
POST /api/ai/estimate         — Auth + PRO: Estimate timeline + budget from brief
POST /api/ai/proposal         — Auth + PRO: Generate full proposal document
POST /api/ai/project-summary  — Auth + PRO: Summarize a project's updates
POST /api/ai/message-summary  — Auth + PRO: Summarize a message thread
POST /api/ai/onboarding       — Auth + PRO: AI onboarding conversation step
POST /api/ai/chat             — Auth + PRO: Public chat widget (Claude-powered)
GET  /api/ai/admin/insights   — Admin: Platform-wide AI insights
GET  /api/ai/admin/usage      — Admin: All usage records (paginated)
GET  /api/ai/usage/me         — Auth: User's own usage stats
```

### Feature Map
| Feature | Plan | Description |
|---|---|---|
| Dashboard AI Insight | PROFESSIONAL | Analyze user's projects and give actionable advice |
| Project Brief Generator | PROFESSIONAL | Turn rough idea into structured brief |
| Project Estimator | PROFESSIONAL | Estimate timeline and cost from description |
| Proposal Generator | PROFESSIONAL | Full client-ready proposal document |
| Project Summary | PROFESSIONAL | Summarize all updates chronologically |
| Message Summary | PROFESSIONAL | TL;DR of a message thread |
| Onboarding Assistant | PROFESSIONAL | Guide new users through project setup |
| AI Chat Widget | PROFESSIONAL | Real Claude conversation on public site |
| Admin Insights | ADMIN | Platform health, trends, recommendations |

---

## IMPLEMENTATION ORDER

1. Install @anthropic-ai/sdk
2. AIUsage model
3. claudeService.js (API wrapper with caching, streaming, cost tracking)
4. aiRateLimit middleware
5. aiController.js (all 10 endpoints)
6. ai.js routes
7. Register routes in server.js
8. Update Dashboard: replace fake AIInsightCard with real one
9. Update AIChatWidget: integrate Claude API
10. Create AIInsightCard.jsx component (real, API-backed)
11. Create ProjectBriefGenerator.jsx
12. Create AIAssistantPanel.jsx (in-app AI chat)
13. Add AI controls to admin panel
14. Write tests
15. Build verification
16. Generate AI_USAGE_REPORT.md
17. Generate PHASE4_REPORT.md

---

## GRACEFUL DEGRADATION

If `ANTHROPIC_API_KEY` is not set:
- All AI endpoints return HTTP 503 with clear message
- Frontend shows "AI features unavailable" with upgrade/config prompt
- No silent failures, no fake responses

---

## ENVIRONMENT VARIABLES

```
ANTHROPIC_API_KEY=sk-ant-...
AI_MAX_TOKENS=2048         # Max output tokens per request
AI_RATE_LIMIT_DAILY=20     # Default daily limit for PRO (admin configurable)
```

---

*PHASE4_PLAN.md — Approved. Beginning implementation.*
