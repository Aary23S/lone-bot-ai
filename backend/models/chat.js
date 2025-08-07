// ✅ backend/models/chat.js

// const { DataTypes } = require('sequelize');
// const sequelize = require('../utils/database');

// const Chat = sequelize.define('Chat', {
//   question: {
//     type: DataTypes.TEXT,
//     allowNull: false,
//   },
//   answer: {
//     type: DataTypes.TEXT,
//     allowNull: false,
//   },
//   user_id: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//   },
//   used_documents: {
//     type: DataTypes.TEXT, // Store filenames or IDs as comma-separated text
//     allowNull: true,
//   },
//   asked_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW,
//   },
// });

// module.exports = Chat;

const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Chat = sequelize.define('Chat', {
  question: { type: DataTypes.TEXT },
  answer: { type: DataTypes.TEXT('long') },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // ✅ Table name must match
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  used_documents: { type: DataTypes.STRING },
  asked_at: { type: DataTypes.DATE },
});

module.exports = Chat;

