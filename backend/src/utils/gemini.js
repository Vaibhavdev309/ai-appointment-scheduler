const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = 'gemini-2.5-flash';

/**
 * Wrapper for Gemini API calls using high-level SDK (fixes multimodal payload).
 * @param {string} prompt - The prompt text.
 * @param {string|null} imageBase64 - Optional base64 image.
 * @param {string} mimeType - MIME for image (default 'image/jpeg').
 * @param {object} options - Generation options.
 * @returns {Promise<{text: string, confidence: number}>}
 */
async function callGemini(prompt, imageBase64 = null, mimeType = 'image/jpeg', options = { temperature: 0.1, maxOutputTokens: 500 }) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        // Strip data URI prefix if present
        if (imageBase64) {
            imageBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
            console.log('Processed Base64 Length:', imageBase64.length); // Temp log
        }

        let generation;
        if (imageBase64) {
            // Multimodal: High-level array input [prompt, imagePart]
            const imagePart = {
                inlineData: {  // SDK expects this exact structure
                    data: imageBase64,
                    mimeType: mimeType
                }
            };
            console.log('Gemini Call Type: Image (Multimodal)'); // Temp log
            generation = await model.generateContent([prompt, imagePart], options);
        } else {
            // Text-only: Simple string input
            console.log('Gemini Call Type: Text'); // Temp log
            generation = await model.generateContent(prompt, options);
        }

        const response = await generation.response;
        const text = response.text().trim();

        // Extract confidence (prompt instructs to include it)
        let confidence = 0.9;
        const confidenceMatch = text.match(/"confidence":\s*(\d*\.?\d+)/i);
        if (confidenceMatch) {
            confidence = parseFloat(confidenceMatch[1]);
        }

        console.log('Gemini Raw Response:', text); // Temp log

        return { text, confidence: Math.min(1.0, Math.max(0.0, confidence)) };
    } catch (error) {
        console.error('Gemini API Error:', error);
        if (imageBase64 && (error.message.includes('400') || error.message.includes('inlineData'))) {
            console.error('Multimodal Issue: Check base64 validity, MIME, or SDK version. Try updating @google/generative-ai.');
        }
        throw new Error(`AI processing failed: ${error.message}`);
    }
}

module.exports = { callGemini };