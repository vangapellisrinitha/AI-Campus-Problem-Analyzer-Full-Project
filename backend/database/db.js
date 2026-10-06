const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite database file path
const DB_PATH = path.resolve(__dirname, 'campus_problems.db');

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${DB_PATH}`);
  }
});

// Create tables if they do not exist
const initDatabase = () => {
  const createComplaintsTable = `
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT UNIQUE NOT NULL,
      student_name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      campus_location TEXT NOT NULL,
      priority TEXT DEFAULT NULL,
      ai_summary TEXT DEFAULT NULL,
      responsible_department TEXT DEFAULT NULL,
      recommended_action TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `;

  db.run(createComplaintsTable, (err) => {
    if (err) {
      console.error('Error initializing complaints table:', err.message);
    } else {
      console.log('Complaints table initialized successfully.');
    }
  });
};

initDatabase();

/**
 * Helper to run INSERT, UPDATE, DELETE queries with Promises
 */
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

/**
 * Helper to query a single row with Promises
 */
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * Helper to query multiple rows with Promises
 */
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  DB_PATH,
  run,
  get,
  all
};
