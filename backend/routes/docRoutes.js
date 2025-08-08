// ✅ backend/routes/docRoutes.js
// ✅ backend/routes/docRoutes.js

const express = require('express');
const router = express.Router();
const docController = require('../controllers/docController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ Import already configured multer middleware
const upload = require('../utils/storageUtil');

// ✅ Routes
router.post('/', authMiddleware, upload.array('documents'), docController.uploadDocuments);
router.post('/ask', authMiddleware, docController.askQuestion);
router.get('/history', authMiddleware, docController.getChatHistory);

module.exports = router;
