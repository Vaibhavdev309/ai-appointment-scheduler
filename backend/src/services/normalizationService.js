const { callGemini } = require('../utils/gemini');
const { extractEntities } = require('./entityService'); // Import entity extraction

/**
 * Normalizes extracted entities into a standard ISO format.
 * @param {RequestContext} context - The request context object.
 * @returns {Promise<{normalized: {date: string, time: string, tz: string}, normalization_confidence: number} | {status: string, message: string}>}
 */
async function normalizeAppointment(context) {
    const STEP_NAME = 'normalization';
    let cachedResult = context.get(STEP_NAME);
    if (cachedResult) {
        console.log('Cache hit: normalization');
        // If a guardrail was triggered and cached, return it directly
        if (cachedResult.status === "needs_clarification") {
            return cachedResult;
        }
        return cachedResult;
    }

    const TIMEZONE = "Asia/Kolkata";
    const CLARIFICATION_THRESHOLD = 0.6;

    // Ensure entities are extracted first (will use cache if available)
    const entityExtraction = await extractEntities(context);
    const entities = entityExtraction.entities;
    const entitiesConfidence = entityExtraction.extraction_confidence;

    // Initial check: If no entities or very low confidence from previous steps,
    // immediately return needs_clarification.
    if (!entities || Object.values(entities).every(val => val === '') || entitiesConfidence < 0.5) { // Adjusted threshold for initial check
        const clarificationResult = { status: "needs_clarification", message: "Ambiguous date/time or department" };
        context.set(STEP_NAME, clarificationResult);
        return clarificationResult;
    }

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
        let normalization_confidence = Math.min(geminiConfidence, entitiesConfidence);

        try {
            const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
            if (jsonMatch) {
                normalized = JSON.parse(jsonMatch[0]);
            } else {
                console.warn('No valid JSON in Gemini response for normalization:', text.substring(0, 100));
                normalization_confidence *= 0.5;
            }
        } catch (parseError) {
            console.error('JSON Parse Error in normalization:', parseError.message, 'Response:', text);
            normalization_confidence = 0.0;
        }

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
            const clarificationResult = { status: "needs_clarification", message: "Ambiguous date/time or department" };
            context.set(STEP_NAME, clarificationResult);
            return clarificationResult;
        }

        context.set(STEP_NAME, finalNormalizedOutput);
        return finalNormalizedOutput;

    } catch (error) {
        console.error('Normalization Error:', error.message);
        const clarificationResult = { status: "needs_clarification", message: "AI processing failed during normalization" };
        context.set(STEP_NAME, clarificationResult);
        return clarificationResult;
    }
}

module.exports = { normalizeAppointment };