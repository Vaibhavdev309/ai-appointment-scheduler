require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = 'gemini-2.5-flash'; // Updated

async function testGemini() {
    try {
        console.log('Testing Gemini with API Key:', !!process.env.GEMINI_API_KEY ? 'Loaded' : 'Missing');
        console.log('Using Model:', modelName);
        const prompt = 'Say hello and output {"confidence": 0.95} at the end.';
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = await result.response.text();
        console.log('Success! Response:', text);

        // Mimic parsing
        const confidenceMatch = text.match(/"confidence":\s*(\d*\.?\d+)/);
        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.9;
        console.log('Parsed Confidence:', confidence);
    } catch (error) {
        console.error('Gemini Test Failed:', error.message);
        if (error.status?.code === 404) {
            console.log('Fix: Model not found. Run ListModels again or try another model like gemini-2.0-flash-001');
        } else if (error.status?.code === 401) {
            console.log('Fix: Invalid API key');
        } else if (error.status?.code === 429) {
            console.log('Fix: Rate limit/quota exceeded. Wait 1-2 min');
        }
    }
}

testGemini();