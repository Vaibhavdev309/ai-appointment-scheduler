const { callGemini } = require('../utils/gemini');

async function extractRawText(context) {
    const STEP_NAME = 'rawTextExtraction';

    // 1. Check global cache (now await)
    let cachedResult = await context.getGlobal(STEP_NAME);
    if (cachedResult) {
        console.log('Global cache hit: rawTextExtraction');
        return cachedResult;
    }

    // 2. Check per-request cache (synchronous)
    cachedResult = context.get(STEP_NAME);
    if (cachedResult) {
        console.log('Per-request cache hit: rawTextExtraction');
        return cachedResult;
    }

    const { input, isImage, mimeType } = context;

    if (!input) {
        throw new Error('Input is required');
    }

    let prompt;
    if (isImage) {
        prompt = `Extract all visible text from this image of a note/email/appointment request. Output only the raw text as a string, followed by a JSON like {"confidence": 0.90} where confidence is your certainty (0-1) about the extraction accuracy. Focus on appointment-related phrases like dates, times, departments. Raw text: `;
    } else {
        prompt = `Clean and return the input text as-is for appointment parsing. Output the raw text, followed by {"confidence": 0.90} (high confidence for typed text). Input: `;
    }

    const fullPrompt = prompt + (isImage ? '' : input);

    try {
        const { text, confidence } = await callGemini(fullPrompt, isImage ? input : null, mimeType);

        const jsonStart = text.indexOf('{');
        const rawText = jsonStart > 0 ? text.substring(0, jsonStart).trim() : text;

        const confidenceRounded = Math.round((confidence || (isImage ? 0.85 : 0.90)) * 100) / 100;

        const result = {
            raw_text: rawText || input,
            confidence: confidenceRounded
        };

        // Cache in per-request (sync) and global (async) caches
        context.set(STEP_NAME, result);
        await context.setGlobal(STEP_NAME, result); // Await this

        return result;
    } catch (error) {
        console.error('Raw Text Extraction Error:', error.message);
        const result = {
            raw_text: isImage ? '' : input,
            confidence: 0.0
        };
        context.set(STEP_NAME, result);
        await context.setGlobal(STEP_NAME, result); // Await this
        return result;
    }
}

module.exports = { extractRawText };