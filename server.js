const express = require('express');
const mysql = require('mysql2/promise'); // Using the promise version
const cors = require('cors'); 
const app = express();
const PORT = 5000;

app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Role']
}));

app.use(express.json());

// 1. Unified Database Pool (Better for performance)
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Benito1997!', 
  database: 'my_app_db',
  waitForConnections: true,
  connectionLimit: 10
});

app.use(cors({
    origin: 'http://127.0.0.1:5500', 
    credentials: true
}));
app.use(express.json());

// --- AUTHENTICATION ROUTES (REQUIRED FOR LOGIN) ---
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Simple check (In production, use bcrypt to compare hashed passwords!)
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        
        if (users.length > 0) {
            const user = users[0];
            res.json({
                token: "mock-jwt-token", // In real apps, generate a real token here
                user: { id: user.id, email: user.email, role: user.role }
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LOG ROUTES 

app.get('/api/logs', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM logs ORDER BY timestamp DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Database error fetching logs" });
    }
});

app.post('/api/logs', async (req, res) => {
    const { user, role, phone, disposition, history, timestamp } = req.body;
    const sql = "INSERT INTO logs (user, role, phone, disposition, history, timestamp) VALUES (?, ?, ?, ?, ?, ?)";
    try {
        const [result] = await db.query(sql, [user, role, phone, disposition, history, timestamp]);
        res.json({ message: "Log added", id: result.insertId });
    } catch (err) {
        console.error("❌ Database Insert Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN ROUTES ---

app.delete("/api/users/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});




app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));