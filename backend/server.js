require('dotenv').config(); // Load env vars from backend/.env

const app = require('./src/index');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});