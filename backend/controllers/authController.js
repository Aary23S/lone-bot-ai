const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User'); // use the direct model to avoid index export differences

// Optional AES-256-CTR encryption of the raw password (for your admin view).
function tryEncrypt(plain) {
  const key = process.env.ADMIN_ENCRYPT_KEY;
  if (!key || key.length !== 32) {
    // Soft-fail: don't store, but don't crash either.
    return null;
  }
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
    let { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields (username, email, password) are required' });
    }

    // Normalize email
    email = String(email).trim().toLowerCase();

    // Check existing
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password for auth
    const hashed = await bcrypt.hash(password, 10);

    // Optional encrypted plain_password for admin (non-fatal if null)
    const encrypted = tryEncrypt(password); // can be null

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
    // Sequelize validation / unique errors
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
    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    email = String(email).trim().toLowerCase();

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
