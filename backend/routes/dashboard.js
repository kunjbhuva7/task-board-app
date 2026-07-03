const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/dashboard/stats — Admin global stats
router.get('/stats', (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const perms = isAdmin ? null : db.prepare('SELECT is_super_admin, can_view_analytics FROM permissions WHERE user_id = ?').get(req.user.id);
  if (!isAdmin && !(perms?.is_super_admin || perms?.can_view_analytics)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const totalUsers = db.prepare('SELECT count(*) as count FROM users WHERE is_active = 1').get().count;
    const tasksByStatus = db.prepare('SELECT status, count(*) as count FROM tasks GROUP BY status').all();
    const tasksCompletedThisWeek = db.prepare('SELECT count(*) as count FROM tasks WHERE status = "done" AND updated_at >= date("now", "-7 days")').get().count;
    const pendingInvites = db.prepare('SELECT count(*) as count FROM users WHERE invite_token IS NOT NULL AND password_hash IS NULL').get().count;

    const recentActivity = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM activity_log a LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC LIMIT 10
    `).all();

    const totalTasks = tasksByStatus.reduce((s, r) => s + r.count, 0);
    const doneTasks = tasksByStatus.find(r => r.status === 'done')?.count || 0;
    const inProgressTasks = tasksByStatus.find(r => r.status === 'in_progress')?.count || 0;
    const todoTasks = tasksByStatus.find(r => r.status === 'todo')?.count || 0;
    const reviewTasks = tasksByStatus.find(r => r.status === 'review')?.count || 0;
    const activeTasks = inProgressTasks + todoTasks + reviewTasks;

    res.json({
      totalUsers, totalTasks, doneTasks, inProgressTasks, todoTasks, reviewTasks, activeTasks,
      tasksCompletedThisWeek, pendingInvites, recentActivity, tasksByStatus
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/my-stats — Per-user stats (fixed SQL)
router.get('/my-stats', (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const perms = isAdmin ? null : db.prepare('SELECT can_view_all_tasks, is_super_admin FROM permissions WHERE user_id = ?').get(userId);
    const canViewAll = isAdmin || !!(perms?.is_super_admin) || !!(perms?.can_view_all_tasks);

    // Build correct queries based on scope
    let counts, dueTodayRows, recentlyUpdatedRows;

    const today = new Date().toISOString().split('T')[0];

    if (canViewAll) {
      counts = {
        todo:       db.prepare("SELECT count(*) as c FROM tasks WHERE status = 'todo'").get().c,
        inProgress: db.prepare("SELECT count(*) as c FROM tasks WHERE status = 'in_progress'").get().c,
        done:       db.prepare("SELECT count(*) as c FROM tasks WHERE status = 'done'").get().c,
        review:     db.prepare("SELECT count(*) as c FROM tasks WHERE status = 'review'").get().c,
      };
      dueTodayRows       = db.prepare("SELECT * FROM tasks WHERE date(due_date) = ? AND status != 'done' ORDER BY priority DESC LIMIT 10").all(today);
      recentlyUpdatedRows = db.prepare("SELECT t.*, u.name as creator_name FROM tasks t LEFT JOIN users u ON t.created_by = u.id ORDER BY t.updated_at DESC LIMIT 8").all();
    } else {
      counts = {
        todo:       db.prepare("SELECT count(*) as c FROM tasks WHERE created_by = ? AND status = 'todo'").get(userId).c,
        inProgress: db.prepare("SELECT count(*) as c FROM tasks WHERE created_by = ? AND status = 'in_progress'").get(userId).c,
        done:       db.prepare("SELECT count(*) as c FROM tasks WHERE created_by = ? AND status = 'done'").get(userId).c,
        review:     db.prepare("SELECT count(*) as c FROM tasks WHERE created_by = ? AND status = 'review'").get(userId).c,
      };
      dueTodayRows       = db.prepare("SELECT * FROM tasks WHERE created_by = ? AND date(due_date) = ? AND status != 'done' ORDER BY priority DESC LIMIT 10").all(userId, today);
      recentlyUpdatedRows = db.prepare("SELECT * FROM tasks WHERE created_by = ? ORDER BY updated_at DESC LIMIT 8").all(userId);
    }

    const total = counts.todo + counts.inProgress + counts.done + counts.review;
    const progressPct = total > 0 ? Math.round((counts.done / total) * 100) : 0;

    // Recent activity from log — always show for the user
    const recentActivity = db.prepare(`
      SELECT a.action, a.details, a.created_at, u.name as user_name, a.target_type
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 12
    `).all();

    res.json({
      counts: { ...counts, total },
      progressPct,
      dueToday: dueTodayRows,
      recentlyUpdated: recentlyUpdatedRows,
      recentActivity
    });
  } catch (error) {
    console.error('My stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
