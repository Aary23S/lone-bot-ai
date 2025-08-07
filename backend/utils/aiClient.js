// ✅ backend/utils/aiClient.js

const axios = require('axios');

/**
 * Send prompt to local Ollama server running LLaMA 3
 */
async function queryLocalAI(question, contextText) {
  try {
    const prompt = `
You are a financial analysis assistant. Based on the following document content, answer the question below precisely, with reasoning.

DOCUMENT CONTENT:
${contextText}

QUESTION:
${question}

Only give deterministic and factual answers. Avoid randomness.
`;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
      prompt,
      temperature: 0.0, // ✅ Make response deterministic
      stream: false,
    });

    return response.data.response.trim();
  } catch (error) {
    console.error('Local AI error:', error.message);
    return 'Failed to get response from local AI.';
  }
}

module.exports = { queryLocalAI };
