const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');
console.log('Connecting to database at:', dbPath);
try {
  const db = new Database(dbPath);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables);
  if (tables.some(t => t.name === 'expenses')) {
    console.log('expenses table exists!');
    const schema = db.prepare("PRAGMA table_info(expenses)").all();
    console.log('expenses columns:', schema);
  } else {
    console.log('expenses table does NOT exist!');
  }
} catch (err) {
  console.error('Error connecting to DB:', err);
}
