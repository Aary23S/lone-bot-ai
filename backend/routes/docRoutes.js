// // //ECHO is on.
// // // routes/authRoutes.js
// // // const express = require('express');
// // // const router = express.Router();
// // // const upload = require('../utils/storageUtil');
// // // const docController = require('../controllers/docController');

// // // // Route: POST /upload
// // // // router.post('/upload', upload.array('documents', 15), docController.uploadDocument);
// // // app.post('/api/upload', uploadMiddleware, async (req, res) => {
// // //   // Your file handling logic here
// // // });
// // // module.exports = router;

// // // const express = require('express');
// // // const multer = require('multer');
// // // const router = express.Router();

// // // const path = require('path');
// // // const docController = require('../controllers/docController');

// // // // Multer setup
// // // const storage = multer.diskStorage({
// // //   destination: function (req, file, cb) {
// // //     cb(null, 'uploads/');
// // //   },
// // //   filename: function (req, file, cb) {
// // //     cb(null, Date.now() + '-' + file.originalname);
// // //   }
// // // });

// // // const upload = multer({ storage: storage });

// // // // Upload route
// // // router.post('/upload', upload.array('documents', 15), docController.uploadDocuments);

// // // module.exports = router;

// // const express = require('express');
// // const multer = require('multer');
// // const path = require('path');

// // const router = express.Router();

// // // Upload config
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => cb(null, 'uploads/'),
// //   filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
// // });

// // const upload = multer({ storage });

// // // Upload route
// // router.post('/', upload.single('file'), (req, res) => {
// //   if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
// //   res.json({ message: 'File uploaded successfully', filename: req.file.filename });
// // });

// // module.exports = router;

// // ✅ backend/routes/docRoutes.js

// const express = require('express');
// const router = express.Router();
// const upload = require('../utils/storageUtil');
// const docController = require('../controllers/docController');

// // Route: POST /api/upload
// router.post('/', upload.array('documents', 15), docController.uploadDocuments);

// module.exports = router;

// ✅ File: backend/routes/docRoutes.js

// const express = require('express');
// const upload = require('../utils/storageUtil');
// const Document = require('../models/document'); // 👈 must exist
// const router = express.Router();

// // 📥 Upload route
// router.post('/', upload.array('documents', 15), async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: 'No files uploaded' });
//     }

//     const uploadedBy = req.user?.id || null; // Placeholder if auth added later
//     const metadataList = [];

//     for (const file of req.files) {
//       const newDoc = await Document.create({
//         filename: file.originalname,
//         filepath: file.path,
//         uploaded_by: uploadedBy,
//         uploaded_at: new Date()
//       });
//       metadataList.push(newDoc);
//     }

//     res.status(201).json({
//       message: 'Files uploaded and metadata saved successfully',
//       documents: metadataList
//     });

//   } catch (err) {
//     res.status(500).json({ error: 'File upload failed', details: err.message });
//   }
// });

// router.post('/', upload.array('documents', 15), docController.uploadDocuments);

// module.exports = router;

// ✅ backend/routes/docRoutes.js

// const express = require('express');
// const router = express.Router();
// const upload = require('../utils/storageUtil');
// const docController = require('../controllers/docController');

// // Route: POST /api/upload
// router.post('/', upload.array('documents', 15), docController.uploadDocuments);

// module.exports = router;

// ✅ backend/routes/docRoutes.js

const express = require('express');
const router = express.Router();
const upload = require('../utils/storageUtil');
const docController = require('../controllers/docController');

// ✅ Route: Upload documents
// POST /api/upload
router.post('/', upload.array('documents', 15), docController.uploadDocuments);

// ✅ Route: Ask a question about uploaded documents
// POST /api/ask
router.post('/ask', docController.askQuestion);

module.exports = router;
