// backend/middleware/relevanceGuard.js
const Document = require('../models/document');
const DocumentChunk = require('../models/documentChunk');
const { chunkScore } = require('../utils/simpleTextSimilarity');
const config = require('../config/retrievalConfig');

module.exports = async function relevanceGuard(req, res, next) {
  try {
    const question = (req.body && req.body.question) || req.query.question;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ message: 'Question is required.' });
    }

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    const selectedIds = Array.isArray(req.body?.documentIds)
      ? req.body.documentIds.filter(Boolean)
      : null;

    const where = selectedIds && selectedIds.length > 0
      ? { id: selectedIds, uploaded_by: userId }
      : { uploaded_by: userId };

    const docs = await Document.findAll({
      where,
      order: [['uploaded_at', 'DESC']]
    });
    if (!docs || docs.length === 0) {
      return res.status(404).json({ message: 'No documents found for this user.' });
    }

    const docsScored = [];
    for (const doc of docs) {
      let storedChunks = [];
      try {
        storedChunks = await DocumentChunk.findAll({
          where: { document_id: doc.id },
          order: [['chunk_index', 'ASC']]
        });
      } catch {
        storedChunks = [];
      }

      let items = [];
      if (storedChunks.length > 0) {
        items = storedChunks.map(c => ({ text: c.chunk_text }));
      } else {
        const text = (doc.extracted_text || '');
        const pieces = text.match(/[\s\S]{1,2000}/g) || [];
        items = pieces.map(t => ({ text: t }));
      }

      const scored = items
        .filter(i => i.text && i.text.trim().length >= config.MIN_SNIPPET_LEN)
        .map(i => ({ text: i.text, score: chunkScore(question, i.text) }));

      scored.sort((a, b) => b.score - a.score);
      const topChunks = scored.slice(0, config.TOP_CHUNKS_PER_DOC);
      const docScore = topChunks.length
        ? topChunks.reduce((s, x) => s + x.score, 0) / topChunks.length
        : 0;

      // log each doc’s top chunks (helps you debug)
      if (config.LOG_RETRIEVAL && process.env.NODE_ENV !== 'production') {
        console.log(`\n📄 Doc: ${doc.filename}`);
        console.log(`   Avg score: ${docScore.toFixed(4)}`);
        topChunks.forEach((c, i) =>
          console.log(`   #${i + 1} chunk score: ${c.score.toFixed(4)} | len=${c.text.length}`));
      }

      docsScored.push({ doc, docScore, topChunks });
    }

    // sort by doc score
    docsScored.sort((a, b) => b.docScore - a.docScore);

    const top = docsScored[0];
    const second = docsScored[1];
    const ambiguous =
      !!second &&
      Math.abs(top.docScore - second.docScore) < config.AMBIGUITY_DELTA &&
      second.docScore >= config.CHUNK_SCORE_THRESHOLD;

    let selected = [];
    if (selectedIds && selectedIds.length > 0) {
      // only user-chosen docs
      const allowed = new Set(selectedIds.map(String));
      selected = docsScored.filter(d => allowed.has(String(d.doc.id)));

      // if user selected docs but their scores are weak, still include their best chunks
      // (the model will then try with that context instead of rejecting too early)
      if (config.LOG_RETRIEVAL && process.env.NODE_ENV !== 'production') {
        console.log('📌 Using ONLY user-selected docs:', selected.map(s => ({
          id: s.doc.id, file: s.doc.filename, avg: Number(s.docScore.toFixed(4))
        })));
      }
    } else if (ambiguous) {
      selected = docsScored.slice(0, 2);
    } else {
      selected = docsScored
        .filter(r => r.docScore >= config.CHUNK_SCORE_THRESHOLD)
        .slice(0, config.TOP_K_DOCS);
      if (selected.length === 0 && top) selected = [top];
    }

    // Build the docContext from selected
    const usedDocuments = [];
    const docContextParts = [];

    for (const s of selected) {
      usedDocuments.push(s.doc.filename);

      // if even topChunks are empty (edge case), keep a minimal fallback from extracted_text
      let chunks = s.topChunks;
      if (!chunks || chunks.length === 0) {
        const fallback = (s.doc.extracted_text || '').slice(0, 1500);
        if (fallback && fallback.trim().length >= config.MIN_SNIPPET_LEN) {
          chunks = [{ text: fallback, score: 0 }];
        }
      }

      const seen = new Set();
      const pieces = [];
      for (const c of chunks) {
        const snippet = (c.text || '').trim();
        if (!snippet) continue;
        const key = snippet.slice(0, 200);
        if (seen.has(key)) continue;
        seen.add(key);
        pieces.push(snippet);
      }

      if (pieces.length > 0) {
        docContextParts.push(`=== ${s.doc.filename} ===\n${pieces.join('\n\n')}`);
      }
    }

    req.docContext = docContextParts.join('\n\n---\n\n'); // what the model will see
    req.usedDocuments = usedDocuments;
    req.relevanceAmbiguous = ambiguous;
    req.retrieved = selected.map(s => ({
      id: s.doc.id,
      filename: s.doc.filename,
      avgScore: Number(s.docScore.toFixed(4))
    }));

    if (config.LOG_RETRIEVAL && process.env.NODE_ENV !== 'production') {
      console.log('\n✅ Final selected docs:', req.retrieved);
      console.log('🧩 Context chars:', req.docContext.length);
    }

    // If user did NOT select docs: block weak-evidence asks here (prevents "biryani" leakage)
    if ((!selectedIds || selectedIds.length === 0) && config.REQUIRE_EVIDENCE) {
      const bestAvg = (docsScored[0]?.docScore || 0);
      if (bestAvg < config.CHUNK_SCORE_THRESHOLD) {
        return res.status(200).json({
          answer: 'No relevant information found in the uploaded documents.'
        });
      }
    }

    return next();
  } catch (err) {
    console.error('relevanceGuard error:', err);
    return res.status(500).json({ message: 'Internal server error in relevance check.' });
  }
};
