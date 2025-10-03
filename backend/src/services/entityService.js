const { callGemini } = require('../utils/gemini');

/**
 * Extracts structured entities from raw text using Gemini.
 * @param {string} rawText - The extracted text from Step 2.
 * @param {number} extractionConfidence - Confidence from Step 2 (to influence overall).
 * @returns {Promise<{entities: {department: string, date: string, time: string, notes: string}, extraction_confidence: number}>}
 */
async function extractEntities(rawText, extractionConfidence) {
    if (!rawText || rawText.trim().length === 0) {
        return {
            entities: { department: '', date: '', time: '', notes: '' },
            extraction_confidence: 0.0
        };
    }

    // Skip if Step 2 confidence too low (avoid bad input)
    if (extractionConfidence < 0.5) {
        console.log('Skipping entity extraction: Low input confidence'); // Temp log
        return {
            entities: { department: '', date: '', time: '', notes: '' },
            extraction_confidence: 0.0
        };
    }

    // Prompt: Few-shot for accuracy, strict JSON output
    const prompt = `You are an entity extractor for appointment scheduling. Analyze the following raw text and extract:
  - department: Medical department (e.g., "dentist", "cardiologist", "general"). Default "" if unclear.
  - date: ISO date (YYYY-MM-DD) or relative (e.g., "next Friday" → infer current date +7 days). Use today's date as base (assume UTC). Default "" if none.
  - time: 24-hour format (e.g., "3pm" → "15:00"). Default "" if none.
  - notes: Any additional details (e.g., "urgent"). Default "".

  Examples:
  - "Book dentist next Friday at 3pm" → {"department": "dentist", "date": "2023-10-13", "time": "15:00", "notes": ""}
  - "Cardio checkup tomorrow 10am, bring reports" → {"department": "cardiologist", "date": "2023-10-07", "time": "10:00", "notes": "bring reports"}

  Output ONLY valid JSON: {"department": "...", "date": "...", "time": "...", "notes": "..."}. No extra text.

  Raw text: ${rawText}`;

    try {
        const { text, confidence } = await callGemini(prompt);

        // Parse JSON from response (Gemini instructed to output only JSON)
        let entities = { department: '', date: '', time: '', notes: '' };
        let parsedConfidence = Math.min(confidence, extractionConfidence); // Overall confidence

        try {
            // Extract JSON (handle if embedded or multi-line)
            const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/); // Robust JSON regex
            if (jsonMatch) {
                entities = JSON.parse(jsonMatch[0]);
            } else {
                console.warn('No valid JSON in Gemini response:', text.substring(0, 100)); // Temp log
                parsedConfidence *= 0.5; // Penalize bad output
            }
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError.message, 'Response:', text); // Temp log
            parsedConfidence = 0.0;
        }

        return {
            entities,
            extraction_confidence: parsedConfidence
        };
    } catch (error) {
        console.error('Entity Extraction Error:', error.message);
        return {
            entities: { department: '', date: '', time: '', notes: '' },
            extraction_confidence: 0.0
        };
    }
}

module.exports = { extractEntities };