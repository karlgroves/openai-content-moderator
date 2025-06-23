# OpenAI Content Moderator API

A middleware-based REST API for content moderation using OpenAI's moderation API.

## Features

- Request validation middleware
- OpenAI API integration with error handling
- RESTful API endpoints
- Metadata enrichment for responses
- Comprehensive error handling
- Environment-based configuration

## API Endpoints

### POST /api/moderation/text

Moderate text content using OpenAI's moderation API.

**Request:**

```json
{
  "text": "Text content to moderate"
}
```

**Response:**

```json
{
  "results": {
    "flagged": false,
    "categories": { ... },
    "category_scores": { ... }
  },
  "metadata": {
    "timestamp": "2024-12-23T00:00:00.000Z",
    "textLength": 123,
    "model": "omni-moderation-latest"
  }
}
```

### GET /api/moderation/models

Get available moderation models.

### GET /health

Health check endpoint.

### POST /moderate (Legacy)

Maintained for backward compatibility. Redirects to `/api/moderation/text`.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/openai-content-moderator.git
   cd openai-content-moderator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

4. Add your OpenAI API key to `.env`:

   ```text
   OPENAI_API_KEY=your-api-key-here
   ```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The API will be available at `http://localhost:8000` by default.

## Testing

The project includes comprehensive unit and integration tests using Jest and Supertest.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run only unit tests  
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:**

- Unit tests for all middleware components
- Integration tests for API endpoints
- Validation testing for all input scenarios
- Error handling verification
- Mock OpenAI API interactions

**Test Structure:**

- `tests/unit/` - Unit tests for individual components
- `tests/integration/` - Full API endpoint testing
- `tests/fixtures/` - Test data and mock responses
- `tests/helpers/` - Test utilities and helper functions

## Configuration

Environment variables (see `.env.example`):

- `OPENAI_API_KEY` (required): Your OpenAI API key
- `OPENAI_MODEL` (optional): Model to use (default: "omni-moderation-latest")
- `PORT` (optional): Server port (default: 8000)
- `NODE_ENV` (optional): Environment (default: "development")
- `CORS_ORIGIN` (optional): CORS origin (default: "*")

## Architecture

### Middleware Chain

1. **Validation Middleware** (`middleware/validation.js`)
   - Validates request body
   - Checks text presence, type, and length
   - Returns 400 errors for invalid requests

2. **Moderation Middleware** (`middleware/moderation.js`)
   - Calls OpenAI Moderation API
   - Handles API-specific errors
   - Adds metadata to responses

3. **Error Handler** (`middleware/errorHandler.js`)
   - Global error handling
   - Consistent error response format

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "field": "field_name" // For validation errors
}
```

HTTP Status Codes:

- 200: Success
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid API key)
- 429: Rate limit exceeded
- 500: Internal server error
- 503: Service unavailable

## License

MIT
