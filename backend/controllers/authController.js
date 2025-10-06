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

/*
Module Importing

Function: Brings in external libraries and the user model needed for authentication.
Way: Uses require() to import jsonwebtoken (for tokens), bcryptjs (for password hashing), crypto (for encryption), and the User model (for database operations).
Environment Variables

Function: Provides sensitive configuration values securely.
Way: Accesses values like the encryption key and JWT secret from process.env, set via environment or .env files.
Encryption (tryEncrypt function)

Function: Optionally encrypts plain passwords for admin use.
Way: Uses AES-256-CTR algorithm with a key from environment variables; returns encrypted string or null if encryption fails.
Password Hashing

Function: Secures user passwords before storing them.
Way: Uses bcrypt.hash() to convert plain passwords into secure hashes.
Database Interaction

Function: Checks for existing users and creates new ones.
Way: Uses Sequelize model methods (findOne, create) to query and insert user data.
Input Validation

Function: Ensures requests contain all required fields and valid data.
Way: Checks the request body for presence and type of username, email, and password.
Error Handling

Function: Responds to errors with appropriate status codes and messages.
Way: Uses try-catch blocks and inspects error types to send meaningful responses.
JWT Token Generation

Function: Issues authentication tokens for logged-in users.
Way: Uses jwt.sign() to create a token containing the user ID, signed with a secret and expiration.
RESTful API Design

Function: Provides endpoints for registration and login.
Way: Defines register and login as exported async functions for POST requests.
Response Formatting

Function: Sends structured feedback to the client.
Way: Uses res.status().json() to return status codes and JSON objects with messages and user info.
*/