# AWS Serverless Deployment Guide

This guide covers deploying the OpenAI Content Moderator API to AWS Lambda using the Serverless Framework.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured with credentials
3. Node.js 18.x or later
4. Serverless Framework CLI (installed as dev dependency)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your `OPENAI_API_KEY`
   - Set any other required environment variables

## Deployment

### Deploy to Development Stage

```bash
npm run deploy
```

This deploys to the default `dev` stage in `us-east-1`.

### Deploy to Production

```bash
npm run deploy:prod
```

### Deploy to Custom Stage/Region

```bash
npx serverless deploy --stage staging --region eu-west-1
```

## Local Testing

Test the Lambda function locally:

```bash
npm run offline
```

This starts the serverless-offline plugin on port 3000.

## Configuration

The `serverless.yml` file contains all deployment configuration:

- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **API Gateway**: Configured with CORS and compression

### Environment Variables

The following environment variables are configured:
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `NODE_ENV`: Set based on deployment stage
- `CORS_ORIGIN`: CORS configuration (defaults to '*')

## API Endpoints

After deployment, you'll receive API Gateway endpoints:

- `POST {api-url}/api/moderation/text` - Moderate text content
- `GET {api-url}/api/moderation/models` - Get available models
- `GET {api-url}/health` - Health check
- `POST {api-url}/moderate` - Legacy endpoint

## Monitoring

- CloudWatch Logs: Automatically configured for each function
- Request IDs: Added to response headers for tracking

## Removing the Deployment

To remove all AWS resources:

```bash
npm run remove
```

## Cost Considerations

- Lambda pricing: First 1M requests/month are free
- API Gateway: $3.50 per million requests
- CloudWatch Logs: $0.50 per GB ingested

## Security Best Practices

1. Use IAM roles with minimal permissions
2. Store `OPENAI_API_KEY` in AWS Systems Manager Parameter Store or Secrets Manager
3. Enable API Gateway request throttling
4. Configure custom domain with SSL certificate
5. Implement API key authentication for production use