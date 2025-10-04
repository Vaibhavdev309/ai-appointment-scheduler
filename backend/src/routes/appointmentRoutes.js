const express = require('express');
const router = express.Router();
const {
    extractTextController,
    extractEntitiesController,
    normalizeAppointmentController,
    getFinalAppointmentJsonController
} = require('../controllers/appointmentController');
const { validateInput } = require('../middleware/validation');
const upload = require('../middleware/upload'); // Import the upload middleware

// Apply upload and validation middleware to all endpoints that accept initial input
router.post('/extract-text', upload.single('image'), validateInput, extractTextController);
router.post('/extract-entities', upload.single('image'), validateInput, extractEntitiesController);
router.post('/normalize', upload.single('image'), validateInput, normalizeAppointmentController);
router.post('/final-json', upload.single('image'), validateInput, getFinalAppointmentJsonController);

module.exports = router;