module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 8000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'omni-moderation-latest'
  },
  
  // Google Perspective API configuration
  googlePerspective: {
    apiKey: process.env.GOOGLE_PERSPECTIVE_API_KEY,
    enabled: process.env.PERSPECTIVE_API_ENABLED === 'true',
    discoveryUrl: 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1',
    attributes: {
      TOXICITY: { scoreThreshold: 0.7 },
      SEVERE_TOXICITY: { scoreThreshold: 0.7 },
      IDENTITY_ATTACK: { scoreThreshold: 0.7 },
      INSULT: { scoreThreshold: 0.7 },
      PROFANITY: { scoreThreshold: 0.7 },
      THREAT: { scoreThreshold: 0.7 }
    }
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // Rate limiting configuration (for future implementation)
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};