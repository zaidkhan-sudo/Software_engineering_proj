const http = require('http');
const dotenv = require('dotenv');

// Load environment variables before any other imports
dotenv.config();

// Fail fast if critical environment variables are absent
if (!process.env.MONGO_URI) {
  console.error('FATAL CONFIG ERROR: MONGO_URI is not defined in environment.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('FATAL CONFIG ERROR: JWT_SECRET is not defined in environment.');
  process.exit(1);
}

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// ==========================================
// Socket.IO Server Setup (Will be added in Phase 6)
// ==========================================

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error.message);
    process.exit(1);
  }
}

startServer();
