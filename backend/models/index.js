// // backend/models/index.js

// const User = require('./User');
// const Document = require('./document');
// const Chat = require('./chat');

// // (Optional) Define associations here if needed in future

// module.exports = {
//   User,
//   Document,
//   Chat,
// };

// backend/models/index.js

// backend/models/index.js
const sequelize = require('../utils/database');
const User = require('./User');          // you already have this
const Document = require('./document');  // you already have this (lowercase filename)
const Chat = require('./chat');          // you already have this
const DocumentChunk = require('./documentChunk'); // ✅ add this line

// Existing associations (keep yours)
Document.belongsTo(User, { foreignKey: 'uploaded_by' });
User.hasMany(Document, { foreignKey: 'uploaded_by' });

Chat.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Chat, { foreignKey: 'user_id' });

// ✅ New: document -> chunks
Document.hasMany(DocumentChunk, { foreignKey: 'document_id', onDelete: 'CASCADE' });
DocumentChunk.belongsTo(Document, { foreignKey: 'document_id' });

module.exports = {
  sequelize,
  User,
  Document,
  Chat,
  DocumentChunk, // ✅ export it
};



