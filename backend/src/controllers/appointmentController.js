const { extractRawText } = require('../services/inputService');

/**
 * POST /api/appointments/parse - Handles JSON (text/base64) or file upload (image).
 */
async function parseAppointment(req, res, next) {
    try {
        let input, isImage = false, mimeType = 'image/jpeg';

        // Check for file upload first (Multer)
        if (req.file) {
            // File uploaded: Convert buffer to base64
            input = req.file.buffer.toString('base64');
            isImage = true;
            mimeType = req.file.mimetype; // Auto-detect (e.g., 'image/png')
            console.log('File Uploaded:', req.file.originalname, 'MIME:', mimeType, 'Size:', req.file.size); // Temp log
        } else {
            // Fallback to JSON body
            const { input: bodyInput, isImage: bodyIsImage = false, mimeType: bodyMimeType = 'image/jpeg' } = req.body;
            if (!bodyInput) {
                return res.status(400).json({ status: 'error', message: 'Input (text, base64, or file) is required' });
            }
            input = bodyInput;
            isImage = bodyIsImage;
            mimeType = bodyIsImage ? bodyMimeType : undefined;
        }

        // Extract raw text (service handles text/image)
        const extraction = await extractRawText(input, isImage, mimeType);

        res.status(200).json({
            status: 'partial',
            step: 'text_extraction',
            data: extraction,
            message: 'Raw text extracted; full pipeline TBD'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { parseAppointment };