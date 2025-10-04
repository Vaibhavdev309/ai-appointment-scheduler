const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const appointmentRoutes = require('./routes/appointmentRoutes');

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Service is healthy' });
});

// API Routes
app.use('/api/appointments', appointmentRoutes);

// 404 and error handlers
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    // Multer errors are now handled within the upload middleware or its calling context if needed,
    // but a general error handler for MulterError is still good practice if it bubbles up.
    if (err.name === 'MulterError') {
        return res.status(400).json({ status: 'error', message: `Upload error: ${err.message}` });
    }
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

module.exports = app;