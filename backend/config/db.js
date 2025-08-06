// backend/config/db.js
const { Sequelize } = require('sequelize');

// 💡 Use .env variables for security
const sequelize = new Sequelize(
  process.env.DB_NAME,     // database name
  process.env.DB_USER,     // mysql username
  process.env.DB_PASS,     // mysql password
  {
    host: process.env.DB_HOST,  // usually 'localhost'
    dialect: 'mysql',
    logging: false
  }
);

module.exports = sequelize;
