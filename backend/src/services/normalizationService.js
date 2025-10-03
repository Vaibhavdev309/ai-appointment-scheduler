const { callGemini } = require('../utils/gemini');
const { extractEntities } = require('./entityService');

async function normalizeAppointment(context) {
    const STEP_NAME = 'normalization';
    let cachedResult = context.getGlobal(STEP_NAME);
    if (cachedResult) {
        console.log('Global cache hit: normalization');
        return cachedResult;
    }

    cachedResult = context.get(STEP_NAME);
    if (cachedResult) {
        console.log('Per-request cache hit: normalization');
        return cachedResult;
    }

    const TIMEZONE = "Asia/Kolkata";
    const CLARIFICATION_THRESHOLD = 0.6;

    const entityExtraction = await extractEntities(context);
    const entities = entityExtraction.entities;
    const entitiesConfidence = entityExtraction.extraction_confidence;

    if (!entities || Object.values(entities).every(val => val === '') || entitiesConfidence < 0.5) {
        const guardrail = { status: "needs_clarification", message: "Ambiguous date/time or department" };
        context.set(STEP_NAME, guardrail);
        context.setGlobal(STEP_NAME, guardrail);
        return guardrail;
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
  Output: {"date": "2025-09-26", "time": "15:00", "tz": "Asia/Kolkata"} (assuming today is 2025-09-19)
- Input: {"date_phrase": "tomorrow", "time_phrase": "10am", "department": "cardiologist", "notes": "bring reports"}
  Output: {"date": "2025-09-20", "time": "10:00", "tz": "Asia/Kolkata"} (assuming today is 2025-09-19)
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
                normalization_confidence *= 0.5;
            }
        } catch {
            normalization_confidence = 0.0;
        }

        if (normalization_confidence < CLARIFICATION_THRESHOLD) {
            const guardrail = { status: "needs_clarification", message: "Ambiguous date/time or department" };
            context.set(STEP_NAME, guardrail);
            context.setGlobal(STEP_NAME, guardrail);
            return guardrail;
        }

        normalization_confidence = Math.round(normalization_confidence * 100) / 100;

        const result = {
            normalized: {
                date: normalized.date || '',
                time: normalized.time || '',
                tz: normalized.tz || TIMEZONE,
            },
            normalization_confidence
        };

        context.set(STEP_NAME, result);
        context.setGlobal(STEP_NAME, result);

        return result;

    } catch (error) {
        console.error('Normalization Error:', error.message);
        const guardrail = { status: "needs_clarification", message: "AI processing failed during normalization" };
        context.set(STEP_NAME, guardrail);
        context.setGlobal(STEP_NAME, guardrail);
        return guardrail;
    }
}

module.exports = { normalizeAppointment };