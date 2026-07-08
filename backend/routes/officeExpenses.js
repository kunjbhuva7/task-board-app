const express = require('express');
const router = express.Router();
const { db } = require('../database');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/office-expenses
router.get('/', async (req, res) => {
  try {
    const { category, from, to } = req.query;
    let sql = 'SELECT * FROM office_expenses WHERE user_id = $1';
    const params = [req.user.id];
    let idx = 2;
    if (category && category !== 'All') { sql += ` AND category = $${idx++}`; params.push(category); }
    if (from) { sql += ` AND expense_date >= $${idx++}`; params.push(from); }
    if (to) { sql += ` AND expense_date <= $${idx++}`; params.push(to); }
    sql += ' ORDER BY expense_date DESC, id DESC';
    const rows = await db.all(sql, params);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// POST /api/office-expenses
router.post('/', async (req, res) => {
  try {
    const { expense_date, item, amount, category, payment_mode, notes } = req.body;
    if (!item || !amount) return res.status(400).json({ message: 'Item and amount are required' });
    const result = await db.run(
      'INSERT INTO office_expenses (user_id, expense_date, item, amount, category, payment_mode, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user.id, expense_date || new Date().toISOString().split('T')[0], item, Number(amount), category || 'Other', payment_mode || 'Cash', notes || null]
    );
    req.app.get('io')?.emit('tasks_updated');
    res.json(result.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/office-expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM office_expenses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const { expense_date, item, amount, category, payment_mode, notes } = req.body;
    await db.run(
      'UPDATE office_expenses SET expense_date=$1, item=$2, amount=$3, category=$4, payment_mode=$5, notes=$6 WHERE id=$7',
      [expense_date || existing.expense_date, item || existing.item, amount != null ? Number(amount) : existing.amount, category || existing.category, payment_mode || existing.payment_mode, notes !== undefined ? notes : existing.notes, existing.id]
    );
    const row = await db.get('SELECT * FROM office_expenses WHERE id = $1', [existing.id]);
    req.app.get('io')?.emit('tasks_updated');
    res.json(row);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/office-expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await db.run('DELETE FROM office_expenses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    req.app.get('io')?.emit('tasks_updated');
    res.json({ message: 'Deleted', deleted: r.rowCount });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
