// jwtUtils.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Create JWT token
const createToken = (userId) => {
    try {
        const token = jwt.sign(
            { user_id: userId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        return { success: true, token };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Validate JWT token
const validateToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { success: true, data: decoded };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Middleware to verify token in request headers
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Gets token from "Bearer <token>"

    if (!token) {
        return res.status(403).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Adds user info to request object
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = {
    createToken,
    validateToken,
    verifyToken
};