// backend/server.js
require('dotenv').config();
const app = require('./app');
const sequelize = require('./utils/database');

const PORT = process.env.PORT || 5000;

console.log('🟡 Starting Lone Bot AI backend...');

sequelize.authenticate()
  .then(() => {
    console.log('🔌 Database connection OK');
    return sequelize.sync({ alter: true }); // safe in dev: updates schema without dropping
  })
  .then(() => {
    console.log('✅ Database synced successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Could not start server - DB connection error:', err.message || err);
    process.exit(1);
  });
