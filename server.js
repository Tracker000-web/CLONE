const mysql = require('mysql2/promise');
const express = require('express');
const cors = require('cors'); 
const app = express();

app.use(cors({
    origin: 'http://127.0.0.1:5500', // Matches your frontend URL
    credentials: true
}));

app.use(express.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Benito1997!', 
  database: 'my_app_db'
});

// --- USER ROUTES ---

app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/add-user', (req, res) => {
    const { username, email } = req.body;
    const sql = "INSERT INTO users (username, email) VALUES (?, ?)";
    connection.query(sql, [username, email], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "User added successfully!", id: result.insertId });
    });
});

// --- LOG ROUTES (Required for your admin.js) ---

// Get all logs
app.get('/api/logs', (req, res) => {
  connection.query('SELECT * FROM logs ORDER BY timestamp DESC', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Add a new log
app.post('/api/logs', (req, res) => {
  const { user, role, phone, disposition, history, timestamp } = req.body;
  const sql = "INSERT INTO logs (user, role, phone, disposition, history, timestamp) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(sql, [user, role, phone, disposition, history, timestamp], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Log added", id: result.insertId });
  });
});

/**
 * SERVER-SIDE AUTH & ROUTES
 * Move these to your main server file (e.g., server.js)
 */

// Middleware: Strict Admin Check
function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
}

// Route: Get Audit Logs
app.get("/api/logs", isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM audit_logs ORDER BY timestamp DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Database error fetching logs" });
    }
});

// Route: Delete User
app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));