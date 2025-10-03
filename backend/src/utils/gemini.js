const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = 'gemini-2.5-flash'; // Using a fast, cost-effective model

/**
 * Wrapper for Gemini API calls, supporting both text and multimodal (image + text) inputs.
 * It extracts the generated text and a confidence score (if present in the response).
 * @param {string} prompt - The text prompt for Gemini.
 * @param {string|null} [imageBase64=null] - Optional base64 encoded image string for multimodal input.
 * @param {string} [mimeType='image/jpeg'] - MIME type of the image if imageBase64 is provided.
 * @param {object} [options={ temperature: 0.1, maxOutputTokens: 500 }] - Generation configuration options.
 * @returns {Promise<{text: string, confidence: number}>} - The generated text and a confidence score.
 * @throws {Error} If the AI processing fails.
 */
async function callGemini(prompt, imageBase64 = null, mimeType = 'image/jpeg', options = { temperature: 0.1, maxOutputTokens: 500 }) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }

    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        // Remove data URI prefix if present in base64 string
        if (imageBase64) {
            imageBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        }

        let generationConfig = {
            temperature: options.temperature,
            maxOutputTokens: options.maxOutputTokens,
            // Add other generation parameters as needed, e.g., topP, topK
        };

        let generationResult;
        if (imageBase64) {
            // Multimodal input: prompt and image part
            const imagePart = {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType
                }
            };
            generationResult = await model.generateContent({
                contents: [{ parts: [{ text: prompt }, imagePart] }],
                generationConfig: generationConfig
            });
        } else {
            // Text-only input
            generationResult = await model.generateContent({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: generationConfig
            });
        }

        const response = generationResult.response;
        const text = response.text().trim();

        // Attempt to extract confidence from the generated text, as per prompt instruction
        let confidence = 0.9; // Default confidence
        const confidenceMatch = text.match(/"confidence":\s*(\d*\.?\d+)/i);
        if (confidenceMatch && confidenceMatch[1]) {
            confidence = parseFloat(confidenceMatch[1]);
        }


        return { text, confidence: Math.min(1.0, Math.max(0.0, confidence)) }; // Ensure confidence is within [0, 1]
    } catch (error) {
        console.error('Gemini API Error in callGemini:', error);
        if (imageBase64 && (error.message.includes('400') || error.message.includes('inlineData'))) {
            console.error('Gemini API Error: Possible multimodal issue. Check base64 encoding, MIME type, or Gemini SDK version.');
        }
        throw new Error(`AI processing failed: ${error.message}`);
    }
}

module.exports = { callGemini };