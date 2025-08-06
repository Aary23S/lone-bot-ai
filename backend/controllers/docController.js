// ✅ backend/controllers/docController.js
// const extractUtil = require('../utils/extractUtil');
// const Document = require('../models/document');

// ✅ Controller: Handle file uploads
// Route: POST /api/upload
// Add this at the top of the file
const extractUtil = require('../utils/extractUtil');
const Document = require('../models/document');

// Replace the whole uploadDocuments function with this:
exports.uploadDocuments = async (req, res) => {
  try {
    const uploadedBy = req.body.uploadedBy || 'Anonymous';
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedDocs = await Promise.all(
      files.map(async (file) => {
        let extractedText = '';

        try {
          extractedText = await extractUtil.extractTextFromFile(file.path); // ✅ extract content
        } catch (err) {
          console.error(`Failed to extract content from ${file.originalname}`);
        }

        return await Document.create({
          filename: file.originalname,
          filepath: file.path,
          uploaded_by: uploadedBy,
          uploaded_at: new Date(),
          extracted_text: extractedText, // ✅ save extracted content to DB
        });
      })
    );

    res.status(201).json({
      message: 'Files uploaded and text extracted successfully',
      files: uploadedDocs,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
};


// ✅ Controller: Simulate AI response
// Route: POST /api/ask
exports.askQuestion = async (req, res) => {
  try {
    const { question, documentIds } = req.body;

    // ✅ Validate question only
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ message: 'Question is required and must be a string.' });
    }

    let documents;

    // ✅ If documentIds are provided, use them
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      documents = await Document.findAll({
        where: { id: documentIds }
      });

      if (!documents || documents.length === 0) {
        return res.status(404).json({ message: 'No documents found for the given IDs.' });
      }
    } else {
      // ✅ If no IDs provided, fetch all documents
      documents = await Document.findAll();

      if (!documents || documents.length === 0) {
        return res.status(404).json({ message: 'No documents available in the system.' });
      }
    }

    // ✅ Dummy AI response using all/found documents
    res.status(200).json({
      answer: 'This is a dummy AI response based on all relevant documents.'
    });

  } catch (error) {
    console.error('askQuestion error:', error);
    res.status(500).json({ message: 'Error processing question.' });
  }
};

