# OpenAI Content Moderator API

A production-ready REST API for content moderation using OpenAI's moderation API. This service provides a secure, scalable interface for moderating text content with comprehensive validation, error handling, and deployment options for both traditional servers and AWS Lambda.

## Features

- **Request Validation**: Comprehensive input validation with detailed error messages
- **OpenAI Integration**: Direct integration with OpenAI's moderation API
- **RESTful Design**: Clean, intuitive API endpoints following REST principles
- **Metadata Enrichment**: Response metadata including timestamps, text length, and model info
- **Error Handling**: Robust error handling with consistent response formats
- **Environment Configuration**: Flexible configuration for different deployment environments
- **AWS Lambda Ready**: Serverless deployment support with AWS Lambda
- **Comprehensive Testing**: Full test coverage with unit and integration tests
- **CORS Support**: Configurable CORS for browser-based applications

## Quick Start

```bash
# Clone the repository
git clone https://github.com/karlgroves/openai-content-moderator.git
cd openai-content-moderator

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run the API
npm start
```

The API will be available at `http://localhost:8000`

## API Endpoints

### POST /api/moderation/text

Moderate text content using OpenAI's moderation API.

Analyzes text content for potentially harmful content using OpenAI's moderation API.

**Request:**

```json
{
  "text": "Text content to moderate"
}
```

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**

```json
{
  "results": {
    "flagged": false,
    "categories": {
      "sexual": false,
      "hate": false,
      "harassment": false,
      "self-harm": false,
      "sexual/minors": false,
      "hate/threatening": false,
      "violence/graphic": false,
      "self-harm/intent": false,
      "self-harm/instructions": false,
      "harassment/threatening": false,
      "violence": false
    },
    "category_scores": {
      "sexual": 0.00001,
      "hate": 0.00001,
      "harassment": 0.00001,
      "self-harm": 0.00001,
      "sexual/minors": 0.00001,
      "hate/threatening": 0.00001,
      "violence/graphic": 0.00001,
      "self-harm/intent": 0.00001,
      "self-harm/instructions": 0.00001,
      "harassment/threatening": 0.00001,
      "violence": 0.00001
    }
  },
  "metadata": {
    "timestamp": "2024-12-23T00:00:00.000Z",
    "textLength": 123,
    "model": "omni-moderation-latest"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "ValidationError",
  "message": "Text is required",
  "field": "text"
}
```

### GET /api/moderation/models

Returns a list of available moderation models.

**Response (200 OK):**

```json
{
  "models": [
    {
      "id": "omni-moderation-latest",
      "name": "Omni Moderation Latest",
      "description": "Latest OpenAI moderation model"
    },
    {
      "id": "text-moderation-latest",
      "name": "Text Moderation Latest",
      "description": "Latest text-only moderation model"
    }
  ]
}
```

### GET /health

Health check endpoint for monitoring and load balancers.

**Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2024-12-23T00:00:00.000Z",
  "service": "openai-content-moderator",
  "version": "1.0.0"
}
```

### POST /moderate (Legacy)

Legacy endpoint maintained for backward compatibility. Automatically redirects to `/api/moderation/text`.

**Note:** This endpoint is deprecated and will be removed in a future version. Please update your integration to use `/api/moderation/text`.

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Step-by-Step Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/karlgroves/openai-content-moderator.git
   cd openai-content-moderator
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

4. **Add your OpenAI API key to `.env`:**

   ```text
   OPENAI_API_KEY=sk-your-api-key-here
   ```

5. **Verify installation:**

   ```bash
   npm test
   ```

## Usage

### Development Mode

Run with auto-reload for development:

```bash
npm run dev
```

### Production Mode

Run in production mode:

```bash
npm start
```

### Testing the API

Once running, you can test the API using curl:

```bash
# Moderate text
curl -X POST http://localhost:8000/api/moderation/text \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test message"}'

# Check health
curl http://localhost:8000/health

# Get available models
curl http://localhost:8000/api/moderation/models
```

### Using with JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:8000/api/moderation/text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Content to moderate'
  })
});

const result = await response.json();
console.log('Flagged:', result.results.flagged);
```

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

### Environment Variables

Configure the application using environment variables in your `.env` file:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | Your OpenAI API key |
| `OPENAI_MODEL` | No | `omni-moderation-latest` | OpenAI moderation model to use |
| `PORT` | No | `8000` | Port number for the API server |
| `NODE_ENV` | No | `development` | Environment (development/production) |
| `CORS_ORIGIN` | No | `*` | CORS allowed origins |

### Example `.env` file:

```bash
# Required
OPENAI_API_KEY=sk-your-api-key-here

# Optional
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
OPENAI_MODEL=text-moderation-latest
```

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

The API provides consistent error responses with detailed information:

### Error Response Format

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description",
  "field": "field_name" // Only for validation errors
}
```

### HTTP Status Codes

| Status Code | Description | Example |
|-------------|-------------|----------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Missing or invalid text field |
| 401 | Unauthorized | Invalid or missing OpenAI API key |
| 413 | Payload Too Large | Text exceeds 32,768 characters |
| 429 | Rate Limited | OpenAI API rate limit exceeded |
| 500 | Server Error | Unexpected server error |
| 503 | Service Unavailable | OpenAI API temporarily unavailable |

### Common Error Scenarios

**Missing Text:**
```json
{
  "error": "ValidationError",
  "message": "Text is required",
  "field": "text"
}
```

**Invalid API Key:**
```json
{
  "error": "AuthenticationError",
  "message": "Invalid API key provided"
}
```

**Rate Limit:**
```json
{
  "error": "RateLimitError",
  "message": "Rate limit exceeded. Please try again later."
}
```

## Deployment

### Traditional Server Deployment

1. **Using PM2:**
   ```bash
   npm install -g pm2
   pm2 start index.js --name content-moderator
   pm2 save
   pm2 startup
   ```

2. **Using Docker:**
   ```bash
   docker build -t content-moderator .
   docker run -p 8000:8000 --env-file .env content-moderator
   ```

### AWS Lambda Deployment

This project includes AWS Lambda support. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

Quick deployment:
```bash
npm install
npm run deploy
```

## Security Best Practices

1. **API Key Security:**
   - Never commit `.env` files to version control
   - Use environment-specific API keys
   - Rotate API keys regularly
   - Consider using AWS Secrets Manager or similar for production

2. **Rate Limiting:**
   - Implement application-level rate limiting
   - Use API Gateway throttling for AWS deployments
   - Monitor usage patterns

3. **Input Validation:**
   - Maximum text length enforced (32,768 characters)
   - Content-Type validation
   - Request body size limits

4. **CORS Configuration:**
   - Set specific origins in production
   - Avoid using wildcard (*) in production environments

## Monitoring and Logging

- **Health Checks**: Use `/health` endpoint for monitoring
- **Logging**: Structured JSON logs for production environments
- **Metrics**: Track API usage, response times, and error rates
- **Alerts**: Set up alerts for high error rates or API failures

## Support and Contributing

### Getting Help

- Check the [documentation](./docs)
- Open an [issue](https://github.com/karlgroves/openai-content-moderator/issues)
- Review [existing issues](https://github.com/karlgroves/openai-content-moderator/issues)

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Powered by [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation)
- Deployed with [Serverless Framework](https://www.serverless.com/)
