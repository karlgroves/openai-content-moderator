# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a middleware-based REST API for content moderation using OpenAI's moderation API. It provides a clean, validated interface for text moderation with comprehensive error handling.

## Architecture

### Middleware-based Express API

- Express server with middleware chain for request validation and OpenAI API calls
- Main endpoints:
  - `POST /api/moderation/text` - Moderate text content
  - `GET /api/moderation/models` - Get available models
  - `GET /health` - Health check
  - `POST /moderate` - Legacy endpoint (redirects to new API)
- Middleware structure:
  - `middleware/validation.js` - Request validation
  - `middleware/moderation.js` - OpenAI API integration
  - `middleware/errorHandler.js` - Global error handling
- Configuration in `config/index.js`
- Routes organized in `routes/moderation.js`
- Requires `OPENAI_API_KEY` environment variable (set in `.env`)

## Development Commands

### Setup

```bash
npm install
cp .env.example .env
# Add OPENAI_API_KEY to .env file
```

### Running the API

```bash
# Production mode
npm start

# Development mode with auto-reload (requires nodemon)
npm run dev
```

The API runs on port 8000 by default (configurable via PORT env var).

### Testing

Comprehensive test suite using Jest and Supertest:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration

# Watch mode for development
npm run test:watch
```

**Test Structure:**

- Unit tests: `tests/unit/` - Tests individual middleware functions
- Integration tests: `tests/integration/` - Tests full API endpoints  
- Test fixtures: `tests/fixtures/` - Mock data and responses
- Test helpers: `tests/helpers/` - Utilities for mocking OpenAI API

**Coverage includes:**

- Request validation middleware
- OpenAI API integration
- Error handling scenarios
- All API endpoints with various inputs

## Key Technical Details

- Uses the official OpenAI Node.js SDK
- Request validation includes text presence, type, and length checks
- Maximum text length: 32,768 characters
- Returns both OpenAI results and metadata (timestamp, text length, model used)
- Comprehensive error handling with appropriate HTTP status codes
- CORS enabled by default (configurable via CORS_ORIGIN env var)
- Environment-based configuration for easy deployment

## Test Requirements

**CRITICAL:** All tests must pass before any code changes can be committed.

### Test-Driven Development Rules

1. **No commits with failing tests** - Always run `npm test` before committing changes and ensure all tests pass
2. **Test coverage for new features** - All meaningful new functionality must include appropriate test coverage:
   - Unit tests for individual functions and middleware
   - Integration tests for new API endpoints
   - Error handling tests for new error scenarios
3. **Test coverage for meaningful changes** - Significant modifications to existing code must include updated or additional tests to maintain coverage
4. **Test validation** - Run the complete test suite (`npm test`) to verify:
   - All existing functionality still works
   - New functionality works as expected
   - Error handling is properly tested

### Testing Commands for Development

```bash
# Always run before committing
npm test

# For ongoing development
npm run test:watch

# To check coverage
npm run test:coverage
```
