// backend/utils/simpleTextSimilarity.js
// Combines your cosine+overlap with an optional keyword bonus

const STOPWORDS = new Set([
  'the','is','at','which','on','and','a','an','of','or','to','in','for','with','that','this','it','be','are',
  'as','by','from','was','were','will','would','can','could','should','has','have','had','i','you','he','she','they','we','our','my','your'
]);

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(tok => tok && !STOPWORDS.has(tok) && tok.length > 1);
}

function termFreqMap(tokens) {
  const map = Object.create(null);
  for (const t of tokens) map[t] = (map[t] || 0) + 1;
  return map;
}

function dotProduct(a, b) {
  let sum = 0;
  for (const k of Object.keys(a)) {
    if (b[k]) sum += a[k] * b[k];
  }
  return sum;
}

function magnitude(map) {
  let sum = 0;
  for (const k of Object.keys(map)) sum += map[k] * map[k];
  return Math.sqrt(sum);
}

function similarityScore(textA, textB) {
  try {
    const tA = tokenize(textA);
    const tB = tokenize(textB);
    if (tA.length === 0 || tB.length === 0) return 0;

    const keepTop = (tokens, maxTypes = 700) => {
      const tf = termFreqMap(tokens);
      const entries = Object.entries(tf).sort((a, b) => b[1] - a[1]);
      return Object.fromEntries(entries.slice(0, maxTypes));
    };

    const mapA = keepTop(tA, 700);
    const mapB = keepTop(tB, 700);

    const denom = magnitude(mapA) * magnitude(mapB);
    if (!denom) return 0;
    return dotProduct(mapA, mapB) / denom;
  } catch (err) {
    console.error('similarityScore error:', err);
    return 0;
  }
}

function chunkTextBySize(text, maxChunkSize = 1000, overlap = 200) {
  if (!text || typeof text !== 'string') return [];
  text = text.trim();
  if (text.length === 0) return [];

  maxChunkSize = Math.max(200, Number(maxChunkSize) || 1000);
  overlap = Math.max(0, Number(overlap) || 200);

  if (text.length <= maxChunkSize) return [text];

  const sentences = text.split(/(?<=[.?!])\s+|\n+/).map(s => s.trim()).filter(Boolean);

  const chunks = [];
  let current = '';

  for (const s of sentences) {
    if (!s) continue;
    if ((current.length ? current.length + 1 + s.length : s.length) <= maxChunkSize) {
      current = (current ? current + ' ' + s : s);
      continue;
    }
    if (current) {
      chunks.push(current.trim());
      current = '';
    }
    if (s.length > maxChunkSize) {
      let start = 0;
      while (start < s.length) {
        const end = Math.min(start + maxChunkSize, s.length);
        chunks.push(s.slice(start, end));
        if (end === s.length) break;
        start = Math.max(0, end - overlap);
      }
      continue;
    }
    current = s;
  }

  if (current) chunks.push(current.trim());

  return chunks.filter(ch => ch && ch.length > 0);
}

function keywordBonus(qTokens, textLower) {
  let bonus = 0;
  for (const t of qTokens) {
    if (t.length >= 5 && textLower.includes(t)) bonus += 0.005;
  }
  return Math.min(bonus, 0.05);
}

function chunkScore(question, chunk) {
  try {
    const sim = similarityScore(question, chunk);
    const qTokens = tokenize(question);
    const cTokens = tokenize(chunk);

    let overlapScore = 0;
    if (qTokens.length > 0 && cTokens.length > 0) {
      const qSet = new Set(qTokens);
      let overlap = 0;
      for (const t of cTokens) if (qSet.has(t)) overlap++;
      overlapScore = overlap / Math.min(qTokens.length, 50);
      overlapScore = Math.min(1, overlapScore);
    }

    const bonus = keywordBonus(qTokens, (chunk || '').toLowerCase());

    const combined = (sim * 0.7) + (overlapScore * 0.25) + bonus;
    return Math.max(0, Math.min(1, Number(combined) || 0));
  } catch (err) {
    return 0;
  }
}

module.exports = {
  chunkTextBySize,
  chunkScore,
  tokenize,
  similarityScore
};
