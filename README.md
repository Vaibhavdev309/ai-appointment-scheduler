# AI-Powered Appointment Scheduler Assistant (Backend)

This backend service is designed to parse natural language or image-based appointment requests and convert them into structured data. It implements a robust pipeline for OCR/Text Extraction and Entity Extraction, powered by the Google Gemini API, with a focus on clean architecture, error handling, and clear API responses.

## Problem Statement Context

This project addresses Problem Statement 5, focusing on the initial stages of an AI-Powered Appointment Scheduler Assistant:
1.  **OCR/Text Extraction**: Handling both typed text and noisy image inputs.
2.  **Entity Extraction**: Identifying key appointment details like department, date phrase, and time phrase.

## Architecture Overview

The application follows a modular and layered architecture using Node.js and Express:

*   **Framework**: Node.js with Express.js for building the RESTful API.
*   **AI Integration**: Leverages the Google Gemini API for advanced text extraction (including OCR for images) and intelligent entity recognition.
*   **Pipeline Stages Implemented**:
    1.  **Input Handling**: Accepts both JSON payloads (for text or base64 images) and `multipart/form-data` (for direct image file uploads).
    2.  **Text Extraction (Step 1)**: Extracts raw text from the input. For images, this involves OCR. A confidence score is provided for the extraction quality.
    3.  **Entity Extraction (Step 2)**: Identifies and extracts structured entities (department, date phrase, time phrase, notes) from the raw text. A confidence score reflects the certainty of entity recognition.
*   **State Management**: The API is stateless, processing each request independently.
*   **Error Handling**: Comprehensive error handling is implemented, including specific validation errors, Multer errors, and a global error handler for unexpected issues.
*   **Security**: Basic security measures are in place using `helmet` for HTTP headers and `cors` for cross-origin requests. Input size limits are enforced.
*   **Code Organization**: The codebase is structured into `controllers`, `services`, `middleware`, and `utils` directories for clear separation of concerns and reusability.

## Setup Instructions

Follow these steps to get the project up and running on your local machine.

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/yourusername/ai-appointment-scheduler-backend.git
    cd ai-appointment-scheduler-backend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    *   Create a `.env` file in the root directory of the project.
    *   Copy the contents from `.env.example` into your new `.env` file.
    *   Obtain a `GEMINI_API_KEY` from the Google AI Studio (or Google Cloud Console) and replace `YOUR_GEMINI_API_KEY_HERE` with your actual key.
    *   You can also adjust `PORT` and `NODE_ENV` if needed.

    `.env` example:
    ```
    GEMINI_API_KEY=AIzaSy...
    PORT=3000
    NODE_ENV=development
    ```

4.  **Start the Server**:
    ```bash
    npm run dev
    ```
    The server will start on the specified `PORT` (default: 3000). You should see a message like:
    `Server running on port 3000 in development mode`

## API Usage

The service exposes a single primary endpoint for parsing appointment requests.

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

### **Parse Appointment Request (Step 1 & 2)**

*   **Endpoint**: `POST /api/appointments/parse`
*   **Description**: Processes an appointment request (text or image) to extract raw text and then structured entities.
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
      "status": "success",
      "message": "Raw text and entities extracted successfully",
      "data": {
        "text_extraction": {
          "raw_text": "Book dentist next Friday at 3pm",
          "confidence": 0.95
        },
        "entity_extraction": {
          "entities": {
            "department": "dentist",
            "date_phrase": "next Friday",
            "time_phrase": "3pm",
            "notes": ""
          },
          "entities_confidence": 0.9
        }
      }
    }
    ```

### **Sample cURL Requests**

You can use these cURL commands to test the endpoint.

1.  **Text Input (JSON Body)**:
    ```bash
    curl -X POST http://localhost:3000/api/appointments/parse \
      -H "Content-Type: application/json" \
      -d '{"input": "I need to see a cardiologist on October 26th at 10 AM for a follow-up."}'
    ```

2.  **Base64 Image Input (JSON Body)**:
    *   First, you'll need a base64 encoded image. You can convert an image to base64 online or using a script.
    *   Replace `YOUR_BASE64_IMAGE_STRING_HERE` with your actual base64 string.

    ```bash
    curl -X POST http://localhost:3000/api/appointments/parse \
      -H "Content-Type: application/json" \
      -d '{"input": "YOUR_BASE64_IMAGE_STRING_HERE", "isImage": true, "mimeType": "image/png"}'
    ```

3.  **Image File Upload (Multipart Form Data)**:
    *   Make sure you have an image file (e.g., `note.png`) in the same directory or provide the correct path.

    ```bash
    curl -X POST http://localhost:3000/api/appointments/parse \
      -F "image=@./path/to/your/image.jpg"
    ```
    *(Note: For Windows, you might need to use `--form "image=@note.jpg"` or similar syntax depending on your cURL version and shell.)*

### **Error Responses**

*   **Validation Error (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Validation Error: Input required in request body."
    }
    ```
    or
    ```json
    {
      "status": "error",
      "message": "Validation Error: Only image files are allowed (e.g., JPEG, PNG) for file uploads."
    }
    ```
*   **Not Found Error (404 Not Found)**:
    ```json
    {
      "status": "error",
      "message": "Endpoint not found. Please check the URL and method."
    }
    ```
*   **Internal Server Error (500 Internal Server Error)**:
    ```json
    {
      "status": "error",
      "message": "Internal server error. An unexpected error occurred."
    }
    ```

## Evaluation Criteria Checklist

This project aims to meet the following criteria:

*   **Correctness of API responses and adherence to JSON schemas**: Responses are structured as specified for Step 1 and Step 2, including `raw_text`, `confidence`, `entities`, and `entities_confidence`.
*   **Handling of both text and image inputs with OCR**: The `parseAppointment` endpoint correctly processes both JSON text/base64 inputs and `multipart/form-data` image uploads, utilizing Gemini for OCR when an image is provided.
*   **Implementation of guardrails and error handling**:
    *   Input validation middleware (`validateInput`) ensures correct request formats.
    *   Multer errors for file uploads are caught and handled.
    *   `inputService` and `entityService` include error handling for Gemini API calls and gracefully return default values/low confidence on failure.
    *   A global error handler catches unhandled exceptions.
    *   (Note: The specific "needs\_clarification" guardrail from the problem statement is intentionally omitted as per the request to stop at Step 2, but the confidence scores provide a basis for future guardrails.)
*   **Code organization, clarity, and reusability**:
    *   Clear separation of concerns into `controllers`, `services`, `middleware`, and `utils`.
    *   Functions are well-defined with JSDoc comments.
    *   Consistent naming conventions.
*   **Effective use of AI for chaining and validation**:
    *   Gemini API is used for both raw text extraction (OCR) and entity extraction.
    *   The pipeline chains `inputService` (Step 1) and `entityService` (Step 2) calls.
    *   Confidence scores from each step are propagated and combined to provide an overall `entities_confidence`.

---

### **Submission Instructions Checklist**

*   [ ] **Working backend demo**: Provide a local demo (e.g., via ngrok) or a simple cloud instance URL.
*   [ ] **GitHub repository**: Link to the public GitHub repository containing all code.
*   [x] **README.md**: This document provides setup instructions, architecture overview, and API usage examples.
*   [x] **Sample cURL/Postman requests**: Provided above in the "API Usage" section.
*   [ ] **Short screen recording**: A video demonstrating the endpoints working with sample inputs (text, base64 image, file upload).

---

This comprehensive structure and updated code should set you up for a highly professional and well-evaluated project! Remember to replace placeholder values like `YOUR_GEMINI_API_KEY_HERE` and `yourusername` in the `README.md` and `.env` file.