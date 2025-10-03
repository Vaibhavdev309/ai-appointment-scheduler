const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer'); // Add this import

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' })); // For JSON bodies (text/base64)
app.use(express.urlencoded({ extended: true }));

// Configure Multer for file uploads (in-memory, 10MB limit)
const upload = multer({
    storage: multer.memoryStorage(), // Keep in RAM, convert to base64 later
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        // Accept common image types
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed'), false);
        }
    }
});

// Import routes and middleware
const { parseAppointment } = require('./controllers/appointmentController');
const { validateInput } = require('./middleware/validation');

// API Routes: Add upload middleware for file support
app.post('/api/appointments/parse', upload.single('image'), validateInput, parseAppointment); // Handles file or JSON

// 404 and error handlers (unchanged)
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ status: 'error', message: `Upload error: ${err.message}` });
    }
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

module.exports = app;