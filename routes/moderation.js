const express = require('express');
const router = express.Router();
const { validateModerationRequest } = require('../middleware/validation');
const { moderateContent } = require('../middleware/moderation');
const { moderateWithPerspective } = require('../middleware/perspective');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/moderation/text - Moderate text content
router.post('/text', 
  validateModerationRequest,
  asyncHandler(moderateWithPerspective),
  asyncHandler(moderateContent),
  (req, res) => {
    // Combine results from both APIs
    const combinedResults = {
      openai: {
        results: req.moderationResults,
        metadata: req.moderationMetadata
      }
    };

    // Add Perspective results if available
    if (req.perspectiveResults) {
      combinedResults.perspective = {
        results: req.perspectiveResults,
        metadata: req.perspectiveMetadata
      };
    }

    // Create overall flagged status (flagged if either API flags content)
    const overallFlagged = req.moderationResults.flagged || 
                          (req.perspectiveResults ? req.perspectiveResults.flagged : false);

    const response = {
      flagged: overallFlagged,
      services: combinedResults,
      metadata: {
        timestamp: new Date().toISOString(),
        textLength: req.body.text.length,
        servicesUsed: req.perspectiveResults ? ['openai', 'perspective'] : ['openai']
      }
    };
    res.json(response);
  }
);

// GET /api/moderation/models - Get available moderation models
router.get('/models', (req, res) => {
  res.json({
    models: [
      {
        id: "omni-moderation-latest",
        name: "Omni Moderation Latest",
        description: "Latest OpenAI moderation model"
      }
    ]
  });
});

module.exports = router;