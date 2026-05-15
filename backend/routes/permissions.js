const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Only admins or users with can_manage_roles can manage permissions
router.use((req, res, next) => {
  if (req.user.role === 'admin') return next();
  const perms = db.prepare('SELECT is_super_admin, can_manage_roles FROM permissions WHERE user_id = ?').get(req.user.id);
  if (perms && (perms.is_super_admin || perms.can_manage_roles)) return next();
  return res.status(403).json({ message: 'Access denied: insufficient permissions to manage roles' });
});

const VALID_COLUMNS = [
  'can_create_task', 'can_edit_task', 'can_delete_task', 'can_view_all_tasks',
  'can_manage_users', 'can_view_users', 'can_create_users', 'can_edit_users',
  'can_delete_users', 'can_manage_roles', 'can_manage_tasks', 'can_approve_requests',
  'can_view_analytics', 'can_manage_events', 'can_manage_notifications',
  'can_manage_settings', 'can_view_reports', 'can_export_data',
  'is_read_only', 'is_super_admin'
];

// GET /api/permissions/:userId — fetch current permissions
router.get('/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let perms = db.prepare('SELECT * FROM permissions WHERE user_id = ?').get(userId);

    // Auto-create row if it doesn't exist yet
    if (!perms) {
      db.prepare('INSERT INTO permissions (user_id) VALUES (?)').run(userId);
      perms = db.prepare('SELECT * FROM permissions WHERE user_id = ?').get(userId);
    }

    res.json(perms);
  } catch (error) {
    console.error('GET permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/permissions/:userId — update permissions
router.put('/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure permissions row exists
    const existing = db.prepare('SELECT id FROM permissions WHERE user_id = ?').get(userId);
    if (!existing) {
      db.prepare('INSERT INTO permissions (user_id) VALUES (?)').run(userId);
    }

    const updateClauses = [];
    const values = [];

    for (const key of Object.keys(req.body)) {
      if (VALID_COLUMNS.includes(key)) {
        updateClauses.push(`${key} = ?`);
        values.push(req.body[key] ? 1 : 0);
      }
    }

    if (updateClauses.length > 0) {
      values.push(userId);
      const stmt = `UPDATE permissions SET ${updateClauses.join(', ')} WHERE user_id = ?`;
      db.prepare(stmt).run(...values);

      db.prepare(
        `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`
      ).run(
        req.user.id,
        'Update Permissions',
        'permission',
        userId,
        `Updated ${updateClauses.length} permission(s) for user ${userId}`
      );
    }

    // Return the updated permissions
    const updated = db.prepare('SELECT * FROM permissions WHERE user_id = ?').get(userId);
    res.json({ message: 'Permissions updated successfully', permissions: updated });
  } catch (error) {
    console.error('PUT permissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
