# 0004. Best-effort wrappers for external security CLIs

- **Status**: Accepted
- **Date**: 2026-04-23
- **Deciders**: @karlgroves

## Context

Phase 2 of issue #30 added npm scripts for `osv-scanner`, `semgrep`,
and `gitleaks`. These are external binaries (Rust, Python, Go) not
installable via npm. A new contributor running `npm install` followed
by any of the `security:*` scripts would hit an immediate "command not
found" failure unless they had installed each tool first.

We want the security scripts to be useful when the binaries are
present, without turning "missing binary" into a hard blocker for
everyday work.

## Decision

Wrap each external-binary security script in `scripts/maybe-run.sh`.
The wrapper:

- Runs the tool normally when it is installed, forwarding its exit
  code (so real findings still fail the script).
- Prints an install hint and exits 0 when the binary is missing.

The wrapper applies to `security:osv`, `security:semgrep`, and
`security:secrets`. License checking (`security:licenses`) uses an npm
package and does not need the wrapper.

The pre-commit hook already uses the same best-effort pattern for
`gitleaks`.

## Consequences

- Zero-friction onboarding: `npm install` succeeds, `npm run security:all`
  succeeds (degraded) on a machine without any of the external tools.
- CI jobs that need a hard gate must explicitly install the binaries
  before running the scripts. Best-effort behavior is a local-dev
  convenience, not a substitute for enforced CI.
- If a developer *thinks* they are running a security scan but the
  binary is silently missing, they get the install hint — not a silent
  pass. The hint is easy to miss in long output; documentation
  (README + this ADR) has to carry the load.

## Alternatives considered

- **Hard-fail on missing binary**: clearer semantics, worse DX. Most
  day-to-day work doesn't need every scanner, and new contributors
  shouldn't be forced to install four CLIs before running tests.
- **Ship Docker images with all tools preinstalled**: heavier than this
  project warrants today.
- **Install all tools via `postinstall`**: not portable (each binary
  has a different install mechanism), and surprises users.
