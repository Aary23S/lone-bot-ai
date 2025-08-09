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
// ✅ backend/models/index.js

const sequelize = require('../utils/database');
const User = require('./User');
const Document = require('./document');
const Chat = require('./chat');

// Define associations
User.hasMany(Document, { foreignKey: 'uploaded_by', onDelete: 'CASCADE' });
Document.belongsTo(User, { foreignKey: 'uploaded_by' });

User.hasMany(Chat, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Chat.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize, // ✅ exporting sequelize instance for server.js
  User,
  Document,
  Chat,
};


