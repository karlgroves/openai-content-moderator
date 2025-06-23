// Validation middleware for moderation requests
const validateModerationRequest = (req, res, next) => {
  const { text } = req.body;

  // Check if text is provided
  if (!text) {
    return res.status(400).json({ 
      error: "Text content is required for moderation.",
      field: "text"
    });
  }

  // Check if text is a string
  if (typeof text !== 'string') {
    return res.status(400).json({ 
      error: "Text must be a string.",
      field: "text"
    });
  }

  // Check if text is not empty after trimming
  if (!text.trim()) {
    return res.status(400).json({ 
      error: "Text content cannot be empty.",
      field: "text"
    });
  }

  // Check text length (OpenAI has limits)
  if (text.length > 32768) {
    return res.status(400).json({ 
      error: "Text content exceeds maximum length of 32,768 characters.",
      field: "text",
      maxLength: 32768,
      currentLength: text.length
    });
  }

  // Validation passed, proceed to next middleware
  next();
};

module.exports = {
  validateModerationRequest
};