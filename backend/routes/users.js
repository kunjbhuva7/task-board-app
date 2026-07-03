const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');
const sendEmail = require('../utils/email');
const { sendInviteEmail } = require('../utils/email');

router.use(authMiddleware);

// GET /api/users - list all users (accessible to admin, can_view_users, can_manage_users, can_manage_roles)
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let allowed = isAdmin;

    if (!isAdmin) {
      const perms = await db.get('SELECT * FROM permissions WHERE user_id = $1', [req.user.id]);
      allowed = perms && (perms.is_super_admin || perms.can_view_users || perms.can_manage_users || perms.can_manage_roles);
    }

    if (!allowed) return res.status(403).json({ message: 'Forbidden: cannot view users' });

    const users = await db.all('SELECT id, name, email, role, is_active, invite_token, created_at FROM users');
    res.json(users);
  } catch (error) {
    console.error('GET users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users - create new user + send invite
router.post('/', async (req, res) => {
  const { email, role } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ message: 'Valid email is required' });
  const name = email.split('@')[0];

  const inviteToken = uuidv4();
  const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  try {
    const result = await db.run(
      'INSERT INTO users (name, email, role, invite_token, invite_token_expiry) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, role || 'member', inviteToken, inviteExpiry]
    );
    const userId = result.rows[0].id;

    const perms = role === 'admin' ? [1, 1, 1, 1, 1] : [1, 1, 0, 0, 0];
    await db.run(
      `INSERT INTO permissions (user_id, can_create_task, can_edit_task, can_delete_task, can_view_all_tasks, can_manage_users)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, ...perms]
    );
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Create User', 'user', userId, `Created user ${email}`]
    );

    // Inline notification for admins (replaces SQLite trigger)
    const details = `Created user ${email}`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [details]
    );

    // Respond IMMEDIATELY - don't wait for email
    const frontendUrl = process.env.FRONTEND_URL || 'https://kunjbhuva.up.railway.app';
    const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;
    res.json({
      message: 'User created successfully',
      userId,
      emailSent: true,
      inviteLink,
    });

    // Send email in BACKGROUND (non-blocking)
    sendInviteEmail(email, inviteToken).catch(err => {
      console.error('Background email error:', err.message);
    });

  } catch (error) {
    if (error.message && (error.message.includes('unique') || error.message.includes('duplicate'))) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id - edit user
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;
  try {
    await db.run('UPDATE users SET name = $1, role = $2 WHERE id = $3', [name, role, id]);
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Update User', 'user', id, `Updated user ${id}`]
    );
    res.json({ message: 'User updated' });
  } catch (error) {
    console.error('PUT user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Clear FK references before deleting
    await db.run('UPDATE tasks SET created_by = NULL WHERE created_by = $1', [id]);
    await db.run('UPDATE activity_log SET user_id = NULL WHERE user_id = $1', [id]);
    await db.run('DELETE FROM permissions WHERE user_id = $1', [id]);
    const result = await db.run('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// POST /api/users/:id/resend-invite
router.post('/:id/resend-invite', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.get('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.password_hash) return res.status(400).json({ message: 'User already set their password' });

    const inviteToken = uuidv4();
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await db.run('UPDATE users SET invite_token = $1, invite_token_expiry = $2 WHERE id = $3', [inviteToken, inviteExpiry, id]);
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Resend Invite', 'user', id, `Resent invite to ${user.email}`]
    );

    // Respond immediately
    const frontendUrl = process.env.FRONTEND_URL || 'https://kunjbhuva.up.railway.app';
    const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;
    res.json({ message: 'Invite resent', emailSent: true, inviteLink });

    // Send email in background
    sendInviteEmail(user.email, inviteToken).catch(err => {
      console.error('Background resend email error:', err.message);
    });
  } catch (error) {
    console.error('Resend invite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id/toggle-active
router.put('/:id/toggle-active', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.get('SELECT is_active FROM users WHERE id = $1', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const newStatus = user.is_active ? 0 : 1;
    await db.run('UPDATE users SET is_active = $1 WHERE id = $2', [newStatus, id]);
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Toggle Active', 'user', id, `Set user ${id} active=${newStatus}`]
    );
    res.json({ message: 'User status updated', is_active: newStatus });
  } catch (error) {
    console.error('Toggle active error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
