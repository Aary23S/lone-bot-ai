// ✅ backend/controllers/docController.js

const extractUtil = require('../utils/extractUtil');
const { queryLocalAI } = require('../utils/aiClient');
const Document = require('../models/document');
const { Chat } = require('../models');


// Replace the whole uploadDocuments function with this:
exports.uploadDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedDocs = [];

    for (const file of files) {
      try {
        const extractedText = await extractUtil.extractTextFromFile(file.path);

        const newDoc = await Document.create({
          filename: file.originalname,
          filepath: file.path,
          uploaded_by: userId,
          uploaded_at: new Date(),
          extracted_text: extractedText || '',
        });

        uploadedDocs.push(newDoc);

      } catch (error) {
        console.error(`❌ Failed to extract text from ${file.originalname}:`, error.message);
        // Don't throw here — allow other files to continue
      }
    }

    if (uploadedDocs.length === 0) {
      return res.status(500).json({ message: 'All file uploads failed. Please check file formats or size limits.' });
    }

    res.status(201).json({
      message: uploadedDocs.length === files.length
        ? '✅ All files uploaded successfully'
        : `⚠️ Only ${uploadedDocs.length} out of ${files.length} files uploaded successfully.`,
      files: uploadedDocs,
    });

  } catch (err) {
    console.error('❌ Upload error:', err.message);
    res.status(500).json({ message: 'Internal server error during file upload' });
  }
};




// ✅ backend/controllers/docController.js

exports.askQuestion = async (req, res) => {
  console.log("ASK QUESTION ROUTE HIT");
  console.log("Request body:", req.body);
  console.log("User ID:", req.user.userId);

  try {
    const { question, documentIds } = req.body;
    const userId = req.user.userId; // Authenticated user from JWT

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    let documents;

    // If documentIds are provided, restrict to only user's documents
    if (documentIds && documentIds.length > 0) {
      documents = await Document.findAll({
        where: {
          id: documentIds,
          uploaded_by: userId,
        },
      });
    } else {
      // Otherwise, fetch all documents uploaded by this user
      documents = await Document.findAll({
        where: {
          uploaded_by: userId,
        },
      });
    }

    if (!documents || documents.length === 0) {
      return res.status(404).json({ message: 'No documents found for this user' });
    }

    const combinedText = documents.map((doc) => doc.extracted_text || '').join('\n');

    if (!combinedText) {
      return res.status(400).json({ message: 'No extracted content found in user\'s documents.' });
    }

    const answer = await queryLocalAI(question, combinedText);

    // Save chat to DB
    await Chat.create({
      question,
      answer,
      user_id: userId,
      used_documents: documents.map((doc) => doc.filename).join(', '),
      asked_at: new Date(),
    });

    res.status(200).json({
      question,
      answer,
      usedDocuments: documents.map((doc) => doc.filename),
    });
  }
  catch (error) {
  console.error('❌ FULL ERROR IN /ask');
  console.error(error); // <-- shows stack trace and full cause
  res.status(500).json({
    message: 'Error processing the question.',
    error: error.message,
    details: error.stack
  });
}

};

// ✅ Get all chat history for the logged-in user
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.findAll({
      where: { user_id: userId },
      order: [['asked_at', 'DESC']], // latest first
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
