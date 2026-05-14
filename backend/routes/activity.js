const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/activity (admin only)
router.get('/', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const activities = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
