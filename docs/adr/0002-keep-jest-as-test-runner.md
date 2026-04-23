# 0002. Keep Jest as the test runner

- **Status**: Accepted
- **Date**: 2026-04-23
- **Deciders**: @karlgroves

## Context

Issue #30 proposes Vitest as the standard test runner. This project
already uses Jest + Supertest with a full suite of unit and integration
tests (85 tests passing as of Phase 1), plus `nock` for HTTP mocking
and `@types/jest` for editor completions.

Per the issue's ground rules, we do not replace tools that work unless
there is a demonstrable quality, performance, or maintenance win.

## Decision

Keep Jest. Do not migrate to Vitest.

## Consequences

- No migration cost, no churn in test files, no temporary loss of
  coverage during a rewrite.
- We forgo Vitest's faster startup and native ESM support. Neither is a
  live pain point in this repo.
- Jest's CJS-first model aligns with the project's CommonJS source.
- If the project adopts ESM or TypeScript in the future, revisit this
  decision.

## Alternatives considered

- **Vitest**: faster, modern, good defaults. Rejected because the
  project runs plain CJS JavaScript where Jest is the established
  solution, and the migration cost buys us nothing today.
- **Node's built-in test runner**: not feature-complete for our needs
  (no supertest integration story, weaker mocking).
