const express = require('express');
const router = express.Router();
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');
const sendEmail = require('../utils/email');

router.use(authMiddleware);

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const perms = await db.get('SELECT can_view_all_tasks FROM permissions WHERE user_id = $1', [req.user.id]);
    const canViewAll = req.user.role === 'admin' || (perms && perms.can_view_all_tasks);

    let tasks;
    if (canViewAll) {
      tasks = await db.all('SELECT t.* FROM tasks t');
    } else {
      tasks = await db.all('SELECT t.* FROM tasks t WHERE t.created_by = $1', [req.user.id]);
    }
    res.json(tasks);
  } catch (error) {
    console.error('GET tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', checkPermission('can_create_task'), async (req, res) => {
  const { title, description, priority, due_date, project_id } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const isMember = req.user.role === 'member';
    const initialApprovalStatus = isMember ? 'pending' : 'approved';

    const result = await db.run(
      `INSERT INTO tasks (title, description, priority, created_by, due_date, approval_status, project_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, priority || 'medium', req.user.id, due_date || null, initialApprovalStatus, project_id || null]
    );
    const taskId = result.rows[0].id;

    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Create Task', 'task', taskId, `Created task: ${title}`]
    );

    // Inline notification for admins
    const details = `Created task: ${title}`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [details]
    );

    // Send email notification
    sendEmail({
      to: 'kunjbhuva301@gmail.com',
      subject: `New Task Created: ${title}`,
      text: `A new task "${title}" has been created by ${req.user.name}.\nPriority: ${priority || 'medium'}\nDue Date: ${due_date || 'None'}\n\nDescription:\n${description || 'No description provided.'}`
    }).catch(console.error);

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Task created', taskId });
  } catch (error) {
    console.error('POST task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', checkPermission('can_edit_task'), async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, due_date, status, project_id } = req.body;

  try {
    await db.run(
      `UPDATE tasks 
       SET title = $1, description = $2, priority = $3, due_date = $4, status = $5, project_id = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [title, description, priority, due_date, status, project_id || null, id]
    );

    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Edit Task', 'task', id, `Edited task: ${title}`]
    );

    // Inline notification for admins
    const logDetails = `Edited task: ${title}`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [logDetails]
    );

    if (status === 'done' || status === 'in_progress') {
      const statusLabel = status === 'done' ? 'Completed' : 'In Progress';
      const statusBg = status === 'done' ? '#dcfce7' : '#dbeafe';
      const statusColor = status === 'done' ? '#166534' : '#1e40af';

      const html = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #FF7E5F, #FEB47B); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Task Update</h1>
            </div>
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #475569; margin-top: 0;">Hi there,</p>
              <p style="font-size: 16px; color: #475569; line-height: 1.6;">The status of the task <strong>"${title}"</strong> has been updated to <span style="display: inline-block; padding: 4px 12px; background: ${statusBg}; color: ${statusColor}; border-radius: 20px; font-size: 14px; font-weight: 700; margin-left: 5px;">${statusLabel}</span>.</p>
              
              <div style="margin: 30px 0; padding: 20px; background: #f1f5f9; border-radius: 12px; border-left: 4px solid #FF7E5F;">
                <p style="margin: 0; font-size: 14px; color: #64748B;"><strong>Updated by:</strong> ${req.user.name}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/dashboard" style="display: inline-block; padding: 14px 28px; background: #1E293B; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">View Task Board</a>
              </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Helios</p>
            </div>
          </div>
        </div>
      `;

      sendEmail({
        to: 'kunjbhuva301@gmail.com',
        subject: `Task ${statusLabel}: ${title}`,
        html
      }).catch(console.error);
    }

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Task updated' });
  } catch (error) {
    console.error('PUT task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.run('UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Update Task Status', 'task', id, `Updated task ${id} status to ${status}`]
    );

    // Inline notification for admins
    const logDetails = `Updated task ${id} status to ${status}`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [logDetails]
    );

    if (status === 'done' || status === 'in_progress') {
      const task = await db.get('SELECT title FROM tasks WHERE id = $1', [id]);
      const statusLabel = status === 'done' ? 'Completed' : 'In Progress';
      const statusBg = status === 'done' ? '#dcfce7' : '#dbeafe';
      const statusColor = status === 'done' ? '#166534' : '#1e40af';

      const html = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #FF7E5F, #FEB47B); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Task Update</h1>
            </div>
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #475569; margin-top: 0;">Hi there,</p>
              <p style="font-size: 16px; color: #475569; line-height: 1.6;">The status of the task <strong>"${task.title}"</strong> has been updated to <span style="display: inline-block; padding: 4px 12px; background: ${statusBg}; color: ${statusColor}; border-radius: 20px; font-size: 14px; font-weight: 700; margin-left: 5px;">${statusLabel}</span>.</p>
              
              <div style="margin: 30px 0; padding: 20px; background: #f1f5f9; border-radius: 12px; border-left: 4px solid #FF7E5F;">
                <p style="margin: 0; font-size: 14px; color: #64748B;"><strong>Updated by:</strong> ${req.user.name}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/dashboard" style="display: inline-block; padding: 14px 28px; background: #1E293B; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">View Task Board</a>
              </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Helios</p>
            </div>
          </div>
        </div>
      `;

      sendEmail({
        to: 'kunjbhuva301@gmail.com',
        subject: `Task ${statusLabel}: ${task.title}`,
        html
      }).catch(console.error);
    }

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Status updated' });
  } catch (error) {
    console.error('PATCH task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id/submit-approval
router.put('/:id/submit-approval', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run("UPDATE tasks SET approval_status = 'submitted' WHERE id = $1", [id]);
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Submit Task', 'task', id, `Submitted task ${id} for approval`]
    );

    const details = `Submitted task ${id} for approval`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [details]
    );

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Task submitted for approval' });
  } catch (error) {
    console.error('Submit approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id/approve
router.put('/:id/approve', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const { id } = req.params;
  try {
    await db.run("UPDATE tasks SET approval_status = 'approved' WHERE id = $1", [id]);
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Approve Task', 'task', id, `Approved task ${id}`]
    );

    const details = `Approved task ${id}`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [details]
    );

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Task approved successfully' });
  } catch (error) {
    console.error('Approve task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', checkPermission('can_delete_task'), async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM tasks WHERE id = $1', [id]);
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Delete Task', 'task', id, `Deleted task ${id}`]
    );

    const details = `Deleted task ${id}`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [details]
    );

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('DELETE task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
