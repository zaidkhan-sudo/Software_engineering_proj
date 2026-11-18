const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const healthRoutes = require('./routes/healthRoutes');
const apiV1Router = require('./routes/index');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Required on Render/PaaS behind reverse proxies for rate limiting & IP detection
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS configuration supporting web dev and packaged Electron applications
const corsOptions = {
  origin: function (origin, callback) {
    const allowed = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // In dev: origin matches e.g. http://localhost:5173
    // In prod (Electron file://): origin is literal string "null" or starts with "file://"
    // Postman / server-to-server / curl: origin is undefined
    const isElectron =
      origin === 'null' ||
      origin === 'file://' ||
      (origin && origin.startsWith('file://'));

    if (!origin || isElectron || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitize user input against MongoDB operator injection ($ and .)
app.use(mongoSanitize());

// Mount health check route at root level (/health)
app.use(healthRoutes);

// Mount API v1 routes
app.use('/api/v1', apiV1Router);

// Unknown route 404 handler
app.use(notFoundHandler);

// Global centralized error handler
app.use(errorHandler);

module.exports = app;
