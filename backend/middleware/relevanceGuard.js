// backend/middleware/relevanceGuard.js
// Advanced relevance guard: chunk-based scoring, per-user ownership, multi-doc merging,
// ambiguity handling, metadata filter hooks, and attaches req.docContext & req.usedDocuments.

const Document = require('../models/document'); // existing model
const {
  chunkTextBySize,
  chunkScore
} = require('../utils/simpleTextSimilarity');

// Tunable parameters
const CHUNK_SIZE = 4000; // characters per chunk (approx). Adjust to 3000-6000 depending on model context.
const TOP_K_DOCS = 3;    // how many top docs to consider
const TOP_K_CHUNKS = 3;  // how many chunks per doc to merge
const DOC_SCORE_THRESHOLD = 0.12; // minimal doc-level score to consider relevant (tuneable)
const AMBIGUITY_DELTA = 0.08; // if top two docs within this delta -> ambiguous

// helper: compute best chunk scores per doc
async function scoreDocumentForQuery(doc, question) {
  const text = (doc.extracted_text || '').toString();
  if (!text || text.trim().length === 0) return { bestScore: 0, topChunks: [] };

  const chunks = chunkTextBySize(text, CHUNK_SIZE);
  const scored = chunks.map((c, idx) => ({ idx, score: chunkScore(question, c), text: c }));
  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.slice(0, TOP_K_CHUNKS);
  // doc score = top chunk score (could also use average of top chunks)
  const bestScore = topChunks.length ? topChunks[0].score : 0;
  return { bestScore, topChunks };
}

module.exports = async function relevanceGuard(req, res, next) {
  try {
    const question = (req.body && req.body.question) || req.query.question;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ message: 'Question is required.' });
    }

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    // documentIds override (manual selection) — if provided, restrict to those
    let docIds = Array.isArray(req.body.documentIds) ? req.body.documentIds.filter(Boolean) : null;

    // Always fetch fresh from DB: either selected docs or all of user's docs.
    const where = docIds && docIds.length > 0 ? { id: docIds, uploaded_by: userId } : { uploaded_by: userId };
    const docs = await Document.findAll({ where, order: [['uploaded_at', 'DESC']] });

    if (!docs || docs.length === 0) {
      return res.status(404).json({ message: 'No documents found for this user.' });
    }

    // Debug log (you can remove later)
    console.log(`relevanceGuard: scoring ${docs.length} docs for user ${userId}`);

    // Score all docs (concurrently)
    const scoredResults = await Promise.all(docs.map(async (d) => {
      const { bestScore, topChunks } = await scoreDocumentForQuery(d, question);
      return { doc: d, bestScore, topChunks };
    }));

    // Sort by bestScore desc
    scoredResults.sort((a, b) => b.bestScore - a.bestScore);

    console.log('relevanceGuard: top scores:', scoredResults.slice(0, 10).map(r => ({ filename: r.doc.filename, score: r.bestScore })));

    // If highest is below threshold => no relevant info
    const top = scoredResults[0];
    if (!top || top.bestScore < DOC_SCORE_THRESHOLD) {
      return res.status(200).json({ answer: 'No relevant information found in the uploaded documents.' });
    }

    // Ambiguity detection: if second doc close to top, treat specially
    const second = scoredResults[1];
    const ambiguous = second && (top.bestScore - second.bestScore) < AMBIGUITY_DELTA && second.bestScore >= DOC_SCORE_THRESHOLD;

    // Build docContext: if ambiguous -> include top two docs' top chunks, else include top doc chunks.
    // Also support multi-doc mode: if multiple docs above threshold and not ambiguous, include top N up to TOP_K_DOCS
    let selected = [];
    if (ambiguous) {
      // merge top 2 docs
      selected = scoredResults.slice(0, 2);
    } else {
      // choose up to TOP_K_DOCS docs with bestScore >= DOC_SCORE_THRESHOLD
      selected = scoredResults.filter(r => r.bestScore >= DOC_SCORE_THRESHOLD).slice(0, TOP_K_DOCS);
      // ensure at least the top doc
      if (selected.length === 0 && top) selected = [top];
    }

    // Build concatenated context with headings and small separators
    const usedDocuments = [];
    const docContextParts = [];

    for (const s of selected) {
      const filename = s.doc.filename;
      usedDocuments.push(filename);

      // merge topChunks text (avoid duplicates)
      const pieces = [];
      const seen = new Set();
      for (const c of s.topChunks) {
        const snippet = (c.text || '').trim();
        if (!snippet) continue;
        const key = snippet.slice(0, 200); // small dedupe key
        if (seen.has(key)) continue;
        seen.add(key);
        pieces.push(snippet);
      }

      // join pieces for this doc
      const docText = pieces.join('\n\n');
      docContextParts.push(`=== ${filename} ===\n${docText}`);
    }

    const docContext = docContextParts.join('\n\n---\n\n');

    // Attach to req for controller to use (docContext & usedDocuments)
    req.docContext = docContext;
    req.usedDocuments = usedDocuments;
    req.retrieved = selected.map(s => ({ id: s.doc.id, filename: s.doc.filename, score: s.bestScore }));

    // If ambiguous, add a flag so controller can optionally ask for clarification
    req.relevanceAmbiguous = ambiguous;

    return next();
  } catch (err) {
    console.error('relevanceGuard error:', err);
    return res.status(500).json({ message: 'Internal server error in relevance check.' });
  }
};
