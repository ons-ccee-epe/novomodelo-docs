// Version-reference gate (Epic 04 ticket-015) — reframe of novomodelo's
// `scripts/ci/check_book_version.py`.
//
// novomodelo's book compares every version STRING it finds against the workspace
// `Cargo.toml` version — novomodelo-docs has no Cargo.toml, so this gate is
// reframed around the "No version numbers in the corpus" hard rule
// (CLAUDE.md): the single anchor is the `**Synced to: novomodelo vX.Y.Z …**` line.
//
//   - STRICT zones (math/*.mdx excluding _impl/, overview/*, reference/glossary.md): ZERO novomodelo-
//     version strings/tokens AND zero version-annotation narration
//     ("added in v0.8.1", "as of v0.8.0", "Keys renamed from v0.8.1", "earlier
//     releases", ...) are tolerated — this enforces the hard rule directly.
//     Third-party versions ("PSR's SDDP (v17.3+)") are NOT flagged: the
//     token patterns require a literal `novomodelo`/`NOVOMODELO`/`novomodelo_version` marker
//     immediately adjacent, and the narration patterns require a
//     version-change verb, neither of which a bare third-party `vN.N` token
//     satisfies.
//   - LENIENT zones (math/_impl/*, reference/* (except reference/glossary.md), running/*, getting-started/*,
//     examples/*): a novomodelo-version string MAY appear (real CLI output like
//     `NOVOMODELO v0.9.1`, sample JSON like `"novomodelo_version": "0.9.0"`) but must be
//     a well-formed `X.Y.Z` — it is deliberately NOT required to equal the
//     anchor (lenient content shows the actual binary/artifact version, which
//     need not match the methodology sync tag; see CLAUDE.md's own recorded
//     `getting-started/quickstart.mdx` vs "Synced to" mismatch).
//
// Unlike check-doc-voice.mjs, this gate does NOT blank fenced code / inline
// code before matching: a raw novomodelo-version token appearing anywhere in the
// file — including inside a CLI-transcript or JSON-sample code fence — is
// exactly what it must catch (mirrors check_book_version.py, which has no
// fence-tracking at all).
//
// Because this corpus mixes single-long-line paragraphs with hard-wrapped
// files (`math/lp-warm-start.mdx` wraps at ~80 cols), matching is done against
// PARAGRAPH blocks (contiguous non-blank lines joined with a space), not bare
// physical lines — a real narration phrase in this tree ("removed entirely in
// the\nv0.8.2 restructure") is split by a mid-sentence line wrap, and a
// naive per-line regex would silently miss it. Each match is mapped back to
// the physical line on which it STARTS for reporting. The block building,
// offset mapping and rule self-reference guard are shared preprocessing in
// scripts/doc-text.mjs.
//
// A committed baseline allowlist (scripts/doc-lint-allow.txt, shared with
// check-doc-voice.mjs) grandfathers pre-existing strict-zone hits. An entry
// grandfathers only the rule id it names, and an entry of this gate's that
// matches no hit is reported as STALE and fails the gate.
//
// Exports `parseAnchor(text)`, `detectVersionViolations(text, zone)` and
// `RULE_IDS` (the rule ids this gate can emit) behind a direct-run guard,
// mirroring check-doc-voice.mjs.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { zoneOf, ZONE_STRICT, collectZonedSourceFiles } from "./doc-zones.mjs";
import { loadAllowlist, partitionByAllowlist } from "./doc-lint-allowlist.mjs";
import {
  buildBlocks,
  lineForOffset,
  inRuleSelfReference,
} from "./doc-text.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const contentRoot = join(repoRoot, "src", "content", "docs") + "/";
const claudeMdPath = join(repoRoot, "CLAUDE.md");
const allowlistPath = join(scriptDir, "doc-lint-allow.txt");

// ---------------------------------------------------------------------------
// The single version anchor: `**Synced to: novomodelo vX.Y.Z …**` in CLAUDE.md.
// ---------------------------------------------------------------------------
const ANCHOR_RE = /\*\*Synced to:\s*novomodelo\s+v(\d+\.\d+\.\d+)\b[^*]*\*\*/i;

/**
 * Parse the `**Synced to: novomodelo vX.Y.Z …**` anchor out of CLAUDE.md's text.
 * Throws a descriptive Error if the line is absent or malformed — this is
 * the single version anchor and its absence is a hard failure, not a warning.
 *
 * @param {string} text CLAUDE.md file contents
 * @returns {{ version: string, raw: string }}
 */
export function parseAnchor(text) {
  const m = ANCHOR_RE.exec(text);
  if (!m) {
    throw new Error(
      "no '**Synced to: novomodelo vX.Y.Z …**' anchor line found in CLAUDE.md " +
        "(or it is malformed) — this is the single version anchor and must be present.",
    );
  }
  return { version: m[1], raw: m[0] };
}

// ---------------------------------------------------------------------------
// STRICT-zone-only: version-ANNOTATION narration phrases. The first seven
// mirror the ticket's R3 pattern list verbatim; `version-narration-renamed`
// is an ADDED pattern (documented here, not silently folded in) — it is
// needed to catch a real, ticket-named hit ("Keys renamed from v0.8.1",
// math/cut-management.mdx:250) that none of the seven literal patterns match.
// All run against a paragraph BLOCK (see buildBlocks), case-insensitive,
// global.
// ---------------------------------------------------------------------------
const NARRATION_PATTERNS = [
  ["version-narration-added", /added\s+in\s+(?:the\s+)?v\d/gi],
  ["version-narration-since", /since\s+v\d/gi],
  ["version-narration-removed", /removed\s+(?:entirely\s+)?in\s+(?:the\s+)?v\d/gi],
  ["version-narration-as-of", /as\s+of\s+v\d/gi],
  ["version-narration-earlier-releases", /earlier\s+(?:novomodelo\s+)?releases?\b/gi],
  ["version-narration-deprecated", /\bdeprecated\b/gi],
  ["version-narration-migration", /\bmigration\b/gi],
  [
    "version-narration-renamed",
    /(?:renamed|restructured|changed)\s+(?:from|in)\s+(?:the\s+)?v\d/gi,
  ],
];

// ---------------------------------------------------------------------------
// novomodelo-version TOKEN patterns, checked in BOTH zones (with a different
// verdict per zone — see detectVersionViolations). The captured group is
// deliberately loose (`[0-9][0-9.]*` / `[^"]*`) rather than a strict
// `\d+\.\d+\.\d+`, so a MALFORMED lenient-zone version string (e.g.
// "NOVOMODELO v0.9") is still caught by the pattern and can be validated for
// well-formedness, rather than silently failing to match at all.
// ---------------------------------------------------------------------------
const VERSION_TOKEN_PATTERNS = [
  [
    // Case-insensitive: the title-case prose spelling "Novomodelo v0.9.0" is the
    // dominant form in the corpus and must be caught in strict zones, alongside
    // lowercase `novomodelo` (JSON/CLI context) and uppercase `NOVOMODELO` (CLI banner).
    "novomodelo-version-banner",
    /\bnovomodelo\s+v([0-9][0-9.]*)/gi,
    (m) => m[1].replace(/\.$/, ""),
  ],
  [
    "novomodelo-version-json",
    /"novomodelo_version"\s*:\s*"([^"]*)"/g,
    (m) => m[1],
  ],
];

const WELL_FORMED_VERSION = /^\d+\.\d+\.\d+$/;
const MALFORMED_VERSION_RULE = "malformed-version-string";

// Every rule id this gate can emit (except `unreadable`); the allowlist applies
// and reports only these.
export const RULE_IDS = new Set([
  ...NARRATION_PATTERNS.map(([rule]) => rule),
  ...VERSION_TOKEN_PATTERNS.map(([rule]) => rule),
  MALFORMED_VERSION_RULE,
]);

// ---------------------------------------------------------------------------
// Pure per-file detector (exported for the node:test fixture and for main()).
// Returns { lineno, rule, text } violations (allowlist NOT applied here).
// ---------------------------------------------------------------------------
export function detectVersionViolations(text, zone) {
  const violations = [];
  const blocks = buildBlocks(text);

  for (const block of blocks) {
    if (zone === ZONE_STRICT) {
      for (const [rule, pattern] of NARRATION_PATTERNS) {
        for (const m of block.joined.matchAll(pattern)) {
          // Skip a narration hit that lands inside the corpus's own statement
          // of the no-version-annotations rule (see inRuleSelfReference) — a
          // sentence forbidding "migration notes" is not itself a migration
          // note.
          if (inRuleSelfReference(block.joined, m.index)) continue;
          violations.push({
            lineno: lineForOffset(block, m.index),
            rule,
            text: m[0].trim(),
          });
        }
      }
    }

    for (const [rule, pattern, extractVersion] of VERSION_TOKEN_PATTERNS) {
      for (const m of block.joined.matchAll(pattern)) {
        const lineno = lineForOffset(block, m.index);
        if (zone === ZONE_STRICT) {
          violations.push({ lineno, rule, text: m[0].trim() });
        } else {
          const versionValue = extractVersion(m);
          if (!WELL_FORMED_VERSION.test(versionValue)) {
            violations.push({
              lineno,
              rule: MALFORMED_VERSION_RULE,
              text: `${m[0].trim()} (version token ${JSON.stringify(versionValue)} is not a well-formed X.Y.Z)`,
            });
          }
        }
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly). Kept behind a direct-run guard so
// importing this module for parseAnchor/detectVersionViolations (the
// node:test fixture) does NOT trigger the filesystem walk or process.exit.
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(claudeMdPath)) {
    console.error("check:version: CLAUDE.md not found at repo root.");
    process.exit(1);
  }
  let anchor;
  try {
    anchor = parseAnchor(readFileSync(claudeMdPath, "utf8"));
  } catch (error) {
    console.error(`check:version: ${error.message}`);
    process.exit(1);
  }

  if (!existsSync(contentRoot)) {
    console.error(
      "check:version: src/content/docs/ not found — run this from the repo root.",
    );
    process.exit(1);
  }

  let allowlist;
  try {
    allowlist = loadAllowlist(allowlistPath);
  } catch (error) {
    console.error(`check:version: ${error.message}`);
    process.exit(1);
  }

  const relFiles = collectZonedSourceFiles(contentRoot).sort();
  const violations = [];

  for (const rel of relFiles) {
    const zone = zoneOf(rel);
    let text;
    try {
      text = readFileSync(join(contentRoot, rel), "utf8");
    } catch (error) {
      violations.push({
        rel,
        lineno: 0,
        rule: "unreadable",
        text: `${error.code ?? error.name}: ${error.message}`,
      });
      continue;
    }

    for (const v of detectVersionViolations(text, zone)) {
      violations.push({ rel, ...v });
    }
  }

  const { failing, grandfathered, stale } = partitionByAllowlist(
    violations,
    allowlist,
    (id) => RULE_IDS.has(id),
  );

  if (failing.length === 0 && stale.length === 0) {
    console.log(
      `OK: ${relFiles.length} files scanned; anchor is novomodelo v${anchor.version}; ` +
        `no NEW novomodelo-version violations found` +
        (grandfathered.length > 0
          ? ` (${grandfathered.length} pre-existing hit(s) grandfathered via scripts/doc-lint-allow.txt).`
          : "."),
    );
    process.exit(0);
  }

  for (const v of failing) {
    console.log(`VIOLATION [${v.rule}]: ${v.rel}:${v.lineno}: ${JSON.stringify(v.text)}`);
  }
  for (const s of stale) {
    console.log(
      `STALE [${s.ruleId}]: ${s.key} — doc-lint-allow.txt:${s.fileLine} matches no version hit`,
    );
  }
  console.log(
    `FAIL: ${failing.length} version violation(s), ${stale.length} stale allowlist entry(ies). The methodology corpus carries no ` +
      `novomodelo-version numbers/annotations outside the CLAUDE.md "Synced to" anchor (v${anchor.version}); ` +
      `a lenient-zone version string must be a well-formed X.Y.Z. Add a rationale to ` +
      `scripts/doc-lint-allow.txt for a pre-existing hit under editorial review; delete or re-key a stale entry there.`,
  );
  process.exit(1);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
