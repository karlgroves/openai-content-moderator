const { moderateWithPerspective } = require('../../middleware/perspective');
const config = require('../../config');

// Mock fetch globally
global.fetch = jest.fn();

// Mock config
jest.mock('../../config', () => ({
  googlePerspective: {
    enabled: true,
    apiKey: 'test-api-key',
    attributes: {
      TOXICITY: { scoreThreshold: 0.7 },
      SEVERE_TOXICITY: { scoreThreshold: 0.7 },
      IDENTITY_ATTACK: { scoreThreshold: 0.7 },
      INSULT: { scoreThreshold: 0.7 },
      PROFANITY: { scoreThreshold: 0.7 },
      THREAT: { scoreThreshold: 0.7 }
    }
  }
}));

describe('Perspective API Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        text: 'This is a test message'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Reset fetch mock
    fetch.mockReset();
    
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
      config.googlePerspective.enabled = true;
      config.googlePerspective.apiKey = null;
      
      await moderateWithPerspective(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      expect(req.perspectiveResults).toBeUndefined();
    });

    it('should successfully process clean content', async () => {
      config.googlePerspective.enabled = true;
      config.googlePerspective.apiKey = 'test-api-key';
      
      const mockResponse = {
        attributeScores: {
          TOXICITY: {
            summaryScore: { value: 0.1 }
          },
          SEVERE_TOXICITY: {
            summaryScore: { value: 0.05 }
          },
          IDENTITY_ATTACK: {
            summaryScore: { value: 0.02 }
          },
          INSULT: {
            summaryScore: { value: 0.03 }
          },
          PROFANITY: {
            summaryScore: { value: 0.01 }
          },
          THREAT: {
            summaryScore: { value: 0.02 }
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await moderateWithPerspective(req, res, next);

      expect(fetch).toHaveBeenCalledWith(
        'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=test-api-key',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            comment: { text: 'This is a test message' },
            requestedAttributes: config.googlePerspective.attributes,
            languages: ['en']
          })
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
          threat: false
        },
        scores: {
          toxicity: 0.1,
          severe_toxicity: 0.05,
          identity_attack: 0.02,
          insult: 0.03,
          profanity: 0.01,
          threat: 0.02
        },
        category_scores: {
          toxicity: 0.1,
          severe_toxicity: 0.05,
          identity_attack: 0.02,
          insult: 0.03,
          profanity: 0.01,
          threat: 0.02
        }
      });

      expect(req.perspectiveMetadata).toEqual({
        timestamp: expect.any(String),
        textLength: 22,
        service: 'google-perspective'
      });

      expect(next).toHaveBeenCalled();
    });

    it('should flag toxic content', async () => {
      config.googlePerspective.enabled = true;
      config.googlePerspective.apiKey = 'test-api-key';
      
      const mockResponse = {
        attributeScores: {
          TOXICITY: {
            summaryScore: { value: 0.9 }
          },
          SEVERE_TOXICITY: {
            summaryScore: { value: 0.1 }
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await moderateWithPerspective(req, res, next);

      expect(req.perspectiveResults.flagged).toBe(true);
      expect(req.perspectiveResults.categories.toxicity).toBe(true);
      expect(req.perspectiveResults.categories.severe_toxicity).toBe(false);
      expect(next).toHaveBeenCalled();
    });

    it('should handle 400 API errors', async () => {
      config.googlePerspective.enabled = true;
      config.googlePerspective.apiKey = 'test-api-key';
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: { message: 'Bad request' }
        })
      });

      await moderateWithPerspective(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request format for Perspective API'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle 401 API errors', async () => {
      config.googlePerspective.enabled = true;
      config.googlePerspective.apiKey = 'test-api-key';
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: { message: 'Unauthorized' }
        })
      });

      await moderateWithPerspective(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid API key. Please check your Google Perspective API key configuration.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle 429 rate limit errors', async () => {
      config.googlePerspective.enabled = true;
      config.googlePerspective.apiKey = 'test-api-key';
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: { message: 'Rate limit exceeded' }
        })
      });

      await moderateWithPerspective(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Rate limit exceeded for Perspective API. Please try again later.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle 503 service unavailable errors', async () => {
      config.googlePerspective.enabled = true;
      config.googlePerspective.apiKey = 'test-api-key';
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({
          error: { message: 'Service unavailable' }
        })
      });

      await moderateWithPerspective(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Perspective API service is temporarily unavailable. Please try again later.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should continue without Perspective API on other errors', async () => {
      config.googlePerspective.enabled = true;
      config.googlePerspective.apiKey = 'test-api-key';
      
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await moderateWithPerspective(req, res, next);

      expect(console.warn).toHaveBeenCalledWith(
        'Perspective API failed, continuing without it:',
        'Network error'
      );
      
      expect(req.perspectiveResults).toBe(null);
      expect(req.perspectiveMetadata).toEqual({
        timestamp: expect.any(String),
        textLength: 22,
        service: 'google-perspective',
        error: 'Service unavailable'
      });
      
      expect(next).toHaveBeenCalled();
    });

    it('should handle empty attributeScores response', async () => {
      config.googlePerspective.enabled = true;
      config.googlePerspective.apiKey = 'test-api-key';
      
      const mockResponse = {};

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await moderateWithPerspective(req, res, next);

      expect(req.perspectiveResults).toEqual({
        flagged: false,
        categories: {},
        scores: {},
        category_scores: {}
      });
      
      expect(next).toHaveBeenCalled();
    });
  });
});