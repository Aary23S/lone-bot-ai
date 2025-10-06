// backend/controllers/docController.js
const extractUtil = require('../utils/extractUtil');
const { queryLocalAI } = require('../utils/aiClient');
const Document = require('../models/document');
const { Chat } = require('../models');
const DocumentChunk = require('../models/documentChunk');
const config = require('../config/retrievalConfig');

const {
  chunkTextBySize,
  tokenize
} = require('../utils/simpleTextSimilarity');

// ==================== UPLOAD DOCUMENTS ====================
const uploadDocuments = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const files = req.files;

    if (!userId) {
      return res.status(401).json({ message: 'User ID missing from token' });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedDocs = [];

    for (const file of files) {
      try {
        const extractedText = await extractUtil.extractTextFromFile(file.path);
        const truncatedText = extractedText?.substring(0, 100000) || '';

        const newDoc = await Document.create({
          filename: file.originalname,
          filepath: file.path,
          uploaded_by: userId,
          uploaded_at: new Date(),
          extracted_text: truncatedText,
        });
        uploadedDocs.push(newDoc);

        // Pre-chunk and store chunks for faster retrieval on queries
        try {
          const pieces = chunkTextBySize(truncatedText || '', config.CHUNK_SIZE);
          if (pieces && pieces.length > 0) {
            const rows = pieces.map((p, idx) => ({
              document_id: newDoc.id,
              chunk_index: idx,
              chunk_text: p,
              token_count: tokenize(p).length || null,
            }));
            await DocumentChunk.bulkCreate(rows);
          }
        } catch (chunkErr) {
          console.warn(`⚠ Failed to create chunks for ${file.originalname}:`, chunkErr.message || chunkErr);
        }

      } catch (fileErr) {
        console.error(`❌ Error processing ${file.originalname}:`, fileErr);
      }
    }

    if (uploadedDocs.length === 0) {
      return res.status(500).json({ message: '❌ All uploads failed. Check file type or content.' });
    }

    return res.status(201).json({
      message:
        uploadedDocs.length === files.length
          ? '✅ All files uploaded successfully'
          : `⚠️ Only ${uploadedDocs.length} of ${files.length} files uploaded.`,
      files: uploadedDocs,
    });
  } catch (err) {
    console.error('❌ Upload Controller Error:', err.stack);
    res.status(500).json({
      message: '❌ Internal server error during upload',
      error: err.message,
    });
  }
};

// ==================== ASK QUESTION ====================
const askQuestion = async (req, res) => {
  try {
    const { question } = req.body || {};
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Missing user ID in token' });
    }
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ message: 'Question must be provided as a string' });
    }

    // must be set by relevanceGuard
    const combinedText = (req.docContext || '').trim();
    const usedDocuments = Array.isArray(req.usedDocuments) ? req.usedDocuments : [];

    // If no context was retrieved, don't let the model hallucinate.
    if (!combinedText) {
      return res.status(200).json({
        answer: 'No relevant information found in the uploaded documents.'
      });
    }

    // Finance-aware hint (light touch)
    const financeKeywords = ['revenue', 'profit', 'balance', 'asset', 'liability', 'forecast', 'q1', 'q2', 'q3', 'q4', 'fiscal', 'financial', 'income', 'cashflow'];
    const financeDetected = financeKeywords.some(k => question.toLowerCase().includes(k)) ||
      usedDocuments.some(fn => financeKeywords.some(k => fn.toLowerCase().includes(k)));

    // Strict grounding instruction prevents biryani/hallucinations
    let instruction =
      `You MUST answer using ONLY the provided document excerpts below. ` +
      `If the excerpts do not contain the explicit answer, respond exactly:\n` +
      `"No relevant information found in the uploaded documents." ` +
      `Do NOT use outside knowledge or guess. Cite nothing beyond the provided excerpts. stick to the facts. ` +
      `If the question is not answerable from the documents, return that exact phrase. Confind to the uploaded documents, seleced documents, and their excerpts. ` +
      `If the question is about a specific document, use the filename as context. `;;

    if (financeDetected) {
      instruction += ' Provide concise analysis, state assumptions clearly, and do not invent numbers. Analyse the data strictly based on the provided documents. Predict future trends only if explicitly supported by the documents.';
    }

    const prompt = `${instruction}

Context:
${combinedText}

Question:
${question}

Answer:`;

    console.log('📤 Sending to AI model...');
    console.log('📜 Context length:', combinedText.length);
    console.log('🗂️ Sources:', usedDocuments);
    console.log('❓ Question:', question);

    // Send the fully-formed prompt
    const answer = await queryLocalAI(question, prompt);

    if (!answer || typeof answer !== 'string') {
      return res.status(500).json({ message: 'AI did not return a valid string answer' });
    }

    // Ensure we don't accidentally pass through a non-grounded answer
    const cleaned = answer.trim();
    let finalAnswer = cleaned;
    if (!cleaned || /^no relevant information/i.test(cleaned)) {
      finalAnswer = 'No relevant information found in the uploaded documents.';
    }

    const disclaimer = '\n\n---\nAnswer is based only on the provided documents.';
    const answerWithSources = `${finalAnswer}${disclaimer}\n\nSources: ${usedDocuments.join(', ')}`;

    await Chat.create({
      question,
      answer: answerWithSources,
      user_id: userId,
      used_documents: usedDocuments.join(', '),
      asked_at: new Date(),
    });

    return res.status(200).json({
      question,
      answer: finalAnswer,
      answerWithSources,
      usedDocuments,
    });

  } catch (err) {
    console.error('❌ /ask error:', err);
    return res.status(500).json({
      message: 'Error processing the question.',
      error: err.message,
    });
  }
};

// ==================== CHAT HISTORY ====================
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.findAll({
      where: { user_id: userId },
      order: [['asked_at', 'DESC']],
    });

    res.status(200).json({
      user: userId,
      history: chats,
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
};

module.exports = {
  uploadDocuments,
  askQuestion,
  getChatHistory,
};

/**
 * Module Importing

Function: Brings in utilities, AI client, models, and configuration needed for document processing and querying.
Way: Uses require() to import modules at the top of the file.
Asynchronous Programming

Function: Handles file uploads, database operations, and AI queries without blocking the server.
Way: Declares controller functions as async and uses await for promises.
RESTful API Design

Function: Provides endpoints for uploading documents, asking questions, and retrieving chat history.
Way: Defines controller functions (uploadDocuments, askQuestion, getChatHistory) for use in routes.
User Authentication

Function: Ensures only authenticated users can upload documents or ask questions.
Way: Reads user ID from req.user (set by authentication middleware).
File Handling

Function: Processes uploaded files and extracts their text content.
Way: Iterates over req.files, uses extractUtil.extractTextFromFile().
Text Extraction and Chunking

Function: Prepares documents for efficient retrieval and querying.
Way: Extracts text, truncates it, splits into chunks (chunkTextBySize), tokenizes, and stores in the database.
Database Interaction

Function: Stores and retrieves documents, chunks, and chat history.
Way: Uses Sequelize models (Document, DocumentChunk, Chat) for CRUD operations.
Input Validation

Function: Ensures requests contain all required and valid data.
Way: Checks for presence and type of user ID, files, and question in requests.
Error Handling

Function: Responds to errors with appropriate status codes and messages.
Way: Uses try-catch blocks and sends JSON error responses.
AI Integration

Function: Answers user questions based on uploaded documents.
Way: Builds a prompt and sends it to the local AI model (queryLocalAI).
Contextual Prompt Engineering

Function: Guides the AI to answer strictly from provided document excerpts.
Way: Constructs detailed instructions and context for the AI prompt.
Finance Keyword Detection

Function: Adjusts AI instructions for finance-related questions.
Way: Checks for finance keywords in the question and document filenames.
Response Formatting

Function: Sends structured feedback to the client.
Way: Uses res.status().json() to return status codes and JSON objects.
Exporting Functions

Function: Makes controller functions available for routing.
Way: Exports the functions via module.exports.
 * 
 * 
 */