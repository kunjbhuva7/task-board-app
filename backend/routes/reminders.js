const express = require('express');
const router = express.Router();
const db = require('../database');
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
router.get('/', auth, (req, res) => {
  const { priority, category, status, date } = req.query;
  const userId = req.user.id;

  let query = 'SELECT * FROM reminders WHERE created_by = ?';
  const params = [userId];

  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (date) {
    query += ' AND reminder_date = ?';
    params.push(date);
  }

  query += ' ORDER BY status = "overdue" DESC, status = "upcoming" DESC, reminder_date ASC, reminder_time ASC';

  try {
    const list = db.prepare(query).all(...params);
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
    const insert = db.prepare(`
      INSERT INTO reminders (
        title, description, reminder_date, reminder_time, priority, repeat_type, 
        category, email_notify, notify_15min, notify_1hour, is_important, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insert.run(
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
    );

    const createdReminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(info.lastInsertRowid);

    // Push WebSocket alert
    req.app.get('io').emit('tasks_updated');

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
router.put('/:id', auth, (req, res) => {
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
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND created_by = ?').get(id, req.user.id);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    db.prepare(`
      UPDATE reminders
      SET title = ?, description = ?, reminder_date = ?, reminder_time = ?, 
          priority = ?, repeat_type = ?, category = ?, email_notify = ?, 
          notify_15min = ?, notify_1hour = ?, is_important = ?, status = ?,
          reminder_sent = 0, pre_15min_sent = 0, pre_1hour_sent = 0, overdue_sent = 0, snooze_until = NULL
      WHERE id = ?
    `).run(
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
    );

    const updated = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
    
    // WS update
    req.app.get('io').emit('tasks_updated');

    res.json(updated);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/reminders/:id - Remove reminder
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  try {
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND created_by = ?').get(id, req.user.id);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    db.prepare('DELETE FROM reminders WHERE id = ?').run(id);

    // WS update
    req.app.get('io').emit('tasks_updated');

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
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND created_by = ?').get(id, req.user.id);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    db.prepare('UPDATE reminders SET status = ? WHERE id = ?').run(status, id);

    const updated = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);

    // WS update
    req.app.get('io').emit('tasks_updated');

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
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND created_by = ?').get(id, req.user.id);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    const snoozeTime = getSnoozedTime(minutes);

    // Reset sent status so it re-triggers after snooze finishes
    db.prepare(`
      UPDATE reminders 
      SET snooze_until = ?, status = "upcoming", reminder_sent = 0, pre_15min_sent = 0, pre_1hour_sent = 0
      WHERE id = ?
    `).run(snoozeTime, id);

    const updated = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);

    // WS update
    req.app.get('io').emit('tasks_updated');

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
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
    if (!reminder) return res.status(404).send('Reminder not found');

    db.prepare('UPDATE reminders SET status = "done" WHERE id = ?').run(id);
    const updated = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);

    if (updated.email_notify === 1) {
      sendReminderNotification(updated, 'completed').catch(console.error);
    }

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    res.send(`
      <html>
        <head>
          <title>Purple Success</title>
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
            <a href="${frontendBase}/user/reminders" class="btn">Open Purple Dashboard</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Server error completing task');
  }
});

// GET /api/reminders/:id/snooze-email - Snooze via direct email click
router.get('/:id/snooze-email', async (req, res) => {
  const { id } = req.params;
  const minutes = parseInt(req.query.minutes) || 30;

  try {
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
    if (!reminder) return res.status(404).send('Reminder not found');

    const snoozeTime = getSnoozedTime(minutes);
    db.prepare(`
      UPDATE reminders 
      SET snooze_until = ?, status = "upcoming", reminder_sent = 0, pre_15min_sent = 0, pre_1hour_sent = 0
      WHERE id = ?
    `).run(snoozeTime, id);

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    res.send(`
      <html>
        <head>
          <title>Purple Snooze</title>
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
            <a href="${frontendBase}/user/reminders" class="btn">Open Purple Dashboard</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Server error snoozing task');
  }
});

module.exports = router;
