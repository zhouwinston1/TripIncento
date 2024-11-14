// index.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const corsMiddleware = require('./middleware/cors');

const app = express();

// Apply CORS middleware first
app.use(corsMiddleware());

// Handle OPTIONS requests
app.options('*', (req, res) => {
    res.status(204).send();
});

// Parse JSON bodies
app.use(express.json());

// Database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

// Import routes
const userRoutes = require('./routes/userRoutes')(connection);
const tripRoutes = require('./routes/tripRoutes')(connection);

// Use routes
app.use('/user', userRoutes);
app.use('/user/trips', tripRoutes);

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});//