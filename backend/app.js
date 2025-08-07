// ✅ File: backend/app.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require("dotenv").config();

const app = express();

const sequelize = require('./utils/database'); // 🔧 STEP 1

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const docRoutes = require('./routes/docRoutes');
app.use('/api/upload', docRoutes);

app.get('/', (req, res) => res.send('Lone Bot AI Backend Running'));

// 🔧 STEP 2: Sync DB
sequelize.sync()
  .then(() => console.log("✅ Database synced successfully"))
  .catch((err) => console.error("❌ DB sync failed:", err));

module.exports = app;
