require('dotenv').config(); // Load environment variables from .env file

const app = require('./src/index'); // Import the configured Express app

const PORT = process.env.PORT || 3000; // Use port from environment or default to 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log('Access health check at: http://localhost:' + PORT + '/health');
    console.log('Access appointment parsing at: http://localhost:' + PORT + '/api/appointments/parse');
});