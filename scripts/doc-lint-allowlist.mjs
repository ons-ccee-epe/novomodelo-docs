// Shared committed baseline allowlist reader (Epic 04 ticket-015, R4;
// hardened to a rule-scoped, stale-strict ratchet by ticket-008a, ADR-034).
//
// `scripts/doc-lint-allow.txt` is a ratchet: it grandfathers pre-existing
// strict-zone hits (each with a rationale) so the voice-family gates
// (`check-doc-voice.mjs`, `check-doc-version.mjs`) land green on the current
// corpus while still failing on any NEW violation with no matching entry. This
// mirrors novomodelo's own `scripts/ci/allow-rationale-allowlist.txt` convention.
//
// Format: one entry per grandfathered hit, one per line:
//   <relpath>:<line>  <rule-id>[,<rule-id>...]  # rationale
// `<relpath>` is relative to `src/content/docs/` (forward slashes). Blank
// lines and lines starting with `#` are comments and are ignored. A
// malformed non-comment, non-blank line is a NAMED failure — the gate must
// not silently ignore a typo that would otherwise widen the allowlist's
// effective grandfather set. A missing file is treated as an empty allowlist
// (a fresh checkout with no allowlist yet is not a crash).
//
// An entry grandfathers only the rule id it names, and only for the gate that
// owns that rule. Every gate reports each of its own entries that matched no
// hit in the run as stale, so a line shift fails on both sides (the unlisted
// hit at its new line and the entry left at the old one) and re-keying is
// enforced rather than trusted.

import { readFileSync, existsSync } from "node:fs";

const ENTRY_RE = /^(\S+):(\d+)\s+(\S+)\s+#\s*(.+)$/;

/**
 * Parse the allowlist file into a Map of "relpath:lineno" -> one element per
 * rule id (`fileLine` is the 1-based line of the entry in the allowlist file).
 * Throws a descriptive Error on a malformed non-comment/non-blank line.
 *
 * @param {string} path absolute path to scripts/doc-lint-allow.txt
 * @returns {Map<string, Array<{ ruleId: string, fileLine: number }>>}
 */
export function loadAllowlist(path) {
  const map = new Map();
  if (!existsSync(path)) return map;

  const lines = readFileSync(path, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;

    const m = ENTRY_RE.exec(line);
    if (!m) {
      throw new Error(
        `doc-lint-allow.txt:${i + 1}: malformed entry ${JSON.stringify(raw)} ` +
          `— expected '<relpath>:<line>  <rule-id>  # rationale'`,
      );
    }
    const [, relpath, lineno, ruleIds] = m;
    const key = `${relpath}:${lineno}`;
    if (!map.has(key)) map.set(key, []);
    for (const ruleId of ruleIds.split(",")) {
      map.get(key).push({ ruleId, fileLine: i + 1 });
    }
  }
  return map;
}

/**
 * Split a gate's violations against the allowlist.
 *
 * A violation is grandfathered only when an entry at `rel:lineno` names exactly
 * its rule and the calling gate owns that rule; `unreadable` is never
 * grandfathered. `stale` lists every entry whose rule the gate owns that
 * grandfathered no violation in this run. Entries for rules the gate does not
 * own are neither applied nor reported.
 *
 * @template {{ rel: string, lineno: number, rule: string }} V
 * @param {V[]} violations
 * @param {Map<string, Array<{ ruleId: string, fileLine: number }>>} allowlist
 * @param {(ruleId: string) => boolean} ownsRule the calling gate's own-rule predicate
 * @returns {{ failing: V[], grandfathered: V[], stale: Array<{ key: string, ruleId: string, fileLine: number }> }}
 */
export function partitionByAllowlist(violations, allowlist, ownsRule) {
  const failing = [];
  const grandfathered = [];
  const matched = new Set();

  for (const v of violations) {
    const entries =
      v.rule === "unreadable"
        ? []
        : (allowlist.get(`${v.rel}:${v.lineno}`) ?? []).filter(
            (e) => e.ruleId === v.rule && ownsRule(e.ruleId),
          );
    for (const e of entries) matched.add(e);
    (entries.length > 0 ? grandfathered : failing).push(v);
  }

  const stale = [];
  for (const [key, entries] of allowlist) {
    for (const e of entries) {
      if (ownsRule(e.ruleId) && !matched.has(e)) {
        stale.push({ key, ruleId: e.ruleId, fileLine: e.fileLine });
      }
    }
  }

  return { failing, grandfathered, stale };
}
