'use strict';
const openai       = require('../utils/openaiService');
const KnowledgeDoc  = require('../models/KnowledgeDoc');

/* ═══════════════════════════════════════════════════════════════════════════
   RAG knowledge base — small admin-managed corpus (services/pricing/FAQ/
   policy/case studies). MongoDB here is self-hosted (no Atlas $vectorSearch),
   and the corpus is expected to stay small (tens of docs), so retrieval is a
   plain in-process cosine-similarity scan rather than a dedicated vector DB —
   the right amount of engineering for the actual data size.
   ═══════════════════════════════════════════════════════════════════════ */

// Cache the active-doc embeddings in memory; invalidate on any write.
let _docCache = null;
let _docCacheAt = 0;
const CACHE_TTL_MS = 30_000;

const invalidateCache = () => { _docCache = null; };

const loadActiveDocs = async () => {
  const now = Date.now();
  if (_docCache && (now - _docCacheAt) < CACHE_TTL_MS) return _docCache;
  const docs = await KnowledgeDoc.find({ isActive: true, embedding: { $ne: [] } }).lean();
  _docCache = docs;
  _docCacheAt = now;
  return docs;
};

const cosineSim = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom ? dot / denom : 0;
};

// Exported for supportController — retrieves the top-K most relevant knowledge
// snippets for the current user message. Returns '' if RAG unavailable/empty/
// nothing relevant enough (keeps prompts clean when there's no real match).
// NOTE: text-embedding-3-small cosine scores for genuinely relevant
// query↔passage pairs commonly land in the 0.3-0.5 range (not 0.7+ — that
// range is closer to near-duplicate text). Verified empirically: a real
// on-topic match scored ~0.43, an unrelated query scored lower still.
exports.retrieveContext = async (query, { topK = 4, minScore = 0.3 } = {}) => {
  if (!openai.isConfigured() || !query?.trim()) return '';
  try {
    const docs = await loadActiveDocs();
    if (!docs.length) return '';

    const queryVec = await openai.embed(query.trim());
    const scored = docs
      .map(d => ({ ...d, score: cosineSim(queryVec, d.embedding) }))
      .filter(d => d.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (!scored.length) return '';
    return scored.map(d => `[${d.category}] ${d.title}: ${d.content}`).join('\n\n');
  } catch (err) {
    console.error('[knowledge:retrieve]', err.message);
    return '';
  }
};

// ── Admin CRUD ────────────────────────────────────────────────────────────
exports.adminList = async (req, res) => {
  try {
    const docs = await KnowledgeDoc.find().sort({ updatedAt: -1 }).lean();
    res.json({ docs });
  } catch { res.status(500).json({ error: 'Failed to load knowledge base.' }); }
};

exports.adminCreate = async (req, res) => {
  try {
    const { title, content, category, lang } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    let embedding = [];
    if (openai.isConfigured()) {
      try { embedding = await openai.embed(`${title.trim()}: ${content.trim()}`); }
      catch (e) { console.error('[knowledge:embed]', e.message); }
    }

    const doc = await KnowledgeDoc.create({
      title: title.trim(), content: content.trim(),
      category: category || 'other', lang: lang || 'both',
      embedding, updatedBy: req.user._id,
    });
    invalidateCache();
    res.status(201).json({ doc });
  } catch { res.status(500).json({ error: 'Failed to create knowledge entry.' }); }
};

exports.adminUpdate = async (req, res) => {
  try {
    const doc = await KnowledgeDoc.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found.' });

    const { title, content, category, lang, isActive } = req.body;
    let contentChanged = false;
    if (title !== undefined   && title.trim()   !== doc.title)   { doc.title = title.trim(); contentChanged = true; }
    if (content !== undefined && content.trim() !== doc.content) { doc.content = content.trim(); contentChanged = true; }
    if (category !== undefined) doc.category = category;
    if (lang !== undefined)     doc.lang = lang;
    if (typeof isActive !== 'undefined') doc.isActive = isActive;
    doc.updatedBy = req.user._id;

    if (contentChanged && openai.isConfigured()) {
      try { doc.embedding = await openai.embed(`${doc.title}: ${doc.content}`); }
      catch (e) { console.error('[knowledge:embed]', e.message); }
    }

    await doc.save();
    invalidateCache();
    res.json({ doc });
  } catch { res.status(500).json({ error: 'Failed to update knowledge entry.' }); }
};

exports.adminDelete = async (req, res) => {
  try {
    await KnowledgeDoc.findByIdAndDelete(req.params.id);
    invalidateCache();
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete knowledge entry.' }); }
};
