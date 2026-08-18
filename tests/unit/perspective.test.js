const { moderateWithPerspective } = require('../../middleware/perspective');
const config = require('../../config');

// Mock fetch globally
global.fetch = jest.fn();

// Mock config
jest.mock('../../config', () => ({
  googlePerspective: {
    enabled: true,
    apiKey: 'test-api-key',
    timeoutMs: 5000,
    attributes: {
      TOXICITY: { scoreThreshold: 0.7 },
      SEVERE_TOXICITY: { scoreThreshold: 0.7 },
      IDENTITY_ATTACK: { scoreThreshold: 0.7 },
      INSULT: { scoreThreshold: 0.7 },
      PROFANITY: { scoreThreshold: 0.7 },
      THREAT: { scoreThreshold: 0.7 },
    },
  },
}));

const ENDPOINT = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

// Build a Perspective error response with the given HTTP status.
const mockPerspectiveStatus = (status, message) =>
  fetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: { message } }),
  });

describe('Perspective API Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        text: 'This is a test message',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Reset fetch mock
    fetch.mockReset();

    config.googlePerspective.enabled = true;
    config.googlePerspective.apiKey = 'test-api-key';

    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('moderateWithPerspective', () => {
    it('should call next() when Perspective API is disabled', async () => {
      // Mock config to disable Perspective API
      config.googlePerspective.enabled = false;

      await moderateWithPerspective(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      expect(req.perspectiveResults).toBeUndefined();
    });

    it('should call next() when Perspective API key is missing', async () => {
      config.googlePerspective.apiKey = null;

      await moderateWithPerspective(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      expect(req.perspectiveResults).toBeUndefined();
    });

    it('should successfully process clean content', async () => {
      const mockResponse = {
        attributeScores: {
          TOXICITY: {
            summaryScore: { value: 0.1 },
          },
          SEVERE_TOXICITY: {
            summaryScore: { value: 0.05 },
          },
          IDENTITY_ATTACK: {
            summaryScore: { value: 0.02 },
          },
          INSULT: {
            summaryScore: { value: 0.03 },
          },
          PROFANITY: {
            summaryScore: { value: 0.01 },
          },
          THREAT: {
            summaryScore: { value: 0.02 },
          },
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await moderateWithPerspective(req, res, next);

      expect(fetch).toHaveBeenCalledWith(
        ENDPOINT,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': 'test-api-key',
          },
          body: JSON.stringify({
            comment: { text: 'This is a test message' },
            requestedAttributes: config.googlePerspective.attributes,
            languages: ['en'],
          }),
        })
      );

      expect(req.perspectiveResults).toEqual({
        flagged: false,
        categories: {
          toxicity: false,
          severe_toxicity: false,
          identity_attack: false,
          insult: false,
          profanity: false,
          threat: false,
        },
        scores: {
          toxicity: 0.1,
          severe_toxicity: 0.05,
          identity_attack: 0.02,
          insult: 0.03,
          profanity: 0.01,
          threat: 0.02,
        },
        category_scores: {
          toxicity: 0.1,
          severe_toxicity: 0.05,
          identity_attack: 0.02,
          insult: 0.03,
          profanity: 0.01,
          threat: 0.02,
        },
      });

      expect(req.perspectiveMetadata).toEqual({
        timestamp: expect.any(String),
        textLength: 22,
        service: 'google-perspective',
      });

      expect(next).toHaveBeenCalled();
    });

    it('should flag toxic content', async () => {
      const mockResponse = {
        attributeScores: {
          TOXICITY: {
            summaryScore: { value: 0.9 },
          },
          SEVERE_TOXICITY: {
            summaryScore: { value: 0.1 },
          },
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await moderateWithPerspective(req, res, next);

      expect(req.perspectiveResults.flagged).toBe(true);
      expect(req.perspectiveResults.categories.toxicity).toBe(true);
      expect(req.perspectiveResults.categories.severe_toxicity).toBe(false);
      expect(next).toHaveBeenCalled();
    });

    it('should handle empty attributeScores response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await moderateWithPerspective(req, res, next);

      expect(req.perspectiveResults).toEqual({
        flagged: false,
        categories: {},
        scores: {},
        category_scores: {},
      });

      expect(next).toHaveBeenCalled();
    });
  });

  // Regression tests for #56.
  describe('credential handling', () => {
    it('sends the API key in the x-goog-api-key header', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await moderateWithPerspective(req, res, next);

      const [, options] = fetch.mock.calls[0];
      expect(options.headers['x-goog-api-key']).toBe('test-api-key');
    });

    it('never puts the API key in the request URL', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await moderateWithPerspective(req, res, next);

      const [url] = fetch.mock.calls[0];
      // A secret in a URL is a secret in every access log and proxy log.
      expect(url).toBe(ENDPOINT);
      expect(url).not.toContain('test-api-key');
      expect(url).not.toContain('key=');
    });

    it('logs an allowlisted error shape, not the raw error object', async () => {
      const raw = new Error('Network error');
      raw.cause = { secret: 'should-not-be-logged', code: 'ECONNRESET' };
      fetch.mockRejectedValueOnce(raw);

      await moderateWithPerspective(req, res, next);

      expect(console.warn).toHaveBeenCalledWith('Perspective API failed, continuing without it:', {
        name: 'Error',
        message: 'Network error',
        statusCode: undefined,
        code: 'ECONNRESET',
      });
      const logged = JSON.stringify(console.warn.mock.calls[0][1]);
      expect(logged).not.toContain('should-not-be-logged');
    });
  });

  // Regression tests for #57.
  describe('resilience', () => {
    it('passes an abort signal so the call cannot hang', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await moderateWithPerspective(req, res, next);

      const [, options] = fetch.mock.calls[0];
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('degrades gracefully on timeout and records it in metadata', async () => {
      const timeout = new Error('The operation was aborted due to timeout');
      timeout.name = 'TimeoutError';
      fetch.mockRejectedValueOnce(timeout);

      await moderateWithPerspective(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(req.perspectiveResults).toBe(null);
      expect(req.perspectiveMetadata).toEqual({
        timestamp: expect.any(String),
        textLength: 22,
        service: 'google-perspective',
        error: 'Timed out',
      });
    });

    // Every one of these previously returned a terminal HTTP response, which
    // meant an optional enrichment service could stop the primary OpenAI
    // moderation from ever running.
    it.each([
      [400, 'Bad request'],
      [401, 'Unauthorized'],
      [403, 'Forbidden'],
      [429, 'Rate limit exceeded'],
      [500, 'Internal error'],
      [502, 'Bad gateway'],
      [503, 'Service unavailable'],
    ])('degrades gracefully on upstream %i instead of failing the request', async (status, msg) => {
      mockPerspectiveStatus(status, msg);

      await moderateWithPerspective(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(req.perspectiveResults).toBe(null);
      expect(req.perspectiveMetadata).toEqual({
        timestamp: expect.any(String),
        textLength: 22,
        service: 'google-perspective',
        error: 'Service unavailable',
        statusCode: status,
      });
    });

    it('continues without Perspective on a network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await moderateWithPerspective(req, res, next);

      expect(req.perspectiveResults).toBe(null);
      expect(req.perspectiveMetadata).toEqual({
        timestamp: expect.any(String),
        textLength: 22,
        service: 'google-perspective',
        error: 'Service unavailable',
      });
      expect(next).toHaveBeenCalled();
    });
  });
});
