/**
 * PostgreSQL Database Layer for Purple
 * Replaces better-sqlite3 with pg (async).
 * Exports a db object with helper methods that mimic the old sync API
 * but work with PostgreSQL via a connection pool.
 *
 * Env: DATABASE_URL (Railway auto-injects this when you add a PostgreSQL service)
 * Fallback: postgres://localhost:5432/purple_dev (local dev)
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Decide whether to use SSL for the Postgres connection.
// - No DATABASE_URL (local dev): no SSL.
// - DATABASE_SSL=false or a URL with sslmode=disable (e.g. in-cluster Postgres): no SSL.
// - Otherwise (managed DBs like Railway): SSL with relaxed cert verification.
function resolveSsl() {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (/sslmode=disable/i.test(url)) return false;
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/purple_dev',
  ssl: resolveSsl(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

// ── Helper: the db object exposed to routes ──
const db = {
  pool,

  // Run a query, return { rows, rowCount }
  async query(text, params) {
    return pool.query(text, params);
  },

  // Get one row (or null)
  async get(text, params) {
    const { rows } = await pool.query(text, params);
    return rows[0] || null;
  },

  // Get all rows
  async all(text, params) {
    const { rows } = await pool.query(text, params);
    return rows;
  },

  // Run an INSERT/UPDATE/DELETE, return { rowCount, rows } (with RETURNING support)
  async run(text, params) {
    const res = await pool.query(text, params);
    return res;
  },
};

// ── Schema initialization ──
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        role TEXT DEFAULT 'member',
        invite_token TEXT,
        invite_token_expiry TIMESTAMPTZ,
        is_active INTEGER DEFAULT 1,
        reset_token TEXT,
        reset_token_expiry TIMESTAMPTZ,
        email_notifications INTEGER DEFAULT 1,
        mfa_secret TEXT,
        mfa_enabled INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Permissions table
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        can_create_task INTEGER DEFAULT 1,
        can_edit_task INTEGER DEFAULT 1,
        can_delete_task INTEGER DEFAULT 0,
        can_view_all_tasks INTEGER DEFAULT 1,
        can_manage_users INTEGER DEFAULT 0,
        can_view_users INTEGER DEFAULT 0,
        can_create_users INTEGER DEFAULT 0,
        can_edit_users INTEGER DEFAULT 0,
        can_delete_users INTEGER DEFAULT 0,
        can_manage_roles INTEGER DEFAULT 0,
        can_manage_tasks INTEGER DEFAULT 0,
        can_approve_requests INTEGER DEFAULT 0,
        can_view_analytics INTEGER DEFAULT 0,
        can_manage_events INTEGER DEFAULT 0,
        can_manage_notifications INTEGER DEFAULT 0,
        can_manage_settings INTEGER DEFAULT 0,
        can_view_reports INTEGER DEFAULT 0,
        can_export_data INTEGER DEFAULT 0,
        is_read_only INTEGER DEFAULT 0,
        is_super_admin INTEGER DEFAULT 0,
        can_view_projects INTEGER DEFAULT 0,
        can_manage_projects INTEGER DEFAULT 0
      );

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        created_by INTEGER REFERENCES users(id),
        due_date DATE,
        approval_status TEXT DEFAULT 'approved',
        project_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Activity log
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        target_type TEXT,
        target_id INTEGER,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Events table
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        event_date DATE NOT NULL,
        event_time TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id),
        reminder_sent INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Expenses table
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        expense_date DATE NOT NULL,
        category TEXT DEFAULT 'Other',
        payment_mode TEXT DEFAULT 'Cash',
        tags TEXT,
        receipt_filename TEXT,
        receipt_mimetype TEXT,
        receipt_data TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Reminders table
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        reminder_date TEXT NOT NULL,
        reminder_time TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        repeat_type TEXT DEFAULT 'once',
        category TEXT DEFAULT 'Other',
        email_notify INTEGER DEFAULT 1,
        notify_15min INTEGER DEFAULT 0,
        notify_1hour INTEGER DEFAULT 0,
        is_important INTEGER DEFAULT 0,
        status TEXT DEFAULT 'upcoming',
        snooze_until TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        reminder_sent INTEGER DEFAULT 0,
        pre_15min_sent INTEGER DEFAULT 0,
        pre_1hour_sent INTEGER DEFAULT 0,
        overdue_sent INTEGER DEFAULT 0
      );

      -- Gym entries (date-wise fitness journal)
      CREATE TABLE IF NOT EXISTS gym_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        entry_date TEXT NOT NULL,
        entry_time TEXT,
        type TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        source TEXT DEFAULT 'manual',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Gym days (per-day meta: goals, mood, notes, completed)
      CREATE TABLE IF NOT EXISTS gym_days (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        entry_date TEXT NOT NULL,
        protein_goal INTEGER DEFAULT 150,
        water_goal INTEGER DEFAULT 3000,
        mood TEXT,
        day_notes TEXT,
        completed INTEGER DEFAULT 0,
        UNIQUE(user_id, entry_date)
      );

      -- Index for gym performance
      CREATE INDEX IF NOT EXISTS idx_gym_entries_user_date ON gym_entries(user_id, entry_date);

      -- Office Expenses (reimbursement tracker)
      CREATE TABLE IF NOT EXISTS office_expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
        item TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT DEFAULT 'Other',
        payment_mode TEXT DEFAULT 'Cash',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- AI Chat History
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Vault (hidden modules config per user)
      CREATE TABLE IF NOT EXISTS vault_config (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id),
        pin_hash TEXT,
        hidden_modules TEXT DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── Seed admin user (NEVER overwrites existing password) ──
    const adminEmail = 'kunjbhuva301@gmail.com';

    const existing = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (existing.rows.length === 0) {
      const adminPassword = 'Admin@123';
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(adminPassword, salt);
      const ins = await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, 1) RETURNING id`,
        ['Admin', adminEmail, hash, 'admin']
      );
      const adminId = ins.rows[0].id;
      await client.query(
        `INSERT INTO permissions (user_id, can_create_task, can_edit_task, can_delete_task, can_view_all_tasks, can_manage_users, is_super_admin, can_view_projects, can_manage_projects)
         VALUES ($1, 1, 1, 1, 1, 1, 1, 1, 1) ON CONFLICT (user_id) DO NOTHING`,
        [adminId]
      );
      await client.query(
        `INSERT INTO activity_log (user_id, action, target_type, details) VALUES ($1, $2, $3, $4)`,
        [adminId, 'System Initialized', 'system', 'Admin user seeded']
      );
      console.log('✅ Admin user created:', adminEmail);
    } else {
      // Only ensure role + active status — NEVER overwrite password
      await client.query(
        `UPDATE users SET is_active = 1, role = 'admin' WHERE email = $1`,
        [adminEmail]
      );
      const adminId = existing.rows[0].id;
      await client.query(
        `INSERT INTO permissions (user_id, can_view_projects, can_manage_projects, is_super_admin, can_create_task, can_edit_task, can_delete_task, can_view_all_tasks, can_manage_users)
         VALUES ($1, 1, 1, 1, 1, 1, 1, 1, 1) ON CONFLICT (user_id) DO UPDATE SET
         can_view_projects=1, can_manage_projects=1, is_super_admin=1, can_create_task=1, can_edit_task=1, can_delete_task=1, can_view_all_tasks=1, can_manage_users=1`,
        [adminId]
      );
      console.log('✅ Admin user verified (password NOT overwritten):', adminEmail);
    }

    // Ensure all users have permission rows
    await client.query(`
      INSERT INTO permissions (user_id)
      SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM permissions)
      ON CONFLICT (user_id) DO NOTHING
    `);

  } finally {
    client.release();
  }
};

// ── Notification trigger (replicated in app logic since PG triggers need plpgsql setup) ──
// We'll handle notification creation in the routes directly instead of a DB trigger.

module.exports = { db, pool, initDb };
