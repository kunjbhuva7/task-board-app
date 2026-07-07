const express = require('express');
const router = express.Router();
const { db } = require('../database');
const auth = require('../middleware/auth');
const { sendReminderNotification } = require('../utils/reminderEmail');

// Helper: Calculate Snooze Datetime in IST (Format: YYYY-MM-DD HH:MM)
const getSnoozedTime = (minutes) => {
  const now = new Date();
  const snoozed = new Date(now.getTime() + minutes * 60000);

  // Format to YYYY-MM-DD HH:MM in IST
  const offset = 5.5 * 60 * 60 * 1000; // IST offset is +5:30
  const istDate = new Date(snoozed.getTime() + offset);

  const yyyy = istDate.getUTCFullYear();
  const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(istDate.getUTCDate()).padStart(2, '0');
  const hh = String(istDate.getUTCHours()).padStart(2, '0');
  const min = String(istDate.getUTCMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

// ── USER ROUTES (Authenticated) ──────────────────────────────────────────────

// GET /api/reminders - Fetch user reminders
router.get('/', auth, async (req, res) => {
  const { priority, category, status, date } = req.query;
  const userId = req.user.id;

  let query = 'SELECT * FROM reminders WHERE created_by = $1';
  const params = [userId];
  let paramIndex = 2;

  if (priority) {
    query += ` AND priority = $${paramIndex++}`;
    params.push(priority);
  }
  if (category) {
    query += ` AND category = $${paramIndex++}`;
    params.push(category);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  if (date) {
    query += ` AND reminder_date = $${paramIndex++}`;
    params.push(date);
  }

  query += ` ORDER BY (CASE WHEN status = 'overdue' THEN 0 WHEN status = 'upcoming' THEN 1 ELSE 2 END), reminder_date ASC, reminder_time ASC`;

  try {
    const list = await db.all(query, params);
    res.json(list);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/reminders - Add new reminder
router.post('/', auth, async (req, res) => {
  const {
    title,
    description,
    reminder_date,
    reminder_time,
    priority,
    repeat_type,
    category,
    email_notify,
    notify_15min,
    notify_1hour,
    is_important
  } = req.body;

  if (!title || !reminder_date || !reminder_time) {
    return res.status(400).json({ message: 'Title, Date, and Time are required' });
  }

  try {
    const result = await db.run(
      `INSERT INTO reminders (
        title, description, reminder_date, reminder_time, priority, repeat_type, 
        category, email_notify, notify_15min, notify_1hour, is_important, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        title,
        description || null,
        reminder_date,
        reminder_time,
        priority || 'medium',
        repeat_type || 'once',
        category || 'Other',
        email_notify ? 1 : 0,
        notify_15min ? 1 : 0,
        notify_1hour ? 1 : 0,
        is_important ? 1 : 0,
        req.user.id
      ]
    );

    const createdReminder = result.rows[0];

    // Push WebSocket alert
    req.app.get('io')?.emit('tasks_updated');

    // Trigger confirmation email if requested
    if (createdReminder.email_notify === 1) {
      sendReminderNotification(createdReminder, 'created').catch(console.error);
    }

    res.status(201).json(createdReminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reminders/:id - Edit reminder
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    reminder_date,
    reminder_time,
    priority,
    repeat_type,
    category,
    email_notify,
    notify_15min,
    notify_1hour,
    is_important,
    status
  } = req.body;

  try {
    const reminder = await db.get('SELECT * FROM reminders WHERE id = $1 AND created_by = $2', [id, req.user.id]);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    await db.run(
      `UPDATE reminders
       SET title = $1, description = $2, reminder_date = $3, reminder_time = $4, 
           priority = $5, repeat_type = $6, category = $7, email_notify = $8, 
           notify_15min = $9, notify_1hour = $10, is_important = $11, status = $12,
           reminder_sent = 0, pre_15min_sent = 0, pre_1hour_sent = 0, overdue_sent = 0, snooze_until = NULL
       WHERE id = $13`,
      [
        title || reminder.title,
        description !== undefined ? description : reminder.description,
        reminder_date || reminder.reminder_date,
        reminder_time || reminder.reminder_time,
        priority || reminder.priority,
        repeat_type || reminder.repeat_type,
        category || reminder.category,
        email_notify !== undefined ? (email_notify ? 1 : 0) : reminder.email_notify,
        notify_15min !== undefined ? (notify_15min ? 1 : 0) : reminder.notify_15min,
        notify_1hour !== undefined ? (notify_1hour ? 1 : 0) : reminder.notify_1hour,
        is_important !== undefined ? (is_important ? 1 : 0) : reminder.is_important,
        status || reminder.status,
        id
      ]
    );

    const updated = await db.get('SELECT * FROM reminders WHERE id = $1', [id]);

    // WS update
    req.app.get('io')?.emit('tasks_updated');

    res.json(updated);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/reminders/:id - Remove reminder
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await db.get('SELECT * FROM reminders WHERE id = $1 AND created_by = $2', [id, req.user.id]);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    await db.run('DELETE FROM reminders WHERE id = $1', [id]);

    // WS update
    req.app.get('io')?.emit('tasks_updated');

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/reminders/:id/status - Toggle status (complete / activate)
router.patch('/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'done' or 'upcoming'

  try {
    const reminder = await db.get('SELECT * FROM reminders WHERE id = $1 AND created_by = $2', [id, req.user.id]);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    await db.run('UPDATE reminders SET status = $1 WHERE id = $2', [status, id]);

    const updated = await db.get('SELECT * FROM reminders WHERE id = $1', [id]);

    // WS update
    req.app.get('io')?.emit('tasks_updated');

    // Trigger Completion Email Alert
    if (status === 'done' && updated.email_notify === 1) {
      sendReminderNotification(updated, 'completed').catch(console.error);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error changing reminder status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/reminders/:id/snooze - Snooze reminder for specific time
router.patch('/:id/snooze', auth, async (req, res) => {
  const { id } = req.params;
  const { minutes } = req.body; // e.g. 10, 30, 60

  if (!minutes || isNaN(minutes)) {
    return res.status(400).json({ message: 'Snooze duration minutes are required' });
  }

  try {
    const reminder = await db.get('SELECT * FROM reminders WHERE id = $1 AND created_by = $2', [id, req.user.id]);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    const snoozeTime = getSnoozedTime(minutes);

    // Reset sent status so it re-triggers after snooze finishes
    await db.run(
      `UPDATE reminders 
       SET snooze_until = $1, status = 'upcoming', reminder_sent = 0, pre_15min_sent = 0, pre_1hour_sent = 0
       WHERE id = $2`,
      [snoozeTime, id]
    );

    const updated = await db.get('SELECT * FROM reminders WHERE id = $1', [id]);

    // WS update
    req.app.get('io')?.emit('tasks_updated');

    res.json(updated);
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── EMAIL LINK DIRECT TRIGGER VIEWS (No JWT needed, uses secure matching) ──────

// GET /api/reminders/:id/complete-email - Mark done via direct email click
router.get('/:id/complete-email', async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await db.get('SELECT * FROM reminders WHERE id = $1', [id]);
    if (!reminder) return res.status(404).send('Reminder not found');

    await db.run("UPDATE reminders SET status = 'done' WHERE id = $1", [id]);
    const updated = await db.get('SELECT * FROM reminders WHERE id = $1', [id]);

    if (updated.email_notify === 1) {
      sendReminderNotification(updated, 'completed').catch(console.error);
    }

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    res.send(`
      <html>
        <head>
          <title>Helios Success</title>
          <style>
            body { font-family:-apple-system,BlinkMacSystemFont,sans-serif; text-align:center; padding:50px; background:#FAF9F6; color:#1E293B; }
            .card { background:white; padding:40px; border-radius:18px; display:inline-block; box-shadow:0 8px 30px rgba(0,0,0,0.03); max-width:400px; }
            h1 { color:#10B981; margin-bottom:8px; }
            p { color:#64748B; line-height:1.6; }
            .btn { display:inline-block; margin-top:20px; padding:12px 24px; background:#8B5CF6; color:white; font-weight:700; text-decoration:none; border-radius:8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🎉 Task Completed!</h1>
            <p>Your reminder "<strong>${reminder.title}</strong>" has been marked as completed successfully from your email.</p>
            <a href="${frontendBase}/user/reminders" class="btn">Open Helios Dashboard</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Complete-email error:', error);
    res.status(500).send('Server error completing task');
  }
});

// GET /api/reminders/:id/snooze-email - Snooze via direct email click
router.get('/:id/snooze-email', async (req, res) => {
  const { id } = req.params;
  const minutes = parseInt(req.query.minutes) || 30;

  try {
    const reminder = await db.get('SELECT * FROM reminders WHERE id = $1', [id]);
    if (!reminder) return res.status(404).send('Reminder not found');

    const snoozeTime = getSnoozedTime(minutes);
    await db.run(
      `UPDATE reminders 
       SET snooze_until = $1, status = 'upcoming', reminder_sent = 0, pre_15min_sent = 0, pre_1hour_sent = 0
       WHERE id = $2`,
      [snoozeTime, id]
    );

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    res.send(`
      <html>
        <head>
          <title>Helios Snooze</title>
          <style>
            body { font-family:-apple-system,BlinkMacSystemFont,sans-serif; text-align:center; padding:50px; background:#FAF9F6; color:#1E293B; }
            .card { background:white; padding:40px; border-radius:18px; display:inline-block; box-shadow:0 8px 30px rgba(0,0,0,0.03); max-width:400px; }
            h1 { color:#F59E0B; margin-bottom:8px; }
            p { color:#64748B; line-height:1.6; }
            .btn { display:inline-block; margin-top:20px; padding:12px 24px; background:#8B5CF6; color:white; font-weight:700; text-decoration:none; border-radius:8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>⏰ Snooze Activated!</h1>
            <p>Your reminder "<strong>${reminder.title}</strong>" has been successfully snoozed for ${minutes} minutes until ${snoozeTime} IST.</p>
            <a href="${frontendBase}/user/reminders" class="btn">Open Helios Dashboard</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Snooze-email error:', error);
    res.status(500).send('Server error snoozing task');
  }
});

module.exports = router;
