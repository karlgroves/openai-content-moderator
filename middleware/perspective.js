const config = require('../config');

// Lookup table built once so we can use Map.get() for attribute config
// instead of a computed property access on the plain config object.
const attributeConfigs = new Map(Object.entries(config.googlePerspective.attributes));

// Custom error class to carry HTTP status from Perspective API
class PerspectiveApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Helper function to make API request to Perspective API
const makePerspectiveRequest = async text => {
  const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${config.googlePerspective.apiKey}`;

  const data = {
    comment: { text },
    requestedAttributes: config.googlePerspective.attributes,
    languages: ['en'],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PerspectiveApiError(
      response.status,
      errorData.error?.message || 'Unknown Perspective API error'
    );
  }

  return response.json();
};

// Transform Perspective API results to match our expected format
const transformPerspectiveResults = perspectiveResponse => {
  const scores = {};
  const categories = {};

  if (perspectiveResponse.attributeScores) {
    Object.entries(perspectiveResponse.attributeScores).forEach(([attribute, data]) => {
      const score = data.summaryScore?.value || 0;
      const threshold = attributeConfigs.get(attribute)?.scoreThreshold ?? Infinity;
      scores[attribute.toLowerCase()] = score;
      categories[attribute.toLowerCase()] = score > threshold;
    });
  }

  return {
    flagged: Object.values(categories).some(flagged => flagged),
    categories,
    scores,
    category_scores: scores,
  };
};

// Perspective API middleware
const moderateWithPerspective = async (req, res, next) => {
  // Skip if Perspective API is disabled
  if (!config.googlePerspective.enabled || !config.googlePerspective.apiKey) {
    return next();
  }

  try {
    const { text } = req.body;

    // Call Perspective API
    const perspectiveResponse = await makePerspectiveRequest(text);

    // Transform results to match OpenAI format
    const transformedResults = transformPerspectiveResults(perspectiveResponse);

    // Attach Perspective results to request object
    req.perspectiveResults = transformedResults;

    // Add metadata
    req.perspectiveMetadata = {
      timestamp: new Date().toISOString(),
      textLength: text.length,
      service: 'google-perspective',
    };

    next();
  } catch (error) {
    console.error('Perspective API Error:', error);

    // Handle specific Perspective API errors using status codes
    if (error instanceof PerspectiveApiError) {
      if (error.statusCode === 400) {
        return res.status(400).json({
          error: 'Invalid request format for Perspective API',
        });
      } else if (error.statusCode === 401 || error.statusCode === 403) {
        return res.status(401).json({
          error: 'Invalid API key. Please check your Google Perspective API key configuration.',
        });
      } else if (error.statusCode === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded for Perspective API. Please try again later.',
        });
      } else if (error.statusCode === 503 || error.statusCode === 502) {
        return res.status(503).json({
          error: 'Perspective API service is temporarily unavailable. Please try again later.',
        });
      }
    }

    // If Perspective fails, log error but continue without it
    console.warn('Perspective API failed, continuing without it:', error.message);
    req.perspectiveResults = null;
    req.perspectiveMetadata = {
      timestamp: new Date().toISOString(),
      textLength: req.body.text.length,
      service: 'google-perspective',
      error: 'Service unavailable',
    };

    next();
  }
};

module.exports = {
  moderateWithPerspective,
};
