const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
console.log('Connecting to DB at:', dbPath);
const db = new Database(dbPath);
console.log('DB connected.');

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
      is_super_admin INTEGER DEFAULT 0
    );

    -- Tasks table
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      created_by INTEGER REFERENCES users(id),
      due_date DATE,
      approval_status TEXT DEFAULT 'approved',
      project_id INTEGER REFERENCES projects(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    -- Events table
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      event_date DATE NOT NULL,
      event_time TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      reminder_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Trigger to auto-generate notifications on activity
    CREATE TRIGGER IF NOT EXISTS notify_admins AFTER INSERT ON activity_log
    BEGIN
      INSERT INTO notifications (user_id, message)
      SELECT id, NEW.details FROM users WHERE role = 'admin' AND id != NEW.user_id;
    END;
  `);

  // Add columns if they do not exist (for existing databases)
  const columnsToAdd = [
    ['can_view_users', 0], ['can_create_users', 0], ['can_edit_users', 0], ['can_delete_users', 0],
    ['can_manage_roles', 0], ['can_manage_tasks', 0], ['can_approve_requests', 0],
    ['can_view_analytics', 0], ['can_manage_events', 0], ['can_manage_notifications', 0],
    ['can_manage_settings', 0], ['can_view_reports', 0], ['can_export_data', 0],
    ['is_read_only', 0], ['is_super_admin', 0], ['can_view_all_tasks', 1],
    ['can_view_projects', 0], ['can_manage_projects', 0]
  ];
  
  const existingColumns = db.prepare("PRAGMA table_info(permissions)").all().map(c => c.name);
  columnsToAdd.forEach(([col, defaultVal]) => {
    if (!existingColumns.includes(col)) {
      db.exec(`ALTER TABLE permissions ADD COLUMN ${col} INTEGER DEFAULT ${defaultVal}`);
    }
  });

  // Also add project_id to tasks if it doesn't exist
  const taskColumns = db.prepare("PRAGMA table_info(tasks)").all().map(c => c.name);
  if (!taskColumns.includes('project_id')) {
    db.exec('ALTER TABLE tasks ADD COLUMN project_id INTEGER REFERENCES projects(id)');
  }

  // Auto-create permission rows for users that don't have one yet
  const allUsers = db.prepare('SELECT id FROM users').all();
  const insertPermIfMissing = db.prepare('INSERT OR IGNORE INTO permissions (user_id) VALUES (?)');
  for (const u of allUsers) {
    insertPermIfMissing.run(u.id);
  }

  // Seed admin user - ALWAYS ensure correct password
  const adminEmail = 'kunjbhuva301@gmail.com';
  const adminPassword = 'Admin@123';
  const adminQuery = db.prepare('SELECT * FROM users WHERE email = ?');
  const adminExists = adminQuery.get(adminEmail);
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(adminPassword, salt);

  if (!adminExists) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const info = insertUser.run('Admin', adminEmail, hash, 'admin');
    const adminId = info.lastInsertRowid;

    db.prepare(`
      INSERT INTO permissions (
        user_id, can_create_task, can_edit_task, can_delete_task, 
        can_view_all_tasks, can_manage_users, is_super_admin, can_view_projects, can_manage_projects
      ) VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1)
    `).run(adminId);

    db.prepare(`
      INSERT INTO activity_log (user_id, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(adminId, 'System Initialized', 'system', null, 'Admin user seeded');

    console.log('✅ Admin user created:', adminEmail);
  } else {
    // Always update password_hash and ensure admin is active
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, is_active = 1, role = 'admin'
      WHERE email = ?
    `).run(hash, adminEmail);

    // Ensure admin permissions are set
    db.prepare(`
      UPDATE permissions 
      SET can_view_projects = 1, can_manage_projects = 1, is_super_admin = 1,
          can_create_task = 1, can_edit_task = 1, can_delete_task = 1,
          can_view_all_tasks = 1, can_manage_users = 1
      WHERE user_id = ?
    `).run(adminExists.id);

    console.log('✅ Admin user updated/verified:', adminEmail);
  }
};

initDb();

module.exports = db;
