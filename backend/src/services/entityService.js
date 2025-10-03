const { callGemini } = require('../utils/gemini');

/**
 * Extracts structured entities from raw text using Gemini.
 * @param {string} rawText - The extracted text from Step 1.
 * @param {number} textExtractionConfidence - Confidence from Step 1.
 * @returns {Promise<{entities: {date_phrase: string, time_phrase: string, department: string}, extraction_confidence: number}>}
 */
async function extractEntities(rawText, textExtractionConfidence) {
    if (!rawText || rawText.trim().length === 0) {
        return {
            entities: { date_phrase: '', time_phrase: '', department: '' },
            extraction_confidence: 0.0
        };
    }

    // Skip if Step 1 confidence too low (avoid bad input)
    if (textExtractionConfidence < 0.5) {
        console.log('Skipping entity extraction: Low input confidence from text extraction');
        return {
            entities: { date_phrase: '', time_phrase: '', department: '' },
            extraction_confidence: 0.0
        };
    }

    // Prompt: Few-shot for accuracy, strict JSON output
    const prompt = `You are an entity extractor for appointment scheduling. Analyze the following raw text and extract:
  - date_phrase: The exact phrase referring to the date (e.g., "next Friday", "tomorrow"). Default "" if none.
  - time_phrase: The exact phrase referring to the time (e.g., "3pm", "10am"). Default "" if none.
  - department: Medical department (e.g., "dentist", "cardiologist", "general"). Default "" if unclear.
  - notes: Any additional details (e.g., "urgent", "bring reports"). Default "".

  Examples:
  - "Book dentist next Friday at 3pm" → {"date_phrase": "next Friday", "time_phrase": "3pm", "department": "dentist", "notes": ""}
  - "Cardio checkup tomorrow 10am, bring reports" → {"date_phrase": "tomorrow", "time_phrase": "10am", "department": "cardiologist", "notes": "bring reports"}

  Output ONLY valid JSON: {"date_phrase": "...", "time_phrase": "...", "department": "...", "notes": "..."}. No extra text.

  Raw text: ${rawText}`;

    try {
        const { text, confidence: geminiConfidence } = await callGemini(prompt);

        let entities = { date_phrase: '', time_phrase: '', department: '', notes: '' };
        let extraction_confidence = Math.min(geminiConfidence, textExtractionConfidence); // Combine confidences

        try {
            const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
            if (jsonMatch) {
                entities = JSON.parse(jsonMatch[0]);
            } else {
                console.warn('No valid JSON in Gemini response for entity extraction:', text.substring(0, 100));
                extraction_confidence *= 0.5; // Penalize bad output
            }
        } catch (parseError) {
            console.error('JSON Parse Error in entity extraction:', parseError.message, 'Response:', text);
            extraction_confidence = 0.0;
        }

        // Filter entities to match the exact output format for Step 2
        const filteredEntities = {
            date_phrase: entities.date_phrase || '',
            time_phrase: entities.time_phrase || '',
            department: entities.department || ''
        };

        return {
            entities: filteredEntities,
            extraction_confidence: extraction_confidence
        };
    } catch (error) {
        console.error('Entity Extraction Error:', error.message);
        return {
            entities: { date_phrase: '', time_phrase: '', department: '' },
            extraction_confidence: 0.0
        };
    }
}

module.exports = { extractEntities };