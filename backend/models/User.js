const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_username',
      msg: 'Username already exists'
    },
    validate: {
      notEmpty: { msg: 'Username cannot be empty' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Email already exists'
    },
    validate: {
      isEmail: { msg: 'Email is invalid' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Optional: store AES-encrypted raw password for your admin tool
  plain_password: {
    type: DataTypes.TEXT, // TEXT in case AES output is long
    allowNull: true
  }
}, {
  tableName: 'Users'
});

module.exports = User;
