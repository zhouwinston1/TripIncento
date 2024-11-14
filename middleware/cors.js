// middleware/cors.js
const cors = require('cors');

const corsMiddleware = () => {
    return cors({
        origin: '*', // Allow all origins
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
        credentials: true, // Allow credentials
        preflightContinue: false,
        optionsSuccessStatus: 204
    });
};

module.exports = corsMiddleware;