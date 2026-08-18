const config = require('../config');

const PERSPECTIVE_ENDPOINT = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

// Fallback used when a caller-supplied config omits the timeout (the unit tests
// mock ../config wholesale, so the key is not always present).
const DEFAULT_TIMEOUT_MS = 5000;

// Lookup table built once at module load so we can use Map.get() for attribute
// config instead of a computed property access on the plain config object.
// NOTE: because this runs once when the module is first required, a test that
// mutates `config.googlePerspective.attributes` after import will NOT see the
// change reflected here — reset the module registry (e.g. jest.resetModules()
// + re-require) before asserting against a mutated config.
const attributeConfigs = new Map(Object.entries(config.googlePerspective.attributes));

// Custom error class to carry HTTP status from Perspective API
class PerspectiveApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Reduce an error to an explicit, allowlisted shape before logging.
//
// Written inline in this module rather than shared with middleware/moderation.js
// on purpose: a shared logging helper merges taint paths and makes CodeQL
// strictly worse (see karlgroves/spyfu-client#27 and #60). A `fetch` rejection
// carries a `cause` chain whose contents are undici's, not ours, so logging the
// raw object is exactly what this avoids.
const describeError = error => ({
  name: error?.name,
  message: error?.message,
  statusCode: error?.statusCode,
  code: error?.code ?? error?.cause?.code,
});

// Helper function to make API request to Perspective API
const makePerspectiveRequest = async text => {
  const data = {
    comment: { text },
    requestedAttributes: config.googlePerspective.attributes,
    languages: ['en'],
  };

  const response = await fetch(PERSPECTIVE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The key travels in a header, not the query string. `?key=` is a
      // documented Google auth mechanism, but a secret in a URL is a secret in
      // every access log, proxy log and error string that handles the request.
      'x-goog-api-key': config.googlePerspective.apiKey,
    },
    body: JSON.stringify(data),
    // Without this the call has no timeout of any kind, against a 30s Lambda
    // budget it shares with the primary OpenAI call.
    signal: AbortSignal.timeout(config.googlePerspective.timeoutMs ?? DEFAULT_TIMEOUT_MS),
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
    // Perspective is optional enrichment. It must never fail the request it
    // enriches: this middleware runs BEFORE the OpenAI moderation, so returning
    // a terminal response here means the primary function of the service — the
    // moderation result — is never produced at all. Previously a Perspective
    // rate-limit returned 429 to the caller and no moderation was performed.
    //
    // Every failure now degrades gracefully and the reason is surfaced in
    // req.perspectiveMetadata rather than in the HTTP status.
    console.warn('Perspective API failed, continuing without it:', describeError(error));

    const isApiError = error instanceof PerspectiveApiError;
    const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';

    req.perspectiveResults = null;
    req.perspectiveMetadata = {
      timestamp: new Date().toISOString(),
      textLength: req.body.text.length,
      service: 'google-perspective',
      error: isTimeout ? 'Timed out' : 'Service unavailable',
      ...(isApiError ? { statusCode: error.statusCode } : {}),
    };

    next();
  }
};

module.exports = {
  moderateWithPerspective,
};
