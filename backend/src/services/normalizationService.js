const { callGemini } = require('../utils/gemini');

/**
 * Normalizes extracted entities into a standard ISO format.
 * @param {{date_phrase: string, time_phrase: string, department: string, notes: string}} entities - Entities from Step 2.
 * @param {number} entitiesConfidence - Confidence from Step 2.
 * @returns {Promise<{date: string, time: string, tz: string, normalization_confidence: number}>}
 */
async function normalizeAppointment(entities, entitiesConfidence) {
    // Default timezone for normalization
    const TIMEZONE = "Asia/Kolkata";

    // If no entities or very low confidence, return empty normalized data
    if (!entities || Object.values(entities).every(val => val === '') || entitiesConfidence < 0.6) {
        console.log('Skipping normalization: Low entities confidence or no entities');
        return {
            date: '',
            time: '',
            tz: TIMEZONE,
            normalization_confidence: 0.0
        };
    }

    // Construct a more detailed prompt for Gemini to handle date/time inference
    const prompt = `You are an appointment normalization assistant. Given the following extracted appointment details, convert them into a standardized JSON format.
  Assume today's date is ${new Date().toISOString().split('T')[0]} and the timezone is ${TIMEZONE} for relative date/time calculations.

  Input entities:
  - date_phrase: "${entities.date_phrase || ''}"
  - time_phrase: "${entities.time_phrase || ''}"
  - department: "${entities.department || ''}"
  - notes: "${entities.notes || ''}"

  Output ONLY valid JSON: {"date": "YYYY-MM-DD", "time": "HH:MM", "tz": "Asia/Kolkata"}.
  - 'date' should be in ISO format (YYYY-MM-DD). Infer from 'date_phrase' relative to today. If 'date_phrase' is empty or unclear, default to "".
  - 'time' should be in 24-hour format (HH:MM). Infer from 'time_phrase'. If 'time_phrase' is empty or unclear, default to "".
  - 'tz' should always be "${TIMEZONE}".

  Examples:
  - Input: {"date_phrase": "next Friday", "time_phrase": "3pm", "department": "dentist", "notes": ""}
    Output: {"date": "2023-10-13", "time": "15:00", "tz": "Asia/Kolkata"} (assuming today is 2023-10-06)
  - Input: {"date_phrase": "tomorrow", "time_phrase": "10am", "department": "cardiologist", "notes": "bring reports"}
    Output: {"date": "2023-10-07", "time": "10:00", "tz": "Asia/Kolkata"} (assuming today is 2023-10-06)
  - Input: {"date_phrase": "", "time_phrase": "evening", "department": "general", "notes": "urgent"}
    Output: {"date": "", "time": "", "tz": "Asia/Kolkata"}

  Normalize the following:`;

    try {
        const { text, confidence: geminiConfidence } = await callGemini(prompt);

        let normalized = { date: '', time: '', tz: TIMEZONE };
        let normalization_confidence = Math.min(geminiConfidence, entitiesConfidence); // Combine confidences

        try {
            const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
            if (jsonMatch) {
                normalized = JSON.parse(jsonMatch[0]);
            } else {
                console.warn('No valid JSON in Gemini response for normalization:', text.substring(0, 100));
                normalization_confidence *= 0.5; // Penalize bad output
            }
        } catch (parseError) {
            console.error('JSON Parse Error in normalization:', parseError.message, 'Response:', text);
            normalization_confidence = 0.0;
        }

        // Ensure the output matches the exact format
        return {
            date: normalized.date || '',
            time: normalized.time || '',
            tz: normalized.tz || TIMEZONE,
            normalization_confidence: normalization_confidence
        };
    } catch (error) {
        console.error('Normalization Error:', error.message);
        return {
            date: '',
            time: '',
            tz: TIMEZONE,
            normalization_confidence: 0.0
        };
    }
}

module.exports = { normalizeAppointment };