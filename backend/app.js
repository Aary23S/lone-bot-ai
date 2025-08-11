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