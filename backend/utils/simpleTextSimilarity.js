// backend/utils/simpleTextSimilarity.js
// Hybrid simple similarity utilities: tokenization, keyword density and normalized overlap.
// Designed to be cheap (no external calls) and robust across small and large docs.

const STOPWORDS = new Set([
  'the','is','at','which','on','and','a','an','of','or','to','in','for','with','that','this','it','be','are','by','from','as','was','were','will','can'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toString()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(t => t && !STOPWORDS.has(t));
}

// term frequency map
function tfMap(tokens) {
  const m = Object.create(null);
  for (const t of tokens) m[t] = (m[t] || 0) + 1;
  return m;
}

// dot product / magnitude helpers
function dotProduct(a, b) {
  let sum = 0;
  for (const k of Object.keys(a)) if (b[k]) sum += a[k] * b[k];
  return sum;
}
function magnitude(a) {
  let s = 0;
  for (const k of Object.keys(a)) s += a[k] * a[k];
  return Math.sqrt(s);
}

// cosine similarity on token TF vectors
function cosineSimilarity(textA, textB) {
  const ta = tokenize(textA);
  const tb = tokenize(textB);
  if (ta.length === 0 || tb.length === 0) return 0;
  const ma = tfMap(ta);
  const mb = tfMap(tb);
  const denom = magnitude(ma) * magnitude(mb);
  if (!denom) return 0;
  return dotProduct(ma, mb) / denom;
}

// keyword-density score: overlapCount / docTokenCount
function keywordDensityScore(query, docText) {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return 0;
  const docTokens = tokenize(docText);
  if (docTokens.length === 0) return 0;
  const qSet = new Set(qTokens);
  let overlap = 0;
  for (const t of docTokens) if (qSet.has(t)) overlap++;
  // density normalized by sqrt(length) to avoid huge docs dominating
  return overlap / Math.sqrt(Math.max(1, docTokens.length));
}

/*
 * chunkScore:
 *  - computes a hybrid score for a query vs a text chunk
 *  - weights: cosineSimilarity (0.6), keywordDensity (0.4)
 *  - returns a number between 0 and 1 (approximately)
 */
function chunkScore(query, chunkText) {
  const cos = cosineSimilarity(query, chunkText);
  const kd = keywordDensityScore(query, chunkText);
  // combine with weights, apply small normalization
  return (0.6 * cos) + (0.4 * Math.min(1, kd));
}

// chunk splitting helper: split text into chunks of approx chunkSize chars (natural split at newlines)
function chunkTextBySize(text, chunkSize = 4000) {
  if (!text) return [];
  text = text.toString();
  const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let buffer = '';
  for (const p of paragraphs) {
    if ((buffer + '\n' + p).length > chunkSize) {
      if (buffer) chunks.push(buffer);
      // if paragraph itself > chunkSize, slice it
      if (p.length > chunkSize) {
        for (let i = 0; i < p.length; i += chunkSize) {
          chunks.push(p.slice(i, i + chunkSize));
        }
        buffer = '';
      } else {
        buffer = p;
      }
    } else {
      buffer = buffer ? (buffer + '\n' + p) : p;
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}

module.exports = {
  tokenize,
  cosineSimilarity,
  keywordDensityScore,
  chunkScore,
  chunkTextBySize
};
