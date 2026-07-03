const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { sendResetEmail } = require('../utils/email');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in a few minutes.' },
});
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again later.' },
});

// Helper: insert notification for all admins
async function notifyAdmins(userId, details) {
  try {
    await db.run(`INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'`, [details]);
  } catch (e) { /* ignore notification failures */ }
}

// POST /api/auth/login
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = $1 AND is_active = 1', [email]);
    if (!user || !user.password_hash) return res.status(401).json({ message: 'Invalid credentials or account inactive' });
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_change_me', { expiresIn: '8h' });
    await db.run(`INSERT INTO activity_log (user_id, action, target_type, details) VALUES ($1, $2, $3, $4)`, [user.id, 'Login', 'system', 'User logged in']);
    await notifyAdmins(user.id, 'User logged in');

    // Send login alert email (non-blocking)
    const { sendLoginAlert } = require('../utils/email');
    sendLoginAlert(user.email, user.name).catch(() => {});

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/auth/verify-token/:token
router.get('/verify-token/:token', async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE invite_token = $1', [req.params.token]);
  if (!user) return res.status(400).json({ message: 'This invite link is invalid.' });
  if (new Date(user.invite_token_expiry) < new Date()) return res.status(400).json({ message: 'This invite link has expired. Please ask admin to resend.' });
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
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { token, password, name } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE invite_token = $1', [token]);
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    if (new Date(user.invite_token_expiry) < new Date()) return res.status(400).json({ message: 'This invite link has expired.' });
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    await db.run('UPDATE users SET name = $1, password_hash = $2, invite_token = NULL, invite_token_expiry = NULL WHERE id = $3', [name, hash, user.id]);
    await db.run(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`, [user.id, 'Set Password', 'user', user.id, 'User set their name and password via invite']);
    await notifyAdmins(user.id, 'User set their password via invite');
    res.json({ message: 'Password set successfully' });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotLimiter, [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = $1 AND is_active = 1', [email]);
    if (!user) return res.status(404).json({ message: 'No account found with this email address' });
    const resetToken = crypto.randomUUID();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db.run('UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3', [resetToken, resetExpiry, user.id]);
    await db.run(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`, [user.id, 'Forgot Password', 'user', user.id, `Password reset requested for ${user.email}`]);
    res.json({ message: 'A password reset link has been sent to your email' });
    sendResetEmail(user.email, resetToken).catch(err => console.error('Background reset email error:', err.message));
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/auth/verify-reset-token/:token
router.get('/verify-reset-token/:token', async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE reset_token = $1', [req.params.token]);
  if (!user) return res.status(400).json({ message: 'This reset link is invalid.' });
  if (!user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' });
  res.json({ email: user.email });
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Must contain a number')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Must contain a special character')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { token, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE reset_token = $1', [token]);
    if (!user) return res.status(400).json({ message: 'Invalid or already used reset link' });
    if (!user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) return res.status(400).json({ message: 'This reset link has expired.' });
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    await db.run('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, is_active = 1 WHERE id = $2', [hash, user.id]);
    await db.run(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`, [user.id, 'Reset Password', 'user', user.id, 'User reset their password via email link']);
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await db.get('SELECT id, name, email, role, is_active, created_at, email_notifications FROM users WHERE id = $1', [req.user.id]);
    const perms = await db.get('SELECT * FROM permissions WHERE user_id = $1', [req.user.id]);
    res.json({ ...user, permissions: perms || {} });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/auth/notification-preferences
router.put('/notification-preferences', require('../middleware/auth'), async (req, res) => {
  const { email_notifications } = req.body;
  try {
    const val = email_notifications ? 1 : 0;
    await db.run('UPDATE users SET email_notifications = $1 WHERE id = $2', [val, req.user.id]);
    res.json({ message: 'Notification preferences updated', email_notifications: val });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/auth/profile
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters' });
  try {
    await db.run('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), req.user.id]);
    await db.run(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`, [req.user.id, 'Update Profile', 'user', req.user.id, 'User updated their profile name']);
    res.json({ message: 'Profile updated' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/auth/password
router.put('/password', require('../middleware/auth'), [
  body('current').notEmpty().withMessage('Current password is required'),
  body('newPass').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/\d/).withMessage('Must contain a number')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Must contain a special character')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { current, newPass } = req.body;
  try {
    const user = await db.get('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!user || !user.password_hash) return res.status(400).json({ message: 'User not found' });
    const isMatch = bcrypt.compareSync(current, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPass, salt);
    await db.run('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    await db.run(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`, [req.user.id, 'Update Password', 'user', req.user.id, 'User updated their password']);
    res.json({ message: 'Password updated successfully' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Test email connectivity
router.get('/test-email', async (req, res) => {
  try {
    const sendEmail = require('../utils/email');
    const result = await sendEmail({
      to: 'kunjbhuva301@gmail.com',
      subject: 'Purple Email Test (Resend)',
      text: 'If you received this, Resend email is working on Railway!'
    });
    res.json({ result, env: { RESEND_API_KEY: !!process.env.RESEND_API_KEY } });
  } catch (err) {
    res.json({ error: err.message, env: { RESEND_API_KEY: !!process.env.RESEND_API_KEY } });
  }
});

module.exports = router;
