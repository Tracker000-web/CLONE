const mysql = require('mysql2');
const express = require('express');
const cors = require('cors'); 
const app = express();

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Benito1997!', // Keep this as is
  database: 'my_app_db'
});

// Route to get users from MySQL
app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Route to add a user
app.post('/add-user', (req, res) => {
    const { username, email } = req.body;
    const sql = "INSERT INTO users (username, email) VALUES (?, ?)";
    
    // Changed 'db.query' to 'connection.query'
    connection.query(sql, [username, email], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "User added successfully!", id: result.insertId });
    });
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));