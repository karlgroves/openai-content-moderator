# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) — short
documents capturing a single significant decision along with the context
and consequences. They exist so that future contributors (human or
agent) can understand *why* a choice was made, not just *what* the code
does today.

## Format

We use a compact [MADR](https://adr.github.io/madr/)-style template. See
`0000-template.md` for the starting point.

## Index

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-keep-jest-as-test-runner.md) | Keep Jest as the test runner | Accepted |
| [0003](0003-plain-javascript-not-typescript.md) | Plain JavaScript, not TypeScript | Accepted |
| [0004](0004-best-effort-security-cli-wrappers.md) | Best-effort wrappers for external security CLIs | Accepted |
| [0005](0005-new-eslint-rules-start-at-warn.md) | New ESLint rules start at `warn` level | Accepted |
| [0006](0006-trufflehog-for-secret-scanning.md) | TruffleHog for secret scanning (replacing gitleaks) | Accepted |

## Creating a new ADR

1. Copy `0000-template.md` to `NNNN-short-title.md`, using the next
   available number.
2. Fill it in. Keep it short — one decision per file.
3. Add a row to the index above.
4. Open a PR.

Status values: `Proposed`, `Accepted`, `Deprecated`, `Superseded by <id>`.

## Status convention

An ADR is authored as `Proposed` while it lives on a feature branch and
is under review. It is flipped to `Accepted` in the same PR once the
decision is ratified and merged to `develop`. In other words, an ADR on
`main`/`develop` reflects a ratified decision, so `Accepted` is the
expected steady state for merged records. Use `Deprecated` or
`Superseded by <id>` when a later decision overrides it; never edit a
merged ADR's decision in place.
