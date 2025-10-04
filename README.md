# AI-Powered Appointment Scheduler Assistant (Backend)

This backend service is designed to parse natural language or image-based appointment requests and convert them into structured data. It implements a robust pipeline for OCR/Text Extraction and Entity Extraction, powered by the Google Gemini API, with a focus on clean architecture, error handling, and clear API responses.

## Problem Statement Context

This project addresses Problem Statement 5, focusing on the initial stages of an AI-Powered Appointment Scheduler Assistant:
1.  **OCR/Text Extraction**: Handling both typed text and noisy image inputs.
2.  **Entity Extraction**: Identifying key appointment details like department, date phrase, and time phrase.
3.  **Normalization**: Standardizing extracted entities into a consistent format (e.g., ISO dates, 24-hour times).
4.  **Final JSON Generation**: Combining all extracted and normalized data into a final, structured appointment object.

## Architecture Overview

The application follows a modular and layered architecture using Node.js and Express:

*   **Framework**: Node.js with Express.js for building the RESTful API.
*   **AI Integration**: Leverages the Google Gemini API for advanced text extraction (including OCR for images) and intelligent entity recognition.
*   **Pipeline Stages Implemented**:
    1.  **Input Handling**: Accepts both JSON payloads (for text or base64 images) and `multipart/form-data` (for direct image file uploads).
    2.  **Text Extraction (Step 1)**: Extracts raw text from the input. For images, this involves OCR. A confidence score is provided for the extraction quality.
    3.  **Entity Extraction (Step 2)**: Identifies and extracts structured entities (department, date phrase, time phrase, notes) from the raw text. A confidence score reflects the certainty of entity recognition.
    4.  **Normalization (Step 3)**: Converts extracted date and time phrases into standardized `YYYY-MM-DD` and `HH:MM` formats, along with a timezone.
    5.  **Final JSON (Step 4)**: Combines the normalized date/time and extracted department into a final appointment object.
*   **Caching**: Implements both per-request caching (using `Map`) and global caching (using Redis) to optimize performance and reduce redundant AI calls for identical inputs.
*   **State Management**: The API is stateless, processing each request independently, with caching mechanisms to improve efficiency.
*   **Error Handling**: Comprehensive error handling is implemented, including specific validation errors, Multer errors, and a global error handler for unexpected issues. Guardrails are in place to return "needs_clarification" for low-confidence extractions or normalizations.
*   **Security**: Basic security measures are in place using `helmet` for HTTP headers and `cors` for cross-origin requests. Input size limits are enforced.
*   **Code Organization**: The codebase is structured into `controllers`, `services`, `middleware`, `routes`, and `utils` directories for clear separation of concerns and reusability.

.
├── controllers/
│ └── appointmentController.js # Handles API request/response logic for appointment processing
│
├── middleware/
│ ├── upload.js # Multer configuration for file uploads
│ └── validation.js # Input validation middleware
│
├── routes/
│ └── appointmentRoutes.js # Defines API routes for appointment processing
│
├── services/
│ ├── entityService.js # Logic for extracting entities using Gemini
│ ├── inputService.js # Logic for extracting raw text (OCR) using Gemini
│ └── normalizationService.js # Logic for normalizing extracted entities using Gemini
│
├── utils/
│ ├── gemini.js # Wrapper for Google Gemini API calls
│ ├── globalCache.js # Redis-based global caching mechanism
│ └── requestContext.js # Manages per-request and global caching context
│
├── .env.example # Example environment variables file
├── index.js # Main Express app setup, global middleware, and route mounting
├── package.json # Project dependencies and scripts
├── server.js # Entry point to start the Node.js server
└── README.md # Project documentation

## Setup Instructions

Follow these steps to get the project up and running on your local machine.

1.  **Clone the Repository**:
    ```bash
    git clone <your-repository-url>
    cd ai-appointment-scheduler-backend # or whatever your project folder is named
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    *   Create a `.env` file in the root directory of the project.
    *   Copy the contents from `.env.example` into your new `.env` file.
    *   Obtain a `GEMINI_API_KEY` from the Google AI Studio (or Google Cloud Console) and replace `YOUR_GEMINI_API_KEY_HERE` with your actual key.
    *   If you plan to use Redis caching, set `REDIS_URL` (e.g., `redis://localhost:6379`). If not set, Redis caching will attempt to connect to `redis://localhost:6379` by default, but the application will still function without a running Redis instance (though caching will be ineffective).
    *   You can also adjust `PORT` and `NODE_ENV` if needed.

    `.env` example:
    ```
    GEMINI_API_KEY=AIzaSy...
    REDIS_URL=redis://localhost:6379
    PORT=3000
    NODE_ENV=development
    ```

4.  **Start the Server**:
    ```bash
    npm run dev
    ```
    The server will start on the specified `PORT` (default: 3000). You should see messages like:
    `Server running on port 3000 in development mode`
    `Access health check at: http://localhost:3000/health`
    `Access appointment parsing at: http://localhost:3000/api/appointments/parse` (Note: this is a conceptual endpoint, actual endpoints are more granular)

## API Usage

The service exposes several endpoints for processing appointment requests in a step-by-step manner.

### **Health Check**

*   **Endpoint**: `GET /health`
*   **Description**: Checks if the server is running and responsive.
*   **Response**:
    ```json
    {
      "status": "ok",
      "message": "Service is healthy"
    }
    ```

### **Step 1: Extract Raw Text**

*   **Endpoint**: `POST /api/appointments/extract-text`
*   **Description**: Extracts raw text from the input (text string or image).
*   **Input**:
    *   **Text Input (JSON Body)**:
        *   `Content-Type`: `application/json`
        *   `body`: `{ "input": "Book dentist next Friday at 3pm" }`
    *   **Base64 Image Input (JSON Body)**:
        *   `Content-Type`: `application/json`
        *   `body`: `{ "input": "base64string...", "isImage": true, "mimeType": "image/jpeg" }`
        *   `mimeType` is optional, defaults to `image/jpeg`.
    *   **Image File Upload (Multipart Form Data)**:
        *   `Content-Type`: `multipart/form-data`
        *   `form-data field`: `image` (containing the image file)
*   **Expected Output (JSON)**:
    ```json
    {
      "raw_text": "Book dentist next Friday at 3pm",
      "confidence": 0.95
    }
    ```

### **Step 2: Extract Entities**

*   **Endpoint**: `POST /api/appointments/extract-entities`
*   **Description**: Extracts structured entities (department, date phrase, time phrase, notes) from the raw text. This endpoint internally calls `/api/appointments/extract-text` if raw text is not already cached.
*   **Input**: Same as "Step 1: Extract Raw Text".
*   **Expected Output (JSON)**:
    ```json
    {
      "entities": {
        "date_phrase": "next Friday",
        "time_phrase": "3pm",
        "department": "dentist"
      },
      "entities_confidence": 0.9
    }
    ```

### **Step 3: Normalize Appointment**

*   **Endpoint**: `POST /api/appointments/normalize`
*   **Description**: Normalizes the extracted entities into standardized date, time, and timezone formats. This endpoint internally calls `/api/appointments/extract-entities` (and subsequently `/api/appointments/extract-text`) if entities are not already cached.
*   **Input**: Same as "Step 1: Extract Raw Text".
*   **Expected Output (JSON)**:
    ```json
    {
      "normalized": {
        "date": "2025-09-26",
        "time": "15:00",
        "tz": "Asia/Kolkata"
      },
      "normalization_confidence": 0.85
    }
    ```
    OR (if clarification is needed)
    ```json
    {
      "status": "needs_clarification",
      "message": "Ambiguous date/time or department"
    }
    ```

### **Step 4: Get Final Appointment JSON**

*   **Endpoint**: `POST /api/appointments/final-json`
*   **Description**: Combines the extracted department and normalized date/time into a final appointment JSON object. This endpoint internally calls `/api/appointments/normalize` (and its preceding steps) if data is not already cached.
*   **Input**: Same as "Step 1: Extract Raw Text".
*   **Expected Output (JSON)**:
    ```json
    {
      "appointment": {
        "department": "Dentistry",
        "date": "2025-09-26",
        "time": "15:00",
        "tz": "Asia/Kolkata"
      },
      "status": "ok"
    }
    ```
    OR (if clarification is needed)
    ```json
    {
      "status": "needs_clarification",
      "message": "Ambiguous date/time or department"
    }
    ```

### **Sample cURL Requests**

You can use these cURL commands to test the endpoints. Remember to replace `YOUR_BASE_URL` with either `http://localhost:3000` for local testing or `https://ai-appointment-scheduler.onrender.com` for the deployed server.

1.  **Health Check**:
    ```bash
    curl -X GET YOUR_BASE_URL/health
    ```

2.  **Text Input (JSON Body) - Final JSON Endpoint**:
    ```bash
    curl -X POST YOUR_BASE_URL/api/appointments/final-json \
      -H "Content-Type: application/json" \
      -d '{"input": "I need to see a cardiologist on October 26th at 10 AM for a follow-up."}'
    ```

3.  **Base64 Image Input (JSON Body) - Final JSON Endpoint**:
    *   First, you'll need a base64 encoded image. You can convert an image to base64 online or using a script.
    *   Replace `YOUR_BASE64_IMAGE_STRING_HERE` with your actual base64 string.

    ```bash
    curl -X POST YOUR_BASE_URL/api/appointments/final-json \
      -H "Content-Type: application/json" \
      -d '{"input": "YOUR_BASE64_IMAGE_STRING_HERE", "isImage": true, "mimeType": "image/png"}'
    ```

4.  **Image File Upload (Multipart Form Data) - Final JSON Endpoint**:
    *   Make sure you have an image file (e.g., `note.png`) in the same directory or provide the correct path.

    ```bash
    curl -X POST YOUR_BASE_URL/api/appointments/final-json \
      -F "image=@./path/to/your/image.jpg"
    ```
    *(Note: For Windows, you might need to use `--form "image=@note.jpg"` or similar syntax depending on your cURL version and shell.)*

### **Error Responses**

*   **Validation Error (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Valid input string required (text or base64)"
    }
    ```
    or
    ```json
    {
      "status": "error",
      "message": "Only image files are allowed (e.g., JPEG, PNG)"
    }
    ```
*   **Multer Error (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Upload error: File too large"
    }
    ```
*   **Not Found Error (404 Not Found)**:
    ```json
    {
      "status": "error",
      "message": "Endpoint not found"
    }
    ```
*   **Internal Server Error (500 Internal Server Error)**:
    ```json
    {
      "status": "error",
      "message": "Internal server error"
    }
    ```

## Evaluation Criteria Checklist

This project aims to meet the following criteria:

*   **Correctness of API responses and adherence to JSON schemas**: Responses are structured as specified for each step, including `raw_text`, `confidence`, `entities`, `entities_confidence`, `normalized`, `normalization_confidence`, and the final `appointment` object.
*   **Handling of both text and image inputs with OCR**: The endpoints correctly process both JSON text/base64 inputs and `multipart/form-data` image uploads, utilizing Gemini for OCR when an image is provided.
*   **Implementation of guardrails and error handling**:
    *   Input validation middleware (`validateInput`) ensures correct request formats.
    *   Multer errors for file uploads are caught and handled.
    *   `inputService`, `entityService`, and `normalizationService` include robust error handling for Gemini API calls and gracefully return default values/low confidence or "needs_clarification" on failure or low confidence.
    *   A global error handler catches unhandled exceptions.
    *   Confidence scores are used to trigger "needs_clarification" responses when processing is uncertain.
*   **Code organization, clarity, and reusability**:
    *   Clear separation of concerns into `controllers`, `services`, `middleware`, `routes`, and `utils`.
    *   Functions are well-defined with JSDoc comments.
    *   Consistent naming conventions.
*   **Effective use of AI for chaining and validation**:
    *   Gemini API is used for raw text extraction (OCR), entity extraction, and normalization.
    *   The pipeline chains `inputService` (Step 1), `entityService` (Step 2), and `normalizationService` (Step 3) calls, with each step leveraging caching.
    *   Confidence scores from each step are propagated and combined to provide overall confidence and trigger guardrails.
*   **Caching Mechanism**: Per-request and global Redis caching are implemented to prevent redundant AI calls for identical inputs, improving performance and reducing API costs.

---

### **Submission Instructions Checklist**

*   [ ] **Working backend demo**: Provide a local demo (e.g., via ngrok) or a simple cloud instance URL.
*   [ ] **GitHub repository**: Link to the public GitHub repository containing all code.
*   [x] **README.md**: This document provides setup instructions, architecture overview, and API usage examples.
*   [x] **Sample cURL/Postman requests**: Provided above in the "API Usage" section.
*   [ ] **Short screen recording**: A video demonstrating the endpoints working with sample inputs (text, base64 image, file upload).

---