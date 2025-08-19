const express = require('express');
const router = express.Router();
const { User } = require('../models');
const crypto = require('crypto');


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

// Example: GET /api/admin/user-password/:id
router.get('/user-password/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const plainPass = decryptPassword(user.plain_password);
    res.json({ username: user.username, email: user.email, password: plainPass });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving password', error: err.message });
  }
});

module.exports = router;
