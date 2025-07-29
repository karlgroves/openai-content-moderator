const config = require('../config');

// Helper function to make API request to Perspective API
const makePerspectiveRequest = async (text) => {
  const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${config.googlePerspective.apiKey}`;
  
  const data = {
    comment: { text },
    requestedAttributes: config.googlePerspective.attributes,
    languages: ['en']
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Perspective API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  return response.json();
};

// Transform Perspective API results to match our expected format
const transformPerspectiveResults = (perspectiveResponse) => {
  const scores = {};
  const categories = {};
  
  if (perspectiveResponse.attributeScores) {
    Object.entries(perspectiveResponse.attributeScores).forEach(([attribute, data]) => {
      const score = data.summaryScore?.value || 0;
      scores[attribute.toLowerCase()] = score;
      categories[attribute.toLowerCase()] = score > config.googlePerspective.attributes[attribute]?.scoreThreshold;
    });
  }
  
  return {
    flagged: Object.values(categories).some(flagged => flagged),
    categories,
    scores,
    category_scores: scores
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
      service: 'google-perspective'
    };

    next();
  } catch (error) {
    console.error('Perspective API Error:', error);
    
    // Handle specific Perspective API errors
    if (error.message.includes('400')) {
      return res.status(400).json({ 
        error: 'Invalid request format for Perspective API' 
      });
    } else if (error.message.includes('401') || error.message.includes('403')) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your Google Perspective API key configuration.' 
      });
    } else if (error.message.includes('429')) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded for Perspective API. Please try again later.' 
      });
    } else if (error.message.includes('503') || error.message.includes('502')) {
      return res.status(503).json({ 
        error: 'Perspective API service is temporarily unavailable. Please try again later.' 
      });
    }
    
    // If Perspective fails, log error but continue without it
    console.warn('Perspective API failed, continuing without it:', error.message);
    req.perspectiveResults = null;
    req.perspectiveMetadata = {
      timestamp: new Date().toISOString(),
      textLength: req.body.text.length,
      service: 'google-perspective',
      error: 'Service unavailable'
    };
    
    next();
  }
};

module.exports = {
  moderateWithPerspective
};