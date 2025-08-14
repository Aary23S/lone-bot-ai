const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User'); // direct model import

// Optional AES-256-CTR encryption for storing plain password (admin use)
function tryEncrypt(plain) {
  const key = process.env.ADMIN_ENCRYPT_KEY;
  if (!key || key.length !== 32) return null; // Soft-fail
  try {
    const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(key), Buffer.alloc(16, 0));
    let enc = cipher.update(plain, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
  } catch (e) {
    console.error('❌ AES encrypt failed:', e.message);
    return null;
  }
}

// ✅ POST /api/auth/register
exports.register = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    let { username, email, password } = req.body || {};
    username = username ? String(username).trim() : '';
    email = email ? String(email).trim().toLowerCase() : '';
    password = password ? String(password) : '';

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields (username, email, password) are required' });
    }

    // Check if email already exists
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const encrypted = tryEncrypt(password);

    const created = await User.create({
      username,
      email,
      password: hashed,
      plain_password: encrypted
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: created.id, username: created.username, email: created.email }
    });
  } catch (err) {
    console.error('❌ Registration Error:', err);
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const messages = (err.errors || []).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') || 'Validation error' });
    }
    return res.status(500).json({ message: 'Registration failed' });
  }
};

// ✅ POST /api/auth/login
exports.login = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    let { email, password } = req.body || {};
    email = email ? String(email).trim().toLowerCase() : '';
    password = password ? String(password) : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('❌ Login Error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
};
