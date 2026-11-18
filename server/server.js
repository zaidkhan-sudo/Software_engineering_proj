const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

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
const User = require('./models/User');
const { ROLES } = require('./utils/constants');
const notificationService = require('./services/notificationService');

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// ==========================================
// Socket.IO Server Setup
// ==========================================

const allowedCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === 'null' || origin === 'file://' || origin.startsWith('file://')) return true;
  return allowedCorsOrigins.includes(origin);
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO Authentication Handshake Middleware (README lines 943-958)
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Verify user exists and is active (same rule as HTTP auth middleware)
    const user = await User.findById(decoded.id).select('isActive role');
    if (!user || !user.isActive) {
      return next(new Error('Account is inactive or does not exist'));
    }
    socket.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Each user joins a private room — notifications are sent only here
  socket.join(`user:${socket.user.id}`);

  // Admins additionally join an admin room for system-wide alerts
  if (socket.user.role === ROLES.ADMIN) {
    socket.join('admins');
  }
});

// Initialize notification service with the active io instance
notificationService.init(io);

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
