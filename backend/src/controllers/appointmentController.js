const { extractRawText } = require('../services/inputService');

/**
 * POST /api/appointments/parse - Main endpoint for pipeline.
 * Currently handles only input extraction; will chain full pipeline later.
 * @param {object} req - Express request (body: { input: string, isImage: boolean })
 * @param {object} res - Express response
 */
async function parseAppointment(req, res, next) {
    try {
        const { input, isImage = false } = req.body;

        if (!input) {
            return res.status(400).json({ status: 'error', message: 'Input (text or base64 image) is required' });
        }

        // Step 1: Extract raw text
        const extraction = await extractRawText(input, isImage);

        // For now, return only Step 1 output (full pipeline later)
        res.status(200).json({
            status: 'partial', // Will be 'ok' when full
            step: 'text_extraction',
            data: extraction,
            message: 'Raw text extracted; full pipeline TBD'
        });
    } catch (error) {
        next(error); // Pass to global error handler
    }
}

module.exports = { parseAppointment };