// // ✅ backend/utils/aiClient.js

// const axios = require('axios');

// /**
//  * Send prompt to local Ollama server running LLaMA 3
//  */
// async function queryLocalAI(question, contextText) {
//   try {
//     const prompt = `
// You are a financial analysis assistant. Based on the following document content, answer the question below precisely, with reasoning.

// DOCUMENT CONTENT:
// ${contextText}

// QUESTION:
// ${question}

// Only give deterministic and factual answers. Avoid randomness.
// `;

//     const response = await axios.post('http://localhost:11434/api/generate', {
//       model: 'mistral',
//       prompt,
//       temperature: 0.0, // ✅ Make response deterministic
//       stream: false,
//     });

//     return response.data.response.trim();
//   } catch (error) {
//     console.error('Local AI error:', error.message);
//     return 'Failed to get response from local AI.';
//   }
// }

// module.exports = { queryLocalAI };
// ✅ backend/utils/aiClient.js

const axios = require('axios');

exports.queryLocalAI = async (question, context) => {
  try {
    const prompt = `Answer the following question based on the context below.\n\nContext:\n${context}\n\nQuestion:\n${question}\n\nAnswer:`;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',       // or 'llama3' if you prefer
      prompt: prompt,
      temperature: 0.0,
      stream: false           // we want the full response
    });

    const result = response.data?.response?.trim();

    if (!result) throw new Error('No response from model');

    return result;

  } catch (err) {
    console.error('❌ AI call failed:', err.message);
    throw err;
  }
};

