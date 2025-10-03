const { callGemini } = require('../utils/gemini');
const RequestContext = require('../utils/requestContext'); // Import RequestContext

/**
 * Processes input (text or image) to extract raw text via Gemini (OCR for images).
 * @param {RequestContext} context - The request context object.
 * @returns {Promise<{raw_text: string, confidence: number}>}
 */
async function extractRawText(context) {
    const STEP_NAME = 'rawTextExtraction';
    let cachedResult = context.get(STEP_NAME);
    if (cachedResult) {
        console.log('Cache hit: rawTextExtraction');
        return cachedResult;
    }

    const { input, isImage, mimeType } = context;

    if (!input) {
        throw new Error('Input is required');
    }

    let prompt;
    if (isImage) {
        prompt = `Extract all visible text from this image of a note/email/appointment request. Output only the raw text as a string, followed by a JSON like {"confidence": 0.95} where confidence is your certainty (0-1) about the extraction accuracy. Focus on appointment-related phrases like dates, times, departments. Raw text: `;
    } else {
        prompt = `Clean and return the input text as-is for appointment parsing. Output the raw text, followed by {"confidence": 0.95} (high confidence for typed text). Input: `;
    }

    const fullPrompt = prompt + (isImage ? '' : input);

    try {
        const { text, confidence } = await callGemini(fullPrompt, isImage ? input : null, mimeType);

        const jsonStart = text.indexOf('{');
        const rawText = jsonStart > 0 ? text.substring(0, jsonStart).trim() : text;

        const confidenceRounded = Math.round((confidence || (isImage ? 0.85 : 0.95)) * 100) / 100;
        const result = {
            raw_text: rawText || input,
            confidence: confidenceRounded
        };
        context.set(STEP_NAME, result);
        return result;
    } catch (error) {
        console.error('Raw Text Extraction Error:', error.message);
        const result = {
            raw_text: isImage ? '' : input,
            confidence: 0.0
        };
        context.set(STEP_NAME, result); // Cache the error result too
        return result;
    }
}

module.exports = { extractRawText };