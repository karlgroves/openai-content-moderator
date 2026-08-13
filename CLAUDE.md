# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Flow Branching Strategy

This project follows Git Flow branching strategy. All development work must adhere to these guidelines:

### Branch Structure

- **main** - Production-ready code only. Direct commits are not allowed.
- **develop** - Integration branch for features. All feature branches merge here first.
- **feature/** - New features (branch from develop, merge back to develop)
- **release/** - Release preparation (branch from develop, merge to both main and develop)
- **hotfix/** - Emergency fixes (branch from main, merge to both main and develop)

### Workflow Rules

1. **Never commit directly to main** - All changes must come through proper Git Flow branches
2. **Feature development** - Create feature branches from develop: `git checkout -b feature/feature-name develop`
3. **Completing features** - Merge completed features back to develop via pull request
4. **Releases** - Create release branches from develop when ready for production
5. **Hotfixes** - Only for critical production issues, branch from main

### Common Commands

```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# Finish a feature (via PR preferred)
git checkout develop
git merge --no-ff feature/new-feature
git push origin develop

# Start a release
git checkout -b release/1.0.0 develop

# Start a hotfix
git checkout -b hotfix/critical-fix main
```

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

## CI policy: no scheduled GitHub Actions

**No GitHub Actions workflow in this repository may use a `schedule:` (cron)
trigger, and no scheduled workflow that has been removed may be added back.**
This is a standing constraint, not a default to be traded away for convenience.

A timer-triggered check reports a problem hours or days after it entered the
codebase, attributes it to no one, and gets ignored. The same check run against a
pull request blocks the defect at the point of introduction.

### Rules

- No `on: schedule:` and no `- cron:` in any file under `.github/workflows/`.
- No `.github/dependabot.yml` — Dependabot is a scheduled updater and is covered
  by this policy. GitHub **security alerts** are event-driven notifications, not
  scheduled jobs, and remain enabled.
- Every check a scheduled job would have performed runs as a step in the
  pull-request pipeline instead:
  - Dependency vulnerability and freshness checks (`npm audit`, `npm outdated`,
    OWASP Dependency-Check) run on `pull_request`.
  - Static analysis (CodeQL and equivalents) runs on `pull_request`.
  - Link checking, docs linting, and content checks run on `pull_request`,
    path-filtered to the files that can break them.
  - SBOM generation runs in the release/publish pipeline — an SBOM is a build
    output, not a periodic report.
  - DAST scans (ZAP and equivalents) run against the PR preview environment or
    as a post-deploy gate, not against a static URL on a timer.
  - End-to-end suites run as a smoke subset on `pull_request` and as the full
    matrix on merge to the default branch — never nightly.
- `workflow_dispatch` is allowed. A manual, on-demand run is not a scheduled run.
- Event-driven triggers (`push`, `pull_request`, `release`, `repository_dispatch`,
  `workflow_call`) are allowed and preferred.
- Genuinely periodic _product_ work — batch jobs, data pipelines, report
  generation — does not belong in GitHub Actions at all. Run it on real
  infrastructure with its own scheduler, alerting, and retries.

### If you think you need an exception

You do not add the cron. Raise it with the repository owner first.
