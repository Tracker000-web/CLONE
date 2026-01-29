const mysql = require('mysql2');
const express = require('express');
const cors = require('cors'); 
const app = express();

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
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

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));