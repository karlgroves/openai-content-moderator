# 0006. TruffleHog for secret scanning (replacing gitleaks)

- **Status**: Accepted
- **Date**: 2026-06-10
- **Deciders**: @karlgroves

## Context

Phase 2 of issue #30 (see [0004](0004-best-effort-security-cli-wrappers.md))
adopted `gitleaks` for secret scanning, wired into the `security:secrets`
npm script and the Husky `pre-commit` hook. Issue #37 proposes replacing
it with [TruffleHog](https://github.com/trufflesecurity/trufflehog).

Issue #30's ground rules say not to replace an existing tool without a
demonstrable quality win, and to record the decision as an ADR. The
relevant differences:

- **Verification** — TruffleHog actively verifies detected credentials
  against live services, so `--only-verified` reports confirmed secrets
  and suppresses the regex false positives that gitleaks surfaces.
- **Detector coverage** — 800+ verified detectors vs. gitleaks' regex
  rules.
- **Licensing** — the gitleaks GitHub Action requires a paid license for
  organization use; TruffleHog is fully open source (AGPL-3.0). The AGPL
  applies to the tool we *run*, not to this MIT/ISC-licensed project, so
  it carries no obligation for our source.
- **Maintenance** — TruffleHog ships frequent detector updates and has a
  larger contributor base.

## Decision

Replace `gitleaks` with `trufflehog` everywhere it was referenced:

- `security:secrets` runs
  `trufflehog git file://. --since-commit HEAD --only-verified --fail`,
  still wrapped in `scripts/maybe-run.sh` so a missing binary degrades to
  an install hint rather than a hard failure (the best-effort pattern from
  [0004](0004-best-effort-security-cli-wrappers.md) is retained).
- The Husky `pre-commit` hook runs the same best-effort scan.
- CI (`security.yml`) gains a `secret-scan` job using the
  `trufflesecurity/trufflehog` action with `--only-verified --fail`, which
  is the enforced gate; the local hook is a convenience layer.

This supersedes the `gitleaks`-specific portion of
[0004](0004-best-effort-security-cli-wrappers.md). The best-effort wrapper
decision itself (for `osv-scanner`, `semgrep`, and now `trufflehog`)
remains in force.

## Consequences

- Fewer false positives locally: `--only-verified` means a flagged secret
  is a real, live credential, so developers are less likely to learn to
  ignore the scanner.
- CI now hard-fails on verified secrets on every push/PR, closing the gap
  where secret scanning was only a (skippable) local hook.
- New contributors install `trufflehog` instead of `gitleaks`
  (`brew install trufflehog`); README and bootstrap docs updated
  accordingly.
- `--only-verified` will not catch unverifiable secret formats (e.g. a
  generic high-entropy string with no live service to check against). This
  is an accepted trade-off against false-positive noise; CodeQL and code
  review remain backstops.

## Alternatives considered

- **Keep gitleaks**: simpler (no change), but loses verification and
  carries the org-licensing concern for any future Action use.
- **Run both**: redundant coverage at the cost of two binaries, slower
  hooks, and double the false positives. Not worth it at this scale.
