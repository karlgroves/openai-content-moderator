const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import middleware and routes
const { errorHandler } = require('../../middleware/errorHandler');
const moderationRoutes = require('../../routes/moderation');
const { 
  mockOpenAISuccess, 
  mockOpenAISpecificError,
  mockOpenAIFlagged 
} = require('../helpers/testHelpers');
const { validTestCases, invalidTestCases } = require('../fixtures/mockData');

// Create test app
const createTestApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(bodyParser.json());
  
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'openai-content-moderator'
    });
  });
  
  app.use('/api/moderation', moderationRoutes);
  
  app.post('/moderate', (req, res) => {
    req.url = '/api/moderation/text';
    app.handle(req, res);
  });
  
  app.use((req, res) => {
    res.status(404).json({ 
      error: 'Not found',
      message: `The requested endpoint ${req.path} does not exist`
    });
  });
  
  app.use(errorHandler);
  
  return app;
};

describe('API Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        service: 'openai-content-moderator'
      });
    });
  });

  describe('POST /api/moderation/text', () => {
    it('should successfully moderate clean content', async () => {
      const testText = 'This is a clean message';
      const scope = mockOpenAISuccess(testText);

      const response = await request(app)
        .post('/api/moderation/text')
        .send({ text: testText })
        .expect(200);

      expect(scope.isDone()).toBe(true);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.results.flagged).toBe(false);
      expect(response.body.metadata).toEqual({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        textLength: testText.length,
        model: 'omni-moderation-latest'
      });
    });

    it('should successfully moderate flagged content', async () => {
      const testText = 'offensive content';
      const scope = mockOpenAIFlagged(testText);

      const response = await request(app)
        .post('/api/moderation/text')
        .send({ text: testText })
        .expect(200);

      expect(scope.isDone()).toBe(true);
      expect(response.body.results.flagged).toBe(true);
      expect(response.body.metadata.textLength).toBe(testText.length);
    });

    // Test all valid cases
    validTestCases.forEach(({ description, input }) => {
      it(`should handle ${description}`, async () => {
        const scope = mockOpenAISuccess(input.text);

        const response = await request(app)
          .post('/api/moderation/text')
          .send(input)
          .expect(200);

        expect(scope.isDone()).toBe(true);
        expect(response.body).toHaveProperty('results');
        expect(response.body).toHaveProperty('metadata');
      });
    });

    // Test all invalid cases
    invalidTestCases.forEach(({ description, input, expectedError }) => {
      it(`should return 400 for ${description}`, async () => {
        const response = await request(app)
          .post('/api/moderation/text')
          .send(input)
          .expect(400);

        expect(response.body).toEqual({
          error: expectedError,
          field: 'text',
          ...(expectedError.includes('exceeds maximum length') && {
            maxLength: 32768,
            currentLength: expect.any(Number)
          })
        });
      });
    });

    it('should return 401 for invalid API key', async () => {
      const scope = mockOpenAISpecificError(401, 'Invalid API key');

      const response = await request(app)
        .post('/api/moderation/text')
        .send({ text: 'test message' })
        .expect(401);

      expect(scope.isDone()).toBe(true);
      expect(response.body).toEqual({
        error: 'Invalid API key. Please check your OpenAI API key configuration.'
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/moderation/text')
        .type('json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle large payloads gracefully', async () => {
      const largeText = 'A'.repeat(32768); // Maximum allowed
      const scope = mockOpenAISuccess(largeText);

      const response = await request(app)
        .post('/api/moderation/text')
        .send({ text: largeText })
        .expect(200);

      expect(scope.isDone()).toBe(true);
      expect(response.body.metadata.textLength).toBe(32768);
    });
  });

  describe('GET /api/moderation/models', () => {
    it('should return available models', async () => {
      const response = await request(app)
        .get('/api/moderation/models')
        .expect(200);

      expect(response.body).toEqual({
        models: [
          {
            id: 'omni-moderation-latest',
            name: 'Omni Moderation Latest',
            description: 'Latest OpenAI moderation model'
          }
        ]
      });
    });
  });

  describe('POST /moderate (Legacy endpoint)', () => {
    it('should redirect to new API endpoint', async () => {
      const testText = 'Legacy endpoint test';
      const scope = mockOpenAISuccess(testText);

      const response = await request(app)
        .post('/moderate')
        .send({ text: testText })
        .expect(200);

      expect(scope.isDone()).toBe(true);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('metadata');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/non-existent-endpoint')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not found',
        message: 'The requested endpoint /non-existent-endpoint does not exist'
      });
    });

    it('should handle unsupported HTTP methods', async () => {
      const response = await request(app)
        .put('/api/moderation/text')
        .send({ text: 'test' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/moderation/text')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });
});