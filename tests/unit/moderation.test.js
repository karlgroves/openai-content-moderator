const { moderateContent } = require('../../middleware/moderation');
const { 
  mockOpenAISuccess, 
  mockOpenAIFlagged,
  createMockReq, 
  createMockRes, 
  createMockNext,
  createExpectedMetadata
} = require('../helpers/testHelpers');
const { mockOpenAIResponse, mockFlaggedResponse } = require('../fixtures/mockData');

describe('Moderation Middleware - Core Functionality', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
  });

  describe('moderateContent', () => {
    it('should successfully moderate content and call next()', async () => {
      const testText = 'This is a test message';
      req.body = { text: testText };
      
      const scope = mockOpenAISuccess(testText);

      await moderateContent(req, res, next);

      expect(scope.isDone()).toBe(true);
      expect(req.moderationResults).toEqual(mockOpenAIResponse.results[0]);
      expect(req.moderationMetadata).toEqual(createExpectedMetadata(testText.length));
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle flagged content correctly', async () => {
      const testText = 'offensive content';
      req.body = { text: testText };
      
      const scope = mockOpenAIFlagged(testText);

      await moderateContent(req, res, next);

      expect(scope.isDone()).toBe(true);
      expect(req.moderationResults).toEqual(mockFlaggedResponse.results[0]);
      expect(req.moderationResults.flagged).toBe(true);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should include correct metadata for different text lengths', async () => {
      const testTexts = [
        'Short',
        'A medium length message with some content',
        'A'.repeat(1000)
      ];

      for (const text of testTexts) {
        req = createMockReq({ text });
        res = createMockRes();
        next = createMockNext();
        
        const scope = mockOpenAISuccess(text);
        
        await moderateContent(req, res, next);
        
        expect(scope.isDone()).toBe(true);
        expect(req.moderationMetadata).toEqual(createExpectedMetadata(text.length));
      }
    });

    it('should handle empty text after validation', async () => {
      req.body = { text: '' };
      
      const scope = mockOpenAISuccess('');

      await moderateContent(req, res, next);

      expect(scope.isDone()).toBe(true);
      expect(req.moderationMetadata.textLength).toBe(0);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should set correct timestamp format in metadata', async () => {
      const testText = 'Test timestamp';
      req.body = { text: testText };
      
      const scope = mockOpenAISuccess(testText);

      await moderateContent(req, res, next);

      expect(scope.isDone()).toBe(true);
      expect(req.moderationMetadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should use correct model in metadata', async () => {
      const testText = 'Test model';
      req.body = { text: testText };
      
      const scope = mockOpenAISuccess(testText);

      await moderateContent(req, res, next);

      expect(scope.isDone()).toBe(true);
      expect(req.moderationMetadata.model).toBe('omni-moderation-latest');
    });
  });
});