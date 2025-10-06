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

/*
Module Exporting (module.exports = {...})

Function: Makes the configuration object available to other files in the project.
Way: Uses Node.js module system to export the object, so it can be imported and used elsewhere.
Configuration Object

Function: Centralizes all retrieval-related settings for easy management and consistency.
Way: Defines key-value pairs for each parameter, grouping them logically.
Scoring and Chunking Parameters

Function: Control how documents are split into chunks and how relevance is scored.
Way:
CHUNK_SIZE: Sets the number of characters per chunk for precision.
TOP_CHUNKS_PER_DOC: Limits chunks evaluated per document.
CHUNK_SCORE_THRESHOLD: Sets the minimum score for relevance.
AMBIGUITY_DELTA: Determines when documents are considered similarly relevant.
TOP_K_DOCS: Limits the number of top documents merged.
Guardrails

Function: Ensure only meaningful and strong evidence is returned.
Way:
MIN_SNIPPET_LEN: Ignores very short or junk lines.
REQUIRE_EVIDENCE: Returns a default message if evidence is too weak.
Logging

Function: Helps with debugging and development by tracking retrieval details.
Way:
LOG_RETRIEVAL: Enables logging of document scores and chunk information.
Inline Comments

Function: Document the purpose of each parameter for clarity.
Way:
Comments are placed next to each setting to explain its role and reasoning.


*/