const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' })); // For image uploads
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
});

// Error handling middleware (professional touch)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
});

module.exports = app;