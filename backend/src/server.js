require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify MySQL database connection
    await prisma.$connect();
    console.log('✅ Connected to MySQL Database (civicconnect) successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 CivicConnect Backend REST API running on port ${PORT}`);
      console.log(`📖 API Documentation available at: http://localhost:${PORT}/api/docs`);
      console.log(`🩺 Health check endpoint: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    process.exit(1);
  }
}

startServer();
