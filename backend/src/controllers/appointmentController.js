const { extractRawText } = require('../services/inputService');
const { extractEntities } = require('../services/entityService');
const { normalizeAppointment } = require('../services/normalizationService');
const RequestContext = require('../utils/requestContext');

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

async function getFinalAppointmentJsonController(req, res, next) {
    try {
        const context = createRequestContext(req);
        const normalizationResult = await normalizeAppointment(context);

        if (normalizationResult.status === "needs_clarification") {
            return res.status(200).json(normalizationResult);
        }

        const entityExtraction = context.get('entityExtraction');

        // Map department to expected final output name
        const departmentMap = {
            dentist: "Dentistry",
            cardiologist: "Cardiology",
            general: "General",
            // Add more mappings as needed
        };

        const deptRaw = (entityExtraction?.entities?.department || "").toLowerCase();
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