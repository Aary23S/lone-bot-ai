// ✅ backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalized shape used across the app
    req.user = { userId: decoded.userId || decoded.id };
    return next();
  } catch (e) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// module.exports = authenticate;
