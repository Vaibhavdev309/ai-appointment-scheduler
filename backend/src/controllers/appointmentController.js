const { extractRawText } = require('../services/inputService');
const { extractEntities } = require('../services/entityService');
const { normalizeAppointment } = require('../services/normalizationService');
const RequestContext = require('../utils/requestContext'); // Import RequestContext

// Helper to create a RequestContext from req
function createRequestContext(req) {
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
    return new RequestContext(input, isImage, mimeType);
}

/**
 * POST /api/appointments/extract-text - Step 1: Extract raw text from input.
 * Input: raw text string or image (multipart/form-data or base64 in JSON)
 * Expected Output: { raw_text: string, confidence: number }
 */
async function extractTextController(req, res, next) {
    try {
        const context = createRequestContext(req);
        const textExtraction = await extractRawText(context);
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
 * Input: raw text string or image (multipart/form-data or base64 in JSON)
 * Expected Output: { entities: { date_phrase: string, time_phrase: string, department: string }, entities_confidence: number }
 */
async function extractEntitiesController(req, res, next) {
    try {
        const context = createRequestContext(req);
        const entityExtraction = await extractEntities(context);
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
 * Input: raw text string or image (multipart/form-data or base64 in JSON)
 * Expected Output: { normalized: { date: string, time: string, tz: string }, normalization_confidence: number }
 * OR {status: "needs_clarification", message: "Ambiguous date/time or department"}
 */
async function normalizeAppointmentController(req, res, next) {
    try {
        const context = createRequestContext(req);
        const normalizationResult = await normalizeAppointment(context);

        if (normalizationResult.status === "needs_clarification") {
            return res.status(200).json(normalizationResult);
        }
        res.status(200).json({
            normalized: {
                date: normalizationResult.normalized.date,
                time: normalizationResult.normalized.time,
                tz: normalizationResult.normalized.tz
            },
            normalization_confidence: normalizationResult.normalization_confidence
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/appointments/final-json - Step 4: Combine entities and normalized values into final JSON.
 * Input: raw text string or image (multipart/form-data or base64 in JSON)
 * Expected Output: { appointment: { department: string, date: string, time: string, tz: string }, status: "ok" }
 * OR {status: "needs_clarification", message: "Ambiguous date/time or department"}
 */
async function getFinalAppointmentJsonController(req, res, next) {
    try {
        const context = createRequestContext(req);
        // Calling normalizeAppointment will internally call extractEntities and extractRawText,
        // all leveraging the request-scoped cache.
        const normalizationResult = await normalizeAppointment(context);

        if (normalizationResult.status === "needs_clarification") {
            return res.status(200).json(normalizationResult);
        }
        // Map department to expected final output name (e.g., "dentist" -> "Dentistry")
        const departmentMap = {
            dentist: "Dentistry",
            cardiologist: "Cardiology",
            general: "General",
            // Add other mappings as needed
        };
        const entityExtraction = context.get('entityExtraction');
        const deptRaw = entityExtraction?.entities?.department?.toLowerCase() || "";
        const departmentFinal = departmentMap[deptRaw] || entityExtraction?.entities?.department || "";
        res.status(200).json({
            appointment: {
                department: departmentFinal,
                date: normalizationResult.normalized.date,
                time: normalizationResult.normalized.time,
                tz: normalizationResult.normalized.tz
            },
            status: "ok"
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    extractTextController,
    extractEntitiesController,
    normalizeAppointmentController,
    getFinalAppointmentJsonController
};