# OpenAI Content Moderator API

A production-ready REST API for content moderation using OpenAI's moderation API. This service provides a secure, scalable interface for moderating text content with comprehensive validation, error handling, and deployment options for both traditional servers and AWS Lambda.

> **⚠️ Important**: Google Perspective API integration is currently incomplete and under development. The API currently uses OpenAI moderation only. Perspective API functionality will be added in a future release.

## Features

- **Request Validation**: Comprehensive input validation with detailed error messages
- **OpenAI Integration**: Direct integration with OpenAI's moderation API
- **Google Perspective API**: Integration with Google's Perspective API (⚠️ **Not yet complete** - Coming soon)
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

`Content-Type: application/json`

**Response (200 OK):**

```json
{
  "flagged": false,
  "services": {
    "openai": {
      "results": {
        "flagged": false,
        "categories": {
          "harassment": false,
          "harassment/threatening": false,
          "sexual": false,
          "hate": false,
          "hate/threatening": false,
          "illicit": false,
          "illicit/violent": false,
          "self-harm/intent": false,
          "self-harm/instructions": false,
          "self-harm": false,
          "sexual/minors": false,
          "violence": false,
          "violence/graphic": false
        },
        "category_scores": {
          "harassment": 0.000024923252458203565,
          "harassment/threatening": 0.000003169325442919291,
          "sexual": 0.00016229670614688406,
          "hate": 0.000005829126566113866,
          "hate/threatening": 2.4061023397180247e-7,
          "illicit": 0.00004173157606777201,
          "illicit/violent": 0.000010889691002655445,
          "self-harm/intent": 0.00000288571183887091,
          "self-harm/instructions": 0.0000016964426510543331,
          "self-harm": 0.000006605214485464791,
          "sexual/minors": 0.000010554685795431098,
          "violence": 0.00048644850322948033,
          "violence/graphic": 0.000006605214485464791
        },
        "category_applied_input_types": {
          "harassment": ["text"],
          "harassment/threatening": ["text"],
          "sexual": ["text"],
          "hate": ["text"],
          "hate/threatening": ["text"],
          "illicit": ["text"],
          "illicit/violent": ["text"],
          "self-harm/intent": ["text"],
          "self-harm/instructions": ["text"],
          "self-harm": ["text"],
          "sexual/minors": ["text"],
          "violence": ["text"],
          "violence/graphic": ["text"]
        }
      },
      "metadata": {
        "timestamp": "2025-08-26T19:49:29.449Z",
        "textLength": 12,
        "model": "omni-moderation-latest"
      }
    }
  },
  "metadata": {
    "timestamp": "2025-08-26T19:49:29.449Z",
    "textLength": 12,
    "servicesUsed": ["openai"]
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Text content is required for moderation.",
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
  "timestamp": "2025-08-26T19:49:31.302Z",
  "service": "openai-content-moderator"
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
- nodemon (for development mode) - `npm install -g nodemon`

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

   All tests should pass before proceeding.

## Usage

### Development Mode

Run with auto-reload for development (requires nodemon):

```bash
npm run dev
```

**Note:** If you don't have nodemon installed, install it globally first:

```bash
npm install -g nodemon
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
console.log('Flagged:', result.flagged);
console.log('OpenAI Results:', result.services.openai.results);
```

## Testing

The project includes comprehensive unit and integration tests using Jest and Supertest.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests  
npm run test:integration
```

**Note:** The `test:unit` and `test:integration` scripts are not currently defined in package.json. To run specific test suites:

```bash
# Unit tests only
jest tests/unit

# Integration tests only
jest tests/integration
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
| `GOOGLE_PERSPECTIVE_API_KEY` | No | - | Google Perspective API key (optional) |
| `PERSPECTIVE_API_ENABLED` | No | `false` | Enable Google Perspective API integration |
| `PORT` | No | `8000` | Port number for the API server |
| `NODE_ENV` | No | `development` | Environment (development/production) |
| `CORS_ORIGIN` | No | `*` | CORS allowed origins |

### Example `.env` file

```bash
# Required
OPENAI_API_KEY=sk-your-api-key-here

# Optional - OpenAI Configuration
OPENAI_MODEL=omni-moderation-latest

# Optional - Google Perspective API (⚠️ integration in development)
GOOGLE_PERSPECTIVE_API_KEY=your-google-perspective-api-key-here
PERSPECTIVE_API_ENABLED=true

# Optional - Server Configuration
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

> **⚠️ Important**: The Google Perspective API integration is not yet functional. The `perspective.js` middleware exists but is not fully implemented. Setting `PERSPECTIVE_API_ENABLED=true` will not enable this feature until development is complete.

## Architecture

### Middleware Chain

1. **Validation Middleware** (`middleware/validation.js`)
   - Validates request body
   - Checks text presence, type, and length (max 32,768 characters)
   - Returns 400 errors for invalid requests

2. **Moderation Middleware** (`middleware/moderation.js`)
   - Calls OpenAI Moderation API
   - Handles API-specific errors
   - Adds metadata to responses

3. **Perspective Middleware** (`middleware/perspective.js`)
   - **⚠️ Not yet complete** - Placeholder for Google Perspective API integration
   - Will provide toxicity analysis when implemented

4. **Error Handler** (`middleware/errorHandler.js`)
   - Global error handling
   - Consistent error response format
   - Handles OpenAI API errors gracefully

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
  "error": "Text content is required for moderation.",
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

2. **Using systemd (Linux):**

   Create a service file and configure it to run the Node.js application.

3. **Docker Support:**

   Docker configuration is not currently included but can be easily added. Create a `Dockerfile` with:

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 8000
   CMD ["node", "index.js"]
   ```

### AWS Lambda Deployment

This project includes AWS Lambda support through the Serverless Framework. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Prerequisites:**

- AWS CLI configured with appropriate credentials
- Serverless Framework installed (`npm install -g serverless`)

**Quick deployment:**

```bash
npm install
serverless deploy
```

**Note:** There is no `npm run deploy` script defined. Use the Serverless Framework directly.

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
- **Logging**: Console logging (structured JSON logging can be added for production)
- **Metrics**: Track API usage, response times, and error rates (implementation needed)
- **Alerts**: Set up alerts for high error rates or API failures (requires external monitoring)

### Recommended Monitoring Stack

- Use AWS CloudWatch for Lambda deployments
- Consider New Relic, Datadog, or Prometheus for traditional deployments
- Implement structured logging with Winston or Bunyan for production

## Project Structure

```text
openai-content-moderator/
├── config/              # Configuration files
│   └── index.js        # Main configuration module
├── middleware/         # Express middleware
│   ├── errorHandler.js # Global error handling
│   ├── moderation.js   # OpenAI API integration
│   ├── perspective.js  # Google Perspective API (incomplete)
│   └── validation.js   # Request validation
├── routes/             # API route definitions
│   └── moderation.js   # Moderation endpoints
├── tests/              # Test suites
│   ├── fixtures/       # Mock data
│   ├── helpers/        # Test utilities
│   ├── integration/    # API endpoint tests
│   └── unit/          # Component tests
├── docs/               # Documentation
├── index.js           # Main application entry
├── lambda.js          # AWS Lambda handler
└── serverless.yml     # Serverless Framework config
```

## Support and Contributing

### Getting Help

- Check the [documentation](./docs)
- Open an [issue](https://github.com/karlgroves/openai-content-moderator/issues)
- Review [existing issues](https://github.com/karlgroves/openai-content-moderator/issues)

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. **Run tests to ensure everything passes** (`npm test`)
4. Make your changes
5. **Add tests for new functionality**
6. **Ensure all tests pass** (`npm test`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

**Important:** All tests must pass before any PR can be merged. See CLAUDE.md for development guidelines.

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Powered by [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation)
- Deployed with [Serverless Framework](https://www.serverless.com/)
