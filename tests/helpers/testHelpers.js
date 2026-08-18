const nock = require('nock');
const { mockOpenAIResponse, mockFlaggedResponse } = require('../fixtures/mockData');
const config = require('../../config');

// The OpenAI client retries per config.openai.maxRetries, so a failing call is
// attempted maxRetries + 1 times. Deriving it here keeps `scope.isDone()` a
// genuine assertion that the client made exactly the configured number of
// attempts, instead of a hardcoded 3 that silently rots when the budget changes.
const EXPECTED_ATTEMPTS = config.openai.maxRetries + 1;

// Helper to mock OpenAI API calls
const mockOpenAISuccess = (text = 'test text', response = mockOpenAIResponse) => {
  return nock('https://api.openai.com').post('/v1/moderations').reply(200, response);
};

const mockOpenAIError = (
  statusCode = 500,
  errorBody = { error: { message: 'Internal server error' } }
) => {
  return nock('https://api.openai.com')
    .post('/v1/moderations')
    .times(EXPECTED_ATTEMPTS)
    .reply(statusCode, errorBody);
};

// Create specific OpenAI-style errors
const mockOpenAISpecificError = (statusCode, message) => {
  const errorResponse = {
    error: {
      message: message,
      type: 'invalid_request_error',
      code: statusCode === 401 ? 'invalid_api_key' : null,
    },
  };

  return nock('https://api.openai.com')
    .post('/v1/moderations')
    .times(EXPECTED_ATTEMPTS)
    .reply(statusCode, errorResponse);
};

const mockOpenAIFlagged = (text = 'offensive text') => {
  return mockOpenAISuccess(text, mockFlaggedResponse);
};

// Helper to create mock request and response objects
const createMockReq = (body = {}) => ({
  body,
  moderationResults: null,
  moderationMetadata: null,
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Helper to create expected metadata
const createExpectedMetadata = (textLength, model = 'omni-moderation-latest') => ({
  timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
  textLength,
  model,
});

// Helper to wait for async operations
const waitFor = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  EXPECTED_ATTEMPTS,
  mockOpenAISuccess,
  mockOpenAIError,
  mockOpenAISpecificError,
  mockOpenAIFlagged,
  createMockReq,
  createMockRes,
  createMockNext,
  createExpectedMetadata,
  waitFor,
};
