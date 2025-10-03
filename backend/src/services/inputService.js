const { callGemini } = require('../utils/gemini');

/**
 * Processes input (text or image) to extract raw text via Gemini (OCR for images).
 * @param {string} input - Text string or base64 image.
 * @param {boolean} isImage - True if base64 image.
 * @param {string} mimeType - MIME type for image.
 * @returns {Promise<{raw_text: string, confidence: number}>}
 */
async function extractRawText(input, isImage = false, mimeType = 'image/jpeg') {
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

        // Parse raw_text from response (Gemini outputs text + JSON; extract first part)
        const jsonStart = text.indexOf('{');
        const rawText = jsonStart > 0 ? text.substring(0, jsonStart).trim() : text;

        return {
            raw_text: rawText || input,
            confidence: confidence || (isImage ? 0.85 : 0.95)
        };
    } catch (error) {
        console.error('Raw Text Extraction Error:', error.message);
        return {
            raw_text: isImage ? '' : input,
            confidence: 0.0
        };
    }
}

module.exports = { extractRawText };