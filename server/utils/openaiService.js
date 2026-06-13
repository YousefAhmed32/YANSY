'use strict';
const axios = require('axios');

const API_KEY = () => process.env.OPENAI_API_KEY;
const MODEL   = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';
const BASE    = 'https://api.openai.com/v1/chat/completions';

const authHeaders = () => ({
  Authorization:  `Bearer ${API_KEY()}`,
  'Content-Type': 'application/json',
});

/**
 * Non-streaming completion — returns { text, usage, durationMs }
 */
exports.complete = async ({ system, messages, maxTokens = 500, temperature = 0.75, jsonMode = false }) => {
  const t0 = Date.now();
  const body = {
    model:      MODEL(),
    messages:   system ? [{ role: 'system', content: system }, ...messages] : messages,
    max_tokens: maxTokens,
    temperature,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  const res = await axios.post(BASE, body, { headers: authHeaders() });
  return {
    text:       res.data.choices[0].message.content,
    usage:      res.data.usage,
    durationMs: Date.now() - t0,
  };
};

/**
 * Streaming completion — fires onChunk(delta) for each chunk, resolves to full text
 */
exports.stream = async ({ system, messages, maxTokens = 700, temperature = 0.75, onChunk }) => {
  const body = {
    model:      MODEL(),
    messages:   system ? [{ role: 'system', content: system }, ...messages] : messages,
    max_tokens: maxTokens,
    temperature,
    stream:     true,
  };

  const res = await axios.post(BASE, body, {
    headers:      authHeaders(),
    responseType: 'stream',
  });

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

exports.isConfigured = () => !!API_KEY();
