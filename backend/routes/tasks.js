const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');
const sendEmail = require('../utils/email');

router.use(authMiddleware);

// GET /api/tasks
router.get('/', (req, res) => {
  try {
    const perms = db.prepare('SELECT can_view_all_tasks FROM permissions WHERE user_id = ?').get(req.user.id);
    const canViewAll = req.user.role === 'admin' || (perms && perms.can_view_all_tasks);

    let tasks;
    if (canViewAll) {
      tasks = db.prepare(`
        SELECT t.* FROM tasks t 
      `).all();
    } else {
      tasks = db.prepare(`
        SELECT t.* FROM tasks t 
        WHERE t.created_by = ?
      `).all(req.user.id);
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', checkPermission('can_create_task'), (req, res) => {
  const { title, description, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const isMember = req.user.role === 'member';
    const initialApprovalStatus = isMember ? 'pending' : 'approved';

    const insert = db.prepare(`
      INSERT INTO tasks (title, description, priority, created_by, due_date, approval_status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = insert.run(title, description, priority || 'medium', req.user.id, due_date || null, initialApprovalStatus);
    
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Create Task', 'task', info.lastInsertRowid, `Created task: ${title}`);
    
    // Send email notification
    sendEmail({
      to: 'kunjbhuva301@gmail.com',
      subject: `New Task Created: ${title}`,
      text: `A new task "${title}" has been created by ${req.user.name}.\nPriority: ${priority || 'medium'}\nDue Date: ${due_date || 'None'}\n\nDescription:\n${description || 'No description provided.'}`
    }).catch(console.error);

    req.app.get('io').emit('tasks_updated');
    res.json({ message: 'Task created', taskId: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', checkPermission('can_edit_task'), (req, res) => {
  const { id } = req.params;
  const { title, description, priority, due_date, status } = req.body;

  try {
    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, priority = ?, due_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, priority, due_date, status, id);
    
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Edit Task', 'task', id, `Edited task: ${title}`);

    if (status === 'done') {
      sendEmail({
        to: 'kunjbhuva301@gmail.com',
        subject: `Task Completed: ${title}`,
        text: `The task "${title}" has been marked as done by ${req.user.name}.`
      }).catch(console.error);
    }

    req.app.get('io').emit('tasks_updated');
    res.json({ message: 'Task updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Update Task Status', 'task', id, `Updated task ${id} status to ${status}`);
    
    if (status === 'done') {
      const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(id);
      sendEmail({
        to: 'kunjbhuva301@gmail.com',
        subject: `Task Completed: ${task.title}`,
        text: `The task "${task.title}" has been marked as done by ${req.user.name}.`
      }).catch(console.error);
    }

    req.app.get('io').emit('tasks_updated');
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id/submit-approval
router.put('/:id/submit-approval', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE tasks SET approval_status = 'submitted' WHERE id = ?").run(id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Submit Task', 'task', id, `Submitted task ${id} for approval`);
    req.app.get('io').emit('tasks_updated');
    res.json({ message: 'Task submitted for approval' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id/approve
router.put('/:id/approve', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const { id } = req.params;
  try {
    db.prepare("UPDATE tasks SET approval_status = 'approved' WHERE id = ?").run(id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Approve Task', 'task', id, `Approved task ${id}`);
    req.app.get('io').emit('tasks_updated');
    res.json({ message: 'Task approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', checkPermission('can_delete_task'), (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Delete Task', 'task', id, `Deleted task ${id}`);
    req.app.get('io').emit('tasks_updated');
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
