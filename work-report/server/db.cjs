const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

const initDB = () => {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      department TEXT,
      designation TEXT,
      reporting_person TEXT,
      photo TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Reports table
    db.run(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      report_date TEXT NOT NULL,
      category TEXT,
      tasks_data TEXT,
      expanded_data TEXT,
      selected_logos TEXT,
      start_time TEXT,
      end_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_email) REFERENCES users (email)
    )`);

    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      user_email TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'dark',
      use_ai BOOLEAN DEFAULT 1,
      report_tone TEXT DEFAULT 'Standard',
      recipient_email TEXT,
      smart_memo TEXT,
      FOREIGN KEY (user_email) REFERENCES users (email)
    )`);
  });
};

module.exports = { db, initDB };
