const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { body, validationResult } = require('express-validator');

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials or account inactive' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production', { expiresIn: '8h' });

    // log activity
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(user.id, 'Login', 'system', null, 'User logged in');

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/auth/verify-token/:token
router.get('/verify-token/:token', (req, res) => {
  const { token } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE invite_token = ?').get(token);
  
  if (!user) {
    return res.status(400).json({ message: 'This invite link is invalid.' });
  }

  if (new Date(user.invite_token_expiry) < new Date()) {
    return res.status(400).json({ message: 'This invite link has expired. Please ask admin to resend.' });
  }

  res.json({ email: user.email });
});

// POST /api/auth/set-password
router.post('/set-password', [
  body('token').notEmpty(),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Must contain a number')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Must contain a special character')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { token, password, name } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE invite_token = ?').get(token);
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    if (new Date(user.invite_token_expiry) < new Date()) return res.status(400).json({ message: 'This invite link has expired. Please ask admin to resend.' });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const updateStmt = db.prepare('UPDATE users SET name = ?, password_hash = ?, invite_token = NULL, invite_token_expiry = NULL WHERE id = ?');
    updateStmt.run(name, hash, user.id);

    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(user.id, 'Set Password', 'user', user.id, 'User set their name and password via invite');

    res.json({ message: 'Password set successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(req.user.id);
    const perms = db.prepare('SELECT * FROM permissions WHERE user_id = ?').get(req.user.id);
    res.json({ ...user, permissions: perms || {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', require('../middleware/auth'), (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters' });
  try {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Update Profile', 'user', req.user.id, 'User updated their profile name');
    res.json({ message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/password
router.put('/password', require('../middleware/auth'), [
  body('current').notEmpty().withMessage('Current password is required'),
  body('newPass').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/\d/).withMessage('Must contain a number')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Must contain a special character')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { current, newPass } = req.body;

  try {
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user || !user.password_hash) return res.status(400).json({ message: 'User not found' });

    const isMatch = bcrypt.compareSync(current, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPass, salt);

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Update Password', 'user', req.user.id, 'User updated their password');

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
