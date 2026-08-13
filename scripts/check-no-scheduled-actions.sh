#!/usr/bin/env bash
# Enforce the "no scheduled GitHub Actions" policy recorded in CLAUDE.md.
#
# Three things are checked, because removing the cron alone is not enough:
#
#   1. No `schedule:` / `- cron:` trigger in any workflow.
#   2. No `.github/dependabot.yml` — Dependabot is a scheduled updater.
#   3. No job or step still gated on `github.event_name == 'schedule'`. When a
#      cron is deleted but its `if:` gate is left behind, the job stops running
#      entirely and reports nothing, forever, while still looking configured.
#      That failure mode is silent, which is why it gets its own check.
#
# Exits non-zero, with the offending lines, when any of the three is violated.

set -euo pipefail

workflow_dir=".github/workflows"
failures=0

if [ ! -d "$workflow_dir" ]; then
  echo "No $workflow_dir directory — nothing to check."
  exit 0
fi

echo "==> Checking for cron schedules in $workflow_dir"
if matches=$(grep -rnE '^[[:space:]]*(schedule:|-[[:space:]]*cron:)' "$workflow_dir"); then
  echo "ERROR: scheduled trigger(s) found. Scheduled Actions are forbidden (see CLAUDE.md):"
  echo "$matches"
  failures=$((failures + 1))
else
  echo "OK: no scheduled triggers."
fi

echo "==> Checking for Dependabot configuration"
if [ -f ".github/dependabot.yml" ] || [ -f ".github/dependabot.yaml" ]; then
  echo "ERROR: .github/dependabot.yml exists. Dependabot is a scheduled updater and is"
  echo "       covered by the no-scheduled-Actions policy (see CLAUDE.md)."
  failures=$((failures + 1))
else
  echo "OK: no Dependabot configuration."
fi

echo "==> Checking for dead schedule gates"
# `^[^#]*` anchors the match to the code part of the line, so a YAML comment
# that merely mentions the forbidden condition (as security.yml does) is not
# itself reported as a violation.
if matches=$(grep -rnE "^[^#]*event_name[[:space:]]*==[[:space:]]*'schedule'" "$workflow_dir"); then
  echo "ERROR: job/step condition(s) still test for the 'schedule' event. The cron that"
  echo "       would satisfy them has been removed, so these can never run again:"
  echo "$matches"
  failures=$((failures + 1))
else
  echo "OK: no dead schedule gates."
fi

if [ "$failures" -gt 0 ]; then
  echo
  echo "$failures policy violation(s) found."
  exit 1
fi

echo
echo "All scheduled-Actions policy checks passed."
