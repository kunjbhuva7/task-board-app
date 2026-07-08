const express = require('express');
const router = express.Router();
const { db } = require('../database');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.use(auth);

const getModel = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

// System context for AI — teaches it about the app
const SYSTEM_PROMPT = `You are Helios AI Assistant — a smart, friendly helper inside the Helios productivity app.
The app has these modules:
1. Tasks (create/edit/delete tasks with title, description, priority, status, due_date)
2. Gym Tracker (meals, workouts, water, supplements, weight — date-wise)
3. Office Expenses (item, amount, category, payment_mode, date)
4. Projects (name, description)
5. Reminders (title, date, time, priority, repeat)
6. Events (title, date, time)

You understand Hindi and English both. User will ask you to do things in natural language.

IMPORTANT: You must respond in JSON format ONLY with this structure:
{
  "message": "Human readable response to show the user",
  "action": null or { "type": "create|delete|update|query", "module": "task|gym_meal|gym_workout|gym_water|gym_supplement|office_expense|project|reminder|event", "data": {...} }
}

For "query" type actions, just answer in "message" — no data needed.
For "create" actions, include all required fields in "data".
For dates, use YYYY-MM-DD format. For time, use HH:MM (24hr).
If user says "today" use current date. If "yesterday" use yesterday's date.
Current date: ${new Date().toISOString().split('T')[0]}

Examples:
User: "office expense me 420 rupees snacks add kar date 3 july"
Response: {"message":"Done! Added ₹420 snacks to office expenses for July 3.","action":{"type":"create","module":"office_expense","data":{"item":"Snacks","amount":420,"category":"Chai & Snacks","expense_date":"2026-07-03","payment_mode":"Cash"}}}

User: "kitne projects hain?"
Response: {"message":"Let me check...","action":{"type":"query","module":"project"}}

User: "aaj breakfast me 4 eggs khaye 30g protein"
Response: {"message":"Added breakfast — 4 eggs, 30g protein!","action":{"type":"create","module":"gym_meal","data":{"mealType":"Breakfast","foodItems":"4 eggs","protein":30,"entry_date":"2026-07-03","entry_time":"08:00"}}}

User: "500ml water add kar"
Response: {"message":"Added 500ml water!","action":{"type":"create","module":"gym_water","data":{"amount":500,"entry_date":"2026-07-03","entry_time":"${new Date().toTimeString().slice(0,5)}"}}}

User: "delete chai 30 rupees expense"
Response: {"message":"Deleted ₹30 Chai & Snacks expense.","action":{"type":"delete","module":"office_expense","data":{"item":"chai","amount":30}}}

User: "last gym meal delete kar"
Response: {"message":"Deleted your last meal entry.","action":{"type":"delete","module":"gym_meal","data":{}}}

User: "delete last water entry"
Response: {"message":"Deleted last water entry.","action":{"type":"delete","module":"gym_water","data":{}}}

If you cannot understand or perform the action, set action to null and explain in message.
Always be helpful, concise, and friendly. Use emojis sparingly.

For date filtering queries like "pichle week ke expenses dikha" or "last month gym entries":
Response: {"message":"Here are your expenses from last week...","action":{"type":"filter","module":"office_expense","data":{"from":"2026-06-26","to":"2026-07-03"}}}

For auto-fill suggestions when user is typing a form:
If user asks "suggest breakfast items" or "kya khau":
Response: {"message":"Here are some common options:\n• Oats + banana (25g protein)\n• 4 eggs + toast (28g protein)\n• Greek yogurt + nuts (20g protein)","action":null}`;

// Execute the action returned by AI
async function executeAction(action, userId) {
  if (!action) return null;
  const { type, module: mod, data } = action;
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  try {
    if (type === 'create') {
      if (mod === 'office_expense') {
        const r = await db.run(
          'INSERT INTO office_expenses (user_id, expense_date, item, amount, category, payment_mode, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
          [userId, data.expense_date || today, data.item, Number(data.amount), data.category || 'Other', data.payment_mode || 'Cash', data.notes || null]
        );
        return { success: true, created: r.rows[0] };
      }
      if (mod === 'gym_meal' || mod === 'gym_workout' || mod === 'gym_water' || mod === 'gym_supplement') {
        const typeMap = { gym_meal: 'meal', gym_workout: 'workout', gym_water: 'water', gym_supplement: 'supplement' };
        const entryType = typeMap[mod];
        const entryData = { ...data }; delete entryData.entry_date; delete entryData.entry_time;
        const r = await db.run(
          'INSERT INTO gym_entries (user_id, entry_date, entry_time, type, data, source) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
          [userId, data.entry_date || today, data.entry_time || nowTime, entryType, JSON.stringify(entryData), 'manual']
        );
        return { success: true, created: r.rows[0] };
      }
      if (mod === 'task') {
        const r = await db.run(
          'INSERT INTO tasks (title, description, priority, created_by, due_date, approval_status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
          [data.title, data.description || null, data.priority || 'medium', userId, data.due_date || null, 'approved']
        );
        return { success: true, created: r.rows[0] };
      }
      if (mod === 'project') {
        const r = await db.run('INSERT INTO projects (name, description, created_by) VALUES ($1,$2,$3) RETURNING *', [data.name, data.description || null, userId]);
        return { success: true, created: r.rows[0] };
      }
    }

    if (type === 'query') {
      if (mod === 'project') {
        const rows = await db.all('SELECT * FROM projects ORDER BY created_at DESC');
        return { success: true, count: rows.length, data: rows };
      }
      if (mod === 'task') {
        const rows = await db.all('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 20');
        return { success: true, count: rows.length, data: rows };
      }
      if (mod === 'office_expense') {
        const total = await db.get('SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM office_expenses WHERE user_id = $1', [userId]);
        return { success: true, total: Number(total.total), count: Number(total.count) };
      }
    }

    if (type === 'filter') {
      if (mod === 'office_expense') {
        const rows = await db.all('SELECT * FROM office_expenses WHERE user_id=$1 AND expense_date >= $2 AND expense_date <= $3 ORDER BY expense_date DESC', [userId, data.from, data.to]);
        const total = rows.reduce((s, r) => s + Number(r.amount), 0);
        return { success: true, count: rows.length, total, data: rows.slice(0, 10) };
      }
      if (mod === 'gym_meal' || mod === 'gym_workout') {
        const typeFilter = mod === 'gym_meal' ? 'meal' : 'workout';
        const rows = await db.all("SELECT * FROM gym_entries WHERE user_id=$1 AND entry_date >= $2 AND entry_date <= $3 AND type=$4 ORDER BY entry_date DESC", [userId, data.from, data.to, typeFilter]);
        return { success: true, count: rows.length, data: rows.slice(0, 10) };
      }
    }

    if (type === 'delete') {
      if (mod === 'task' && data.id) {
        await db.run('DELETE FROM tasks WHERE id = $1 AND created_by = $2', [data.id, userId]);
        return { success: true };
      }
      if (mod === 'task' && data.title) {
        const r = await db.run("DELETE FROM tasks WHERE id = (SELECT id FROM tasks WHERE created_by = $1 AND LOWER(title) LIKE $2 ORDER BY created_at DESC LIMIT 1)", [userId, `%${data.title.toLowerCase()}%`]);
        return { success: true, deleted: r.rowCount };
      }
      if (mod === 'office_expense') {
        // Delete by matching item name and/or amount (most recent match)
        let sql = 'DELETE FROM office_expenses WHERE id = (SELECT id FROM office_expenses WHERE user_id = $1';
        const params = [userId];
        let idx = 2;
        if (data.item) { sql += ` AND LOWER(item) LIKE $${idx++}`; params.push(`%${data.item.toLowerCase()}%`); }
        if (data.amount) { sql += ` AND amount = $${idx++}`; params.push(Number(data.amount)); }
        sql += ' ORDER BY created_at DESC LIMIT 1)';
        const r = await db.run(sql, params);
        return { success: true, deleted: r.rowCount };
      }
      if (mod === 'gym_meal' || mod === 'gym_workout' || mod === 'gym_water' || mod === 'gym_supplement') {
        const typeMap = { gym_meal: 'meal', gym_workout: 'workout', gym_water: 'water', gym_supplement: 'supplement' };
        const entryType = typeMap[mod];
        let sql = `DELETE FROM gym_entries WHERE id = (SELECT id FROM gym_entries WHERE user_id = $1 AND type = $2`;
        const params = [userId, entryType];
        let idx = 3;
        if (data.entry_date) { sql += ` AND entry_date = $${idx++}`; params.push(data.entry_date); }
        sql += ' ORDER BY created_at DESC LIMIT 1)';
        const r = await db.run(sql, params);
        return { success: true, deleted: r.rowCount };
      }
    }

    return { success: false, reason: 'Action not supported yet' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const model = getModel();
    if (!model) return res.status(503).json({ message: 'AI not configured. Set GEMINI_API_KEY env variable.' });

    // Build chat history for context
    const chatHistory = (history || []).slice(-10).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: '{"message":"Hi! I am Helios AI. How can I help you today?","action":null}' }] },
        ...chatHistory
      ]
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text().trim();

    // Parse AI response
    let parsed;
    try {
      // Extract JSON from response (sometimes AI wraps in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: responseText, action: null };
    } catch {
      parsed = { message: responseText, action: null };
    }

    // Execute action if present
    let actionResult = null;
    if (parsed.action) {
      actionResult = await executeAction(parsed.action, req.user.id);
      if (actionResult && actionResult.success && parsed.action.type === 'query') {
        // Enhance message with query results
        if (parsed.action.module === 'project') {
          parsed.message = `You have ${actionResult.count} project${actionResult.count !== 1 ? 's' : ''}. ${actionResult.data.map(p => p.name).join(', ')}`;
        }
        if (parsed.action.module === 'office_expense') {
          parsed.message = `Total office expenses: ₹${actionResult.total} (${actionResult.count} entries)`;
        }
      }
    }

    // Save to chat history
    await db.run(
      'INSERT INTO ai_chat_history (user_id, role, content) VALUES ($1, $2, $3)',
      [req.user.id, 'user', message]
    );
    await db.run(
      'INSERT INTO ai_chat_history (user_id, role, content) VALUES ($1, $2, $3)',
      [req.user.id, 'assistant', parsed.message]
    );

    res.json({ message: parsed.message, action: parsed.action, actionResult });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ message: 'AI error: ' + err.message });
  }
});

// GET /api/ai/history — chat history
router.get('/history', async (req, res) => {
  try {
    const rows = await db.all(
      'SELECT * FROM ai_chat_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(rows.reverse());
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/ai/history — clear chat
router.delete('/history', async (req, res) => {
  try {
    await db.run('DELETE FROM ai_chat_history WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Chat history cleared' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/ai/suggestions — smart suggestions based on patterns
router.get('/suggestions', async (req, res) => {
  try {
    const now = new Date();
    const hour = now.getHours();
    const today = now.toISOString().split('T')[0];
    const suggestions = [];

    // Check if breakfast logged today
    if (hour >= 7 && hour <= 10) {
      const breakfast = await db.get("SELECT id FROM gym_entries WHERE user_id=$1 AND entry_date=$2 AND type='meal' AND data->>'mealType'='Breakfast'", [req.user.id, today]);
      if (!breakfast) suggestions.push({ text: 'Log breakfast', icon: '🍳', action: { type: 'create', module: 'gym_meal', data: { mealType: 'Breakfast' } } });
    }

    // Check if lunch logged
    if (hour >= 12 && hour <= 14) {
      const lunch = await db.get("SELECT id FROM gym_entries WHERE user_id=$1 AND entry_date=$2 AND type='meal' AND data->>'mealType'='Lunch'", [req.user.id, today]);
      if (!lunch) suggestions.push({ text: 'Log lunch', icon: '🍽', action: { type: 'create', module: 'gym_meal', data: { mealType: 'Lunch' } } });
    }

    // Check water intake
    const waterRow = await db.get("SELECT COALESCE(SUM((data->>'amount')::int),0) as total FROM gym_entries WHERE user_id=$1 AND entry_date=$2 AND type='water'", [req.user.id, today]);
    const water = Number(waterRow?.total || 0);
    if (water < 2000) suggestions.push({ text: `Drink water (${water}ml today)`, icon: '💧', action: { type: 'create', module: 'gym_water', data: { amount: 500 } } });

    // Check if dinner logged (evening)
    if (hour >= 19 && hour <= 22) {
      const dinner = await db.get("SELECT id FROM gym_entries WHERE user_id=$1 AND entry_date=$2 AND type='meal' AND data->>'mealType'='Dinner'", [req.user.id, today]);
      if (!dinner) suggestions.push({ text: 'Log dinner', icon: '🍴', action: { type: 'create', module: 'gym_meal', data: { mealType: 'Dinner' } } });
    }

    // Suggest complete day if entries exist but not completed
    const entries = await db.get("SELECT COUNT(*) as c FROM gym_entries WHERE user_id=$1 AND entry_date=$2", [req.user.id, today]);
    const dayDone = await db.get("SELECT completed FROM gym_days WHERE user_id=$1 AND entry_date=$2", [req.user.id, today]);
    if (Number(entries?.c) >= 3 && (!dayDone || !dayDone.completed)) {
      suggestions.push({ text: 'Complete today & get summary email', icon: '✅', action: { type: 'complete_day' } });
    }

    // Always-available suggestions (fill up to 6)
    if (suggestions.length < 6) suggestions.push({ text: 'Add office expense', icon: '💰' });
    if (suggestions.length < 6) suggestions.push({ text: 'Log workout', icon: '🏋' });
    if (suggestions.length < 6) suggestions.push({ text: 'Total expense kitna?', icon: '📊' });
    if (suggestions.length < 6) suggestions.push({ text: 'Add 500ml water', icon: '💧' });
    if (suggestions.length < 6) suggestions.push({ text: 'Kitne projects hain?', icon: '📁' });
    if (suggestions.length < 6) suggestions.push({ text: 'Create a task', icon: '✏️' });

    res.json(suggestions.slice(0, 6));
  } catch (e) {
    console.error('Suggestions error:', e);
    res.json([]);
  }
});

// GET /api/ai/weekly-insights — AI-generated weekly summary
router.get('/weekly-insights', async (req, res) => {
  try {
    const model = getModel();
    if (!model) return res.json({ insights: 'AI not configured. Set GEMINI_API_KEY.' });

    const today = new Date();
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const from = weekAgo.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];

    // Gather data
    const tasks = await db.all("SELECT status, COUNT(*) as c FROM tasks WHERE created_by=$1 AND created_at >= $2 GROUP BY status", [req.user.id, from]);
    const gymEntries = await db.all("SELECT type, COUNT(*) as c FROM gym_entries WHERE user_id=$1 AND entry_date >= $2 GROUP BY type", [req.user.id, from]);
    const expenses = await db.get("SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM office_expenses WHERE user_id=$1 AND expense_date >= $2", [req.user.id, from]);
    const proteinData = await db.all("SELECT entry_date, data FROM gym_entries WHERE user_id=$1 AND entry_date >= $2 AND type IN ('meal','supplement')", [req.user.id, from]);

    let totalProtein = 0;
    proteinData.forEach(e => { const d = e.data || {}; totalProtein += Number(d.protein) || 0; });

    const dataStr = JSON.stringify({ tasks, gymEntries, expenses, totalProtein, from, to });

    const result = await model.generateContent(`Based on this user's weekly data, generate a brief motivational weekly insight summary (3-4 sentences, friendly tone, include specific numbers). Data: ${dataStr}`);
    const insights = result.response.text().trim();

    res.json({ insights, period: { from, to } });
  } catch (e) {
    console.error('Weekly insights error:', e.message);
    res.json({ insights: 'Could not generate insights this week.' });
  }
});

module.exports = router;
