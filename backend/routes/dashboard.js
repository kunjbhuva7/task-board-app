const express = require('express');
const router = express.Router();
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/dashboard/stats — Admin global stats
router.get('/stats', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let allowed = isAdmin;

    if (!isAdmin) {
      const perms = await db.get('SELECT is_super_admin, can_view_analytics FROM permissions WHERE user_id = $1', [req.user.id]);
      allowed = !!(perms?.is_super_admin || perms?.can_view_analytics);
    }

    if (!allowed) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const totalUsersRow = await db.get('SELECT count(*) as count FROM users WHERE is_active = 1');
    const totalUsers = parseInt(totalUsersRow.count);

    const tasksByStatus = await db.all('SELECT status, count(*) as count FROM tasks GROUP BY status');

    const tasksCompletedThisWeekRow = await db.get("SELECT count(*) as count FROM tasks WHERE status = 'done' AND updated_at >= CURRENT_DATE - INTERVAL '7 days'");
    const tasksCompletedThisWeek = parseInt(tasksCompletedThisWeekRow.count);

    const pendingInvitesRow = await db.get('SELECT count(*) as count FROM users WHERE invite_token IS NOT NULL AND password_hash IS NULL');
    const pendingInvites = parseInt(pendingInvitesRow.count);

    const recentActivity = await db.all(`
      SELECT a.*, u.name as user_name
      FROM activity_log a LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC LIMIT 10
    `);

    const totalTasks = tasksByStatus.reduce((s, r) => s + parseInt(r.count), 0);
    const doneTasks = parseInt(tasksByStatus.find(r => r.status === 'done')?.count || 0);
    const inProgressTasks = parseInt(tasksByStatus.find(r => r.status === 'in_progress')?.count || 0);
    const todoTasks = parseInt(tasksByStatus.find(r => r.status === 'todo')?.count || 0);
    const reviewTasks = parseInt(tasksByStatus.find(r => r.status === 'review')?.count || 0);
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

// GET /api/dashboard/my-stats — Per-user stats
router.get('/my-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    let canViewAll = isAdmin;

    if (!isAdmin) {
      const perms = await db.get('SELECT can_view_all_tasks, is_super_admin FROM permissions WHERE user_id = $1', [userId]);
      canViewAll = !!(perms?.is_super_admin) || !!(perms?.can_view_all_tasks);
    }

    const today = new Date().toISOString().split('T')[0];
    let counts, dueTodayRows, recentlyUpdatedRows;

    if (canViewAll) {
      const todoRow = await db.get("SELECT count(*) as c FROM tasks WHERE status = 'todo'");
      const inProgressRow = await db.get("SELECT count(*) as c FROM tasks WHERE status = 'in_progress'");
      const doneRow = await db.get("SELECT count(*) as c FROM tasks WHERE status = 'done'");
      const reviewRow = await db.get("SELECT count(*) as c FROM tasks WHERE status = 'review'");
      counts = {
        todo: parseInt(todoRow.c),
        inProgress: parseInt(inProgressRow.c),
        done: parseInt(doneRow.c),
        review: parseInt(reviewRow.c),
      };
      dueTodayRows = await db.all(
        "SELECT * FROM tasks WHERE due_date::date = $1 AND status != 'done' ORDER BY priority DESC LIMIT 10",
        [today]
      );
      recentlyUpdatedRows = await db.all(
        "SELECT t.*, u.name as creator_name FROM tasks t LEFT JOIN users u ON t.created_by = u.id ORDER BY t.updated_at DESC LIMIT 8"
      );
    } else {
      const todoRow = await db.get("SELECT count(*) as c FROM tasks WHERE created_by = $1 AND status = 'todo'", [userId]);
      const inProgressRow = await db.get("SELECT count(*) as c FROM tasks WHERE created_by = $1 AND status = 'in_progress'", [userId]);
      const doneRow = await db.get("SELECT count(*) as c FROM tasks WHERE created_by = $1 AND status = 'done'", [userId]);
      const reviewRow = await db.get("SELECT count(*) as c FROM tasks WHERE created_by = $1 AND status = 'review'", [userId]);
      counts = {
        todo: parseInt(todoRow.c),
        inProgress: parseInt(inProgressRow.c),
        done: parseInt(doneRow.c),
        review: parseInt(reviewRow.c),
      };
      dueTodayRows = await db.all(
        "SELECT * FROM tasks WHERE created_by = $1 AND due_date::date = $2 AND status != 'done' ORDER BY priority DESC LIMIT 10",
        [userId, today]
      );
      recentlyUpdatedRows = await db.all(
        "SELECT * FROM tasks WHERE created_by = $1 ORDER BY updated_at DESC LIMIT 8",
        [userId]
      );
    }

    const total = counts.todo + counts.inProgress + counts.done + counts.review;
    const progressPct = total > 0 ? Math.round((counts.done / total) * 100) : 0;

    // Recent activity from log
    const recentActivity = await db.all(`
      SELECT a.action, a.details, a.created_at, u.name as user_name, a.target_type
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 12
    `);

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
