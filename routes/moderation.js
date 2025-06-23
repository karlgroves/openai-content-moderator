const express = require('express');
const router = express.Router();
const { validateModerationRequest } = require('../middleware/validation');
const { moderateContent } = require('../middleware/moderation');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/moderation/text - Moderate text content
router.post('/text', 
  validateModerationRequest,
  asyncHandler(moderateContent),
  (req, res) => {
    res.json({
      results: req.moderationResults,
      metadata: req.moderationMetadata
    });
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