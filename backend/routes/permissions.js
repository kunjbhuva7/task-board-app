const express = require('express');
const router = express.Router();
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Only admins or users with can_manage_roles can manage permissions
router.use(async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();
    const perms = await db.get('SELECT is_super_admin, can_manage_roles FROM permissions WHERE user_id = $1', [req.user.id]);
    if (perms && (perms.is_super_admin || perms.can_manage_roles)) return next();
    return res.status(403).json({ message: 'Access denied: insufficient permissions to manage roles' });
  } catch (error) {
    console.error('Permissions middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
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
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await db.get('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let perms = await db.get('SELECT * FROM permissions WHERE user_id = $1', [userId]);

    // Auto-create row if it doesn't exist yet
    if (!perms) {
      await db.run('INSERT INTO permissions (user_id) VALUES ($1)', [userId]);
      perms = await db.get('SELECT * FROM permissions WHERE user_id = $1', [userId]);
    }

    res.json(perms);
  } catch (error) {
    console.error('GET permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/permissions/:userId — update permissions
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await db.get('SELECT id FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure permissions row exists
    const existing = await db.get('SELECT id FROM permissions WHERE user_id = $1', [userId]);
    if (!existing) {
      await db.run('INSERT INTO permissions (user_id) VALUES ($1)', [userId]);
    }

    const updateClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const key of Object.keys(req.body)) {
      if (VALID_COLUMNS.includes(key)) {
        updateClauses.push(`${key} = $${paramIndex++}`);
        values.push(req.body[key] ? 1 : 0);
      }
    }

    if (updateClauses.length > 0) {
      values.push(userId);
      const stmt = `UPDATE permissions SET ${updateClauses.join(', ')} WHERE user_id = $${paramIndex}`;
      await db.run(stmt, values);

      await db.run(
        `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'Update Permissions', 'permission', userId, `Updated ${updateClauses.length} permission(s) for user ${userId}`]
      );
    }

    // Return the updated permissions
    const updated = await db.get('SELECT * FROM permissions WHERE user_id = $1', [userId]);
    res.json({ message: 'Permissions updated successfully', permissions: updated });
  } catch (error) {
    console.error('PUT permissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
