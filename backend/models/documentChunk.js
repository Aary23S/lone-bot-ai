// backend/models/documentChunk.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const DocumentChunk = sequelize.define('DocumentChunk', {
  document_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  chunk_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  chunk_text: {
    // long text so we don't truncate chunks
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
}, {
  tableName: 'DocumentChunks',
  timestamps: true,
});

module.exports = DocumentChunk;
