require('dotenv').config();
const { parseAppointment } = require('./src/controllers/appointmentController');
const { validateInput } = require('./src/middleware/validation');
const { extractRawText } = require('./src/services/inputService');
const { callGemini } = require('./src/utils/gemini');

console.log('Imports successful:', { parseAppointment: !!parseAppointment, validateInput: !!validateInput });