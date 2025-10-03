const { callGemini } = require('../utils/gemini');
const { extractRawText } = require('./inputService');

async function extractEntities(context) {
    const STEP_NAME = 'entityExtraction';

    // 1. Check global cache
    let cachedResult = context.getGlobal(STEP_NAME);
    if (cachedResult) {
        console.log('Global cache hit: entityExtraction');
        return cachedResult;
    }

    // 2. Check per-request cache
    cachedResult = context.get(STEP_NAME);
    if (cachedResult) {
        console.log('Per-request cache hit: entityExtraction');
        return cachedResult;
    }

    // Ensure raw text is extracted first (will use cache if available)
    const textExtraction = await extractRawText(context);
    const rawText = textExtraction.raw_text;
    const rawTextConfidence = textExtraction.confidence;

    if (!rawText || rawText.trim().length === 0) {
        const result = {
            entities: { department: '', date_phrase: '', time_phrase: '', notes: '' },
            extraction_confidence: 0.0
        };
        context.set(STEP_NAME, result);
        context.setGlobal(STEP_NAME, result);
        return result;
    }

    if (rawTextConfidence < 0.5) {
        const result = {
            entities: { department: '', date_phrase: '', time_phrase: '', notes: '' },
            extraction_confidence: 0.0
        };
        context.set(STEP_NAME, result);
        context.setGlobal(STEP_NAME, result);
        return result;
    }

    const prompt = `You are an entity extractor for appointment scheduling. Analyze the following raw text and extract:
  - department: Medical department (e.g., "dentist", "cardiologist", "general"). Default "" if unclear.
  - date_phrase: The exact phrase used for the date (e.g., "next Friday", "tomorrow"). Default "" if none.
  - time_phrase: The exact phrase used for the time (e.g., "3pm", "10am"). Default "" if none.
  - notes: Any additional details (e.g., "urgent", "bring reports"). Default "".

  Examples:
  - "Book dentist next Friday at 3pm" → {"department": "dentist", "date_phrase": "next Friday", "time_phrase": "3pm", "notes": ""}
  - "Cardio checkup tomorrow 10am, bring reports" → {"department": "cardiologist", "date_phrase": "tomorrow", "time_phrase": "10am", "notes": "bring reports"}

  Output ONLY valid JSON: {"department": "...", "date_phrase": "...", "time_phrase": "...", "notes": "..."}. No extra text.

  Raw text: ${rawText}`;

    try {
        const { text, confidence } = await callGemini(prompt);

        let entities = { department: '', date_phrase: '', time_phrase: '', notes: '' };
        let parsedConfidence = Math.min(confidence, rawTextConfidence);

        try {
            const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
            if (jsonMatch) {
                entities = JSON.parse(jsonMatch[0]);
            } else {
                parsedConfidence *= 0.5;
            }
        } catch {
            parsedConfidence = 0.0;
        }

        const parsedConfidenceRounded = Math.round(parsedConfidence * 100) / 100;

        const result = {
            entities,
            extraction_confidence: parsedConfidenceRounded
        };

        context.set(STEP_NAME, result);
        context.setGlobal(STEP_NAME, result);

        return result;
    } catch (error) {
        console.error('Entity Extraction Error:', error.message);
        const result = {
            entities: { department: '', date_phrase: '', time_phrase: '', notes: '' },
            extraction_confidence: 0.0
        };
        context.set(STEP_NAME, result);
        context.setGlobal(STEP_NAME, result);
        return result;
    }
}

module.exports = { extractEntities };