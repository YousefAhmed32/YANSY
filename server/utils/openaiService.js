'use strict';
const axios = require('axios');

const API_KEY  = () => process.env.OPENAI_API_KEY;
const MODEL    = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';
const BASE     = 'https://api.openai.com/v1/chat/completions';
const EMBED_BASE = 'https://api.openai.com/v1/embeddings';
const TTS_BASE   = 'https://api.openai.com/v1/audio/speech';
const EMBED_MODEL = () => process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';

const authHeaders = () => ({
  Authorization:  `Bearer ${API_KEY()}`,
  'Content-Type': 'application/json',
});

// Newer "reasoning" model families (o1/o3/o4, gpt-5.x, etc.) reject a custom
// `temperature` (only the default, 1, is accepted) and use `max_completion_tokens`
// instead of the legacy `max_tokens`. Rather than hardcode a model-name allowlist
// that goes stale the moment OpenAI ships another model, this provider always
// sends the modern `max_completion_tokens` (accepted by every current chat model)
// and transparently retries once without `temperature` if the API itself says
// this specific model doesn't support it — so upgrading OPENAI_MODEL never
// requires a code change here.
const isUnsupportedTemperature = (err) => {
  const data = err?.response?.data?.error;
  return err?.response?.status === 400 && data?.param === 'temperature' && data?.code === 'unsupported_value';
};

// When the request used `responseType: 'stream'`, a non-2xx response body also
// arrives as a readable stream (not parsed JSON) — read it before inspecting
// the error shape, or the temperature-retry check above silently never matches.
const readStreamErrorBody = (err) => new Promise((resolve) => {
  const body = err?.response?.data;
  if (!body || typeof body.on !== 'function') return resolve(null);
  let raw = '';
  body.on('data', (c) => { raw += c.toString('utf8'); });
  body.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(null); } });
  body.on('error', () => resolve(null));
});

const isUnsupportedTemperatureFromStream = async (err) => {
  if (err?.response?.status !== 400) return false;
  const parsed = await readStreamErrorBody(err);
  const data = parsed?.error;
  return data?.param === 'temperature' && data?.code === 'unsupported_value';
};

const postCompletion = async (body, opts) => {
  try {
    return await axios.post(BASE, body, opts);
  } catch (err) {
    if (isUnsupportedTemperature(err) && 'temperature' in body) {
      const { temperature: _drop, ...rest } = body; // eslint-disable-line no-unused-vars
      return axios.post(BASE, rest, opts);
    }
    throw err;
  }
};

/**
 * Non-streaming completion — returns { text, usage, durationMs }
 */
// `reasoningEffort` ('none'|'low'|'medium'|'high'|'xhigh') matters a lot for
// reasoning-family models: verified via live testing that this model burns its
// ENTIRE max_completion_tokens budget on invisible reasoning for open-ended
// long-form prompts (e.g. "write a 13-section document") and returns EMPTY
// visible content with finish_reason:"length" — not an error, just silence.
// Short conversational replies stay well within budget on their own (~50
// reasoning tokens observed), so this only needs to be set for long-form
// generation calls, not the main chat loop.
exports.complete = async ({ system, messages, maxTokens = 500, temperature = 0.75, jsonMode = false, model, reasoningEffort }) => {
  const t0 = Date.now();
  const body = {
    model:                  model || MODEL(),
    messages:               system ? [{ role: 'system', content: system }, ...messages] : messages,
    max_completion_tokens:  maxTokens,
    temperature,
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  const res = await postCompletion(body, { headers: authHeaders() });
  return {
    text:       res.data.choices[0].message.content,
    usage:      res.data.usage,
    durationMs: Date.now() - t0,
  };
};

/**
 * Streaming completion — fires onChunk(delta) for each chunk, resolves to full text
 */
exports.stream = async ({ system, messages, maxTokens = 700, temperature = 0.75, onChunk, onUsage, model }) => {
  const body = {
    model:                 model || MODEL(),
    messages:              system ? [{ role: 'system', content: system }, ...messages] : messages,
    max_completion_tokens: maxTokens,
    temperature,
    stream:                true,
    stream_options:        { include_usage: true },
  };

  const runStream = (b) => axios.post(BASE, b, { headers: authHeaders(), responseType: 'stream' });

  let res;
  try {
    res = await runStream(body);
  } catch (err) {
    if (await isUnsupportedTemperatureFromStream(err)) {
      const { temperature: _drop, ...rest } = body; // eslint-disable-line no-unused-vars
      res = await runStream(rest);
    } else {
      throw err;
    }
  }

  let fullText = '';
  let buffer   = '';

  return new Promise((resolve, reject) => {
    res.data.on('data', (raw) => {
      buffer += raw.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6).trim();
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const delta  = parsed.choices?.[0]?.delta?.content;
          if (delta) { fullText += delta; onChunk(delta); }
          if (parsed.usage) onUsage?.(parsed.usage); // final chunk when stream_options.include_usage is set
        } catch { /* ignore malformed SSE lines */ }
      }
    });
    res.data.on('end',   () => resolve(fullText));
    res.data.on('error', reject);
  });
};

/**
 * Intent analysis — fast non-streaming call, returns structured JSON
 */
exports.analyze = async (conversationText) => {
  const fallback = {
    leadDetected:    false,
    leadData:        {},
    suggestWhatsapp: false,
    whatsappReason:  null,
    createTicket:    false,
    ticketPriority:  'low',
    ticketSubject:   null,
    escalate:        false,
    escalationReason: null,
    sentiment:       'neutral',
    primaryIntent:   'inquiry',
  };

  if (!exports.isConfigured()) return fallback;

  try {
    const result = await exports.complete({
      system: 'You are an intent classifier. Return ONLY valid JSON. No explanation.',
      messages: [{
        role:    'user',
        content: `Analyze this customer support conversation and return JSON:

${conversationText}

Return this exact JSON structure:
{
  "leadDetected": boolean,
  "leadData": {
    "name": string or null,
    "phone": string or null,
    "email": string or null,
    "projectType": string or null,
    "budget": string or null,
    "timeline": string or null,
    "business": string or null
  },
  "suggestWhatsapp": boolean,
  "whatsappReason": string or null,
  "createTicket": boolean,
  "ticketPriority": "low" or "medium" or "high" or "critical",
  "ticketSubject": string or null,
  "escalate": boolean,
  "escalationReason": string or null,
  "sentiment": "positive" or "neutral" or "frustrated" or "urgent",
  "primaryIntent": "lead" or "support" or "inquiry" or "complaint" or "other"
}

Rules:
- leadDetected = true if customer shows interest in building/buying something
- suggestWhatsapp = true if large project (>5000$), urgency, or they want to share files
- createTicket = true if customer reports a bug, complaint, or support issue
- escalate = true if customer is frustrated, has payment issue, or marked as critical`,
      }],
      maxTokens:   400,
      temperature: 0.1,
      jsonMode:    true,
    });

    return { ...fallback, ...JSON.parse(result.text) };
  } catch {
    return fallback;
  }
};

/**
 * Embeddings — returns a single vector for a string, or an array of vectors
 * for an array of strings (used by the RAG knowledge base).
 */
exports.embed = async (input) => {
  const isBatch = Array.isArray(input);
  const res = await axios.post(EMBED_BASE, {
    model: EMBED_MODEL(),
    input,
  }, { headers: authHeaders() });
  const vectors = res.data.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
  return isBatch ? vectors : vectors[0];
};

/**
 * Text-to-speech — returns an mp3 Buffer for short spoken replies.
 */
exports.tts = async ({ text, voice = 'alloy', model = 'tts-1', speed = 1.0 }) => {
  const res = await axios.post(TTS_BASE, {
    model,
    voice,
    input: text,
    speed,
    response_format: 'mp3',
  }, { headers: authHeaders(), responseType: 'arraybuffer' });
  return Buffer.from(res.data);
};

exports.isConfigured = () => !!API_KEY();
