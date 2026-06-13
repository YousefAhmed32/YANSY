'use strict';

// Pricing per 1M tokens (claude-sonnet-4-6 as of 2025)
const PRICING = {
  'claude-sonnet-4-6': {
    inputPerMToken:      3.00,
    outputPerMToken:     15.00,
    cacheReadPerMToken:  0.30,
    cacheWritePerMToken: 3.75,
  },
};

const DEFAULT_MODEL  = 'claude-sonnet-4-6';
const DEFAULT_MAX    = parseInt(process.env.AI_MAX_TOKENS || '2048');

let anthropicInstance = null;

const getAnthropic = () => {
  if (anthropicInstance) return anthropicInstance;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const Anthropic     = require('@anthropic-ai/sdk');
    anthropicInstance   = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropicInstance;
  } catch (err) {
    console.error('[claude] Failed to initialize Anthropic client:', err.message);
    return null;
  }
};

const isConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

/**
 * Calculate estimated USD cost from token usage.
 */
const calculateCost = (usage, model = DEFAULT_MODEL) => {
  const p = PRICING[model] || PRICING[DEFAULT_MODEL];
  const inputCost       = (usage.input_tokens        || 0) / 1_000_000 * p.inputPerMToken;
  const outputCost      = (usage.output_tokens       || 0) / 1_000_000 * p.outputPerMToken;
  const cacheReadCost   = (usage.cache_read_input_tokens  || 0) / 1_000_000 * p.cacheReadPerMToken;
  const cacheWriteCost  = (usage.cache_creation_input_tokens || 0) / 1_000_000 * p.cacheWritePerMToken;
  return +(inputCost + outputCost + cacheReadCost + cacheWriteCost).toFixed(6);
};

/**
 * Main message call with prompt caching on system prompt.
 *
 * @param {object} options
 * @param {string} options.system       - System prompt (will be cached)
 * @param {Array}  options.messages     - Conversation messages
 * @param {string} options.model        - Model ID
 * @param {number} options.maxTokens    - Max output tokens
 * @param {object} options.metadata     - For usage logging
 * @returns {{ text, usage, costUSD, durationMs }}
 */
const complete = async ({
  system,
  messages,
  model     = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX,
  metadata  = {},
}) => {
  const client = getAnthropic();
  if (!client) throw new Error('ANTHROPIC_API_KEY not configured. AI features are unavailable.');

  const t0 = Date.now();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: system
      ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
      : undefined,
    messages,
  });

  const durationMs    = Date.now() - t0;
  const usage         = response.usage || {};
  const costUSD       = calculateCost(usage, model);
  const text          = response.content?.[0]?.text || '';

  return {
    text,
    usage: {
      inputTokens:      usage.input_tokens                  || 0,
      outputTokens:     usage.output_tokens                 || 0,
      cacheReadTokens:  usage.cache_read_input_tokens       || 0,
      cacheWriteTokens: usage.cache_creation_input_tokens   || 0,
    },
    costUSD,
    durationMs,
    model,
    stopReason: response.stop_reason,
  };
};

/**
 * Streaming version — calls onChunk(text) for each streamed chunk.
 * Returns the same shape as complete() when done.
 */
const stream = async ({
  system,
  messages,
  model     = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX,
  onChunk,  // (chunk: string) => void
}) => {
  const client = getAnthropic();
  if (!client) throw new Error('ANTHROPIC_API_KEY not configured.');

  const t0 = Date.now();
  let fullText = '';

  const streamResponse = await client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: system
      ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
      : undefined,
    messages,
  });

  for await (const event of streamResponse) {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      const chunk = event.delta.text;
      fullText += chunk;
      onChunk?.(chunk);
    }
  }

  const final      = await streamResponse.finalMessage();
  const usage      = final.usage || {};
  const costUSD    = calculateCost(usage, model);
  const durationMs = Date.now() - t0;

  return {
    text: fullText,
    usage: {
      inputTokens:      usage.input_tokens                  || 0,
      outputTokens:     usage.output_tokens                 || 0,
      cacheReadTokens:  usage.cache_read_input_tokens       || 0,
      cacheWriteTokens: usage.cache_creation_input_tokens   || 0,
    },
    costUSD,
    durationMs,
    model,
  };
};

/**
 * Log AI usage to the database (non-blocking).
 */
const logUsage = ({ userId, feature, result, success = true, errorCode = null, metadata = null }) => {
  setImmediate(async () => {
    try {
      const AIUsage = require('../models/AIUsage');
      await AIUsage.create({
        user:             userId,
        feature,
        model:            result?.model || DEFAULT_MODEL,
        inputTokens:      result?.usage?.inputTokens      || 0,
        outputTokens:     result?.usage?.outputTokens     || 0,
        cacheReadTokens:  result?.usage?.cacheReadTokens  || 0,
        cacheWriteTokens: result?.usage?.cacheWriteTokens || 0,
        estimatedCostUSD: result?.costUSD                 || 0,
        durationMs:       result?.durationMs              || 0,
        success,
        errorCode,
        metadata,
      });
    } catch (err) {
      console.error('[claude] Failed to log usage:', err.message);
    }
  });
};

module.exports = {
  isConfigured,
  complete,
  stream,
  logUsage,
  calculateCost,
  DEFAULT_MODEL,
};
