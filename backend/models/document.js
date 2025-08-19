const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Document = sequelize.define('Document', {
  filename: { type: DataTypes.STRING },
  filepath: { type: DataTypes.STRING },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // ✅ Make sure this matches the **table name** (capital 'U')
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  uploaded_at: { type: DataTypes.DATE },
  extracted_text: { type: DataTypes.TEXT('long') },
});

module.exports = Document;

