// const express = require('express');
// const router = express.Router();
// const upload = require('../utils/storageUtil');
// const docController = require('../controllers/docController');
// const authenticate = require('../middleware/authMiddleware');
// const relevanceGuard = require('../middleware/relevanceGuard');

// // ✅ Upload documents (POST)
// router.post('/', authenticate, upload.array('documents', 15), docController.uploadDocuments);

// // ✅ Ask a question
// router.post('/ask', authenticate, relevanceGuard, docController.askQuestion);


// // ✅ Chat history
// router.get('/history', authenticate, docController.getChatHistory);

// module.exports = router;

// backend/routes/docRoutes.js
// backend/routes/docRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../utils/storageUtil');
const docController = require('../controllers/docController');
const authenticate = require('../middleware/authMiddleware');
const relevanceGuard = require('../middleware/relevanceGuard');
const { askQuestion } = require('../controllers/docController'); 

// Upload route (already present) - keeps working
router.post('/', authenticate, upload.array('documents', 15), docController.uploadDocuments);

// Ask route - now protected and runs relevance guard
router.post('/ask', authenticate, relevanceGuard, docController.askQuestion);

// History (existing)
router.get('/history', authenticate, docController.getChatHistory);

// New: list all docs for logged in user (id, filename, uploaded_at)
router.get('/docs', authenticate, async (req, res) => {
  try {
    const Document = require('../models/document');
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const docs = await Document.findAll({
      where: { uploaded_by: userId },
      order: [['uploaded_at', 'DESC']],
      attributes: ['id', 'filename', 'uploaded_at']
    });

    res.status(200).json(docs);
  } catch (err) {
    console.error('GET /docs error:', err);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// ✅ Clear chat history for logged in user
router.delete('/history', authenticate, async (req, res) => {
  try {
    const Chat = require('../models/chat'); // Assuming your chat table model is named 'Chat'
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await Chat.destroy({ where: { user_id: userId } });

    res.status(200).json({ message: 'Chat history cleared successfully' });
  } catch (err) {
    console.error('DELETE /history error:', err);
    res.status(500).json({ message: 'Failed to clear chat history', error: err.message });
  }
});


module.exports = router;
