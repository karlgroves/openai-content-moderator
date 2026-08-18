const OpenAI = require('openai');
const config = require('../config');

// Initialize OpenAI client.
//
// timeout and maxRetries are set explicitly rather than inherited: the SDK
// defaults to a 10-minute timeout with 2 retries, which is 20x the 30s Lambda
// budget in serverless.yml. A slow response under the defaults burns the whole
// budget and the caller gets an API Gateway timeout instead of the handled 503
// the catch block below is trying to produce. See config/index.js for the
// budget arithmetic.
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  timeout: config.openai.timeoutMs,
  maxRetries: config.openai.maxRetries,
});

// Reduce an error to an explicit, allowlisted shape before logging, rather than
// handing the whole object to console.error. Deliberately not shared with
// middleware/perspective.js: a shared logging helper merges taint paths and
// makes CodeQL strictly worse (see karlgroves/spyfu-client#27 and #60).
const describeError = error => ({
  name: error?.name,
  message: error?.message,
  status: error?.status,
  code: error?.code,
  type: error?.type,
  request_id: error?.request_id,
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
      model: config.openai.model,
    };

    next();
  } catch (error) {
    console.error('OpenAI Moderation API Error:', describeError(error));

    // A timeout or dropped connection is an upstream availability problem, not a
    // bug in the caller's request: report it as 503 rather than a generic 500.
    // These errors carry no `status`, so the checks below would miss them.
    // Matched by instanceof because the SDK leaves `name` as plain 'Error';
    // APIConnectionTimeoutError extends APIConnectionError, so both are covered.
    if (error instanceof OpenAI.APIConnectionError) {
      return res.status(503).json({
        error: 'OpenAI service is temporarily unavailable. Please try again later.',
      });
    }

    // Handle specific OpenAI errors
    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key. Please check your OpenAI API key configuration.',
      });
    } else if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
      });
    } else if (error.status === 503) {
      return res.status(503).json({
        error: 'OpenAI service is temporarily unavailable. Please try again later.',
      });
    }

    // Generic error response - don't expose internal error details
    res.status(500).json({
      error: 'Failed to process moderation request',
    });
  }
};

module.exports = {
  moderateContent,
};
