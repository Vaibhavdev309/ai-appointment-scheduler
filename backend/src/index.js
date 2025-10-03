const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Global middleware (applied to all routes)
app.use(helmet()); // Security headers
app.use(cors({ origin: '*' })); // Allow all origins for dev; restrict in prod
app.use(morgan('combined')); // Log requests
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (large for images)
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded

// Import routes and middleware (ADD THESE LINES IF MISSING)
const { parseAppointment } = require('./controllers/appointmentController');
const { validateInput } = require('./middleware/validation');

// API Routes (ADD THIS LINE IF MISSING)
app.post('/api/appointments/parse', validateInput, parseAppointment);

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

// Global error handler (professional: catches and logs errors)
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

module.exports = app;
