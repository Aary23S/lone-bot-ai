// backend/config/retrievalConfig.js
module.exports = {
  // scoring / chunking
  CHUNK_SIZE: 1200,                 // chars per chunk (kept moderate for precision)
  TOP_CHUNKS_PER_DOC: 8,            // evaluate a handful per doc
  CHUNK_SCORE_THRESHOLD: 0.08,      // slightly lower to avoid false negatives (resume, etc.)
  AMBIGUITY_DELTA: 0.02,            // consider docs "close" if within this avg-score delta
  TOP_K_DOCS: 5,                    // max docs to merge if clearly relevant

  // guardrails
  MIN_SNIPPET_LEN: 50,              // ignore junk/very short lines
  REQUIRE_EVIDENCE: true,           // if top evidence is too weak -> return "No relevant information..."

  // logging
  LOG_RETRIEVAL: true,              // log doc scores/chunks in dev
};
