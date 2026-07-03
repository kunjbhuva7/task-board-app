const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const { sendGymSummaryEmail } = require('../utils/email');

// Every gym route requires a logged-in user (user-scoped data)
router.use(auth);

const safeParse = (s) => { try { return JSON.parse(s || '{}'); } catch { return {}; } };
const parse = (row) => ({ ...row, data: safeParse(row.data) });

// Compute a single day's nutrition/workout summary from its entries
function computeSummary(entries) {
  const s = {
    protein: 0, carbs: 0, fat: 0, calories: 0,
    workoutDuration: 0, cardioMinutes: 0, water: 0,
    weight: null, bodyFat: null, waist: null, chest: null, arms: null,
    mealCount: 0, workoutCount: 0, supplementCount: 0,
  };
  for (const e of entries) {
    const d = e.data || {};
    if (e.type === 'meal') {
      s.mealCount++;
      s.protein += Number(d.protein) || 0;
      s.carbs += Number(d.carbs) || 0;
      s.fat += Number(d.fat) || 0;
      s.calories += Number(d.calories) || 0;
    } else if (e.type === 'workout') {
      s.workoutCount++;
      s.cardioMinutes += Number(d.cardioMinutes) || 0;
      s.workoutDuration += Number(d.duration) || 0;
    } else if (e.type === 'supplement') {
      s.supplementCount++;
      s.protein += Number(d.protein) || 0;
    } else if (e.type === 'water') {
      s.water += Number(d.amount) || 0;
    } else if (e.type === 'weight') {
      if (d.bodyWeight !== undefined && d.bodyWeight !== '' && d.bodyWeight !== null) s.weight = Number(d.bodyWeight);
      if (d.bodyFat !== undefined && d.bodyFat !== '' && d.bodyFat !== null) s.bodyFat = Number(d.bodyFat);
      if (d.waist) s.waist = Number(d.waist);
      if (d.chest) s.chest = Number(d.chest);
      if (d.arms) s.arms = Number(d.arms);
    }
  }
  ['protein', 'carbs', 'fat', 'calories'].forEach(k => { s[k] = Math.round(s[k]); });
  s.workoutDuration = Math.round(s.workoutDuration * 10) / 10;
  return s;
}

const emit = (req) => { try { req.app.get('io') && req.app.get('io').emit('tasks_updated'); } catch (e) { /* ignore */ } };

// Small formatting helpers (for the summary email)
const to12h = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; const hr = h % 12 || 12; return `${hr}:${String(m).padStart(2, '0')} ${ap}`; };
const TYPE_LABELS = { meal: 'Meal', workout: 'Workout', supplement: 'Supplement', weight: 'Weight', water: 'Water', note: 'Note' };
const labelOf = (t) => TYPE_LABELS[t] || t;
const titleOf = (e) => {
  const d = e.data || {};
  switch (e.type) {
    case 'meal': return d.mealType || 'Meal';
    case 'workout': return d.workoutName || d.workoutType || 'Workout';
    case 'supplement': return d.name || 'Supplement';
    case 'weight': return 'Body Metrics';
    case 'water': return `${d.amount || 0} ml Water`;
    case 'note': return 'Note';
    default: return e.type;
  }
};
const subtitleOf = (e) => {
  const d = e.data || {};
  switch (e.type) {
    case 'meal': { const p = []; if (d.foodItems) p.push(d.foodItems); if (d.protein) p.push(`${d.protein}g protein`); return p.join(' — '); }
    case 'workout': { const p = []; if (d.workoutType) p.push(d.workoutType); if (Array.isArray(d.exercises) && d.exercises.length) p.push(`${d.exercises.length} exercises`); if (d.duration) p.push(`${d.duration} min`); if (d.cardioMinutes) p.push(`${d.cardioMinutes} min cardio`); return p.join(' · '); }
    case 'supplement': return d.notes || '';
    case 'weight': { const p = []; if (d.bodyWeight) p.push(`${d.bodyWeight} kg`); if (d.bodyFat) p.push(`${d.bodyFat}% fat`); return p.join(' · '); }
    case 'note': return d.text || '';
    default: return '';
  }
};
const prettyLabel = (ymd) => { const [y, m, dd] = ymd.split('-').map(Number); return new Date(y, m - 1, dd).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };

// GET /api/gym/day/:date  → entries (chrono) + day meta + computed summary
router.get('/day/:date', (req, res) => {
  try {
    const { date } = req.params;
    const rows = db.prepare(
      'SELECT * FROM gym_entries WHERE user_id = ? AND entry_date = ? ORDER BY (entry_time IS NULL), entry_time ASC, id ASC'
    ).all(req.user.id, date);
    const entries = rows.map(parse);
    let day = db.prepare('SELECT * FROM gym_days WHERE user_id = ? AND entry_date = ?').get(req.user.id, date);
    if (!day) day = { entry_date: date, protein_goal: 150, water_goal: 3000, mood: null, day_notes: null, completed: 0 };
    res.json({ date, entries, day, summary: computeSummary(entries) });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/gym/entry  → create an entry under a date
router.post('/entry', (req, res) => {
  try {
    const { entry_date, entry_time, type, data, source } = req.body;
    if (!entry_date || !type) return res.status(400).json({ message: 'entry_date and type are required' });
    const src = source || 'manual';
    const info = db.prepare(
      'INSERT INTO gym_entries (user_id, entry_date, entry_time, type, data, source) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, entry_date, entry_time || null, type, JSON.stringify(data || {}), src);
    const row = db.prepare('SELECT * FROM gym_entries WHERE id = ?').get(info.lastInsertRowid);
    emit(req);
    res.json(parse(row));
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/gym/entry/:id  → edit an entry
router.put('/entry/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM gym_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ message: 'Entry not found' });
    const entry_date = req.body.entry_date || existing.entry_date;
    const entry_time = req.body.entry_time !== undefined ? req.body.entry_time : existing.entry_time;
    const data = req.body.data !== undefined ? JSON.stringify(req.body.data) : existing.data;
    db.prepare('UPDATE gym_entries SET entry_date = ?, entry_time = ?, data = ? WHERE id = ?')
      .run(entry_date, entry_time, data, existing.id);
    const row = db.prepare('SELECT * FROM gym_entries WHERE id = ?').get(existing.id);
    emit(req);
    res.json(parse(row));
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/gym/entry/:id
router.delete('/entry/:id', (req, res) => {
  try {
    const r = db.prepare('DELETE FROM gym_entries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    emit(req);
    res.json({ message: 'Deleted', deleted: r.changes });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/gym/day/:date/entries — delete ONLY duplicated entries (source='duplicate'), keep manual ones safe
router.delete('/day/:date/entries', (req, res) => {
  try {
    const { date } = req.params;
    const r = db.prepare("DELETE FROM gym_entries WHERE user_id = ? AND entry_date = ? AND source = 'duplicate'").run(req.user.id, date);
    if (r.changes === 0) {
      return res.json({ message: 'No duplicated entries to clear', deleted: 0 });
    }
    // Reset completed flag since content changed
    db.prepare('UPDATE gym_days SET completed = 0 WHERE user_id = ? AND entry_date = ?').run(req.user.id, date);
    emit(req);
    res.json({ message: `Cleared ${r.changes} duplicated entries`, deleted: r.changes });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/gym/day/:date  → upsert per-day meta (goals, mood, notes)
router.put('/day/:date', (req, res) => {
  try {
    const { date } = req.params;
    const { protein_goal, water_goal, mood, day_notes } = req.body;
    const existing = db.prepare('SELECT * FROM gym_days WHERE user_id = ? AND entry_date = ?').get(req.user.id, date);
    if (existing) {
      db.prepare('UPDATE gym_days SET protein_goal = ?, water_goal = ?, mood = ?, day_notes = ? WHERE id = ?').run(
        protein_goal != null ? protein_goal : existing.protein_goal,
        water_goal != null ? water_goal : existing.water_goal,
        mood !== undefined ? mood : existing.mood,
        day_notes !== undefined ? day_notes : existing.day_notes,
        existing.id
      );
    } else {
      db.prepare('INSERT INTO gym_days (user_id, entry_date, protein_goal, water_goal, mood, day_notes) VALUES (?, ?, ?, ?, ?, ?)').run(
        req.user.id, date, protein_goal != null ? protein_goal : 150, water_goal != null ? water_goal : 3000, mood || null, day_notes || null
      );
    }
    res.json(db.prepare('SELECT * FROM gym_days WHERE user_id = ? AND entry_date = ?').get(req.user.id, date));
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/gym/marked?from=&to=  → { 'YYYY-MM-DD': { types:[...], done:bool } } for calendar dots + tick
router.get('/marked', (req, res) => {
  try {
    const { from, to } = req.query;
    const rows = (from && to)
      ? db.prepare('SELECT DISTINCT entry_date, type FROM gym_entries WHERE user_id = ? AND entry_date BETWEEN ? AND ?').all(req.user.id, from, to)
      : db.prepare('SELECT DISTINCT entry_date, type FROM gym_entries WHERE user_id = ?').all(req.user.id);
    const doneRows = (from && to)
      ? db.prepare('SELECT entry_date FROM gym_days WHERE user_id = ? AND completed = 1 AND entry_date BETWEEN ? AND ?').all(req.user.id, from, to)
      : db.prepare('SELECT entry_date FROM gym_days WHERE user_id = ? AND completed = 1').all(req.user.id);
    const map = {};
    for (const r of rows) {
      if (!map[r.entry_date]) map[r.entry_date] = { types: [], done: false };
      map[r.entry_date].types.push(r.type);
    }
    for (const r of doneRows) {
      if (!map[r.entry_date]) map[r.entry_date] = { types: [], done: false };
      map[r.entry_date].done = true;
    }
    res.json(map);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/gym/day/:date/complete  → mark day complete (tick) or reopen; emails a summary when completing
router.post('/day/:date/complete', (req, res) => {
  try {
    const { date } = req.params;
    const completed = req.body.completed === false ? 0 : 1;
    const existing = db.prepare('SELECT * FROM gym_days WHERE user_id = ? AND entry_date = ?').get(req.user.id, date);
    if (existing) {
      db.prepare('UPDATE gym_days SET completed = ? WHERE id = ?').run(completed, existing.id);
    } else {
      db.prepare('INSERT INTO gym_days (user_id, entry_date, completed) VALUES (?, ?, ?)').run(req.user.id, date, completed);
    }
    emit(req);

    let emailed = false;
    if (completed) {
      const entries = db.prepare('SELECT * FROM gym_entries WHERE user_id = ? AND entry_date = ? ORDER BY (entry_time IS NULL), entry_time ASC, id ASC').all(req.user.id, date).map(parse);
      const summary = computeSummary(entries);
      const user = db.prepare('SELECT email, email_notifications FROM users WHERE id = ?').get(req.user.id);
      if (user && user.email && user.email_notifications !== 0) {
        const items = entries.map(e => ({ time: e.entry_time ? to12h(e.entry_time) : '', label: labelOf(e.type), title: titleOf(e), details: subtitleOf(e) }));
        sendGymSummaryEmail(user.email, prettyLabel(date), summary, items).catch(err => console.error('Gym summary email error:', err.message));
        emailed = true;
      }
    }
    res.json({ completed, emailed });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/gym/search?q=  → search across type/date/food/exercise/notes
router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) return res.json([]);
    const rows = db.prepare('SELECT * FROM gym_entries WHERE user_id = ? ORDER BY entry_date DESC, entry_time DESC').all(req.user.id);
    const results = rows.map(parse).filter(e => {
      const hay = (e.type + ' ' + e.entry_date + ' ' + JSON.stringify(e.data)).toLowerCase();
      return hay.includes(q);
    }).slice(0, 100);
    res.json(results);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/gym/stats  → streak, averages, chart series, recent workouts, favorite meals
router.get('/stats', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM gym_entries WHERE user_id = ?').all(req.user.id).map(parse);
    const byDate = {};
    for (const e of rows) { (byDate[e.entry_date] = byDate[e.entry_date] || []).push(e); }

    const ymd = (d) => {
      const off = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return off.toISOString().split('T')[0];
    };

    // Workout streak: consecutive days (ending today/yesterday) with a workout
    const workoutDates = new Set(rows.filter(e => e.type === 'workout').map(e => e.entry_date));
    let streak = 0;
    const cur = new Date();
    if (!workoutDates.has(ymd(cur))) cur.setDate(cur.getDate() - 1);
    while (workoutDates.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

    // 30-day protein & calories series
    const today = new Date();
    const proteinSeries = [], caloriesSeries = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = ymd(d);
      const s = computeSummary(byDate[key] || []);
      proteinSeries.push({ date: key, protein: s.protein });
      caloriesSeries.push({ date: key, calories: s.calories });
    }

    // Weight series across all logged days
    const weightSeries = [];
    Object.keys(byDate).sort().forEach(date => {
      const s = computeSummary(byDate[date]);
      if (s.weight != null) weightSeries.push({ date, weight: s.weight });
    });

    const last7 = proteinSeries.slice(-7);
    const weeklyProteinAvg = Math.round(last7.reduce((a, b) => a + b.protein, 0) / 7);

    const mprefix = ymd(today).slice(0, 7);
    const monthlyWorkoutCount = rows.filter(e => e.type === 'workout' && e.entry_date.startsWith(mprefix)).length;

    const recentWorkouts = rows.filter(e => e.type === 'workout')
      .sort((a, b) => (b.entry_date + (b.entry_time || '')).localeCompare(a.entry_date + (a.entry_time || '')))
      .slice(0, 5)
      .map(e => ({ id: e.id, date: e.entry_date, time: e.entry_time, name: e.data.workoutName || e.data.workoutType || 'Workout', type: e.data.workoutType || '' }));

    const mealFreq = {};
    rows.filter(e => e.type === 'meal').forEach(e => {
      const name = (e.data.foodItems || '').trim();
      if (name) mealFreq[name] = (mealFreq[name] || 0) + 1;
    });
    const favoriteMeals = Object.entries(mealFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

    // Per-day protein goals (default 150) + completed set
    const dayRows = db.prepare('SELECT entry_date, protein_goal, completed FROM gym_days WHERE user_id = ?').all(req.user.id);
    const goalMap = {}; const completedSet = new Set();
    dayRows.forEach(r => { goalMap[r.entry_date] = r.protein_goal || 150; if (r.completed) completedSet.add(r.entry_date); });

    // Consistency heatmap — last 112 days (16 weeks)
    const heatmap = [];
    for (let i = 111; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = ymd(d);
      heatmap.push({ date: key, count: (byDate[key] || []).length, done: completedSet.has(key) });
    }

    // Protein goal adherence — last 30 days (of logged days, how many hit goal)
    let loggedCount = 0, hitCount = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = ymd(d);
      const es = byDate[key] || [];
      if (es.length === 0) continue;
      loggedCount++;
      if (computeSummary(es).protein >= (goalMap[key] || 150)) hitCount++;
    }
    const adherence = loggedCount > 0 ? Math.round((hitCount / loggedCount) * 100) : 0;

    // Weekly report — last 7 days
    let weeklyWorkouts = 0, weeklyLoggedDays = 0;
    const weekWeights = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const es = byDate[ymd(d)] || [];
      if (es.length) weeklyLoggedDays++;
      weeklyWorkouts += es.filter(e => e.type === 'workout').length;
      const s = computeSummary(es);
      if (s.weight != null) weekWeights.push(s.weight);
    }
    const weightChange = weekWeights.length >= 2 ? Number((weekWeights[weekWeights.length - 1] - weekWeights[0]).toFixed(1)) : null;
    const weekly = { workouts: weeklyWorkouts, proteinAvg: weeklyProteinAvg, loggedDays: weeklyLoggedDays, weightChange };

    res.json({ streak, weeklyProteinAvg, monthlyWorkoutCount, proteinSeries, caloriesSeries, weightSeries, recentWorkouts, favoriteMeals, heatmap, adherence, adherenceLoggedDays: loggedCount, weekly });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
