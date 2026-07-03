const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const sendEmail = require('../utils/email');

router.use(authMiddleware);

// GET /api/events
router.get('/', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM events ORDER BY event_date, event_time').all();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events
router.post('/', async (req, res) => {
  const { title, event_date, event_time } = req.body;
  if (!title || !event_date || !event_time) {
    return res.status(400).json({ message: 'Title, date, and time are required' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO events (title, event_date, event_time, created_by)
      VALUES (?, ?, ?, ?)
    `);
    const info = insert.run(title, event_date, event_time, req.user.id);

    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Create Event', 'event', info.lastInsertRowid, `Scheduled event: ${title}`);

    // Send email notification right away
    await sendEmail({
      to: 'kunjbhuva301@gmail.com',
      subject: `New Event Scheduled: ${title}`,
      text: `An event has been scheduled.\n\nTitle: ${title}\nDate: ${event_date}\nTime: ${event_time}`
    });

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Event scheduled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// DELETE /api/events/:id
router.delete('/:id', (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    db.prepare(`INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`).run(req.user.id, 'Delete Event', 'event', req.params.id, `Deleted event: ${event.title}`);

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
