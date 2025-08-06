// ✅ File: backend/models/User.js

const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_username',
      msg: 'Username already exists' // ✅ Custom error message
    },
    validate: {
      notEmpty: {
        msg: 'Username cannot be empty'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = User;
