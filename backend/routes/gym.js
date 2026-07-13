const express = require('express');
const router = express.Router();
const { db } = require('../database');
const auth = require('../middleware/auth');
const { sendGymSummaryEmail } = require('../utils/email');

router.use(auth);

function computeSummary(entries) {
  const s = { protein: 0, carbs: 0, fat: 0, calories: 0, workoutDuration: 0, cardioMinutes: 0, water: 0, weight: null, bodyFat: null, waist: null, chest: null, arms: null, mealCount: 0, workoutCount: 0, supplementCount: 0 };
  for (const e of entries) {
    const d = e.data || {};
    if (e.type === 'meal') { s.mealCount++; s.protein += Number(d.protein) || 0; s.carbs += Number(d.carbs) || 0; s.fat += Number(d.fat) || 0; s.calories += Number(d.calories) || 0; }
    else if (e.type === 'workout') { s.workoutCount++; s.cardioMinutes += Number(d.cardioMinutes) || 0; s.workoutDuration += Number(d.duration) || 0; }
    else if (e.type === 'supplement') { s.supplementCount++; s.protein += Number(d.protein) || 0; }
    else if (e.type === 'water') { s.water += Number(d.amount) || 0; }
    else if (e.type === 'weight') { if (d.bodyWeight != null && d.bodyWeight !== '') s.weight = Number(d.bodyWeight); if (d.bodyFat != null && d.bodyFat !== '') s.bodyFat = Number(d.bodyFat); if (d.waist) s.waist = Number(d.waist); if (d.chest) s.chest = Number(d.chest); if (d.arms) s.arms = Number(d.arms); }
  }
  ['protein','carbs','fat','calories'].forEach(k => { s[k] = Math.round(s[k]); });
  s.workoutDuration = Math.round(s.workoutDuration * 10) / 10;
  return s;
}

const emit = (req) => { try { req.app.get('io')?.emit('tasks_updated'); } catch(e){} };
const to12h = (t) => { if (!t) return ''; const [h,m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; return `${h%12||12}:${String(m).padStart(2,'0')} ${ap}`; };
const TYPE_LABELS = { meal:'Meal', workout:'Workout', supplement:'Supplement', weight:'Weight', water:'Water', note:'Note' };
const labelOf = (t) => TYPE_LABELS[t] || t;
const titleOf = (e) => { const d=e.data||{}; switch(e.type){ case 'meal': return d.mealType||'Meal'; case 'workout': return d.workoutName||d.workoutType||'Workout'; case 'supplement': return d.name||'Supplement'; case 'weight': return 'Body Metrics'; case 'water': return `${d.amount||0} ml Water`; case 'note': return 'Note'; default: return e.type; } };
const subtitleOf = (e) => { const d=e.data||{}; switch(e.type){ case 'meal':{ const p=[]; if(d.foodItems) p.push(d.foodItems); if(d.protein) p.push(`${d.protein}g protein`); return p.join(' — '); } case 'workout':{ const p=[]; if(d.workoutType)p.push(d.workoutType); if(d.duration)p.push(`${d.duration}h`); if(d.cardioMinutes)p.push(`${d.cardioMinutes}min cardio`); return p.join(' · '); } case 'supplement':{ const p=[]; if(d.protein)p.push(`${d.protein}g protein`); if(d.notes)p.push(d.notes); return p.join(' · '); } case 'weight':{ const p=[]; if(d.bodyWeight)p.push(`${d.bodyWeight}kg`); if(d.bodyFat)p.push(`${d.bodyFat}%`); return p.join(' · '); } case 'note': return d.text||''; default: return ''; } };
const prettyLabel = (ymd) => { const [y,m,dd] = ymd.split('-').map(Number); return new Date(y,m-1,dd).toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); };

// GET /api/gym/day/:date
router.get('/day/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const entries = await db.all('SELECT * FROM gym_entries WHERE user_id = $1 AND entry_date = $2 ORDER BY entry_time ASC NULLS LAST, id ASC', [req.user.id, date]);
    let day = await db.get('SELECT * FROM gym_days WHERE user_id = $1 AND entry_date = $2', [req.user.id, date]);
    if (!day) day = { entry_date: date, protein_goal: 150, water_goal: 3000, mood: null, day_notes: null, completed: 0 };
    res.json({ date, entries, day, summary: computeSummary(entries) });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// POST /api/gym/entry
router.post('/entry', async (req, res) => {
  try {
    const { entry_date, entry_time, type, data, source } = req.body;
    if (!entry_date || !type) return res.status(400).json({ message: 'entry_date and type are required' });
    const src = source || 'manual';
    const result = await db.run(
      'INSERT INTO gym_entries (user_id, entry_date, entry_time, type, data, source) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, entry_date, entry_time || null, type, JSON.stringify(data || {}), src]
    );
    emit(req);
    res.json(result.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/gym/entry/:id
router.put('/entry/:id', async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM gym_entries WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ message: 'Entry not found' });
    const entry_date = req.body.entry_date || existing.entry_date;
    const entry_time = req.body.entry_time !== undefined ? req.body.entry_time : existing.entry_time;
    const data = req.body.data !== undefined ? JSON.stringify(req.body.data) : (typeof existing.data === 'string' ? existing.data : JSON.stringify(existing.data));
    await db.run('UPDATE gym_entries SET entry_date=$1, entry_time=$2, data=$3 WHERE id=$4', [entry_date, entry_time, data, existing.id]);
    const row = await db.get('SELECT * FROM gym_entries WHERE id = $1', [existing.id]);
    emit(req);
    res.json(row);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/gym/entry/:id
router.delete('/entry/:id', async (req, res) => {
  try {
    const r = await db.run('DELETE FROM gym_entries WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    emit(req);
    res.json({ message: 'Deleted', deleted: r.rowCount });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/gym/day/:date/entries (only duplicates)
router.delete('/day/:date/entries', async (req, res) => {
  try {
    const { date } = req.params;
    const r = await db.run("DELETE FROM gym_entries WHERE user_id = $1 AND entry_date = $2 AND source = 'duplicate'", [req.user.id, date]);
    if (r.rowCount === 0) return res.json({ message: 'No duplicated entries to clear', deleted: 0 });
    await db.run('UPDATE gym_days SET completed = 0 WHERE user_id = $1 AND entry_date = $2', [req.user.id, date]);
    emit(req);
    res.json({ message: `Cleared ${r.rowCount} duplicated entries`, deleted: r.rowCount });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/gym/day/:date
router.put('/day/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { protein_goal, water_goal, mood, day_notes } = req.body;
    const existing = await db.get('SELECT * FROM gym_days WHERE user_id = $1 AND entry_date = $2', [req.user.id, date]);
    if (existing) {
      await db.run('UPDATE gym_days SET protein_goal=$1, water_goal=$2, mood=$3, day_notes=$4 WHERE id=$5', [
        protein_goal != null ? protein_goal : existing.protein_goal,
        water_goal != null ? water_goal : existing.water_goal,
        mood !== undefined ? mood : existing.mood,
        day_notes !== undefined ? day_notes : existing.day_notes,
        existing.id
      ]);
    } else {
      await db.run('INSERT INTO gym_days (user_id, entry_date, protein_goal, water_goal, mood, day_notes) VALUES ($1,$2,$3,$4,$5,$6)', [
        req.user.id, date, protein_goal != null ? protein_goal : 150, water_goal != null ? water_goal : 3000, mood || null, day_notes || null
      ]);
    }
    const row = await db.get('SELECT * FROM gym_days WHERE user_id = $1 AND entry_date = $2', [req.user.id, date]);
    res.json(row);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/gym/day/:date/complete
router.post('/day/:date/complete', async (req, res) => {
  try {
    const { date } = req.params;
    const completed = req.body.completed === false ? 0 : 1;
    const existing = await db.get('SELECT * FROM gym_days WHERE user_id = $1 AND entry_date = $2', [req.user.id, date]);
    if (existing) { await db.run('UPDATE gym_days SET completed = $1 WHERE id = $2', [completed, existing.id]); }
    else { await db.run('INSERT INTO gym_days (user_id, entry_date, completed) VALUES ($1,$2,$3)', [req.user.id, date, completed]); }
    emit(req);
    let emailed = false;
    if (completed) {
      const entries = await db.all('SELECT * FROM gym_entries WHERE user_id=$1 AND entry_date=$2 ORDER BY entry_time ASC NULLS LAST, id ASC', [req.user.id, date]);
      const summary = computeSummary(entries);
      const user = await db.get('SELECT email, email_notifications FROM users WHERE id=$1', [req.user.id]);
      if (user && user.email && user.email_notifications !== 0) {
        const items = entries.map(e => ({ time: e.entry_time ? to12h(e.entry_time) : '', label: labelOf(e.type), title: titleOf(e), details: subtitleOf(e) }));
        sendGymSummaryEmail(user.email, prettyLabel(date), summary, items).catch(err => console.error('Gym email err:', err.message));
        emailed = true;
      }
    }
    res.json({ completed, emailed });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/gym/marked
router.get('/marked', async (req, res) => {
  try {
    const { from, to } = req.query;
    const entries = (from && to)
      ? await db.all('SELECT DISTINCT entry_date, type FROM gym_entries WHERE user_id=$1 AND entry_date BETWEEN $2 AND $3', [req.user.id, from, to])
      : await db.all('SELECT DISTINCT entry_date, type FROM gym_entries WHERE user_id=$1', [req.user.id]);
    const doneRows = (from && to)
      ? await db.all('SELECT entry_date FROM gym_days WHERE user_id=$1 AND completed=1 AND entry_date BETWEEN $2 AND $3', [req.user.id, from, to])
      : await db.all('SELECT entry_date FROM gym_days WHERE user_id=$1 AND completed=1', [req.user.id]);
    const map = {};
    for (const r of entries) { if (!map[r.entry_date]) map[r.entry_date] = { types: [], done: false }; map[r.entry_date].types.push(r.type); }
    for (const r of doneRows) { if (!map[r.entry_date]) map[r.entry_date] = { types: [], done: false }; map[r.entry_date].done = true; }
    res.json(map);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/gym/search
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) return res.json([]);
    const rows = await db.all('SELECT * FROM gym_entries WHERE user_id=$1 ORDER BY entry_date DESC, entry_time DESC', [req.user.id]);
    const results = rows.filter(e => { const d = e.data || {}; return (e.type + ' ' + e.entry_date + ' ' + JSON.stringify(d)).toLowerCase().includes(q); }).slice(0, 100);
    res.json(results);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/gym/stats
router.get('/stats', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM gym_entries WHERE user_id=$1', [req.user.id]);
    const dayRows = await db.all('SELECT entry_date, protein_goal, completed FROM gym_days WHERE user_id=$1', [req.user.id]);
    const byDate = {};
    for (const e of rows) { (byDate[e.entry_date] = byDate[e.entry_date] || []).push(e); }

    // All "today"-relative math is done in IST (UTC+5:30) so it matches the day
    // the user actually logged on. The server (Railway) runs in UTC, so using
    // new Date() directly would make "today" a day behind and zero-out the streak.
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const DAY_MS = 86400000;
    const nowMs = Date.now();
    const ymd = (ms) => new Date(ms + IST_OFFSET_MS).toISOString().split('T')[0];
    const dayKey = (i) => ymd(nowMs - i * DAY_MS); // i days ago, in IST

    const goalMap = {}; const completedSet = new Set();
    dayRows.forEach(r => { goalMap[r.entry_date] = r.protein_goal || 150; if (r.completed) completedSet.add(r.entry_date); });

    // Streak: a day counts if it has a workout entry OR was marked "complete".
    // Walk back from today (IST). If today isn't logged yet, start at yesterday
    // so an unfinished current day doesn't reset the streak.
    const workoutDates = new Set(rows.filter(e => e.type === 'workout').map(e => e.entry_date));
    const streakDays = new Set([...workoutDates, ...completedSet]);
    let streak = 0; let si = streakDays.has(dayKey(0)) ? 0 : 1;
    while (streakDays.has(dayKey(si))) { streak++; si++; }

    const proteinSeries = [], caloriesSeries = [];
    for (let i = 29; i >= 0; i--) { const k = dayKey(i); const s = computeSummary(byDate[k]||[]); proteinSeries.push({date:k,protein:s.protein}); caloriesSeries.push({date:k,calories:s.calories}); }
    const weightSeries = []; Object.keys(byDate).sort().forEach(date => { const s = computeSummary(byDate[date]); if (s.weight != null) weightSeries.push({date,weight:s.weight}); });
    const last7 = proteinSeries.slice(-7);
    const weeklyProteinAvg = Math.round(last7.reduce((a,b)=>a+b.protein,0)/7);
    const mprefix = dayKey(0).slice(0,7);
    const monthlyWorkoutCount = rows.filter(e=>e.type==='workout'&&e.entry_date.startsWith(mprefix)).length;
    const recentWorkouts = rows.filter(e=>e.type==='workout').sort((a,b)=>(b.entry_date+(b.entry_time||'')).localeCompare(a.entry_date+(a.entry_time||''))).slice(0,5).map(e=>({id:e.id,date:e.entry_date,time:e.entry_time,name:(e.data||{}).workoutName||(e.data||{}).workoutType||'Workout',type:(e.data||{}).workoutType||''}));
    const mealFreq = {}; rows.filter(e=>e.type==='meal').forEach(e=>{const n=((e.data||{}).foodItems||'').trim();if(n)mealFreq[n]=(mealFreq[n]||0)+1;});
    const favoriteMeals = Object.entries(mealFreq).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));

    // Heatmap (16 weeks) + adherence (30d) + this-week (7d)
    const heatmap = [];
    for (let i = 111; i >= 0; i--) { const k = dayKey(i); heatmap.push({date:k,count:(byDate[k]||[]).length,done:completedSet.has(k)}); }
    let loggedCount = 0, hitCount = 0;
    for (let i = 29; i >= 0; i--) { const k = dayKey(i); const es = byDate[k]||[]; if (!es.length) continue; loggedCount++; if (computeSummary(es).protein >= (goalMap[k]||150)) hitCount++; }
    const adherence = loggedCount > 0 ? Math.round((hitCount/loggedCount)*100) : 0;
    let weeklyWorkouts = 0, weeklyLoggedDays = 0; const weekWeights = [];
    for (let i = 6; i >= 0; i--) { const es = byDate[dayKey(i)]||[]; if (es.length) weeklyLoggedDays++; weeklyWorkouts += es.filter(e=>e.type==='workout').length; const s = computeSummary(es); if (s.weight!=null) weekWeights.push(s.weight); }
    const weightChange = weekWeights.length >= 2 ? Number((weekWeights[weekWeights.length-1]-weekWeights[0]).toFixed(1)) : null;
    const weekly = { workouts: weeklyWorkouts, proteinAvg: weeklyProteinAvg, loggedDays: weeklyLoggedDays, weightChange };

    res.json({ streak, weeklyProteinAvg, monthlyWorkoutCount, proteinSeries, caloriesSeries, weightSeries, recentWorkouts, favoriteMeals, heatmap, adherence, adherenceLoggedDays: loggedCount, weekly });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
