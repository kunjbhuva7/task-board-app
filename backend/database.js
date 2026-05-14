const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initDb = () => {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'member',
      invite_token TEXT,
      invite_token_expiry DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Permissions table
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      can_create_task INTEGER DEFAULT 1,
      can_edit_task INTEGER DEFAULT 1,
      can_delete_task INTEGER DEFAULT 0,
      can_assign_task INTEGER DEFAULT 0,
      can_view_all_tasks INTEGER DEFAULT 1,
      can_manage_users INTEGER DEFAULT 0
    );

    -- Tasks table
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      assigned_to INTEGER REFERENCES users(id),
      created_by INTEGER REFERENCES users(id),
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Activity log
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin user
  const adminQuery = db.prepare('SELECT * FROM users WHERE email = ?');
  const adminExists = adminQuery.get('admin@company.com');

  if (!adminExists) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Admin@123', salt);
    
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    
    const info = insertUser.run('Admin', 'admin@company.com', hash, 'admin');
    const adminId = info.lastInsertRowid;

    const insertPerms = db.prepare(`
      INSERT INTO permissions (
        user_id, can_create_task, can_edit_task, can_delete_task, 
        can_assign_task, can_view_all_tasks, can_manage_users
      ) VALUES (?, 1, 1, 1, 1, 1, 1)
    `);
    insertPerms.run(adminId);
    
    const insertActivity = db.prepare(`
      INSERT INTO activity_log (user_id, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertActivity.run(adminId, 'System Initialized', 'system', null, 'Admin user seeded');
  }
};

initDb();

module.exports = db;
