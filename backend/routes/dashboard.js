const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  try {
    const totalUsers = db.prepare('SELECT count(*) as count FROM users').get().count;
    const activeTasks = db.prepare('SELECT count(*) as count FROM tasks WHERE status != "done"').get().count;
    const tasksCompletedThisWeek = db.prepare('SELECT count(*) as count FROM tasks WHERE status = "done" AND updated_at >= date("now", "-7 days")').get().count;
    const pendingInvites = db.prepare('SELECT count(*) as count FROM users WHERE invite_token IS NOT NULL').get().count;
    
    const recentActivity = db.prepare(`
      SELECT a.*, u.name as user_name 
      FROM activity_log a LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC LIMIT 10
    `).all();

    const tasksByStatus = db.prepare('SELECT status, count(*) as count FROM tasks GROUP BY status').all();

    res.json({
      totalUsers, activeTasks, tasksCompletedThisWeek, pendingInvites, recentActivity, tasksByStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/my-stats
router.get('/my-stats', (req, res) => {
  try {
    const todo = db.prepare('SELECT count(*) as count FROM tasks WHERE (assigned_to = ? OR created_by = ?) AND status = "todo"').get(req.user.id, req.user.id).count;
    const inProgress = db.prepare('SELECT count(*) as count FROM tasks WHERE (assigned_to = ? OR created_by = ?) AND status = "in_progress"').get(req.user.id, req.user.id).count;
    const done = db.prepare('SELECT count(*) as count FROM tasks WHERE (assigned_to = ? OR created_by = ?) AND status = "done"').get(req.user.id, req.user.id).count;
    
    const dueToday = db.prepare('SELECT * FROM tasks WHERE (assigned_to = ? OR created_by = ?) AND date(due_date) = date("now")').all(req.user.id, req.user.id);
    const recentlyUpdated = db.prepare('SELECT * FROM tasks WHERE (assigned_to = ? OR created_by = ?) ORDER BY updated_at DESC LIMIT 5').all(req.user.id, req.user.id);

    res.json({
      counts: { todo, inProgress, done },
      dueToday,
      recentlyUpdated
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
