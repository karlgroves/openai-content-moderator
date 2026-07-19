# 0003. Plain JavaScript, not TypeScript

- **Status**: Accepted
- **Date**: 2026-04-23
- **Deciders**: @karlgroves

## Context

Issue #30 devotes significant space to a TypeScript setup: strict
`tsconfig.json`, `ts-reset`, `@typescript-eslint` at
`strict-type-checked`, TSDoc-enforced documentation, and a build step
via `tsup`/`tsc`.

This project is a small Express middleware API (roughly 440 lines of
application code across `index.js`, four middleware files, and one
route file — about 490 including `config/index.js`). It runs as a
Node.js process and deploys to AWS Lambda via Serverless Framework.
There is no frontend.

## Decision

Stay on plain JavaScript (CommonJS). Do not adopt TypeScript for this
project at this time.

## Consequences

- No build step; `node index.js` runs the source directly. Lambda
  deployment remains trivial.
- JSDoc remains the only option for type hints; we lean on
  `eslint-plugin-jsdoc` at warn level.
- We forgo compile-time type safety. The surface area is small enough
  that tests cover the risk adequately.
- TypeScript-specific items from #30 (`ts-reset`,
  `@typescript-eslint/*`, `verbatimModuleSyntax`, etc.) are out of
  scope indefinitely.

## Alternatives considered

- **Full TS migration**: high cost, low payoff at current scale.
- **JSDoc + `checkJs` in a tsconfig.json**: lighter than full TS but
  still requires a tsconfig and editor setup. Deferred — revisit if the
  codebase grows past roughly 2-3k lines or gains non-trivial typed
  contracts.
