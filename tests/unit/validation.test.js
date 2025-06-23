const { validateModerationRequest } = require('../../middleware/validation');
const { createMockReq, createMockRes, createMockNext } = require('../helpers/testHelpers');
const { invalidTestCases } = require('../fixtures/mockData');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
  });

  describe('validateModerationRequest', () => {
    it('should call next() for valid text input', () => {
      req.body = { text: 'Valid text content' };

      validateModerationRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next() for text with leading/trailing whitespace', () => {
      req.body = { text: '  Valid text with spaces  ' };

      validateModerationRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next() for maximum length text', () => {
      req.body = { text: 'A'.repeat(32768) };

      validateModerationRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    // Test all invalid cases
    invalidTestCases.forEach(({ description, input, expectedError }) => {
      it(`should return 400 error for ${description}`, () => {
        req.body = input;

        validateModerationRequest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expectedError,
            field: 'text'
          })
        );
        expect(next).not.toHaveBeenCalled();
      });
    });

    it('should include length information for text too long error', () => {
      const longText = 'A'.repeat(32769);
      req.body = { text: longText };

      validateModerationRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Text content exceeds maximum length of 32,768 characters.',
        field: 'text',
        maxLength: 32768,
        currentLength: 32769
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle edge case of exactly maximum length', () => {
      req.body = { text: 'A'.repeat(32768) };

      validateModerationRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle Unicode characters correctly', () => {
      req.body = { text: '🚀 Unicode test with emojis 😀' };

      validateModerationRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});