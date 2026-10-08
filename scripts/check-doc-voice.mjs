// Two-voice prose gate (Epic 04 ticket-015) — port of novomodelo's
// `scripts/ci/check_doc_voice.py`.
//
// novomodelo's book is single-voiced (software prose); novomodelo-docs is two-voiced
// (Epic 03: methodology math vs the software-layer partials/pages). The gate
// therefore keys every file off the shared `zoneOf()` predicate
// (scripts/doc-zones.mjs) and runs three checks with different scope:
//
//   1. Hype phrases — a curated list of marketing superlatives and
//      contrasting-affirmative constructs. Runs in BOTH zones: a sober
//      reference register is banned corpus-wide, not just in the methodology.
//   2. Unpinned "typical" numbers — a hedge word (typically/roughly/usually/
//      approximately/commonly) followed shortly by a magnitude, "N or more",
//      "common in practice", or "on a modern/typical ...". Runs in the STRICT
//      zone ONLY: the methodology states the invariant, not a transient
//      number, while the lenient software-layer pages may legitimately carry
//      concrete config/CLI numbers.
//   3. Instance magnitudes — `instance-count` ("160+ hydro"),
//      `instance-approx` ("≈ 2000 states", also KaTeX `\approx`) and
//      `instance-span` ("5-10 iterations", "1 month - 5 years"). Runs in the
//      STRICT zone ONLY: worked examples (`examples/*`) and the software layer
//      carry concrete instance numbers by design. Matching runs per paragraph
//      block, so a phrase split by a hard wrap is found; a hit is reported,
//      and exempted by a doc-voice-ok marker, at the line it starts on.
//
// Scans PROSE only: fenced code blocks (``` / ~~~), inline `code` spans, and
// HTML comments are blanked before matching (shared preprocessing:
// scripts/doc-text.mjs `proseLines`), so code samples, identifiers, and
// config defaults are never flagged. A line carrying an inline
// `<!-- doc-voice-ok: reason -->` marker is exempted (checked against the RAW
// source line, since the marker itself is an HTML comment that would
// otherwise be blanked out of the prose). A fence still open at the end of a
// page would blank the rest of it, so it is reported as `UNCLOSED-FENCE
// <page>:<line>` (the opener's line) and fails the gate; no allowlist entry
// applies.
//
// A committed baseline allowlist (scripts/doc-lint-allow.txt, R4) grandfathers
// pre-existing strict-zone hits so the gate lands green and blocks only NEW
// violations — see that file's header for the rationale-per-entry convention.
// An entry grandfathers only the rule id it names, and an entry of this gate's
// that matches no hit is reported as STALE and fails the gate.
//
// Exports `detectVoiceViolations(text, zone)` — the pure per-file detector —
// `detectMagnitudeViolations(text, zone)` (rule 3 alone), `RULE_IDS` (the rule
// ids this gate can emit) and `MAGNITUDE_RULE_IDS` (rule 3's ids) behind a
// direct-run guard, mirroring check-figures.mjs / check-spdx.mjs.
//
// Run any time (no build needed — reads source content, not dist/):
//   node scripts/check-doc-voice.mjs   |   npm run check:voice

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { zoneOf, ZONE_STRICT, collectZonedSourceFiles } from "./doc-zones.mjs";
import { loadAllowlist, partitionByAllowlist } from "./doc-lint-allowlist.mjs";
import {
  proseLines,
  unclosedFenceLine,
  buildBlocks,
  lineForOffset,
} from "./doc-text.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(scriptDir, "..", "src", "content", "docs") + "/";
const allowlistPath = join(scriptDir, "doc-lint-allow.txt");

// ---------------------------------------------------------------------------
// §5-equivalent banned constructs (hype). Kept deliberately tight: only
// phrases that have no sober-reference use, so a hit is almost always real.
// Ported verbatim from check_doc_voice.py's `_HYPE_PATTERNS`.
// ---------------------------------------------------------------------------
const HYPE_PATTERNS = [
  [
    // NOTE (ticket-028 calibration): "zero[- ]cost" was dropped from this
    // superlative list. In this math-heavy corpus "zero cost" / "zero
    // cost-to-go" is a literal LP term — the objective coefficient of a free
    // column, or the terminal value-function condition $V_{T+1}(x) = 0$ — not
    // the Rust-community "zero-cost abstractions" marketing catchphrase the
    // pattern was ported to catch. It over-fired on legitimate methodology
    // prose with no promotional use in sight. "zero[- ]overhead" is kept: it
    // has no literal LP meaning here, so a hit would still be genuine hype.
    "hype-superlative",
    /\b(blazing[- ]?fast|blazingly|lightning[- ]?fast|world[- ]class|best[- ]in[- ]class|cutting[- ]edge|state[- ]of[- ]the[- ]art|game[- ]chang(?:ing|er)|revolutionar(?:y|ize)|revolutioniz\w*|seamless(?:ly)?|effortless(?:ly)?|production[- ]grade|battle[- ]tested|turnkey|supercharg\w*|unleash\w*|high[- ]fidelity|dramatically|zero[- ]overhead)\b/i,
  ],
  [
    // NOTE (ticket-028 calibration): the "not just" / "not merely" family was
    // dropped. In careful technical writing these are ordinary logical-contrast
    // connectives ("the coupling is not merely a change of time resolution",
    // "not just a presence gate but a full lifecycle state"), not marketing
    // puffery. "more than just" is retained — it survives as the recognisably
    // promotional "more than just a <thing>" construction and does not fire on
    // the corpus's technical prose.
    "hype-contrasting-affirmative",
    /(more than just\b)/i,
  ],
];

// §2-equivalent unpinned-number checks, ported verbatim.
const HEDGE = /\b(typically|roughly|usually|approximately|commonly)\b/gi;
const OR_MORE = /\b\d[\d,]*\s+or\s+more\b/i;
const COMMON_IN_PRACTICE = /\bcommon in practice\b/i;
const ON_A_MODERN = /\bon a (?:modern|typical|standard|decent|recent)\b/i;

// A monetary-rate INSTANCE MAGNITUDE: a numeric magnitude (optionally a range,
// separated by an en/em dash or one-two ASCII hyphens — the corpus uses both
// "1,000–10,000" and "0.001--100" forms, and optionally an open-ended "+"
// suffix like "5,000+") immediately followed by a currency-rate unit token
// (\$/MWh, \$/MW, \$/unit, and the R$/USD currency variants). Requires
// number-then-unit ADJACENCY (only optional whitespace, and the optional "+",
// between them) so it does not fire on a bare unit label with no leading
// number, nor on an unrelated number that merely precedes a KaTeX math span
// ending in a literal "$" (e.g. "$1000$ \$/MWh over 5 stages" — the KaTeX
// closing delimiter breaks the required "<num> <unit>" adjacency).
const INSTANCE_MAGNITUDE =
  /(?:R\$|US\$|USD|\$)?\s*\d[\d.,]*(?:\s*(?:–|—|-{1,2})\s*\d[\d.,]*)?\+?\s*\\?\$\s*\/\s*(?:MWh|MW|unit)\b/i;

// A number found shortly after a hedge word, capturing the word right before it.
const HEDGE_NUM = /([A-Za-z][\w-]*\s+)?(~?\d[\d.,]*\S*)/;

// Words that legitimately precede a number (structural index, not a magnitude).
const STRUCTURAL_NOUNS = new Set([
  "stage",
  "stages",
  "rank",
  "ranks",
  "id",
  "ids",
  "index",
  "indices",
  "step",
  "steps",
  "phase",
  "phases",
  "bus",
  "buses",
  "line",
  "lines",
  "node",
  "nodes",
  "figure",
  "section",
  "chapter",
  "version",
  "table",
  "day",
  "days",
  "month",
  "months",
  "week",
  "weeks",
  "year",
  "years",
  "dimension",
  "dimensions",
  "order",
  "tier",
  "tiers",
  "block",
  "blocks",
  "level",
  "levels",
  "row",
  "rows",
  "column",
  "columns",
  "page",
]);

// A digit that is really part of a token like "1-based" / "8-bit" / "2-D".
const STRUCTURAL_SUFFIX = /^\d[\d.,]*-?(based|indexed|bit|byte|dimensional|d)\b/i;

const OK_MARKER = /<!--\s*doc-voice-ok/;

const UNPINNED_NUMBER_RULE = "unpinned-number";
const INSTANCE_MAGNITUDE_RULE = "instance-magnitude";

// Return a short description of the first unpinned-number hit, else null —
// port of `_typical_number_hit`.
function typicalNumberHit(prose) {
  const orMore = OR_MORE.exec(prose);
  if (orMore) return orMore[0];
  if (COMMON_IN_PRACTICE.test(prose)) return "common in practice";
  const onA = ON_A_MODERN.exec(prose);
  if (onA) return onA[0];

  HEDGE.lastIndex = 0;
  let hedgeMatch;
  while ((hedgeMatch = HEDGE.exec(prose)) !== null) {
    const after = hedgeMatch.index + hedgeMatch[0].length;
    const tail = prose.slice(after, after + 30);
    const m = HEDGE_NUM.exec(tail);
    if (!m) continue;
    const preceding = (m[1] || "").trim().toLowerCase();
    if (STRUCTURAL_NOUNS.has(preceding)) continue;
    let numPart = m[2];
    if (numPart.startsWith("~")) numPart = numPart.slice(1);
    if (STRUCTURAL_SUFFIX.test(numPart)) continue;
    return `${hedgeMatch[0]} ... ${numPart.slice(0, 12).trim()}`;
  }
  return null;
}

// Instance magnitudes that hold for some studies only: an open-ended count, an
// approximate state-space size, and a span of stages/months/years/iterations
// (number-first or unit-first).
const MAGNITUDE_PATTERNS = [
  [
    "instance-count",
    /\b\d[\d,]*\+\s*(?:hydros?|reservoirs?|plants?|thermals?|buses|stages|iterations|scenarios)\b/gi,
  ],
  ["instance-approx", /(?:≈|~|\\approx)\s*\$?\s*\d[\d,.]*\s+states?\b/gi],
  [
    "instance-span",
    /\b\d[\d,.]*\s*(?:–|—|-{1,2}|to)\s*\d[\d,.]*\s+(?:stages|months|years|iterations)\b|\b\d+\s+(?:months?|years?)\s*(?:–|—|-{1,2}|to)\s*\d+\s+(?:months?|years?)\b/gi,
  ],
];

export const MAGNITUDE_RULE_IDS = new Set(
  MAGNITUDE_PATTERNS.map(([rule]) => rule),
);

// Every rule id this gate can emit (except `unreadable`); the allowlist applies
// and reports only these.
export const RULE_IDS = new Set([
  ...HYPE_PATTERNS.map(([label]) => label),
  UNPINNED_NUMBER_RULE,
  INSTANCE_MAGNITUDE_RULE,
  ...MAGNITUDE_RULE_IDS,
]);

// Pure strict-zone detector for the instance-magnitude rules. Non-prose lines
// are blanked, not dropped, so a hit keeps its physical line number; each
// paragraph block is then matched as one joined string. Returns
// { lineno, rule, text } hits sorted by line (allowlist NOT applied).
export function detectMagnitudeViolations(text, zone) {
  if (zone !== ZONE_STRICT) return [];

  const rawLines = text.split("\n");
  const blanked = rawLines.map(() => "");
  for (const [lineno, prose] of proseLines(text)) blanked[lineno - 1] = prose;

  const violations = [];
  for (const block of buildBlocks(blanked.join("\n"))) {
    for (const [rule, pattern] of MAGNITUDE_PATTERNS) {
      for (const m of block.joined.matchAll(pattern)) {
        const lineno = lineForOffset(block, m.index);
        if (OK_MARKER.test(rawLines[lineno - 1])) continue;
        violations.push({ lineno, rule, text: m[0].trim() });
      }
    }
  }

  return violations.sort((a, b) => a.lineno - b.lineno);
}

// ---------------------------------------------------------------------------
// Pure per-file detector (exported for the node:test fixture and for main()).
//
// `zone` is the file's `zoneOf()` result ("strict" | "lenient"). The hype
// check always runs; the unpinned-number check and the magnitude detector run
// only when zone === strict. Returns an array of { lineno, rule, text }
// violations sorted by line (allowlist NOT applied
// here — that is layered on by the caller so the pure detector stays testable
// without touching the filesystem).
// ---------------------------------------------------------------------------
export function detectVoiceViolations(text, zone) {
  const violations = [];
  const rawLines = text.split("\n");

  for (const [lineno, prose] of proseLines(text)) {
    if (!prose.trim()) continue;

    // The OK marker is an HTML comment, blanked out of `prose`; check the raw
    // source line so a genuine exception can opt out.
    if (OK_MARKER.test(rawLines[lineno - 1] ?? "")) continue;

    for (const [label, pattern] of HYPE_PATTERNS) {
      const m = pattern.exec(prose);
      if (m) {
        violations.push({ lineno, rule: label, text: m[0].trim() });
      }
    }

    if (zone === ZONE_STRICT) {
      const hit = typicalNumberHit(prose);
      if (hit !== null) {
        violations.push({ lineno, rule: UNPINNED_NUMBER_RULE, text: hit });
      }

      const magnitude = INSTANCE_MAGNITUDE.exec(prose);
      if (magnitude) {
        violations.push({
          lineno,
          rule: INSTANCE_MAGNITUDE_RULE,
          text: magnitude[0].trim(),
        });
      }
    }
  }

  violations.push(...detectMagnitudeViolations(text, zone));
  return violations.sort((a, b) => a.lineno - b.lineno);
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly). Kept behind a direct-run guard so
// importing this module for detectVoiceViolations (the node:test fixture)
// does NOT trigger the filesystem walk or process.exit.
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(contentRoot)) {
    console.error(
      "check:voice: src/content/docs/ not found — run this from the repo root.",
    );
    process.exit(1);
  }

  let allowlist;
  try {
    allowlist = loadAllowlist(allowlistPath);
  } catch (error) {
    console.error(`check:voice: ${error.message}`);
    process.exit(1);
  }
  const relFiles = collectZonedSourceFiles(contentRoot).sort();

  const violations = [];
  const unclosed = [];
  let linesChecked = 0;

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

    const openFence = unclosedFenceLine(text);
    if (openFence !== null) unclosed.push({ rel, lineno: openFence });

    linesChecked += proseLines(text).filter(([, prose]) => prose.trim()).length;

    for (const v of detectVoiceViolations(text, zone)) {
      violations.push({ rel, ...v });
    }
  }

  const { failing, grandfathered, stale } = partitionByAllowlist(
    violations,
    allowlist,
    (id) => RULE_IDS.has(id),
  );

  if (failing.length === 0 && stale.length === 0 && unclosed.length === 0) {
    console.log(
      `OK: ${linesChecked} prose lines scanned across ${relFiles.length} files; ` +
        `no NEW promotional voice, unpinned 'typical' numbers or instance magnitudes found` +
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
      `STALE [${s.ruleId}]: ${s.key} — doc-lint-allow.txt:${s.fileLine} matches no voice hit`,
    );
  }
  for (const u of unclosed) console.log(`UNCLOSED-FENCE ${u.rel}:${u.lineno}`);
  console.log(
    `FAIL: ${failing.length} prose violation(s), ${stale.length} stale allowlist entry(ies), ${unclosed.length} unclosed fence(s). ` +
      `Rewrite per the Methodology Authoring Standards (instance-count, instance-approx and ` +
      `instance-span flag instance magnitudes, which belong in a worked example or the software layer), ` +
      `mark a genuine exception with an inline ` +
      `'<!-- doc-voice-ok: reason -->', or (for a pre-existing hit under editorial review) add a ` +
      `rationale to scripts/doc-lint-allow.txt; delete or re-key a stale entry there.`,
  );
  process.exit(1);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
