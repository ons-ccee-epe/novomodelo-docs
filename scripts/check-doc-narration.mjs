// Change-narration gate (ticket-009; GRD-01, ADR-007, ADR-034).
//
// CLAUDE.md "Current-state voice, both layers": every page states what novomodelo
// does now, with no change narration ("no longer", "previously", "formerly",
// "fixed in", "this release", migration notes, Before/After examples, ...). This
// gate is zone-independent — every rule applies on every page the voice-family
// gates walk (`collectZonedSourceFiles`, `index.mdx` included, `pt-br/` not).
//
// Before matching, fenced code, inline code (also when wrapped across lines),
// HTML comments, MDX comments, markdown link targets and bare URLs are blanked
// with line numbers preserved: verbatim novomodelo messages, JSON keys and anchor
// fragments are not prose. Matching then runs per paragraph block (a phrase
// split by a hard wrap is still found) through the shared helpers in
// scripts/doc-text.mjs, and a hit inside the corpus's own statement of the
// no-annotations rule is skipped (`inRuleSelfReference`).
//
// Calibration against the corpus (the pattern, never the allowlist, carries it):
//   - `used to` fires only on a finite narrative use ("it used to", "used to
//     be"); the purpose participle ("a value used to initialize") is prose.
//   - `previously` does not fire on the run-history adjective ("a previously
//     trained policy").
//   - `no longer` fires only on a status of the interface (what is accepted,
//     read, declared, supported), not on a step of a derivation ("the pair no
//     longer identifies a single line").
//   - `fixed in` requires a release or version target ("fixed in advance" is
//     prose); `new in` does not fire on "new in-memory ...".
//   - `BREAKING` is case-sensitive, so "tie-breaking" is prose.
//   - `currently` fires only before an interface status ("currently accepts",
//     "does not currently support", "currently inert"), and "as implemented
//     today" always; the run state of a solve ("cuts currently active in the
//     LP") and "today" as a time ("water saved today") are prose.
//
// A fence still open at the end of a page blanks the rest of it, so it is
// reported as `UNCLOSED-FENCE <page>:<line>` (the opener's line) and fails the
// gate; no allowlist entry applies.
//
// An entry in scripts/doc-lint-allow.txt grandfathers only the narration rule it
// names; a narration entry that matches no hit is reported STALE and fails the
// gate. Exit 0 clean, 1 on violations, stale entries or an unclosed fence, 2 on
// a setup error.
//
// Exports `detectNarrationViolations(text)`, `unclosedFenceLine(text)` and
// `NARRATION_RULE_IDS` behind a direct-run guard, mirroring check-doc-version.mjs.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { collectZonedSourceFiles } from "./doc-zones.mjs";
import { loadAllowlist, partitionByAllowlist } from "./doc-lint-allowlist.mjs";
import {
  buildBlocks,
  lineForOffset,
  inRuleSelfReference,
} from "./doc-text.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(scriptDir, "..", "src", "content", "docs") + "/";
const allowlistPath = join(scriptDir, "doc-lint-allow.txt");

// What a "no longer" must be followed by to narrate the interface: the verbs of
// `narration-now-verb` (its mirror), the corpus-evidenced read/exist/declare,
// "dependent", or an interface noun ("no longer an override column").
const NO_LONGER_STATUS = [
  "(?:accepts?|accepted|supports?|supported|rejects?|rejected|refuses?|refused)",
  "(?:requires?|required|includes?|included|reports?|reported)",
  "(?:reads?|exists?|declared|dependent)",
  "an?\\s+(?:\\w+\\s+)?(?:column|field|key|option|flag|file|setting)",
].join("|");

// What a "currently" must be followed by to narrate the interface: a verb of
// what is accepted, supported, imposed or trimmed, or "inert".
const CURRENTLY_STATUS =
  "(?:accepts?|accepted|supports?|supported|imposes?|imposed|trims?|inert)";

const NARRATION_PATTERNS = [
  [
    "narration-no-longer",
    new RegExp(`\\bno\\s+longer\\s+(?:${NO_LONGER_STATUS})\\b`, "gi"),
  ],
  [
    "narration-previously",
    /\bpreviously\b(?![-\s]+(?:solved|trained|exported|deactivated|basic)\b)/gi,
  ],
  [
    "narration-used-to",
    /\b(?:novomodelo|it|this|that|they|which)\s+used\s+to\b|\bused\s+to\s+be\b/gi,
  ],
  ["narration-formerly", /\bformerly\b/gi],
  [
    "narration-currently",
    new RegExp(
      `\\bcurrently\\s+${CURRENTLY_STATUS}\\b|\\bas\\s+implemented\\s+today\\b`,
      "gi",
    ),
  ],
  [
    "narration-now-verb",
    /\bnow\s+(?:supports|accepts|rejects|refuses|requires|includes|reports)\b/gi,
  ],
  ["narration-was-fixed", /\b(?:was|were)\s+(?:fixed|broken)\b/gi],
  [
    "narration-fixed-in",
    /\bfixed\s+in\s+(?:(?:\w+\s+){0,3}(?:releases?|versions?)\b|(?:novomodelo\s+)?v\d|\d+\.\d+)/gi,
  ],
  ["narration-new-in", /\bnew\s+in\b(?!-)/gi],
  ["narration-pre-version", /\bpre-v\d/gi],
  [
    "narration-earlier-docs",
    /\bearlier\s+(?:documentation|versions?|releases?)\b/gi,
  ],
  ["narration-this-release", /\bthis\s+release\b/gi],
  ["narration-breaking", /\bBREAKING\b/g],
  ["narration-migration", /\bmigration\b/gi],
];

const BEFORE_AFTER_RULE = "narration-before-after-heading";
const BEFORE_AFTER_HEADING = /^#{1,6}\s+(?:Before|After)\b/i;

export const NARRATION_RULE_IDS = new Set([
  ...NARRATION_PATTERNS.map(([rule]) => rule),
  BEFORE_AFTER_RULE,
]);

const OPEN_FENCE = /^\s*(?:(`{3,})[^`]*|(~{3,}).*)$/;
const CLOSE_FENCE = /^\s*(`{3,}|~{3,})\s*$/;
const INLINE_CODE = /`[^`]*`/g;
const COMMENT = /<!--[\s\S]*?-->|\{\/\*[\s\S]*?\*\/\}/g;
const LINK_TARGET = /\]\([^)\n]*\)/g;
const BARE_URL = /\bhttps?:\/\/\S+/g;

const blankKeepingNewlines = (s) => s.replace(/[^\n]/g, " ");

// `text` is the page with fenced lines blanked; `unclosedFenceLine` is the
// 1-based line of a fence still open at the end of the page, else null.
function blankFences(text) {
  let fence = null;
  let fenceLine = 0;
  const blanked = text
    .split("\n")
    .map((line, i) => {
      if (fence === null) {
        const open = OPEN_FENCE.exec(line);
        if (!open) return line;
        fence = open[1] ?? open[2];
        fenceLine = i + 1;
        return "";
      }
      const close = CLOSE_FENCE.exec(line);
      if (
        close &&
        close[1][0] === fence[0] &&
        close[1].length >= fence.length
      ) {
        fence = null;
      }
      return "";
    })
    .join("\n");
  return {
    text: blanked,
    unclosedFenceLine: fence === null ? null : fenceLine,
  };
}

export const unclosedFenceLine = (text) => blankFences(text).unclosedFenceLine;

function blankNonProse(text) {
  return blankFences(text)
    .text.replace(/[^\n]+(?:\n[^\n]+)*/g, (paragraph) =>
      paragraph.replace(INLINE_CODE, blankKeepingNewlines),
    )
    .replace(COMMENT, blankKeepingNewlines)
    .replace(LINK_TARGET, blankKeepingNewlines)
    .replace(BARE_URL, blankKeepingNewlines)
    .replace(/\*\*/g, "");
}

/**
 * Change-narration hits in one page's source text (allowlist NOT applied).
 *
 * @param {string} text
 * @returns {Array<{ lineno: number, rule: string, text: string }>}
 */
export function detectNarrationViolations(text) {
  const prose = blankNonProse(text);
  const violations = [];

  for (const block of buildBlocks(prose)) {
    for (const [rule, pattern] of NARRATION_PATTERNS) {
      for (const m of block.joined.matchAll(pattern)) {
        if (inRuleSelfReference(block.joined, m.index)) continue;
        violations.push({
          lineno: lineForOffset(block, m.index),
          rule,
          text: m[0].trim(),
        });
      }
    }
  }

  prose.split("\n").forEach((line, i) => {
    const m = BEFORE_AFTER_HEADING.exec(line);
    if (m)
      violations.push({
        lineno: i + 1,
        rule: BEFORE_AFTER_RULE,
        text: m[0].trim(),
      });
  });

  return violations.sort((a, b) => a.lineno - b.lineno);
}

function main() {
  if (!existsSync(contentRoot)) {
    console.error(
      "check:narration: src/content/docs/ not found — run this from the repo root.",
    );
    process.exit(2);
  }

  let allowlist;
  try {
    allowlist = loadAllowlist(allowlistPath);
  } catch (error) {
    console.error(`check:narration: ${error.message}`);
    process.exit(2);
  }

  const relFiles = collectZonedSourceFiles(contentRoot).sort();
  const violations = [];
  const unclosed = [];

  for (const rel of relFiles) {
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

    const openFence = unclosedFenceLine(text);
    if (openFence !== null) unclosed.push({ rel, lineno: openFence });

    for (const v of detectNarrationViolations(text)) {
      violations.push({ rel, ...v });
    }
  }

  const { failing, grandfathered, stale } = partitionByAllowlist(
    violations,
    allowlist,
    (id) => NARRATION_RULE_IDS.has(id),
  );

  if (failing.length === 0 && stale.length === 0 && unclosed.length === 0) {
    console.log(
      `OK: ${relFiles.length} files scanned; no NEW change narration found` +
        (grandfathered.length > 0
          ? ` (${grandfathered.length} pre-existing hit(s) grandfathered via scripts/doc-lint-allow.txt).`
          : "."),
    );
    process.exit(0);
  }

  for (const v of failing) {
    console.log(
      `VIOLATION [${v.rule}]: ${v.rel}:${v.lineno}: ${JSON.stringify(v.text)}`,
    );
  }
  for (const s of stale) {
    console.log(
      `STALE [${s.ruleId}]: ${s.key} — doc-lint-allow.txt:${s.fileLine} matches no narration hit`,
    );
  }
  for (const u of unclosed) console.log(`UNCLOSED-FENCE ${u.rel}:${u.lineno}`);
  console.log(
    `FAIL: ${failing.length} narration violation(s), ${stale.length} stale allowlist entry(ies), ${unclosed.length} unclosed fence(s). Every page in both layers ` +
      `states what novomodelo does now, with no change narration (CLAUDE.md "Current-state voice, both layers"): ` +
      `reword a hit as a neutral statement of current behaviour. Delete or re-key a stale entry in scripts/doc-lint-allow.txt.`,
  );
  process.exit(1);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
