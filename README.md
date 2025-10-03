# AI-Powered Appointment Scheduler Assistant (Backend)

A backend service for Problem Statement 5: Parses natural language or image-based appointment requests into structured JSON using a pipeline (OCR/Text Extraction -> Entity Extraction -> Normalization) powered by Gemini API. Handles guardrails for ambiguity. Timezone: Asia/Kolkata.

## Architecture Overview
- **Framework**: Node.js + Express (modular: controllers, services, utils).
- **AI Integration**: Gemini API for entity extraction and validation.
- **Pipeline**:
  1. Input: Text or image (via multer for uploads).
  2. OCR/Text: Extract raw text (Gemini multimodal or Tesseract if needed).
  3. Entity Extraction: Identify date/time/department.
  4. Normalization: Convert to ISO format (Asia/Kolkata).
  5. Output: Structured appointment JSON or clarification needed.
- **State Management**: Stateless API; no DB (focus on processing).
- **Error Handling**: Global middleware, confidence-based guardrails.
- **Security**: Helmet, CORS, input limits.

## Setup Instructions
1. Clone the repo: `git clone https://github.com/yourusername/ai-appointment-scheduler-backend.git`
2. Navigate to backend: `cd backend`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and add your `GEMINI_API_KEY`.
5. Start server: `npm run dev` (uses nodemon for hot reload).
6. Test: Visit `http://localhost:3000/health`.

## API Usage
- **Health Check**: GET `/health`
- **Parse Appointment**: POST `/api/appointments/parse`
  - Body: JSON `{ "input": "Book dentist next Friday at 3pm" }` (text) or `{ "input": "base64string...", "isImage": true }`
  - Headers: `Content-Type: application/json`

### Sample Curl Requests
**Text Input:**
```bash
curl -X POST http://localhost:3000/api/appointments/parse \
  -H "Content-Type: application/json" \
  -d '{"input": "Book dentist next Friday at 3pm"}'