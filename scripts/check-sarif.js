#!/usr/bin/env node
/**
 * Gate a build on SARIF findings.
 *
 * This repository does not use GitHub Advanced Security / Code Scanning, so
 * analysis steps run with `upload: never` and the SARIF is kept as a build
 * artifact. Without an uploader there is nothing to turn findings into a
 * failure, so this script is the gate.
 *
 * Blocking threshold: a finding blocks when it is reported at SARIF level
 * "error", or when its `security-severity` is >= 7.0 (CVSS high/critical).
 * That matches the `npm audit --audit-level=high` gate used elsewhere in CI.
 * Everything below the threshold is printed and counted but does not fail the
 * build — the SARIF artifact carries the full detail.
 *
 * Usage: node scripts/check-sarif.js <file-or-directory> [...]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BLOCKING_SECURITY_SEVERITY = 7.0;

/**
 * Collect .sarif / .sarif.json files from a list of files or directories.
 *
 * @param {string[]} targets File or directory paths.
 * @returns {string[]} Absolute-ish paths of SARIF files found.
 */
function collectSarifFiles(targets) {
  const found = [];

  for (const target of targets) {
    if (!fs.existsSync(target)) {
      throw new Error(`SARIF path does not exist: ${target}`);
    }

    if (fs.statSync(target).isDirectory()) {
      for (const entry of fs.readdirSync(target)) {
        if (entry.endsWith('.sarif') || entry.endsWith('.sarif.json')) {
          found.push(path.join(target, entry));
        }
      }
    } else {
      found.push(target);
    }
  }

  return found;
}

/**
 * Build a ruleId -> rule metadata index for one SARIF run.
 *
 * @param {object} run A single SARIF `runs[]` entry.
 * @returns {Map<string, object>} Rule metadata keyed by rule id.
 */
function indexRules(run) {
  const rules = new Map();
  const driverRules = run?.tool?.driver?.rules ?? [];
  const extensionRules = (run?.tool?.extensions ?? []).flatMap(ext => ext.rules ?? []);

  for (const rule of [...driverRules, ...extensionRules]) {
    if (rule?.id) {
      rules.set(rule.id, rule);
    }
  }

  return rules;
}

/**
 * Resolve the effective severity of a result.
 *
 * @param {object} result A SARIF `results[]` entry.
 * @param {Map<string, object>} rules Rule metadata index for the run.
 * @returns {{level: string, securitySeverity: number|null}} Effective severity.
 */
function severityOf(result, rules) {
  const rule = rules.get(result.ruleId);
  const level = result.level ?? rule?.defaultConfiguration?.level ?? 'warning';
  const raw = rule?.properties?.['security-severity'];
  const securitySeverity = raw === undefined || raw === null ? null : Number.parseFloat(raw);

  return {
    level,
    securitySeverity: Number.isNaN(securitySeverity) ? null : securitySeverity,
  };
}

/**
 * Describe where a result was reported, for human-readable output.
 *
 * @param {object} result A SARIF `results[]` entry.
 * @returns {string} A `file:line` style location, or "unknown location".
 */
function locationOf(result) {
  const physical = result?.locations?.[0]?.physicalLocation;
  const uri = physical?.artifactLocation?.uri;
  const line = physical?.region?.startLine;

  if (!uri) {
    return 'unknown location';
  }

  return line ? `${uri}:${line}` : uri;
}

/**
 * Partition every result in a SARIF file into blocking and non-blocking.
 *
 * @param {string} file Path to a SARIF file.
 * @returns {{blocking: object[], belowThreshold: number}} Partitioned findings.
 */
function classifyFile(file) {
  const sarif = JSON.parse(fs.readFileSync(file, 'utf8'));
  const blocking = [];
  let belowThreshold = 0;

  for (const run of sarif.runs ?? []) {
    const rules = indexRules(run);

    for (const result of run.results ?? []) {
      const { level, securitySeverity } = severityOf(result, rules);
      const isBlocking =
        level === 'error' ||
        (securitySeverity !== null && securitySeverity >= BLOCKING_SECURITY_SEVERITY);

      if (isBlocking) {
        blocking.push({
          file,
          ruleId: result.ruleId,
          level,
          securitySeverity,
          location: locationOf(result),
          message: result?.message?.text ?? '',
        });
      } else {
        belowThreshold += 1;
      }
    }
  }

  return { blocking, belowThreshold };
}

/**
 * Print the blocking findings in a form a reviewer can act on.
 *
 * @param {object[]} blocking Findings at or above the blocking threshold.
 * @returns {void}
 */
function reportBlocking(blocking) {
  console.error(`\n${blocking.length} blocking finding(s):`);

  for (const finding of blocking) {
    const severity =
      finding.securitySeverity === null
        ? finding.level
        : `${finding.level} / security-severity ${finding.securitySeverity}`;
    console.error(`  [${severity}] ${finding.ruleId} — ${finding.location}`);
    console.error(`      ${finding.message.split('\n')[0]}`);
  }
}

/**
 * Entry point.
 *
 * @returns {void}
 */
function main() {
  const targets = process.argv.slice(2);

  if (targets.length === 0) {
    console.error('usage: node scripts/check-sarif.js <file-or-directory> [...]');
    process.exit(2);
  }

  const files = collectSarifFiles(targets);

  // A missing SARIF is a broken pipeline, not a clean scan. Fail loudly rather
  // than reporting "0 findings" for an analysis that never produced output.
  if (files.length === 0) {
    console.error(`No SARIF files found under: ${targets.join(', ')}`);
    console.error('The analysis step did not produce output — treating as a failure.');
    process.exit(1);
  }

  const blocking = [];
  let belowThreshold = 0;

  for (const file of files) {
    const classified = classifyFile(file);
    blocking.push(...classified.blocking);
    belowThreshold += classified.belowThreshold;
  }

  console.log(`Scanned ${files.length} SARIF file(s): ${files.join(', ')}`);
  console.log(`Findings below the blocking threshold: ${belowThreshold}`);

  if (blocking.length === 0) {
    console.log('No blocking findings.');
    return;
  }

  reportBlocking(blocking);
  process.exit(1);
}

try {
  main();
} catch (error) {
  // A bad path or malformed SARIF means the gate could not be evaluated. Report
  // it as a failure with a readable message rather than an uncaught stack trace
  // — an unevaluable gate must never be mistaken for a passing one.
  console.error(`check-sarif: ${error.message}`);
  process.exit(1);
}
