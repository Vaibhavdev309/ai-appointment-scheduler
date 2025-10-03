const { callGemini } = require('../utils/gemini');

/**
 * Normalizes extracted entities into a standard ISO format.
 * @param {{date_phrase: string, time_phrase: string, department: string, notes: string}} entities - Entities from Step 2.
 * @param {number} entitiesConfidence - Confidence from Step 2.
 * @returns {Promise<{normalized: {date: string, time: string, tz: string}, normalization_confidence: number} | {status: string, message: string}>}
 */
async function normalizeAppointment(entities, entitiesConfidence) {
    const TIMEZONE = "Asia/Kolkata";
    const CLARIFICATION_THRESHOLD = 0.6; // Define a threshold for clarification

    // Initial check: If no entities or very low confidence from previous steps,
    // immediately return needs_clarification.
    if (!entities || Object.values(entities).every(val => val === '') || entitiesConfidence < 0.5) {
        console.log('Normalization Guardrail Triggered: Low initial entities confidence or no entities.');
        return { status: "needs_clarification", message: "Ambiguous date/time or department" };
    }

    // Construct a more detailed prompt for Gemini to handle date/time inference
    // WITHOUT asking it to calculate the detailed confidence.
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
        // Reverted confidence calculation: simply combine with previous step's confidence
        let normalization_confidence = Math.min(geminiConfidence, entitiesConfidence);

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
        const finalNormalizedOutput = {
            normalized: {
                date: normalized.date || '',
                time: normalized.time || '',
                tz: normalized.tz || TIMEZONE,
            },
            normalization_confidence: normalization_confidence
        };

        // --- GUARDRAIL CONDITION ---
        if (finalNormalizedOutput.normalization_confidence < CLARIFICATION_THRESHOLD) {
            console.log(`Normalization Guardrail Triggered: Confidence ${finalNormalizedOutput.normalization_confidence} is below threshold ${CLARIFICATION_THRESHOLD}`);
            return { status: "needs_clarification", message: "Ambiguous date/time or department" };
        }

        return finalNormalizedOutput;

    } catch (error) {
        console.error('Normalization Error:', error.message);
        return { status: "needs_clarification", message: "AI processing failed during normalization" };
    }
}

module.exports = { normalizeAppointment };