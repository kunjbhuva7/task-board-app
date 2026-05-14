const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');

router.use(authMiddleware);
router.use(checkPermission('can_manage_users'));

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const perms = db.prepare('SELECT * FROM permissions WHERE user_id = ?').get(userId);
  if (!perms) return res.status(404).json({ message: 'Permissions not found' });
  res.json(perms);
});

router.put('/:userId', (req, res) => {
  const { userId } = req.params;
  const { 
    can_create_task, 
    can_edit_task, 
    can_delete_task, 
    can_assign_task, 
    can_view_all_tasks, 
    can_manage_users 
  } = req.body;

  try {
    db.prepare(`
      UPDATE permissions SET 
        can_create_task = ?, 
        can_edit_task = ?, 
        can_delete_task = ?, 
        can_assign_task = ?, 
        can_view_all_tasks = ?, 
        can_manage_users = ?
      WHERE user_id = ?
    `).run(
      can_create_task ? 1 : 0,
      can_edit_task ? 1 : 0,
      can_delete_task ? 1 : 0,
      can_assign_task ? 1 : 0,
      can_view_all_tasks ? 1 : 0,
      can_manage_users ? 1 : 0,
      userId
    );

    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Update Permissions', 'permission', userId, `Updated permissions for user ${userId}`);

    res.json({ message: 'Permissions updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
