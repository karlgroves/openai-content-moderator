const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import middleware and routes
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const moderationRoutes = require('./routes/moderation');

const app = express();
const PORT = process.env.PORT || 8000;

// Security headers
app.use(helmet());

// CORS - use configured origin instead of wildcard default
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);

// Body parser with explicit size limit
app.use(bodyParser.json({ limit: '50kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'openai-content-moderator',
  });
});

// API key authentication middleware
const authenticateApiKey = (req, res, next) => {
  // Skip auth if no API_SECRET_KEY is configured (development mode)
  if (!process.env.API_SECRET_KEY) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'A valid API key is required.',
    });
  }
  next();
};

// API Routes (with auth)
app.use('/api/moderation', authenticateApiKey, moderationRoutes);

// Legacy endpoint for backward compatibility
app.post('/moderate', authenticateApiKey, (req, res, next) => {
  req.url = '/text';
  moderationRoutes(req, res, next);
});

// 404 handler - static message, no path reflection
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist.',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
