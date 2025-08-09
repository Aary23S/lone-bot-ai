const express = require('express');
const router = express.Router();
const upload = require('../utils/storageUtil');
const docController = require('../controllers/docController');
const authenticate = require('../middleware/authMiddleware');

// ✅ Upload documents (POST)
router.post('/', authenticate, upload.array('documents', 15), docController.uploadDocuments);

// ✅ Ask a question
router.post('/ask', authenticate, docController.askQuestion);

// ✅ Chat history
router.get('/history', authenticate, docController.getChatHistory);

module.exports = router;
