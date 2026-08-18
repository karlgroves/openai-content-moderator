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

// Fail closed: a deployed service that spends money on every upstream call must
// not serve unauthenticated traffic just because an env var was forgotten.
// Development and test keep the permissive default so local work needs no setup.
if (config.server.env === 'production' && !process.env.API_SECRET_KEY) {
  throw new Error(
    'API_SECRET_KEY must be set when NODE_ENV=production. ' +
      'Refusing to start with authentication disabled.'
  );
}

// Security headers
app.use(helmet());

// CORS - strict allowlist; reject wildcard because credentials are enabled
if (config.cors.origins.includes('*')) {
  throw new Error(
    'CORS_ORIGIN cannot contain "*" when credentials are enabled. Set an explicit allowlist.'
  );
}
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (config.cors.origins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Origin not allowed by CORS'));
    },
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

// Request logging middleware.
//
// `req.method` and `req.path` are both constrained by Node's HTTP parser and are
// NOT percent-decoded, so neither can carry a raw CR/LF into the log: a raw
// newline in the request line is rejected with 400 before Express runs, and
// `%0A` stays four literal characters. The CR/LF strip below is
// therefore defence-in-depth rather than a live fix, and is written inline at
// the sink on purpose -- routing it through a shared helper merges taint paths
// and makes static analysis strictly worse (see karlgroves/spyfu-client#27).
app.use((req, res, next) => {
  const method = String(req.method).replace(/[\r\n]/g, '');
  const path = String(req.path).replace(/[\r\n]/g, '');
  console.log(`${new Date().toISOString()} - ${method} ${path}`);
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
  // Skip auth if no API_SECRET_KEY is configured (development mode).
  // Production cannot reach this branch: the startup assertion above refuses to
  // build the app at all when NODE_ENV=production and the key is unset.
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

module.exports = app;
