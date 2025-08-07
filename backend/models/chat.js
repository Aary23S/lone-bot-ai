// ✅ backend/models/chat.js

const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Chat = sequelize.define('Chat', {
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  used_documents: {
    type: DataTypes.TEXT, // Store filenames or IDs as comma-separated text
    allowNull: true,
  },
  asked_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Chat;
