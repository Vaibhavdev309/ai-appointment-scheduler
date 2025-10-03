const { extractRawText } = require('../services/inputService');
const { extractEntities } = require('../services/entityService'); // New import

/**
 * POST /api/appointments/parse - Full pipeline: Extract text → Extract entities.
 */
async function parseAppointment(req, res, next) {
    try {
        let input, isImage = false, mimeType = 'image/jpeg';

        // Handle file or JSON (from Step 2)
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

        // Combined response
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