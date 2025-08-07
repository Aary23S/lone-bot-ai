// ✅ Replaced uploadDocuments to support truncation strategy

const extractUtil = require('../utils/extractUtil');
const { queryLocalAI } = require('../utils/aiClient');
const Document = require('../models/document');
const { Chat } = require('../models');

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

        // ✅ Truncate to 100k characters (Option A)
        const truncatedText = extractedText?.substring(0, 100000) || '';

        const newDoc = await Document.create({
          filename: file.originalname,
          filepath: file.path,
          uploaded_by: userId,
          uploaded_at: new Date(),
          extracted_text: truncatedText,
        });

        uploadedDocs.push(newDoc);

      } catch (fileErr) {
        console.error(`❌ Error processing ${file.originalname}:`, fileErr);
      }
    }

    if (uploadedDocs.length === 0) {
      return res.status(500).json({ message: '❌ All uploads failed. Check file type or content.' });
    }

    return res.status(201).json({
      message: uploadedDocs.length === files.length
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

const askQuestion = async (req, res) => {
  try {
    const { question, documentIds } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Missing user ID in token' });
    }

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ message: 'Question must be provided as a string' });
    }

    let documents = [];

    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      documents = await Document.findAll({
        where: {
          id: documentIds,
          uploaded_by: userId,
        },
      });
    } else {
      documents = await Document.findAll({
        where: { uploaded_by: userId },
      });
    }

    if (!documents || documents.length === 0) {
      return res.status(404).json({ message: 'No documents found for this user' });
    }

    const combinedText = documents.map(doc => doc.extracted_text || '').join('\n').trim();

    if (!combinedText || combinedText.length === 0) {
      return res.status(400).json({ message: 'Extracted text is empty for all documents' });
    }

    console.log('📤 Sending to AI model...');
    console.log('📜 Text length:', combinedText.length);
    console.log('❓ Question:', question);

    const answer = await queryLocalAI(question, combinedText);

    if (!answer || typeof answer !== 'string') {
      return res.status(500).json({ message: 'AI did not return a valid string answer' });
    }

    await Chat.create({
      question,
      answer,
      user_id: userId,
      used_documents: documents.map((doc) => doc.filename).join(', '),
      asked_at: new Date(),
    });

    return res.status(200).json({
      question,
      answer,
      usedDocuments: documents.map((doc) => doc.filename),
    });

  } catch (err) {
    console.error('❌ /ask error:', err);
    return res.status(500).json({
      message: 'Error processing the question.',
      error: err.message,
      stack: err.stack,
    });
  }
};


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

// ✅ FINAL EXPORT
module.exports = {
  uploadDocuments,
  askQuestion,
  getChatHistory,
};
