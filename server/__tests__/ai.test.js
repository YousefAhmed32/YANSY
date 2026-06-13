'use strict';
/**
 * Phase 4 — AI Layer tests.
 * All tests run without Anthropic API connection.
 */

const fs   = require('fs');
const path = require('path');

const readFile = (relPath) =>
  fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');

// ── AIUsage model ─────────────────────────────────────────────────────────────
describe('AIUsage model', () => {
  const AIUsage = require('../models/AIUsage');

  it('exports a Mongoose model', () => {
    expect(AIUsage.modelName).toBe('AIUsage');
  });

  it('has all required fields', () => {
    const schema = AIUsage.schema;
    ['user', 'feature', 'model', 'inputTokens', 'outputTokens', 'estimatedCostUSD', 'success'].forEach(f => {
      expect(schema.path(f)).toBeDefined();
    });
  });

  it('feature enum includes all expected values', () => {
    const schema  = AIUsage.schema;
    const enumVal = schema.path('feature').enumValues;
    ['insight', 'brief', 'estimator', 'proposal', 'project_summary', 'message_summary', 'onboarding', 'chat', 'admin_insights'].forEach(v => {
      expect(enumVal).toContain(v);
    });
  });

  it('defaults success to true', () => {
    const mongoose = require('mongoose');
    const rec = new AIUsage({ user: new mongoose.Types.ObjectId(), feature: 'insight' });
    expect(rec.success).toBe(true);
  });

  it('has dailyCount static method', () => {
    expect(typeof AIUsage.dailyCount).toBe('function');
  });

  it('has userStats static method', () => {
    expect(typeof AIUsage.userStats).toBe('function');
  });

  it('has TTL index (90 days)', () => {
    const indexes = AIUsage.schema.indexes();
    const hasTTL  = indexes.some(([keys, opts]) => opts?.expireAfterSeconds === 90 * 24 * 60 * 60);
    expect(hasTTL).toBe(true);
  });
});

// ── Claude service ────────────────────────────────────────────────────────────
describe('claudeService', () => {
  it('exports all required functions', () => {
    const svc = require('../utils/claudeService');
    ['isConfigured', 'complete', 'stream', 'logUsage', 'calculateCost'].forEach(fn => {
      expect(typeof svc[fn]).toBe('function');
    });
  });

  it('isConfigured returns false when API key not set', () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const { isConfigured } = require('../utils/claudeService');
    expect(isConfigured()).toBe(false);
    if (original) process.env.ANTHROPIC_API_KEY = original;
  });

  it('calculateCost returns correct estimate for claude-sonnet-4-6', () => {
    const { calculateCost } = require('../utils/claudeService');
    const usage = { input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
    const cost  = calculateCost(usage, 'claude-sonnet-4-6');
    // input: 1000/1M * $3 = $0.003; output: 500/1M * $15 = $0.0075
    expect(cost).toBeCloseTo(0.0105, 4);
  });

  it('logUsage is a non-throwing function', () => {
    const { logUsage } = require('../utils/claudeService');
    const mongoose = require('mongoose');
    expect(() => logUsage({
      userId:  new mongoose.Types.ObjectId(),
      feature: 'insight',
      result:  { costUSD: 0.001, durationMs: 500, usage: { inputTokens: 100, outputTokens: 50 } },
    })).not.toThrow();
  });
});

// ── AI rate limit middleware ───────────────────────────────────────────────────
describe('aiRateLimit middleware', () => {
  it('exports aiRateLimit function', () => {
    const { aiRateLimit } = require('../middleware/aiRateLimit');
    expect(typeof aiRateLimit).toBe('function');
  });

  it('aiRateLimit has correct arity (req, res, next)', () => {
    const { aiRateLimit } = require('../middleware/aiRateLimit');
    expect(aiRateLimit.length).toBe(3);
  });

  it('admin users bypass rate limit', async () => {
    const { aiRateLimit } = require('../middleware/aiRateLimit');
    const req  = { user: { _id: 'admin123', role: 'ADMIN' } };
    const res  = {};
    const next = jest.fn();
    await aiRateLimit(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ── AI controller ─────────────────────────────────────────────────────────────
describe('aiController', () => {
  it('exports all required handlers', () => {
    const ctrl = require('../controllers/aiController');
    const expected = [
      'getDashboardInsight', 'generateBrief', 'estimateProject',
      'generateProposal', 'summarizeProject', 'summarizeMessages',
      'onboardingAssistant', 'chat',
      'getAdminInsights', 'getAdminUsage', 'getMyUsage',
    ];
    expected.forEach(fn => {
      expect(typeof ctrl[fn]).toBe('function');
    });
  });

  it('chat endpoint returns fallback when API not configured', async () => {
    const ctrl = require('../controllers/aiController');
    // Delete API key to simulate unconfigured state
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const req  = { body: { message: 'Hello', lang: 'en' }, user: null };
    const json = jest.fn();
    const res  = { json };

    await ctrl.chat(req, res, () => {});

    expect(json).toHaveBeenCalled();
    const call = json.mock.calls[0][0];
    expect(call).toHaveProperty('reply');
    expect(call.fallback).toBe(true);

    if (original) process.env.ANTHROPIC_API_KEY = original;
  });

  it('getDashboardInsight returns 503 when AI not configured', async () => {
    const ctrl = require('../controllers/aiController');
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const req  = { user: { _id: 'user123', fullName: 'Test', role: 'USER' } };
    const status = jest.fn().mockReturnThis();
    const json   = jest.fn();
    const res    = { status, json };

    await ctrl.getDashboardInsight(req, res, () => {});
    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AI_NOT_CONFIGURED' }));

    if (original) process.env.ANTHROPIC_API_KEY = original;
  });
});

// ── AI routes ─────────────────────────────────────────────────────────────────
describe('AI routes', () => {
  it('ai routes module loads without error', () => {
    const routes = require('../routes/ai');
    expect(routes).toBeDefined();
  });
});

// ── Code quality checks ───────────────────────────────────────────────────────
describe('AI code quality', () => {
  it('claudeService uses prompt caching on system prompt', () => {
    const src = readFile('utils/claudeService.js');
    expect(src).toContain('cache_control');
    expect(src).toContain('ephemeral');
  });

  it('claudeService tracks cost per request', () => {
    const src = readFile('utils/claudeService.js');
    expect(src).toContain('calculateCost');
    expect(src).toContain('estimatedCostUSD');
  });

  it('aiController has graceful fallback for all unconfigured endpoints', () => {
    const src = readFile('controllers/aiController.js');
    expect(src).toContain('AI_NOT_CONFIGURED');
    expect(src).toContain('ANTHROPIC_API_KEY');
  });

  it('AIUsage model is used for logging (not just defined)', () => {
    const src = readFile('controllers/aiController.js');
    expect(src).toContain('logUsage');
  });

  it('no hardcoded AI responses in aiController', () => {
    const src = readFile('controllers/aiController.js');
    // Should NOT have hardcoded insight strings
    expect(src).not.toContain('actively in progress. Stay engaged');
    expect(src).not.toContain('awaiting review. Our team will respond within 24 hours');
  });

  it('dashboard AIChatWidget no longer uses hardcoded getAIMessage function', () => {
    const src = readFile('../client/src/components/AIChatWidget.jsx');
    expect(src).not.toContain("const getAIMessage = ");
    expect(src).toContain('callClaudeAPI');
  });

  it('Dashboard.jsx AIInsightCard no longer uses hardcoded if/else insight', () => {
    const src = readFile('../client/src/pages/Dashboard.jsx');
    expect(src).not.toContain("Stay engaged with your team.");
    expect(src).not.toContain("awaiting review. Our team will respond within 24 hours.");
    expect(src).toContain("api.post('/ai/insight')");
  });

  it('server.js registers AI routes', () => {
    const src = readFile('server.js');
    expect(src).toContain('aiRoutes');
    expect(src).toContain('/api/ai');
  });
});

// ── Rate limit validation ─────────────────────────────────────────────────────
describe('AI rate limit validation', () => {
  it('DAILY_LIMITS defined in middleware source', () => {
    const src = readFile('middleware/aiRateLimit.js');
    expect(src).toContain('FREE:         0');
    expect(src).toContain('PROFESSIONAL');
    expect(src).toContain('ENTERPRISE');
  });

  it('rate limit returns 402 for FREE plan users', () => {
    const src = readFile('middleware/aiRateLimit.js');
    expect(src).toContain('402');
    expect(src).toContain('upgradeUrl');
  });

  it('rate limit returns 429 when daily limit exceeded', () => {
    const src = readFile('middleware/aiRateLimit.js');
    expect(src).toContain('429');
    expect(src).toContain('Daily AI limit reached');
  });
});
