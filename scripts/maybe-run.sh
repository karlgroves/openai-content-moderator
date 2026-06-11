#!/usr/bin/env sh
# Run a command if its binary is installed; otherwise print an install hint
# and exit 0. Used by security:* npm scripts so missing external binaries
# (semgrep, osv-scanner, gitleaks) don't break local dev loops.
#
# Usage: scripts/maybe-run.sh <tool> <install-hint> [args...]
#   <tool>         - name of the binary to invoke
#   <install-hint> - short string shown when the tool is not found
#   [args...]      - forwarded to <tool> when present
#
# Exits with the tool's exit code when it runs, or 0 when skipped.

set -eu

# Guard against a mis-wired call (fewer than 2 args), which would otherwise
# slip past `shift 2` and print a misleading "<hint> not installed" message
# while exiting 0.
if [ "$#" -lt 2 ]; then
  echo "usage: maybe-run.sh <tool> <install-hint> [args...]" >&2
  exit 2
fi

tool="$1"
hint="$2"
shift 2

if command -v "$tool" >/dev/null 2>&1; then
  exec "$tool" "$@"
fi

echo "[hint] $tool not installed — skipping. Install: $hint"
exit 0
