# AI-Powered Appointment Scheduler Assistant

Backend service for parsing appointment requests via OCR, entity extraction, and normalization using Gemini API.

## Setup
1. Clone repo.
2. `npm install`
3. Copy `backend/.env.example` to `.env` and add GEMINI_API_KEY.
4. `npm run dev` to start server.

## Architecture
- Pipeline: OCR/Text Input -> Entity Extraction (Gemini) -> Normalization -> Structured JSON.
- Timezone: Asia/Kolkata.
- Guardrails: Ambiguity detection.

## API Endpoints
- POST /api/appointments/parse: Input text or image, output structured appointment.

## Submission Notes
- Problem Statement 5.
- Uses Gemini API for AI chaining.
- TODO: Add OCR lib, full pipeline.

## Known Issues
- None yet.