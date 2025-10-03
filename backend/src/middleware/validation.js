const validateInput = (req, res, next) => {
    console.log('Validating input:', req.body);
    if (!req.body.input || typeof req.body.input !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Valid input string required' });
    }
    next();
};

module.exports = { validateInput };