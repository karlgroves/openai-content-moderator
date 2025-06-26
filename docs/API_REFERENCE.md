# API Reference

## Base URL

```
http://localhost:8000
```

For production deployments, replace with your actual domain.

## Authentication

Currently, the API does not require authentication for clients. The service authenticates with OpenAI using the configured API key.

## Content Types

All requests and responses use JSON:

```
Content-Type: application/json
```

## Endpoints

### Moderation Endpoints

#### POST /api/moderation/text

Analyzes text content for potentially harmful content.

##### Request

```http
POST /api/moderation/text HTTP/1.1
Content-Type: application/json

{
  "text": "string"
}
```

**Parameters:**

| Name | Type | Required | Description | Constraints |
|------|------|----------|-------------|-------------|
| text | string | Yes | The text content to moderate | Max 32,768 characters |

##### Response

**Success Response (200 OK):**

```json
{
  "results": {
    "flagged": boolean,
    "categories": {
      "sexual": boolean,
      "hate": boolean,
      "harassment": boolean,
      "self-harm": boolean,
      "sexual/minors": boolean,
      "hate/threatening": boolean,
      "violence/graphic": boolean,
      "self-harm/intent": boolean,
      "self-harm/instructions": boolean,
      "harassment/threatening": boolean,
      "violence": boolean
    },
    "category_scores": {
      "sexual": number,
      "hate": number,
      "harassment": number,
      "self-harm": number,
      "sexual/minors": number,
      "hate/threatening": number,
      "violence/graphic": number,
      "self-harm/intent": number,
      "self-harm/instructions": number,
      "harassment/threatening": number,
      "violence": number
    }
  },
  "metadata": {
    "timestamp": "string (ISO 8601)",
    "textLength": number,
    "model": "string"
  }
}
```

**Field Descriptions:**

- `flagged`: Whether the content was flagged as potentially harmful
- `categories`: Boolean flags for each content category
- `category_scores`: Confidence scores (0-1) for each category
- `metadata.timestamp`: When the moderation was performed
- `metadata.textLength`: Character count of the input text
- `metadata.model`: The OpenAI model used for moderation

##### Error Responses

**400 Bad Request:**

```json
{
  "error": "ValidationError",
  "message": "Text is required",
  "field": "text"
}
```

**413 Payload Too Large:**

```json
{
  "error": "ValidationError",
  "message": "Text exceeds maximum length of 32768 characters",
  "field": "text"
}
```

##### Example

```bash
curl -X POST http://localhost:8000/api/moderation/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a friendly message about cats"
  }'
```

#### GET /api/moderation/models

Returns available moderation models.

##### Request

```http
GET /api/moderation/models HTTP/1.1
```

##### Response

**Success Response (200 OK):**

```json
{
  "models": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ]
}
```

##### Example

```bash
curl http://localhost:8000/api/moderation/models
```

### Utility Endpoints

#### GET /health

Health check endpoint for monitoring.

##### Request

```http
GET /health HTTP/1.1
```

##### Response

**Success Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "string (ISO 8601)",
  "service": "openai-content-moderator",
  "version": "string"
}
```

##### Example

```bash
curl http://localhost:8000/health
```

### Legacy Endpoints

#### POST /moderate

⚠️ **Deprecated**: Use `/api/moderation/text` instead.

This endpoint redirects to `/api/moderation/text` with a 301 status code.

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": "string",
  "message": "string",
  "field": "string"  // Optional, only for validation errors
}
```

### Error Types

| Error Type | Description | Common Causes |
|------------|-------------|---------------|
| ValidationError | Input validation failed | Missing or invalid fields |
| AuthenticationError | OpenAI authentication failed | Invalid API key |
| RateLimitError | Rate limit exceeded | Too many requests |
| APIError | OpenAI API error | Service issues |
| ServerError | Internal server error | Unexpected errors |

### Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 301 | Moved Permanently | Resource moved (legacy endpoints) |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication failed |
| 413 | Payload Too Large | Request body too large |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

## Rate Limiting

The API inherits rate limits from OpenAI's API:

- Default: 10,000 requests per minute
- May vary based on your OpenAI plan

Implement client-side rate limiting to avoid 429 errors.

## Best Practices

1. **Error Handling**: Always check the response status and handle errors appropriately
2. **Retries**: Implement exponential backoff for 429 and 503 errors
3. **Validation**: Validate text length client-side to avoid unnecessary requests
4. **Monitoring**: Use the health endpoint for service monitoring
5. **Timeouts**: Set appropriate client timeouts (recommended: 30 seconds)

## SDK Examples

### JavaScript/TypeScript

```javascript
class ModerationClient {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async moderateText(text) {
    const response = await fetch(`${this.baseUrl}/api/moderation/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  async getModels() {
    const response = await fetch(`${this.baseUrl}/api/moderation/models`);
    return response.json();
  }

  async checkHealth() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Usage
const client = new ModerationClient();
const result = await client.moderateText('Hello world');
console.log('Flagged:', result.results.flagged);
```

### Python

```python
import requests
import json

class ModerationClient:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        
    def moderate_text(self, text):
        response = requests.post(
            f'{self.base_url}/api/moderation/text',
            json={'text': text},
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        return response.json()
    
    def get_models(self):
        response = requests.get(f'{self.base_url}/api/moderation/models')
        response.raise_for_status()
        return response.json()
    
    def check_health(self):
        response = requests.get(f'{self.base_url}/health')
        response.raise_for_status()
        return response.json()

# Usage
client = ModerationClient()
result = client.moderate_text('Hello world')
print(f"Flagged: {result['results']['flagged']}")
```

### cURL

```bash
# Moderate text
curl -X POST http://localhost:8000/api/moderation/text \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here"}'

# Get models
curl http://localhost:8000/api/moderation/models

# Health check
curl http://localhost:8000/health
```