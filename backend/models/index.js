// backend/models/index.js

const User = require('./User');
const Document = require('./document');
const Chat = require('./chat');

// (Optional) Define associations here if needed in future

module.exports = {
  User,
  Document,
  Chat,
};
