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
    insert.run(title, event_date, event_time, req.user.id);

    // Send email notification right away
    await sendEmail({
      to: 'kunjbhuva301@gmail.com',
      subject: `New Event Scheduled: ${title}`,
      text: `An event has been scheduled.\n\nTitle: ${title}\nDate: ${event_date}\nTime: ${event_time}`
    });

    res.json({ message: 'Event scheduled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
