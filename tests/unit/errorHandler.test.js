const { errorHandler, asyncHandler } = require('../../middleware/errorHandler');
const { createMockReq, createMockRes, createMockNext } = require('../helpers/testHelpers');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    // Mock console.error to avoid test output pollution
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('errorHandler', () => {
    it('should handle basic error with default status 500', () => {
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Test error'
      });
      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });

    it('should use error status code when provided', () => {
      const error = new Error('Not found');
      error.statusCode = 404;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Not found'
      });
    });

    it('should use error.status when statusCode is not available', () => {
      const error = new Error('Bad request');
      error.status = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Bad request'
      });
    });

    it('should handle error without message', () => {
      const error = new Error();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });

    it('should include stack trace in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Development error');
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Development error',
        stack: 'Error stack trace'
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Production error');
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Production error'
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const mockHandler = jest.fn().mockResolvedValue('success');
      const wrappedHandler = asyncHandler(mockHandler);

      await wrappedHandler(req, res, next);

      expect(mockHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch and forward async errors', async () => {
      const error = new Error('Async error');
      const mockHandler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = asyncHandler(mockHandler);

      await wrappedHandler(req, res, next);

      expect(mockHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle thrown errors in async functions', async () => {
      const error = new Error('Thrown error');
      const mockHandler = jest.fn().mockImplementation(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler);

      await wrappedHandler(req, res, next);

      expect(mockHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle non-async functions that return promises', async () => {
      const error = new Error('Promise rejection');
      const mockHandler = jest.fn().mockReturnValue(Promise.reject(error));
      const wrappedHandler = asyncHandler(mockHandler);

      await wrappedHandler(req, res, next);

      expect(mockHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should work with functions that return non-promise values', async () => {
      const mockHandler = jest.fn().mockReturnValue('not a promise');
      const wrappedHandler = asyncHandler(mockHandler);

      await wrappedHandler(req, res, next);

      expect(mockHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});