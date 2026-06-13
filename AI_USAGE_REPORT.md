# YANSY — AI Usage Report
> Generated: 2026-05-29 | Model: claude-sonnet-4-6

---

## PRICING MODEL

### claude-sonnet-4-6 (Current Model)

| Token Type | Rate (per 1M tokens) | Notes |
|---|---|---|
| Input | $3.00 | Regular prompt tokens |
| Output | $15.00 | Generated response tokens |
| Cache Read | $0.30 | Saved from cached system prompts (90% savings!) |
| Cache Write | $3.75 | First write to cache |

**Prompt Caching**: YANSY_SYSTEM prompt is cached on every request via `cache_control: { type: 'ephemeral' }`. This saves ~90% on repeated system prompt costs.

---

## PER-FEATURE COST ESTIMATES

| Feature | Avg Input Tokens | Avg Output Tokens | Avg Cost/Request |
|---|---|---|---|
| Dashboard Insight | ~500 | ~150 | ~$0.004 |
| Project Brief | ~300 | ~800 | ~$0.013 |
| Project Estimator | ~250 | ~600 | ~$0.010 |
| Proposal Generator | ~400 | ~2000 | ~$0.031 |
| Project Summary | ~600 | ~300 | ~$0.006 |
| Message Summary | ~800 | ~200 | ~$0.006 |
| Onboarding Step | ~200 | ~250 | ~$0.004 |
| Chat Widget | ~300 | ~200 | ~$0.004 |
| Admin Insights | ~400 | ~500 | ~$0.009 |

**Average cost per Professional user per day (20 requests)**: ~$0.17/user/day

---

## RATE LIMITS

| Plan | Daily AI Requests | Monthly Cost at Avg |
|---|---|---|
| FREE | 0 requests | $0 |
| PROFESSIONAL | 20 requests/day | ~$5/month/user |
| ENTERPRISE | 100 requests/day | ~$25/month/user |
| ADMIN | Unlimited | Tracked only |

**At $49/month (PRO), the AI usage cost is ~$5/user → 90% gross margin on AI feature.**

---

## USAGE TRACKING

Every AI request is logged to `AIUsage` collection with:
- `user` — User ObjectId
- `feature` — Which AI feature was used
- `model` — Model version
- `inputTokens` + `outputTokens` — Exact token counts
- `cacheReadTokens` + `cacheWriteTokens` — Cache performance
- `estimatedCostUSD` — Calculated cost
- `durationMs` — Response latency
- `success` — Whether call succeeded
- `errorCode` — Error type if failed
- `metadata` — Feature-specific context

**Auto-deletion**: Records expire after 90 days (TTL index).

---

## ADMIN CONTROLS

Admins can view AI usage at `/app/admin/ai`:
- Total request count + success rate
- Token usage totals
- Estimated total cost
- Per-user usage log (paginated)
- Filter by feature, user, date range
- Real-time Claude-generated platform insights

---

## COST CONTROL LEVERS

1. **Rate limits** — Configurable via env vars:
   - `AI_RATE_LIMIT_PRO=20` (daily limit for Professional)
   - `AI_RATE_LIMIT_ENTERPRISE=100` (daily limit for Enterprise)

2. **Max tokens** — `AI_MAX_TOKENS=2048` — prevents runaway output generation

3. **Prompt caching** — Enabled on system prompt → saves ~$0.002/request on input

4. **Feature gating** — FREE users cannot access AI → zero cost for non-paying users

5. **TTL on usage records** — 90-day auto-deletion keeps storage costs low

---

## LIVE MONITORING

Query current usage via admin API:
```
GET /api/ai/admin/usage?startDate=2026-05-01&endDate=2026-05-31
→ Returns: totalRequests, successCount, totalInputTokens, totalOutputTokens, totalCostUSD
```

Generate fresh platform insights:
```
POST /api/ai/admin/insights
→ Returns: 3 prioritized insights with actionable recommendations
```

---

*This report reflects the architecture and cost model as of 2026-05-29.*
*Actual costs depend on usage volume and Anthropic pricing changes.*
