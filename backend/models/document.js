// ✅ File: backend/models/document.js

// ✅ backend/models/document.js

// const { DataTypes } = require('sequelize');
// const sequelize = require('../utils/database');

// const Document = sequelize.define('Document', {
//   filename: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   filepath: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   uploaded_by: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
//   uploaded_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW,
//   },
//   extracted_text: {
//     type: DataTypes.TEXT('long'), // ✅ Stores extracted file content
//     allowNull: true,
//   },
// });

// module.exports = Document;

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

