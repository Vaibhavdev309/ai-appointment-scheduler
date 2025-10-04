# AI-Powered Appointment Scheduler Assistant

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-blue)](https://expressjs.com/)
[![Redis](https://img.shields.io/badge/Redis-Caching-orange)](https://redis.io/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%20API-blueviolet)](https://developers.google.com/ai)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [API Usage](#api-usage)
- [Example: Processing an Image Input](#example-processing-an-image-input)
- [Error Responses](#error-responses)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

This backend service leverages **Google Gemini AI** to intelligently parse appointment requests from natural language text and images (via OCR). It extracts, normalizes, and structures key details such as department, date, time, and timezone into clean JSON objects.

The system is designed for **scalability, reliability, and efficiency**, featuring:

- Modular pipeline stages: OCR/Text Extraction → Entity Extraction → Normalization → Final JSON generation
- Support for text input, base64 images, and multipart image uploads
- Per-request and global caching (Redis) to reduce redundant AI calls
- Robust error handling and guardrails for ambiguous inputs
- Stateless API with clear separation of concerns

Ideal for real-world appointment booking automation in healthcare, services, and more.

---

## Architecture


The backend is built with **Node.js** and **Express.js**, integrating Google Gemini API for AI-powered text and image understanding.

### Pipeline Stages

1. **Input Handling**  
   Accepts JSON text, base64 images, or multipart image uploads.

2. **Text Extraction (OCR)**  
   Extracts raw text from images or passes through text input.

3. **Entity Extraction**  
   Identifies appointment entities: department, date phrase, time phrase, notes.

4. **Normalization**  
   Converts date/time phrases into ISO date/time and timezone.

5. **Final JSON Generation**  
   Combines all data into a structured appointment object with confidence scores.

### Caching & State

- **Per-request cache**: In-memory Map to avoid repeated calls within a request.
- **Global cache**: Redis to store results for identical inputs across requests.

### Security & Validation

- Uses `helmet` for secure HTTP headers.
- CORS enabled for cross-origin requests.
- Input validation with custom middleware.
- File upload limits and type restrictions.

---

## Setup Instructions

1. **Clone the repository**

```bash
git clone <your-repository-url>
cd ai-appointment-scheduler-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
```

4. **Start the server**

```bash
npm run dev
```

Server runs on `http://localhost:3000` by default.

---

## API Usage

### Common Input Formats

- **Text Input (JSON)**

```json
{
  "input": "Book dentist next Friday at 3pm",
  "context": "User  is in India"  // Optional
}
```

- **Base64 Image Input (JSON)**

```json
{
  "input": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "isImage": true,
  "mimeType": "image/jpeg"
}
```

- **Image File Upload (multipart/form-data)**

Use form field `image` for JPEG/PNG files (max 5MB).

---

### Endpoints Overview

| Step | Endpoint                          | Description                                  |
|-------|---------------------------------|----------------------------------------------|
| 1     | `POST /api/appointments/extract-text`     | Extract raw text from input (OCR for images) |
| 2     | `POST /api/appointments/extract-entities` | Extract structured entities from text        |
| 3     | `POST /api/appointments/normalize`        | Normalize date/time/timezone                  |
| 4     | `POST /api/appointments/final-json`       | Get final structured appointment JSON        |
| -     | `GET /health`                             | Health check endpoint                         |

---

## Example: Processing an Image Input

This example demonstrates the full pipeline for a handwritten or typed note image:  
**"Book dentist nxt friday at 3pm"**

Upload the image via base64 or multipart form data to any endpoint (e.g., `/api/appointments/final-json`). The system performs OCR, entity extraction, normalization, and outputs structured JSON.

---

### Input Image

![Input Image](https://res.cloudinary.com/dzspdm4fl/image/upload/v1759584905/WhatsApp_Image_2025-10-03_at_8.24.12_PM_bqb1si.jpg)  
*Handwritten/typed note image: "Dentist appt next Tuesday 2:30 PM".*

---

### Step 1: Extract Raw Text (OCR/Text Extraction)

**Endpoint:** `POST /api/appointments/extract-text`

**Response:**

```json
{
    "raw_text": "Book dentist nxt friday at 3pm.",
    "confidence": 0.98
}
```

![Step 1 Response](https://res.cloudinary.com/dzspdm4fl/image/upload/v1759584888/Screenshot_2025-10-04_185933_gszbin.png)  
*API response showing extracted raw text and confidence.*

---

### Step 2: Extract Entities

**Endpoint:** `POST /api/appointments/extract-entities`

**Response:**

```json
{
    "entities": {
        "date_phrase": "nxt friday",
        "time_phrase": "3pm",
        "department": "dentist"
    },
    "entities_confidence": 0.9
}
```

![Step 2 Response](https://res.cloudinary.com/dzspdm4fl/image/upload/v1759584888/Screenshot_2025-10-04_185946_t5ybyh.png)  
*API response showing extracted entities.*

---

### Step 3: Normalize Appointment

**Endpoint:** `POST /api/appointments/normalize`

**Response:**

```json
{
    "normalized": {
        "date": "2025-10-10",
        "time": "15:00",
        "tz": "Asia/Kolkata"
    },
    "normalization_confidence": 0.9
}
```

![Step 3 Response](https://res.cloudinary.com/dzspdm4fl/image/upload/v1759584888/Screenshot_2025-10-04_185954_yhrycv.png)  
*API response showing normalized date, time, and timezone.*

---

### Step 4: Get Final Appointment JSON

**Endpoint:** `POST /api/appointments/final-json`

**Response:**

```json
{
    "appointment": {
        "department": "Dentistry",
        "date": "2025-10-10",
        "time": "15:00",
        "tz": "Asia/Kolkata"
    },
    "status": "ok"
}
```

![Step 4 Response](https://res.cloudinary.com/dzspdm4fl/image/upload/v1759584888/Screenshot_2025-10-04_190004_bedyoq.png)  
*Final structured appointment JSON with aggregated confidence.*

---

## Error Responses

- **400 Bad Request (Validation Error)**

```json
{
  "status": "error",
  "message": "Valid input string required (text or base64)"
}
```

- **Unsupported File Type**

```json
{
  "status": "error",
  "message": "Only image files are allowed (e.g., jpeg, png)"
}
```

- **Needs Clarification**

```json
{
  "status": "needs_clarification",
  "message": "Ambiguous date/time or department – please provide more details."
}
```

---

## Testing

- Unit and integration tests are implemented using **Jest**.
- Run tests with:

```bash
npm test
```

- Coverage reports available with:

```bash
npm test -- --coverage
```

---

## Deployment

- Deploy on **Render**, **Heroku**, **AWS**, or **Vercel**.
- Set environment variables (`GEMINI_API_KEY`, `REDIS_URL`, etc.) in your platform dashboard.
- Use `npm start` as the start command.
- For production, enable Redis caching and monitor API usage.

---

## Live Hosted URLs

- **Frontend**: [https://appoai.vercel.app/](https://appoai.vercel.app/)  
- **Backend API**: [https://ai-appointment-scheduler.onrender.com](https://ai-appointment-scheduler.onrender.com)

---

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, features, or improvements.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

Thank you for exploring the AI-Powered Appointment Scheduler Assistant backend!  

---

*End of README.md*

--=
