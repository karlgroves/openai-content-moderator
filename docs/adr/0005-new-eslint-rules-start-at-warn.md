# 0005. New ESLint rules start at `warn` level

- **Status**: Accepted
- **Date**: 2026-04-23
- **Deciders**: @karlgroves

## Context

Phase 1 of issue #30 added six new ESLint plugins: `security`,
`sonarjs`, `n`, `unicorn`, `no-secrets`, and `jsdoc`. The issue's
recommended config sets most of these to `error` with no escape hatch.

Flipping all of them to `error` in a single PR on an existing codebase
produces a wall of failures unrelated to the PR's intent, blocks
unrelated work, and invites mass `eslint-disable` comments that defeat
the point. It also makes review harder, because the diff mixes
mechanical fixes with the tooling change itself.

## Decision

New ESLint plugins introduced by Phase 1 default to `warn`. We tighten
specific rules to `error` in focused follow-up PRs, one plugin (or one
rule family) at a time, with the accompanying code fixes in the same
PR.

The existing strict rules (`no-eval`, `prefer-const`, `no-var`,
`eqeqeq`, `curly`) stay at `error`.

## Consequences

- Phase 1 merges without requiring codebase-wide fixes.
- `eslint .` now prints ~15 warnings on the existing codebase. These
  should be read as a backlog, not as ignorable noise.
- Risk: warnings are easy to tolerate indefinitely. Mitigate by (a)
  treating each new plugin's warn-to-error promotion as a tracked
  follow-up, and (b) keeping `--max-warnings=0` out of the
  `lint-staged` command until we're ready to enforce.
- If the backlog grows without promotion, revisit — we may need to
  decide to either enforce or remove the plugin.

## Alternatives considered

- **All rules as `error`, fix everything in Phase 1**: blocks Phase 1
  on unrelated refactoring, bloats the diff.
- **All rules as `off`, enable one at a time**: hides actionable
  warnings from developers; defeats the "visible backlog" goal.
- **Keep the issue's recommended `error` levels, but broadly disable
  offending files**: pollutes the code with eslint-disable comments.
