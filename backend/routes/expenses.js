const express = require('express');
const router = express.Router();
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');
const sendEmail = require('../utils/email');

// GET /api/expenses/:id/receipt - Public receipt download (accessible from email)
router.get('/:id/receipt', async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await db.get('SELECT receipt_filename, receipt_mimetype, receipt_data FROM expenses WHERE id = $1', [id]);
    if (!expense || !expense.receipt_data) {
      return res.status(404).send('Receipt not found');
    }

    // Parse the data URI e.g. "data:image/png;base64,iVBORw0KGgoAAA..."
    const match = expense.receipt_data.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).send('Invalid receipt data format');
    }

    const contentType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', contentType);
    if (expense.receipt_filename) {
      res.setHeader('Content-Disposition', `inline; filename="${expense.receipt_filename}"`);
    }
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).send('Server error fetching receipt');
  }
});

// Protect all routes below with auth middleware
router.use(authMiddleware);

// Strict Admin-only middleware check
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access only' });
  }
  next();
});

// GET /api/expenses - Get all expenses with optional filtering
router.get('/', async (req, res) => {
  const { category, search, startDate, endDate, payment_mode, tag } = req.query;

  try {
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category && category !== 'All') {
      sql += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (search) {
      sql += ` AND description LIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }

    if (startDate) {
      sql += ` AND expense_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND expense_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    if (payment_mode && payment_mode !== 'All') {
      sql += ` AND payment_mode = $${paramIndex++}`;
      params.push(payment_mode);
    }

    if (tag && tag !== 'All') {
      sql += ` AND tags LIKE $${paramIndex++}`;
      params.push(`%${tag}%`);
    }

    sql += ' ORDER BY expense_date DESC, id DESC';

    const expenses = await db.all(sql, params);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Server error fetching expenses' });
  }
});

// POST /api/expenses - Add new expense
router.post('/', async (req, res) => {
  const { amount, description, expense_date, category, payment_mode, tags, receipt_filename, receipt_mimetype, receipt_data } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }
  if (!description) {
    return res.status(400).json({ message: 'Description is required' });
  }
  if (!expense_date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  try {
    const result = await db.run(
      `INSERT INTO expenses (amount, description, expense_date, category, payment_mode, tags, receipt_filename, receipt_mimetype, receipt_data, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        Number(amount),
        description,
        expense_date,
        category || 'Other',
        payment_mode || 'Cash',
        tags || null,
        receipt_filename || null,
        receipt_mimetype || null,
        receipt_data || null,
        req.user.id
      ]
    );
    const expenseId = result.rows[0].id;

    // Log Activity
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Create Expense', 'expense', expenseId, `Created expense: ${description} (₹${amount})`]
    );

    // Inline notification for admins
    const notifDetails = `Created expense: ${description} (₹${amount})`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [notifDetails]
    );

    // Notify clients
    req.app.get('io')?.emit('tasks_updated');

    // Trigger Email Notification (non-blocking)
    const pref = await db.get('SELECT email_notifications FROM users WHERE id = $1', [req.user.id]);
    if (!pref || pref.email_notifications !== 0) {
      sendExpenseNotification({
        id: expenseId,
        amount: Number(amount),
        description,
        expense_date,
        category: category || 'Other',
        payment_mode: payment_mode || 'Cash',
        tags: tags || null,
        hasReceipt: !!receipt_data
      }).catch(err => console.error('Failed to send email notification:', err));
    }

    res.status(201).json({
      message: 'Expense recorded successfully',
      expenseId
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Server error creating expense' });
  }
});

// PUT /api/expenses/:id - Update an expense
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { amount, description, expense_date, category, payment_mode, tags, receipt_filename, receipt_mimetype, receipt_data, clear_receipt } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }
  if (!description) {
    return res.status(400).json({ message: 'Description is required' });
  }
  if (!expense_date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  try {
    // Check if expense exists
    const existing = await db.get('SELECT * FROM expenses WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Determine how to handle receipt updates
    let finalFilename = existing.receipt_filename;
    let finalMimetype = existing.receipt_mimetype;
    let finalData = existing.receipt_data;

    if (clear_receipt) {
      finalFilename = null;
      finalMimetype = null;
      finalData = null;
    } else if (receipt_data) {
      finalFilename = receipt_filename;
      finalMimetype = receipt_mimetype;
      finalData = receipt_data;
    }

    await db.run(
      `UPDATE expenses
       SET amount = $1, description = $2, expense_date = $3, category = $4, payment_mode = $5, tags = $6, receipt_filename = $7, receipt_mimetype = $8, receipt_data = $9
       WHERE id = $10`,
      [
        Number(amount),
        description,
        expense_date,
        category || 'Other',
        payment_mode || 'Cash',
        tags || null,
        finalFilename,
        finalMimetype,
        finalData,
        id
      ]
    );

    // Log Activity
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Edit Expense', 'expense', id, `Edited expense: ${description} (₹${amount})`]
    );

    // Notify clients
    req.app.get('io')?.emit('tasks_updated');

    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Server error updating expense' });
  }
});

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check if expense exists
    const existing = await db.get('SELECT * FROM expenses WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await db.run('DELETE FROM expenses WHERE id = $1', [id]);

    // Log Activity
    await db.run(
      `INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'Delete Expense', 'expense', id, `Deleted expense: ${existing.description} (₹${existing.amount})`]
    );

    // Notify clients
    req.app.get('io')?.emit('tasks_updated');

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
});

const getCategoryEmailStyle = (cat) => {
  const c = cat || 'Other';
  const emojis = {
    'Food': '🍕', 'Travel': '✈️', 'Bills': '🧾', 'Entertainment': '🍿',
    'Office': '💼', 'Gym': '💪', 'Personal': '👤', 'Chai & Coffee': '☕',
    'Other': '📦', 'Shopping': '🛍️'
  };
  const emoji = emojis[c] || '📦';

  if (c === 'Food') return { bg: '#FFF1EE', color: '#FF7E5F', emoji };
  if (c === 'Travel') return { bg: '#EEF2FF', color: '#3B82F6', emoji };
  if (c === 'Bills') return { bg: '#FEE2E2', color: '#EF4444', emoji };
  if (c === 'Entertainment') return { bg: '#FDF2F8', color: '#EC4899', emoji };
  if (c === 'Office') return { bg: '#ECFDF5', color: '#10B981', emoji };
  if (c === 'Gym') return { bg: '#FEF3C7', color: '#F59E0B', emoji };
  if (c === 'Personal') return { bg: '#ECFEFF', color: '#06B6D4', emoji };
  if (c === 'Chai & Coffee') return { bg: '#FEF3C7', color: '#B45309', emoji };
  return { bg: '#F5F3FF', color: '#8B5CF6', emoji };
};

const getPaymentModeEmailStyle = (mode) => {
  const m = (mode || '').toUpperCase();
  if (m === 'UPI') return { bg: '#F5F3FF', color: '#7C3AED', emoji: '📱' };
  if (m === 'CARD') return { bg: '#EEF2FF', color: '#1D4ED8', emoji: '💳' };
  return { bg: '#ECFDF5', color: '#059669', emoji: '💵' };
};

const renderEmailTags = (tagsStr) => {
  if (!tagsStr) return '<span style="color:#64748B;font-size:14px;">-</span>';

  const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
  if (tags.length === 0) return '<span style="color:#64748B;font-size:14px;">-</span>';

  const tagStyles = {
    'Lunch': { bg: '#FFF1EE', color: '#FF7E5F', emoji: '🍔' },
    'Weekend': { bg: '#EEF2FF', color: '#3B82F6', emoji: '🏖️' },
    'Shopping': { bg: '#F5F3FF', color: '#8B5CF6', emoji: '🛍️' },
    'Snacks': { bg: '#FEF3C7', color: '#D97706', emoji: '🍿' },
    'Office': { bg: '#ECFDF5', color: '#10B981', emoji: '💼' },
    'Bills': { bg: '#FEE2E2', color: '#EF4444', emoji: '🧾' },
    'Chai & Coffee': { bg: '#FEF3C7', color: '#B45309', emoji: '☕' },
    'Other': { bg: '#F1F5F9', color: '#64748B', emoji: '📦' }
  };

  return tags.map(t => {
    const matchedKey = Object.keys(tagStyles).find(k => k.toLowerCase() === t.toLowerCase());
    const style = tagStyles[matchedKey] || { bg: '#F5F3FF', color: '#8B5CF6', emoji: '🏷️' };

    return `<span style="display:inline-block;padding:4px 8px;background-color:${style.bg};color:${style.color};border-radius:20px;font-size:12px;font-weight:600;margin-right:4px;margin-bottom:4px;white-space:nowrap;font-family:sans-serif;">
      ${style.emoji} ${t}
    </span>`;
  }).join(' ');
};

const sendExpenseNotification = async (expense) => {
  const { id, amount, description, expense_date, category, payment_mode, tags, hasReceipt } = expense;

  const now = new Date();

  // Format Date: e.g. "27 May 2026"
  const dateOptions = { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-IN', dateOptions);

  // Format Time: e.g. "06:16 PM"
  const timeOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true };
  let formattedTime = now.toLocaleTimeString('en-IN', timeOptions);
  formattedTime = formattedTime.toUpperCase();

  const istDateTime = `${formattedDate} • ${formattedTime} IST`;

  // Parse expense date
  const parsedExpenseDate = new Date(expense_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const catStyle = getCategoryEmailStyle(category);
  const pmStyle = getPaymentModeEmailStyle(payment_mode);

  const detailsCardHtml = `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#FFFFFF; border-radius:16px; border:1px solid #E2E8F0; box-shadow:0 4px 12px rgba(0,0,0,0.02); overflow:hidden;">
      <tr>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; width:35%; font-size:14px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Date</td>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; font-size:14px; font-weight:700; color:#1E293B; text-align:left; font-family:sans-serif;">${parsedExpenseDate}</td>
      </tr>
      <tr>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; font-size:14px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Category</td>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; text-align:left; font-family:sans-serif;">
          <span style="display:inline-block; padding:4px 10px; background-color:${catStyle.bg}; color:${catStyle.color}; border-radius:20px; font-size:13px; font-weight:700; white-space:nowrap;">
            ${catStyle.emoji} ${category}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; font-size:14px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Description</td>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; font-size:14px; font-weight:600; color:#1E293B; text-align:left; word-break:break-word; font-family:sans-serif;">${description}</td>
      </tr>
      <tr>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; font-size:14px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Payment Mode</td>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; text-align:left; font-family:sans-serif;">
          <span style="display:inline-block; padding:4px 10px; background-color:${pmStyle.bg}; color:${pmStyle.color}; border-radius:20px; font-size:13px; font-weight:700; white-space:nowrap;">
            ${pmStyle.emoji} ${payment_mode}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; font-size:14px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Tags</td>
        <td style="padding:16px 20px; border-bottom:1px solid #F1F5F9; text-align:left; font-family:sans-serif;">
          ${renderEmailTags(tags)}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px; font-size:14px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Amount</td>
        <td style="padding:16px 20px; font-size:16px; font-weight:800; color:#FF7E5F; text-align:left; font-family:sans-serif;">₹${Number(amount).toFixed(2)}</td>
      </tr>
    </table>
  `;

  let receiptButtonHtml = '';
  if (hasReceipt) {
    const backendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(':5173', ':5005');
    const receiptUrl = `${backendUrl}/api/expenses/${id}/receipt`;
    receiptButtonHtml = `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:24px;">
        <tr>
          <td align="center">
            <a href="${receiptUrl}" target="_blank"
              style="display:inline-block; padding:12px 28px; background-color:#8B5CF6; color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700; font-size:14px; box-shadow:0 4px 12px rgba(139,92,246,0.3); font-family:sans-serif;">
              Open Receipt
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Expense Added Successfully</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF9F6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAF9F6; padding:30px 0;">
    <tr>
      <td align="center">
        <table width="520" border="0" cellspacing="0" cellpadding="0" style="max-width:520px; width:100%; background:#ffffff; border-radius:24px; overflow:hidden; border:1px solid rgba(0,0,0,0.05); box-shadow:0 10px 40px rgba(0,0,0,0.03);">
          
          <!-- 1) Top Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #FF7E5F 0%, #8B5CF6 100%); padding:20px; text-align:center;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td valign="middle" style="padding-right:8px;">
                    <span style="font-size:24px; line-height:1;">💰</span>
                  </td>
                  <td valign="middle">
                    <span style="font-size:20px; font-weight:900; color:#ffffff; letter-spacing:-0.5px; font-family:sans-serif;">ExpenseTracker</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Success Info & Body -->
          <tr>
            <td style="padding:32px 32px 24px; text-align:center;">
              
              <!-- 2) Success Section -->
              <div style="display:inline-block; width:56px; height:56px; line-height:56px; background-color:#ECFDF5; border-radius:50%; margin:0 auto 16px; text-align:center;">
                <span style="font-size:28px; color:#10B981; vertical-align:middle; line-height:56px;">✓</span>
              </div>
              <h2 style="margin:0 0 6px; color:#10B981; font-size:18px; font-weight:800; letter-spacing:-0.2px; font-family:sans-serif;">Expense Added Successfully</h2>
              <div style="font-size:36px; font-weight:900; color:#1E293B; margin-bottom:28px; letter-spacing:-0.5px; font-family:sans-serif;">₹${Number(amount).toFixed(2)}</div>
              
              <!-- 3) Expense Details Card -->
              ${detailsCardHtml}
              
            </td>
          </tr>

          <!-- Extra Info: Date, Location & Receipt -->
          <tr>
            <td style="padding:0 32px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top:1px solid #F1F5F9; padding-top:20px;">
                <tr>
                  <!-- 4) Current India Date & Time -->
                  <td style="font-size:13px; font-weight:600; color:#64748B; font-family:sans-serif;">
                    📅 ${istDateTime}
                  </td>
                  <!-- 5) Location Section -->
                  <td align="right" style="font-size:13px; font-weight:600; color:#64748B; font-family:sans-serif;">
                    📍 <span style="color:#1E293B;">Ahmedabad, India</span>
                  </td>
                </tr>
              </table>

              <!-- 6) Receipt Button -->
              ${receiptButtonHtml}

            </td>
          </tr>

          <!-- 7) Footer -->
          <tr>
            <td style="background-color:#FAF9F6; padding:24px 32px; text-align:center; border-top:1px solid rgba(0,0,0,0.05);">
              <p style="color:#64748B; font-size:12px; margin:0 0 6px; font-weight:500; font-family:sans-serif;">This is an automated email.</p>
              <p style="color:#94A3B8; font-size:12px; margin:0; font-family:sans-serif;">
                Support: <a href="mailto:kunjbhuva301@gmail.com" style="color:#8B5CF6; text-decoration:none; font-weight:600;">kunjbhuva301@gmail.com</a>
              </p>
              <div style="margin:16px auto 0; width:40px; height:1px; background-color:#E2E8F0;"></div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: 'kunjbhuva301@gmail.com',
    subject: `💰 Expense Added: ₹${Number(amount).toFixed(2)} - ${description}`,
    text: `Expense of ₹${Number(amount).toFixed(2)} (${description}) was added successfully.`,
    html
  });
};

module.exports = router;
