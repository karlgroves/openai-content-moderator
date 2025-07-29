const originalEnv = process.env;

describe('Config', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Server Configuration', () => {
    it('should use default port when PORT is not set', () => {
      delete process.env.PORT;
      const config = require('../../config');
      expect(config.server.port).toBe(8000);
    });

    it('should use PORT environment variable when set', () => {
      process.env.PORT = '3000';
      const config = require('../../config');
      expect(config.server.port).toBe('3000');
    });

    it('should use default environment when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const config = require('../../config');
      expect(config.server.env).toBe('development');
    });

    it('should use NODE_ENV environment variable when set', () => {
      process.env.NODE_ENV = 'production';
      const config = require('../../config');
      expect(config.server.env).toBe('production');
    });
  });

  describe('OpenAI Configuration', () => {
    it('should use OPENAI_API_KEY from environment', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      const config = require('../../config');
      expect(config.openai.apiKey).toBe('sk-test-key');
    });

    it('should use default model when OPENAI_MODEL is not set', () => {
      delete process.env.OPENAI_MODEL;
      const config = require('../../config');
      expect(config.openai.model).toBe('omni-moderation-latest');
    });

    it('should use OPENAI_MODEL environment variable when set', () => {
      process.env.OPENAI_MODEL = 'text-moderation-stable';
      const config = require('../../config');
      expect(config.openai.model).toBe('text-moderation-stable');
    });
  });

  describe('CORS Configuration', () => {
    it('should use default CORS origin when CORS_ORIGIN is not set', () => {
      delete process.env.CORS_ORIGIN;
      const config = require('../../config');
      expect(config.cors.origin).toBe('*');
    });

    it('should use CORS_ORIGIN environment variable when set', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      const config = require('../../config');
      expect(config.cors.origin).toBe('https://example.com');
    });

    it('should always set credentials to true', () => {
      const config = require('../../config');
      expect(config.cors.credentials).toBe(true);
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should have correct default rate limit configuration', () => {
      const config = require('../../config');
      expect(config.rateLimit.windowMs).toBe(15 * 60 * 1000);
      expect(config.rateLimit.max).toBe(100);
    });
  });
});