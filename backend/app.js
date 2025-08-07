// // ✅ File: backend/app.js

// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// require("dotenv").config();

// const app = express();

// const sequelize = require('./utils/database'); // 🔧 STEP 1

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// // Routes
// const authRoutes = require('./routes/authRoutes');
// app.use('/api/auth', authRoutes);

// const docRoutes = require('./routes/docRoutes');
// app.use('/api/upload', docRoutes);

// app.get('/', (req, res) => res.send('Lone Bot AI Backend Running'));

// // 🔧 STEP 2: Sync DB
// sequelize.sync()
//   .then(() => console.log("✅ Database synced successfully"))
//   .catch((err) => console.error("❌ DB sync failed:", err));

// module.exports = app;

// const express = require('express');
// const app = express();
// const authRoutes = require('./routes/authRoutes');
// const docRoutes = require('./routes/docRoutes');
// const sequelize = require('./utils/database');
// const cors = require('cors');

// require('dotenv').config();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use('/api/auth', authRoutes);            // login, register
// app.use('/api/upload', docRoutes);           // ✅ this must stay exactly this

// // Root
// app.get('/', (req, res) => {
//   res.send('Lone Bot AI backend running');
// });

// module.exports = app;

// ✅ backend/app.js

// ✅ backend/app.js

// ✅ File: backend/app.js

const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/docRoutes');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Proper route prefixing
app.use('/api/auth', authRoutes);      // => /api/auth/register, /api/auth/login
app.use('/api/upload', docRoutes);     // => /api/upload, /api/upload/ask

app.use('/uploads', express.static('uploads')); // serve uploaded files

module.exports = app;
