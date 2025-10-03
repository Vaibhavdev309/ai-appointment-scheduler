const { extractRawText } = require('../services/inputService');
const { extractEntities } = require('../services/entityService');

/**
 * POST /api/appointments/parse - Full pipeline with guardrail for ambiguity.
 */
async function parseAppointment(req, res, next) {
    try {
        let input, isImage = false, mimeType = 'image/jpeg';

        // Handle file or JSON (unchanged)
        if (req.file) {
            input = req.file.buffer.toString('base64');
            isImage = true;
            mimeType = req.file.mimetype;
            console.log('File Uploaded:', req.file.originalname, 'MIME:', mimeType); // Temp log
        } else {
            const { input: bodyInput, isImage: bodyIsImage = false, mimeType: bodyMimeType = 'image/jpeg' } = req.body;
            if (!bodyInput) {
                return res.status(400).json({ status: 'error', message: 'Input required' });
            }
            input = bodyInput;
            isImage = bodyIsImage;
            mimeType = bodyIsImage ? bodyMimeType : undefined;
        }

        // Step 2: Extract raw text
        const textExtraction = await extractRawText(input, isImage, mimeType);

        // Step 3: Extract entities from raw_text
        const entityExtraction = await extractEntities(textExtraction.raw_text, textExtraction.confidence);

        // Guardrail: Check for ambiguity / needs clarification
        const isAmbiguous =
            textExtraction.confidence < 0.6 ||  // Poor input quality
            entityExtraction.extraction_confidence < 0.7 ||  // Low entity certainty
            !entityExtraction.entities.department ||  // Missing department
            !entityExtraction.entities.date ||  // Missing date
            !entityExtraction.entities.time;  // Missing time (notes optional)

        if (isAmbiguous) {
            console.log('Guardrail Triggered: Ambiguous extraction'); // Temp log
            return res.status(200).json({  // 200 for soft error (not failure)
                status: 'needs_clarification',
                message: 'Ambiguous date/time or department',
                data: {  // Include data for debugging / frontend display
                    text_extraction: textExtraction,
                    entity_extraction: entityExtraction
                },
                suggestion: 'Please provide more details, e.g., specific date, time, and department.'
            });
        }

        // Success: Clear extraction
        res.status(200).json({
            status: 'success',
            step: 'full_extraction',
            data: {
                text_extraction: textExtraction,
                entity_extraction: entityExtraction
            },
            message: 'Text and entities extracted successfully'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { parseAppointment };