const express = require('express');
const router = express.Router();
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/activity (all authenticated users)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const activities = await db.all(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM activity_log a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(activities);
  } catch (error) {
    console.error('GET activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
