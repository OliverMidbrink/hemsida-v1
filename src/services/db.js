import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../../data/users.db'));

// Initialize the database with users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert default user if it doesn't exist
const insertDefaultUser = db.prepare(`
  INSERT OR IGNORE INTO users (email, password) 
  VALUES ('test@test.com', 'password123')
`);

insertDefaultUser.run();

export default db; 