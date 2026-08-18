module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 8000,
    env: process.env.NODE_ENV || 'development',
  },

  // OpenAI configuration
  //
  // Timeouts are sized against the 30s Lambda budget in serverless.yml. The SDK
  // ships a 10-minute default timeout with 2 automatic retries -- 20x longer
  // than the function is allowed to live -- so a slow upstream would burn the
  // whole budget and hand the caller an API Gateway timeout instead of the
  // handled 503 this code tries to produce.
  //
  // Worst case with the defaults below: Perspective 5s, then OpenAI 2 attempts
  // at 8s = 16s, for ~21s inside a 30s budget.
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'omni-moderation-latest',
    timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS) || 8000,
    // Not `||`: 0 is a meaningful value and must not fall through to the default.
    maxRetries: Number.isFinite(Number(process.env.OPENAI_MAX_RETRIES))
      ? Number(process.env.OPENAI_MAX_RETRIES)
      : 1,
  },

  // Google Perspective API configuration
  googlePerspective: {
    apiKey: process.env.GOOGLE_PERSPECTIVE_API_KEY,
    enabled: process.env.PERSPECTIVE_API_ENABLED === 'true',
    // Perspective is optional enrichment, so it gets the smaller slice of the
    // Lambda budget and no retries: a slow Perspective must never be the
    // reason the primary OpenAI moderation does not happen.
    timeoutMs: Number(process.env.PERSPECTIVE_TIMEOUT_MS) || 5000,
    discoveryUrl: 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1',
    attributes: {
      TOXICITY: { scoreThreshold: 0.7 },
      SEVERE_TOXICITY: { scoreThreshold: 0.7 },
      IDENTITY_ATTACK: { scoreThreshold: 0.7 },
      INSULT: { scoreThreshold: 0.7 },
      PROFANITY: { scoreThreshold: 0.7 },
      THREAT: { scoreThreshold: 0.7 },
    },
  },

  // CORS configuration
  // CORS_ORIGIN is a comma-separated allowlist of exact origins.
  // Wildcard '*' is rejected at startup because credentials=true forbids it.
  cors: {
    origins: (process.env.CORS_ORIGIN || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    credentials: true,
  },

  // Rate limiting configuration. This is the authoritative source: app.js reads
  // these values when constructing the express-rate-limit middleware.
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
};
