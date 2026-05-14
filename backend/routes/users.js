const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');
const { sendInviteEmail } = require('../utils/email');

router.use(authMiddleware);
router.use(checkPermission('can_manage_users'));

// GET /api/users - list all users
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, is_active, invite_token, created_at FROM users').all();
  res.json(users);
});

// POST /api/users - create new user + send invite
router.post('/', async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || name.length < 2) return res.status(400).json({ message: 'Name is required (min 2 chars)' });
  if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ message: 'Valid email is required' });

  const inviteToken = uuidv4();
  const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  try {
    const insertUser = db.prepare('INSERT INTO users (name, email, role, invite_token, invite_token_expiry) VALUES (?, ?, ?, ?, ?)');
    const info = insertUser.run(name, email, role || 'member', inviteToken, inviteExpiry);
    const userId = info.lastInsertRowid;

    const perms = role === 'admin'
      ? [1, 1, 1, 1, 1, 1]
      : [1, 1, 0, 0, 0, 0];

    db.prepare(`
      INSERT INTO permissions (user_id, can_create_task, can_edit_task, can_delete_task, can_assign_task, can_view_all_tasks, can_manage_users)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, ...perms);

    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Create User', 'user', userId, `Created user ${email}`);

    // Send invite email
    const emailResult = await sendInviteEmail(email, inviteToken);

    res.json({
      message: 'User created successfully',
      userId,
      emailSent: emailResult.sent,
      inviteLink: emailResult.inviteLink,
      previewUrl: emailResult.previewUrl || null,
    });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id - edit user
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;
  try {
    db.prepare('UPDATE users SET name = ?, role = ? WHERE id = ?').run(name, role, id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Update User', 'user', id, `Updated user ${id}`);
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM permissions WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Delete User', 'user', id, `Deleted user ${id}`);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/:id/resend-invite
router.post('/:id/resend-invite', async (req, res) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.password_hash) return res.status(400).json({ message: 'User already set their password' });

    const inviteToken = uuidv4();
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    db.prepare('UPDATE users SET invite_token = ?, invite_token_expiry = ? WHERE id = ?').run(inviteToken, inviteExpiry, id);
    
    const emailResult = await sendInviteEmail(user.email, inviteToken);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Resend Invite', 'user', id, `Resent invite to ${user.email}`);

    res.json({
      message: 'Invite resent',
      emailSent: emailResult.sent,
      inviteLink: emailResult.inviteLink,
      previewUrl: emailResult.previewUrl || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id/toggle-active
router.put('/:id/toggle-active', (req, res) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const newStatus = user.is_active ? 0 : 1;
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Toggle Active', 'user', id, `Set user ${id} active=${newStatus}`);
    res.json({ message: 'User status updated', is_active: newStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
