const { extractRawText } = require('../services/inputService');
const { extractEntities: serviceExtractEntities } = require('../services/entityService');
const { normalizeAppointment: serviceNormalizeAppointment } = require('../services/normalizationService');

/**
 * Helper function to process initial input (text or image)
 * and return raw_text and confidence.
 * This function will be called internally by subsequent steps.
 */
async function processInputToRawText(req) {
    let input, isImage = false, mimeType = 'image/jpeg';

    if (req.file) {
        input = req.file.buffer.toString('base64');
        isImage = true;
        mimeType = req.file.mimetype;
    } else {
        const { input: bodyInput, isImage: bodyIsImage = false, mimeType: bodyMimeType = 'image/jpeg' } = req.body;
        input = bodyInput;
        isImage = bodyIsImage;
        mimeType = bodyIsImage ? bodyMimeType : undefined;
    }
    return await extractRawText(input, isImage, mimeType);
}

/**
 * POST /api/appointments/extract-text - Step 1: Extract raw text from input.
 * Input: raw text string or image (multipart/form-data or base64 in JSON)
 * Expected Output: { raw_text: string, confidence: number }
 */
async function extractText(req, res, next) {
    try {
        const textExtraction = await processInputToRawText(req);
        res.status(200).json({
            raw_text: textExtraction.raw_text,
            confidence: textExtraction.confidence
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/appointments/extract-entities - Step 2: Extract entities from raw text.
 * This endpoint will first perform text extraction internally.
 * Input: raw text string or image (multipart/form-data or base64 in JSON)
 * Expected Output: { entities: { date_phrase: string, time_phrase: string, department: string }, entities_confidence: number }
 */
async function extractEntities(req, res, next) {
    try {
        // Step 1: Extract raw text
        const textExtraction = await processInputToRawText(req);

        // Step 2: Extract entities from raw_text
        const entityExtraction = await serviceExtractEntities(textExtraction.raw_text, textExtraction.confidence);

        // Ensure the output matches the specified format
        res.status(200).json({
            entities: {
                date_phrase: entityExtraction.entities.date_phrase || "",
                time_phrase: entityExtraction.entities.time_phrase || "",
                department: entityExtraction.entities.department || ""
            },
            entities_confidence: entityExtraction.extraction_confidence
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/appointments/normalize - Step 3: Normalize extracted entities.
 * This endpoint will first perform text extraction and entity extraction internally.
 * Input: raw text string or image (multipart/form-data or base64 in JSON)
 * Expected Output: { normalized: { date: string, time: string, tz: string }, normalization_confidence: number }
 * OR {status: "needs_clarification", message: "Ambiguous date/time or department"}
 */
async function normalizeAppointment(req, res, next) {
    try {
        // Step 1: Extract raw text
        const textExtraction = await processInputToRawText(req);

        // Step 2: Extract entities from raw_text
        const entityExtraction = await serviceExtractEntities(textExtraction.raw_text, textExtraction.confidence);

        // Step 3: Normalize extracted entities
        const normalizationResult = await serviceNormalizeAppointment(entityExtraction.entities, entityExtraction.extraction_confidence);

        // Check if the normalization service returned a guardrail condition
        if (normalizationResult.status === "needs_clarification") {
            return res.status(200).json(normalizationResult); // Return the guardrail JSON directly
        }

        // Otherwise, return the successfully normalized data
        res.status(200).json({
            normalized: {
                date: normalizationResult.normalized.date || "",
                time: normalizationResult.normalized.time || "",
                tz: normalizationResult.normalized.tz || "Asia/Kolkata"
            },
            normalization_confidence: normalizationResult.normalization_confidence
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/appointments/final-json - Step 4: Combine entities and normalized values into final JSON.
 * This endpoint will perform text extraction, entity extraction, and normalization internally.
 * Input: raw text string or image (multipart/form-data or base64 in JSON)
 * Expected Output: { appointment: { department: string, date: string, time: string, tz: string }, status: "ok" }
 * OR {status: "needs_clarification", message: "Ambiguous date/time or department"}
 */
async function getFinalAppointmentJson(req, res, next) {
    try {
        // Step 1: Extract raw text
        const textExtraction = await processInputToRawText(req);

        // Step 2: Extract entities from raw_text
        const entityExtraction = await serviceExtractEntities(textExtraction.raw_text, textExtraction.confidence);

        // Step 3: Normalize extracted entities
        const normalizationResult = await serviceNormalizeAppointment(entityExtraction.entities, entityExtraction.extraction_confidence);

        // Check if the normalization service returned a guardrail condition
        if (normalizationResult.status === "needs_clarification") {
            return res.status(200).json(normalizationResult); // Return the guardrail JSON directly
        }

        // If no guardrail, combine the data into the final format
        res.status(200).json({
            appointment: {
                department: entityExtraction.entities.department || "", // Use department from entity extraction
                date: normalizationResult.normalized.date || "",
                time: normalizationResult.normalized.time || "",
                tz: normalizationResult.normalized.tz || "Asia/Kolkata"
            },
            status: "ok"
        });

    } catch (error) {
        next(error);
    }
}

module.exports = { extractText, extractEntities, normalizeAppointment, getFinalAppointmentJson };