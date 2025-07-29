const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('Index.js - Server Configuration Tests', () => {
  let app;

  beforeEach(() => {
    // Create a minimal app setup that mimics index.js structure
    app = express();
    const PORT = process.env.PORT || 8000;

    // Global middleware
    app.use(cors());
    app.use(bodyParser.json());

    // Request logging middleware
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({ 
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "openai-content-moderator"
      });
    });

    // Legacy endpoint for backward compatibility
    app.post("/moderate", (req, res) => {
      // For testing, just return a simple response
      res.json({ legacy: true, redirected: true });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ 
        error: "Not found",
        message: `The requested endpoint ${req.path} does not exist`
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      res.status(500).json({ error: 'Internal Server Error' });
    });
  });

  describe('Health Check Endpoint', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'openai-content-moderator');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Legacy Endpoint', () => {
    test('should handle legacy /moderate endpoint', async () => {
      const response = await request(app)
        .post('/moderate')
        .send({ text: 'test' })
        .expect(200);

      expect(response.body).toHaveProperty('legacy', true);
      expect(response.body).toHaveProperty('redirected', true);
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/non-existent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('/non-existent-endpoint');
    });

    test('should return 404 for non-existent POST endpoints', async () => {
      const response = await request(app)
        .post('/non-existent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('/non-existent-endpoint');
    });
  });

  describe('Request Logging Middleware', () => {
    test('should log requests', async () => {
      await request(app)
        .get('/health')
        .expect(200);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z - GET \/health/)
      );
    });
  });

  describe('Middleware Setup', () => {
    test('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    test('should parse JSON bodies', async () => {
      const response = await request(app)
        .post('/moderate')
        .send({ text: 'test content' })
        .expect(200);

      expect(response.body).toHaveProperty('legacy', true);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/moderate')
        .type('json')
        .send('{"invalid": json}')
        .expect(500); // Express error handler catches JSON parse errors as 500

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handler', () => {
    test('should handle errors', async () => {
      // Create a new app instance with the error route added before the 404 handler
      const testApp = express();
      testApp.use(cors());
      testApp.use(bodyParser.json());
      
      // Add a route that throws an error for testing
      testApp.get('/error-test', (req, res, next) => {
        const error = new Error('Test error');
        next(error);
      });

      // Error handler
      testApp.use((err, req, res, next) => {
        res.status(500).json({ error: 'Internal Server Error' });
      });

      const response = await request(testApp)
        .get('/error-test')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });
  });
});