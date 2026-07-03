const express = require('express');
const router = express.Router();
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await db.all(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    console.error('GET notifications error:', err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Marked all as read' });
  } catch (err) {
    console.error('PUT notifications read-all error:', err);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// DELETE /api/notifications
router.delete('/', async (req, res) => {
  try {
    await db.run('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Notifications cleared' });
  } catch (err) {
    console.error('DELETE notifications error:', err);
    res.status(500).json({ message: 'Error clearing notifications' });
  }
});

module.exports = router;
