# AWS Serverless Deployment Guide

This guide covers deploying the OpenAI Content Moderator API to AWS Lambda using the Serverless Framework.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured with credentials
3. Node.js 20.5.0 or later (see `engines` in `package.json`)
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

- **Runtime**: Node.js 20.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **API Gateway**: Configured with CORS and compression

### Environment Variables

`serverless.yml` passes the following through to the function:

| variable                     | required           | default                  | notes                                                                                      |
| ---------------------------- | ------------------ | ------------------------ | ------------------------------------------------------------------------------------------ |
| `OPENAI_API_KEY`             | yes                | none                     | Deploy fails if unset.                                                                     |
| `OPENAI_MODEL`               | no                 | `omni-moderation-latest` |                                                                                            |
| `GOOGLE_PERSPECTIVE_API_KEY` | no                 | empty                    | Only read when Perspective is enabled.                                                     |
| `PERSPECTIVE_API_ENABLED`    | no                 | `false`                  | Must be the exact string `true` to enable.                                                 |
| `API_SECRET_KEY`             | **yes for `prod`** | empty                    | See below.                                                                                 |
| `NODE_ENV`                   | derived            | from stage               | `dev` maps to `development`, `prod` to `production`; any other stage maps to `production`. |
| `CORS_ORIGIN`                | no                 | empty                    | Comma-separated exact origins.                                                             |

**`CORS_ORIGIN` has no `'*'` default.** Credentials are enabled, so the app
rejects a wildcard allowlist at start-up. The previous `'*'` default meant any
deploy that did not set `CORS_ORIGIN` explicitly produced a function that threw
on its first invocation. Empty means "no browser origins allowed", which is a
valid and safe configuration; set an explicit list to permit browser clients.

**`API_SECRET_KEY` is mandatory on the `prod` stage.** When `NODE_ENV` resolves
to `production` and the key is unset, the app refuses to start rather than
silently serving unauthenticated traffic — every request costs money at a
third-party API. Development and test keep the permissive default so local work
needs no setup.

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
5. Set `API_SECRET_KEY` for every deployed stage; production refuses to start without it
