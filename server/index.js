import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/users.db');

// At the top of server/index.js, add more logging
const dbDir = path.dirname(dbPath);
console.log('Database directory:', dbDir);
console.log('Database path:', dbPath);

if (!fs.existsSync(dbDir)) {
  console.log('Creating database directory...');
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Database directory created successfully');
  } catch (error) {
    console.error('Error creating database directory:', error);
    process.exit(1);  // Exit if we can't create the database directory
  }
}

let db; // Declare db at the top level

try {
  db = new Database(dbPath);
  console.log('Database connected successfully');
} catch (error) {
  console.error('Database connection error:', error);
  process.exit(1);
}

const app = express();

// CORS configuration for development
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));

app.use(express.json());

// Initialize database tables (only if they don't exist)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert test user if doesn't exist
const insertDefaultUser = db.prepare(`
  INSERT OR IGNORE INTO users (email, password, is_admin) 
  VALUES ('test@test.com', 'password123', 0)
`);
insertDefaultUser.run();

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

// Auth endpoints
app.post('/register', (req, res) => {
  console.log('Register request received:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const checkUser = db.prepare('SELECT email FROM users WHERE email = ?');
    const existingUser = checkUser.get(email);
    
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if this is the admin email
    const isAdmin = email === process.env.ADMIN_EMAIL;

    // Create new user with appropriate admin status
    const stmt = db.prepare('INSERT INTO users (email, password, is_admin) VALUES (?, ?, ?)');
    const result = stmt.run(email, password, isAdmin ? 1 : 0);
    
    if (result.changes > 0) {
      const user = { id: result.lastInsertRowid, email, is_admin: isAdmin };
      console.log('User created:', user);
      res.json(user);
    } else {
      console.log('Failed to create user');
      res.status(400).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?');
    const user = stmt.get(email, password);
    
    if (user) {
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages (admin only)
app.get('/messages', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM messages ORDER BY created_at DESC');
    const messages = stmt.all();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new message
app.post('/messages', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const stmt = db.prepare(
      'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)'
    );
    const result = stmt.run(name, email, message);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle message read status (admin only)
app.post('/messages/:id/toggle-read', (req, res) => {
  try {
    // Define a transaction that toggles the read status and returns the updated message
    const toggleTransaction = db.transaction((id) => {
      // Get current message (using all columns)
      const getMessage = db.prepare('SELECT * FROM messages WHERE id = ?');
      const message = getMessage.get(id);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Explicitly handle the toggle (convert read status to a number)
      const currentReadState = Number(message.read);
      const newReadState = currentReadState === 1 ? 0 : 1;
      
      // Update with the new status
      const updateStmt = db.prepare('UPDATE messages SET read = ? WHERE id = ?');
      const result = updateStmt.run(newReadState, id);
      
      if (result.changes === 0) {
        throw new Error('Failed to update message');
      }
      
      // Return the updated message
      return getMessage.get(id);
    });
    
    // Invoke the transaction
    const updatedMessage = toggleTransaction(req.params.id);
    console.log('Toggled message returned:', updatedMessage);
    res.json(updatedMessage);
  } catch (error) {
    console.error('Error in toggle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const startServer = (initialPort) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(initialPort, () => {
      console.log(`Server running on port ${initialPort}`);
      resolve(server);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${initialPort} is busy, trying ${initialPort + 1}`);
        startServer(initialPort + 1).then(resolve).catch(reject);
      } else {
        console.error('Server error:', err);
        reject(err);
      }
    });
  });
};

// Start the server with proper error handling
const PORT = process.env.PORT || 3001;
startServer(PORT).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 