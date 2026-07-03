const express = require('express');
const router = express.Router();
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');
const sendEmail = require('../utils/email');

router.use(authMiddleware);

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const events = await db.all('SELECT * FROM events ORDER BY event_date, event_time');
    res.json(events);
  } catch (error) {
    console.error('GET events error:', error);
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
    const result = await db.run(
      `INSERT INTO events (title, event_date, event_time, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, event_date, event_time, req.user.id]
    );
    const eventId = result.rows[0].id;

    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Create Event', 'event', eventId, `Scheduled event: ${title}`]
    );

    // Inline notification for admins
    const details = `Scheduled event: ${title}`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [details]
    );

    // Send email notification right away
    await sendEmail({
      to: 'kunjbhuva301@gmail.com',
      subject: `New Event Scheduled: ${title}`,
      text: `An event has been scheduled.\n\nTitle: ${title}\nDate: ${event_date}\nTime: ${event_time}`
    });

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Event scheduled successfully' });
  } catch (error) {
    console.error('POST event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const event = await db.get('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await db.run('DELETE FROM events WHERE id = $1', [req.params.id]);
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Delete Event', 'event', req.params.id, `Deleted event: ${event.title}`]
    );

    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
