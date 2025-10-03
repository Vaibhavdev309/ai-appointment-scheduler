/**
 * Hybrid validation for /api/appointments/parse:
 * - File upload: Checks req.file (image present, valid type).
 * - JSON: Checks req.body.input (string, non-empty).
 * Supports mixed (file + text fields).
 */
const validateInput = (req, res, next) => {
    try {
        // Case 1: File upload (multipart/form-data)
        if (req.file) {
            if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Only image files are allowed (e.g., JPEG, PNG)'
                });
            }
            if (req.file.size === 0) {
                return res.status(400).json({ status: 'error', message: 'Uploaded file is empty' });
            }
            console.log('Validation: File OK -', req.file.originalname); // Temp log
            return next(); // Proceed to controller
        }

        // Case 2: JSON/text input (no file)
        const { input } = req.body;
        if (!input || typeof input !== 'string' || input.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid input string required (text or base64)'
            });
        }

        // Optional: For JSON image (base64), check isImage flag if present
        const { isImage } = req.body;
        if (isImage && !input.match(/^[A-Za-z0-9+/]*={0,2}$/)) { // Basic base64 check
            return res.status(400).json({
                status: 'error',
                message: 'Invalid base64 format for image input'
            });
        }

        console.log('Validation: JSON Input OK -', input.substring(0, 50) + '...'); // Temp log (truncated)
        next();
    } catch (error) {
        console.error('Validation Error:', error);
        res.status(400).json({ status: 'error', message: 'Validation failed' });
    }
};

module.exports = { validateInput };