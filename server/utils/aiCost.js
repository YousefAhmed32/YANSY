'use strict';
const AiCostLog = require('../models/AiCostLog');
const SystemSettings = require('../models/SystemSettings');

/* ═══════════════════════════════════════════════════════════════════════════
   Cost tracking — computes $ cost from token usage using an admin-configured
   per-model rate table (SystemSettings key `aiChat.pricingTable`, JSON:
   { "<model>": { "input": <$ per 1M input tokens>, "output": <$ per 1M output tokens> } }).
   We do NOT hardcode live OpenAI $/token rates here — they change over time
   and vary by account/negotiated tier, so guessing a number would be worse
   than admitting it's unset. Cost is honestly 0 (and visibly flagged as
   "rate not configured" in analytics) until an admin fills in real rates
   from their OpenAI billing dashboard.
   ═══════════════════════════════════════════════════════════════════════ */

let _pricingCache = null;
let _pricingCacheAt = 0;
const CACHE_TTL_MS = 60_000;

const getPricingTable = async () => {
  const now = Date.now();
  if (_pricingCache && (now - _pricingCacheAt) < CACHE_TTL_MS) return _pricingCache;
  try {
    const raw = await SystemSettings.get('aiChat.pricingTable', null);
    _pricingCache = (raw && typeof raw === 'object') ? raw : {};
  } catch {
    _pricingCache = _pricingCache || {};
  }
  _pricingCacheAt = now;
  return _pricingCache;
};

const computeCostUSD = (table, model, inputTokens = 0, outputTokens = 0) => {
  const rate = table?.[model];
  if (!rate) return 0;
  const inCost  = ((rate.input  || 0) / 1_000_000) * inputTokens;
  const outCost = ((rate.output || 0) / 1_000_000) * outputTokens;
  return +(inCost + outCost).toFixed(6);
};

// Fire-and-forget — cost logging must never block or break the actual AI response.
exports.logAiCost = async ({ sessionId, userId, feature, model, inputTokens = 0, outputTokens = 0 }) => {
  try {
    const table = await getPricingTable();
    const costUSD = computeCostUSD(table, model, inputTokens, outputTokens);
    await AiCostLog.create({ sessionId, userId: userId || null, feature, model, inputTokens, outputTokens, costUSD });
  } catch (err) {
    console.error('[aiCost:log]', err.message);
  }
};

exports.invalidatePricingCache = () => { _pricingCache = null; };
