// Test setup file
const nock = require('nock');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.PORT = '3001';

// Disable HTTP requests during tests
nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

// Clean up after each test
afterEach(() => {
  nock.cleanAll();
});

// Clean up after all tests
afterAll(() => {
  nock.restore();
});