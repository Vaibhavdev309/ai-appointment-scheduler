const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config(); // Ensure .env is loaded

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = 'gemini-2.5-flash'; // Efficient for text/image; use 'gemini-1.5-pro' if needed for better OCR

/**
 * Wrapper for Gemini API calls.
 * @param {string} prompt - The prompt text.
 * @param {string|null} imageBase64 - Optional base64 image for multimodal.
 * @param {object} options - { temperature: 0.1, maxTokens: 500 } for consistency.
 * @returns {Promise<{text: string, confidence: number}>} Response with extracted confidence.
 */
async function callGemini(prompt, imageBase64 = null, options = { temperature: 0.1, maxOutputTokens: 500 }) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        let request;

        if (imageBase64) {
            // Multimodal: Text + Image
            const image = {
                inlineData: {
                    data: imageBase64,
                    mimeType: 'image/jpeg' // Assume JPEG; adjust if PNG
                }
            };
            request = { contents: [{ parts: [{ text: prompt }, { inlineData: image }] }] };
        } else {
            // Text only
            request = { contents: [{ parts: [{ text: prompt }] }] };
        }

        const result = await model.generateContent(request, options);
        const response = await result.response;
        const text = response.text().trim();

        // Extract confidence from response (prompt will instruct Gemini to include it, e.g., "Output JSON with confidence")
        let confidence = 0.9; // Default
        const confidenceMatch = text.match(/"confidence":\s*(\d*\.?\d+)/);
        if (confidenceMatch) {
            confidence = parseFloat(confidenceMatch[1]);
        }

        return { text, confidence: Math.min(1.0, Math.max(0.0, confidence)) }; // Clamp 0-1
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error(`AI processing failed: ${error.message}`);
    }
}

module.exports = { callGemini };