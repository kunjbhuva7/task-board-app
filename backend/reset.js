const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
console.log('Connecting to database at:', dbPath);
const db = new Database(dbPath);

try {
  const email = 'kunjbhuva301@gmail.com';
  const newPassword = 'Admin@123';
  
  console.log(`Resetting password for ${email} to "${newPassword}"...`);
  
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(newPassword, salt);
  
  // Verify if user exists
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    // Insert if doesn't exist
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)');
    const info = insertUser.run('Admin', email, hash, 'admin');
    
    // Insert permissions
    db.prepare('INSERT OR IGNORE INTO permissions (user_id, is_super_admin, can_manage_users) VALUES (?, 1, 1)').run(info.lastInsertRowid);
    console.log('✅ Admin user created and permissions assigned.');
  } else {
    // Update password and active status
    db.prepare("UPDATE users SET password_hash = ?, is_active = 1, role = 'admin' WHERE email = ?").run(hash, email);
    
    // Update permissions
    db.prepare('UPDATE permissions SET is_super_admin = 1, can_manage_users = 1 WHERE user_id = ?').run(user.id);
    console.log('✅ Admin user password reset successfully.');
  }
} catch (err) {
  console.error('Error during password reset:', err.message);
}
