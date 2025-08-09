// ✅ backend/controllers/authController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');

const encryptPassword = (plainPassword) => {
  const cipher = crypto.createCipheriv(
    'aes-256-ctr',
    Buffer.from(process.env.ADMIN_ENCRYPT_KEY), // 32 chars key
    Buffer.alloc(16, 0) // 16 bytes IV
  );
  let encrypted = cipher.update(plainPassword, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decryptPassword = (encryptedPassword) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-ctr',
    Buffer.from(process.env.ADMIN_ENCRYPT_KEY),
    Buffer.alloc(16, 0)
  );
  let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// ✅ Register Controller
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Encrypt plain password
    const encryptedPassword = encryptPassword(password);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      plain_password: encryptedPassword
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      }
    });

  } catch (err) {
    console.error('❌ Registration Error:', err.message);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// ✅ Login Controller
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error('❌ Login Error:', err.message);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// ✅ Admin: Get decrypted password
exports.getUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const decrypted = decryptPassword(user.plain_password);
    res.status(200).json({ username: user.username, email: user.email, password: decrypted });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve password', error: err.message });
  }
};