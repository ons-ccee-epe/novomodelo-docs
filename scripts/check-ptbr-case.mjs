// pt-BR sentence-case gate (ticket-033; R70, ADR-011).
//
// The pt-BR translation uses sentence case: a page heading, a frontmatter
// `title:` and a pt-BR label in astro.config.mjs capitalise the first word and
// nothing else, as Portuguese does (the English pages keep Title Case). This
// gate scans every `pt-br/` page that `collectZonedSourceFiles` walks (ATX
// headings outside fenced code, plus the `title:` of the first `---` block) and
// every `"pt-BR": "<label>"` string of astro.config.mjs, and fails on a
// non-initial word that starts with a capital.
//
// The rule, per heading, title or label, after stripping what is not displayed
// words (`$math$`, HTML/JSX tags, a trailing `{#id}`, link targets with the link
// text kept, `*`):
//   - the text is split into segments at " — " / " – ", and each segment has its
//     own initial word; leading enumeration tokens (`3.1`, `2.3a`, `§2`, `(a)`)
//     are not words;
//   - a non-initial word that starts with a capital letter is flagged, except a
//     word that starts with a digit and a word with two or more capitals (an
//     acronym or mixed-case name: PDDE, CVaR, PAR(p), HiGHS, PreFilling);
//   - a hyphenated word is flagged when any of its parts is a capitalised word
//     (`Pós-Estudo`, `Código-Fonte`); `PAR(p)-A` passes;
//   - a word after ":" is not initial, so a capital there is flagged.
// Fenced code, inline code and HTML comments are blanked through the shared
// helpers in scripts/doc-text.mjs, with line numbers preserved.
//
// Exemption policy: EXEMPT_TERMS below is the whole vocabulary of capitalised
// terms, kept in this script (ADR-011 rejected reading it from the glossary
// markdown). A term is added only for a proper noun, product name or named tier.
//
// A fence still open at the end of a page blanks the rest of it, so it is
// reported as `UNCLOSED-FENCE <page>:<line>` and fails the gate; no allowlist
// entry applies. An entry in scripts/doc-lint-allow.txt grandfathers only a
// `ptbr-title-case` hit (astro.config.mjs hits are keyed `astro.config.mjs:<line>`);
// an entry that matches no hit is reported STALE and fails the gate.
//
// Run: `npm run check:ptbr-case` (from the repo root). Exit 0 clean, 1 on
// violations, stale entries or an unclosed fence, 2 on a setup error.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { collectZonedSourceFiles } from "./doc-zones.mjs";
import { loadAllowlist, partitionByAllowlist } from "./doc-lint-allowlist.mjs";
import { proseLines, unclosedFenceLine } from "./doc-text.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(scriptDir, "..", "src", "content", "docs") + "/";
const configPath = join(scriptDir, "..", "astro.config.mjs");
const allowlistPath = join(scriptDir, "doc-lint-allow.txt");
const CONFIG_REL = "astro.config.mjs";

const RULE = "ptbr-title-case";
export const PTBR_CASE_RULE_IDS = new Set([RULE]);

// Capitalised terms that keep their capitals inside a pt-BR heading, title or
// label. A term is added only for a proper noun, product name or named tier;
// words with two or more capitals are exempt by rule and are not listed.
export const EXEMPT_TERMS = [
  "Novo Modelo",
  "Nível 1",
  "Bellman",
  "Benders",
  "Cholesky",
  "Hive",
  "Larroyd",
  "Lipschitz",
  "Markov",
  "Monte Carlo",
  "Parquet",
  "Polars",
  "Python",
  "Sobol",
  "VS Code",
  "Yule-Walker",
];

const ENUM_TOKEN = /^(\d+(\.\d+)*[a-z]?\.?|§\d+(\.\d+)*|\([a-z]\))$/;
const SEGMENT_BREAK = /\s[—–]\s/;
const EDGE_PUNCT =
  /^[()[\]{}"'“”‘’«».,;:!?]+|[()[\]{}"'“”‘’«».,;:!?]+$/gu;
const PLACEHOLDER = "exempt";
const HEADING = /^#{1,6}\s+(.*?)\s*#*\s*$/;
const FRONTMATTER_TITLE = /^title:\s*(.*)$/;
const LABEL = /"pt-BR":\s*"([^"]*)"/g;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const EXEMPT_RES = EXEMPT_TERMS.map(
  (t) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(t)}(?![\\p{L}\\p{N}])`, "gu"),
);

const displayText = (raw) =>
  raw
    .replace(/`[^`]*`/g, " ")
    .replace(/\$[^$]*\$/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s*\{#[^}]*\}\s*$/, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*+/g, "")
    .replace(/\\/g, "");

function titleCaseWords(raw) {
  let text = displayText(raw);
  for (const re of EXEMPT_RES) text = text.replace(re, PLACEHOLDER);
  const flagged = [];
  for (const segment of text.split(SEGMENT_BREAK)) {
    let seenWord = false;
    for (const rawTok of segment.split(/\s+/)) {
      if (rawTok === "") continue;
      if (!seenWord && ENUM_TOKEN.test(rawTok)) continue;
      const tok = rawTok.replace(EDGE_PUNCT, "");
      if (!/\p{L}/u.test(tok)) continue;
      if (!seenWord) {
        seenWord = true;
        continue;
      }
      if (!/^\p{Lu}/u.test(tok)) continue;
      const acronym = (part) => /\p{Lu}.*\p{Lu}/u.test(part);
      if (tok.includes("-")) {
        if (
          tok
            .split("-")
            .every((part) => !/^\p{Lu}\p{Ll}/u.test(part) || acronym(part))
        )
          continue;
      } else if (acronym(tok)) continue;
      flagged.push(tok);
    }
  }
  return flagged;
}

const violation = (lineno, text) => ({ lineno, rule: RULE, text });

/**
 * Title Case hits in one pt-BR page's source text (allowlist NOT applied): the
 * frontmatter `title:` and each ATX heading outside fenced code.
 *
 * @param {string} text
 * @returns {Array<{ lineno: number, rule: string, text: string }>}
 */
export function detectTitleCase(text) {
  const hits = [];
  const lines = text.split("\n");
  let frontmatterEnd = 0;
  if (lines[0] === "---") {
    let i = 1;
    for (; i < lines.length && lines[i] !== "---"; i++) {
      const m = FRONTMATTER_TITLE.exec(lines[i]);
      if (!m) continue;
      const title = m[1].trim().replace(/^(["'])(.*)\1$/, "$2");
      if (titleCaseWords(title).length > 0) hits.push(violation(i + 1, title));
    }
    frontmatterEnd = i + 1;
  }
  for (const [lineno, prose] of proseLines(text)) {
    if (lineno <= frontmatterEnd) continue;
    const h = HEADING.exec(prose);
    if (h && titleCaseWords(h[1]).length > 0) hits.push(violation(lineno, h[1]));
  }
  return hits;
}

/**
 * Title Case hits in the `"pt-BR": "<label>"` strings of astro.config.mjs
 * (allowlist NOT applied); every other line is ignored.
 *
 * @param {string} configText
 * @returns {Array<{ lineno: number, rule: string, text: string }>}
 */
export function detectLabelTitleCase(configText) {
  const hits = [];
  configText.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(LABEL)) {
      if (titleCaseWords(m[1]).length > 0) hits.push(violation(i + 1, m[1]));
    }
  });
  return hits;
}

function main() {
  if (!existsSync(contentRoot)) {
    console.error(
      "check:ptbr-case: src/content/docs/ not found — run this from the repo root.",
    );
    process.exit(2);
  }

  let configText;
  try {
    configText = readFileSync(configPath, "utf8");
  } catch (error) {
    console.error(
      `check:ptbr-case: cannot read ${CONFIG_REL} (${error.code ?? error.name}) — run this from the repo root.`,
    );
    process.exit(2);
  }

  let allowlist;
  try {
    allowlist = loadAllowlist(allowlistPath);
  } catch (error) {
    console.error(`check:ptbr-case: ${error.message}`);
    process.exit(2);
  }

  const relFiles = collectZonedSourceFiles(contentRoot)
    .filter((rel) => rel.startsWith("pt-br/"))
    .sort();
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

    for (const v of detectTitleCase(text)) violations.push({ rel, ...v });
  }
  for (const v of detectLabelTitleCase(configText)) {
    violations.push({ rel: CONFIG_REL, ...v });
  }

  const { failing, grandfathered, stale } = partitionByAllowlist(
    violations,
    allowlist,
    (id) => PTBR_CASE_RULE_IDS.has(id),
  );

  if (failing.length === 0 && stale.length === 0 && unclosed.length === 0) {
    console.log(
      `OK: ${relFiles.length} pt-BR pages and the ${CONFIG_REL} pt-BR labels scanned; ` +
        (grandfathered.length > 0
          ? `no NEW Title Case found (${grandfathered.length} pre-existing hit(s) grandfathered via scripts/doc-lint-allow.txt).`
          : "no Title Case found."),
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
      `STALE [${s.ruleId}]: ${s.key} — doc-lint-allow.txt:${s.fileLine} matches no Title Case hit`,
    );
  }
  for (const u of unclosed) console.log(`UNCLOSED-FENCE ${u.rel}:${u.lineno}`);
  console.log(
    `FAIL: ${failing.length} Title Case violation(s), ${stale.length} stale allowlist entry(ies), ${unclosed.length} unclosed fence(s). ` +
      `A pt-BR heading, frontmatter title or ${CONFIG_REL} label uses sentence case (rule ${RULE}): ` +
      `lowercase every non-initial word, except a proper noun, product name or named tier, which is added to EXEMPT_TERMS in scripts/check-ptbr-case.mjs ` +
      `(words with two or more capitals are exempt by rule). Delete or re-key a stale entry in scripts/doc-lint-allow.txt.`,
  );
  process.exit(1);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
