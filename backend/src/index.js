const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configure Multer for file uploads (in-memory, 10MB limit)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed'), false);
        }
    }
});

// Import controllers and middleware
const { extractText, extractEntities, normalizeAppointment, getFinalAppointmentJson } = require('./controllers/appointmentController'); // Updated import
const { validateInput } = require('./middleware/validation');

// API Routes: Apply upload and validation middleware to all endpoints that accept initial input
app.post('/api/appointments/extract-text', upload.single('image'), validateInput, extractText);
app.post('/api/appointments/extract-entities', upload.single('image'), validateInput, extractEntities);
app.post('/api/appointments/normalize', upload.single('image'), validateInput, normalizeAppointment);
app.post('/api/appointments/final-json', upload.single('image'), validateInput, getFinalAppointmentJson); // New endpoint

// 404 and error handlers
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