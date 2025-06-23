const OpenAI = require("openai");
const config = require("../config");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// Moderation middleware that calls OpenAI API
const moderateContent = async (req, res, next) => {
  try {
    const { text } = req.body;

    // Call OpenAI Moderation API
    const response = await openai.moderations.create({
      model: config.openai.model,
      input: text,
    });

    // Attach moderation results to request object
    req.moderationResults = response.results[0];
    
    // Add metadata to the results
    req.moderationMetadata = {
      timestamp: new Date().toISOString(),
      textLength: text.length,
      model: config.openai.model
    };

    next();
  } catch (error) {
    console.error("OpenAI Moderation API Error:", error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      return res.status(401).json({ 
        error: "Invalid API key. Please check your OpenAI API key configuration." 
      });
    } else if (error.status === 429) {
      return res.status(429).json({ 
        error: "Rate limit exceeded. Please try again later." 
      });
    } else if (error.status === 503) {
      return res.status(503).json({ 
        error: "OpenAI service is temporarily unavailable. Please try again later." 
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      error: "Failed to process moderation request",
      message: error.message || "An unexpected error occurred"
    });
  }
};

module.exports = {
  moderateContent
};