const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Chat = sequelize.define('Chat', {
  question: { type: DataTypes.TEXT },
  answer: { type: DataTypes.TEXT('long') },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: 
    {
      model: 'Users', // ✅ Table name must match
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  used_documents: { type: DataTypes.STRING },
  asked_at: { type: DataTypes.DATE },
});

module.exports = Chat;
