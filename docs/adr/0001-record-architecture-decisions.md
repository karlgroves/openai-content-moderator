# 0001. Record architecture decisions

- **Status**: Accepted
- **Date**: 2026-04-23
- **Deciders**: @karlgroves

## Context

Issue [#30](https://github.com/karlgroves/openai-content-moderator/issues/30)
proposes adopting a standardized tooling stack. Its ground rules require
that when a proposed tool overlaps with something already in use, we
either keep the existing tool or document the swap as an ADR. Without a
record, those decisions live only in PR descriptions and commit
messages, which are hard to discover months later.

## Decision

We will record significant, cross-cutting decisions as ADRs under
`docs/adr/`, one file per decision, using the template at
`0000-template.md`. ADRs are additive and immutable: when a decision
changes, we write a new ADR that supersedes the old one rather than
editing history.

Scope: decisions about tooling, architecture, process, and
dependencies. _Not_ bug fixes, day-to-day implementation, or code style.

## Consequences

- Future contributors can answer "why is it like this?" without
  archaeology across PRs and chat.
- Small upfront cost (one short markdown file per decision).
- Requires discipline — decisions not written down still don't exist.

## Alternatives considered

- **Wiki / Confluence**: rejected; the project's ground rules forbid
  external dashboards and accounts. ADRs live alongside the code.
- **Comments in CLAUDE.md**: rejected; CLAUDE.md should stay concise and
  instructional. ADRs are narrative and historical.
