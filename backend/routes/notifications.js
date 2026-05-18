const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/notifications
router.get('/', (req, res) => {
  try {
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'Marked all as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// DELETE /api/notifications
router.delete('/', (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'Notifications cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing notifications' });
  }
});

module.exports = router;
