// Column/field-count drift gate (Epic 04 ticket-015) — near-verbatim port of
// novomodelo's `scripts/ci/check_doc_counts.py`, retargeted to the novomodelo-docs I/O
// Reference pages.
//
// Several Reference pages introduce a schema table with a sentence like
// "... 27 columns." or "Eight columns ...", immediately followed by a
// markdown table whose data rows enumerate exactly those columns/fields. The
// number and the table can drift apart silently (the Rust schema tests assert
// the *code*, not the prose), so this gate cross-checks every such count
// against the row count of the table that follows it.
//
// It is deliberately conservative: a count is only checked when a markdown
// table begins after the rest of the count's own paragraph and at most one
// further prose paragraph (blank lines and `**Methodology:**` lines are passed
// over). Counts with no such table (back-references such as "all eleven
// columns must be present", or a count that merely describes a SUBSET, e.g.
// "five energy columns") are skipped — the `_COUNT_RE` requires the number to
// be immediately followed by "columns"/"fields", and the `must be present`
// back-reference form is explicitly skipped. A count whose number and noun a
// hard wrap splits across two lines is read like the unwrapped form and
// reported at the line its number is on. Fenced code is skipped entirely.
//
// UNLIKE check-doc-voice.mjs / check-doc-version.mjs, this gate does NOT
// consult scripts/doc-lint-allow.txt: a column/field-count claim disagreeing
// with its own adjacent table is a plain factual bug (not a methodology-voice
// or version-annotation judgement call), so it has no grandfather path — it
// must be zero on the committed corpus or the gate genuinely fails.
//
// Exports `checkText(text)` (the pure per-file detector) behind a direct-run
// guard, mirroring check-figures.mjs / check-doc-voice.mjs.
//
// Two further pure detectors cover counts that no adjacent "N columns" line
// introduces, and main() runs each on its own page. `checkVariableCatalogCount`
// reads the `## Variable catalog` section of CATALOG_FILE
// (`reference/generic-constraints.mdx`) and compares every "N LP variable
// types" / "N variables" statement in it with the data rows of the section's
// first table. `checkSchemaCount` compares every "N vendored JSON Schema
// files" / "N schemas" statement on SCHEMA_LIST_FILE
// (`reference/json-schemas.mdx`), and the data rows of its `## Available
// schemas` table, with the number of `*.schema.json` files under
// `public/schemas/` (resolved from this script's location, so the working
// directory does not matter). A missing page, a missing `public/schemas/`, or
// a detector that finds no statement to check exits 2: a gate that reads
// nothing must not pass; the problems collected before that point are printed
// first. A fence still open at the end of any of these pages hides every count
// after its opener, so it is reported as `UNCLOSED-FENCE <page>:<line>` (the
// opener's line) and fails the gate.
//
// Run any time (no build needed — reads source content, not dist/):
//   node scripts/check-doc-counts.mjs   |   npm run check:counts

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(scriptDir, "..", "src", "content", "docs");

// Reference pages that use the "N columns/fields" + adjacent-table
// convention — the novomodelo-docs analogs of novomodelo's `output-format.md` /
// `case-format.md`.
const TARGET_FILES = [
  "reference/output/index.mdx",
  "reference/output/training.mdx",
  "reference/output/simulation.mdx",
  "reference/output/policy.mdx",
  "reference/output/metadata.mdx",
  "reference/output/stochastic.mdx",
  "reference/output/hydro-models.mdx",
  "reference/case-format/index.mdx",
  "reference/case-format/stages.mdx",
  "reference/case-format/system.mdx",
  "reference/case-format/hydros.mdx",
  "reference/case-format/production-models.mdx",
  "reference/case-format/scenarios.mdx",
  "reference/case-format/constraints.mdx",
  "reference/case-format/penalties.mdx",
  "reference/case-format/initial-conditions.mdx",
];

// The two pages whose counts no adjacent "N columns" line introduces, and the
// vendored tree the schema count is checked against.
const CATALOG_FILE = "reference/generic-constraints.mdx";
const SCHEMA_LIST_FILE = "reference/json-schemas.mdx";
const schemaDir = join(scriptDir, "..", "public", "schemas");

// Spelled-out cardinals the corpus uses for small counts.
const WORD_TO_INT = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

// A count token: digits or a spelled cardinal.
const NUMBER = `\\d+|${Object.keys(WORD_TO_INT).join("|")}`;

// A count token, then "columns"/"fields". The negative lookbehind rejects
// "4-column" and mid-word matches.
const COUNT_RE = new RegExp(
  `(?<![\\w-])(${NUMBER})\\s+(?:columns|fields)\\b`,
  "i",
);

function parseCount(token) {
  if (/^\d+$/.test(token)) return parseInt(token, 10);
  return WORD_TO_INT[token.toLowerCase()] ?? null;
}

function isTableSeparator(line) {
  const s = line.trim();
  if (!s.startsWith("|")) return false;
  if (!/^[|:\- ]+$/.test(s)) return false;
  return s.includes("-");
}

// A table starts at `lines[i]`: a `|` line over a `|---|` separator. A caller
// that tracks fences passes its per-line `fenced` flags to skip fenced lines.
const startsTable = (lines, i, fenced = []) =>
  !fenced[i] &&
  isTableSeparator(lines[i + 1] ?? "") &&
  lines[i].trimStart().startsWith("|");

// Count data rows of the table whose header is at `headerIdx`. `headerIdx +
// 1` is its `|---|` separator; data rows are the contiguous `|`-prefixed
// lines after it.
function countTableRows(lines, headerIdx) {
  let rows = 0;
  for (let i = headerIdx + 2; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith("|")) {
      rows += 1;
    } else {
      break;
    }
  }
  return rows;
}

// A heading, a fence delimiter, a thematic break or a `|` line is never part
// of a prose paragraph.
const NOT_PROSE = /^(#{1,6}\s|```|~~~|---|\|)/;

// Return the data-row count of the table the count line (`start`) introduces,
// or null if none does. The rest of the count's own paragraph may follow the
// count, and one further prose paragraph may sit between that paragraph and
// the table; blank lines and `**Methodology:**` lines are passed over. A
// heading, a fence, a thematic break or a second prose paragraph ends the
// search — this is what distinguishes a table-intro count ("... 27 columns."
// above the schema table) from a prose mention that happens to precede an
// unrelated table further down.
function tableRowsAfter(lines, start, mayCrossParagraph = true) {
  let idx = start + 1;
  while (
    idx < lines.length &&
    lines[idx].trim() !== "" &&
    !NOT_PROSE.test(lines[idx].trimStart())
  )
    idx += 1;
  while (
    idx < lines.length &&
    (lines[idx].trim() === "" ||
      /^\*\*Methodology:\*\*/.test(lines[idx].trim()))
  )
    idx += 1;
  if (startsTable(lines, idx)) {
    return countTableRows(lines, idx);
  }
  return mayCrossParagraph ? tableRowsAfter(lines, idx - 1, false) : null;
}

/**
 * Pure per-file detector (exported for the node:test fixture). Returns a
 * list of drift messages for one file's text (empty = clean).
 *
 * @param {string} text file contents
 * @param {string} label a display name for the file, used in messages
 * @returns {string[]}
 */
export function checkText(text, label = "<text>") {
  const problems = [];
  const lines = text.split("\n");
  const fenced = fencedLines(lines);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fenced[i]) continue;

    // A hard wrap can split a count from its noun ("has 5" / "columns"): a
    // prose line with no count of its own is read with the next line appended,
    // and the count must start on this line.
    const statement =
      !COUNT_RE.test(line) && !NOT_PROSE.test(line.trimStart())
        ? `${line} ${lines[i + 1] ?? ""}`
        : line;

    // Back-reference forms ("all N columns must be present") point at a
    // table ABOVE, not below — skip them.
    if (statement.toLowerCase().includes("must be present")) continue;

    const match = COUNT_RE.exec(statement);
    if (match === null || match.index >= line.length) continue;
    const stated = parseCount(match[1]);
    if (stated === null) continue;

    const rows = tableRowsAfter(lines, i);
    if (rows === null) continue;

    if (stated !== rows) {
      problems.push(
        `${label}:${i + 1}: states ${JSON.stringify(match[0])} but the adjacent table has ${rows} data rows`,
      );
    }
  }
  return problems;
}

// A count token followed by the noun phrase each detector reads; `g` so one
// line can hold several statements.
const VARIABLE_COUNT_RE = new RegExp(
  `(?<![\\w-])(${NUMBER})\\s+(?:LP\\s+)?variable(?:s|\\s+types)\\b`,
  "gi",
);
const SCHEMA_COUNT_RE = new RegExp(
  `(?<![\\w-])(${NUMBER})\\s+(?:vendored\\s+)?(?:JSON\\s+Schema\\s+files|schemas)\\b`,
  "gi",
);

// `fenced` holds per-line flags: true for a fence delimiter and every line
// inside a fence. A closing fence repeats the opening character at least as
// many times. `unclosedLine` is the 1-based opening line of a fence still open
// at the end, else null.
function scanFences(lines) {
  let open = null;
  let openLine = 0;
  const fenced = lines.map((line, i) => {
    const fence = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (open === null) {
      if (fence === null) return false;
      open = fence[1];
      openLine = i + 1;
      return true;
    }
    if (
      fence !== null &&
      fence[2].trim() === "" &&
      fence[1][0] === open[0] &&
      fence[1].length >= open.length
    ) {
      open = null;
    }
    return true;
  });
  return { fenced, unclosedLine: open === null ? null : openLine };
}

const fencedLines = (lines) => scanFences(lines).fenced;

// 1-based line of the opener of a fence still open at the end of the text, else
// null. Such a fence hides every count and table after it from the detectors.
export const unclosedFenceLine = (text) =>
  scanFences(text.split("\n")).unclosedLine;

/**
 * Compare every variable-count statement in the `## Variable catalog`
 * section (up to the next `#`/`##` heading) with the data rows of the
 * section's first table.
 *
 * @param {string} text file contents
 * @param {string} label a display name for the file, used in messages
 * @returns {{statements: number, catalogRows: number | null, problems: string[]}}
 */
export function checkVariableCatalogCount(text, label = "<text>") {
  const lines = text.split("\n");
  const fenced = fencedLines(lines);
  const heading = lines.findIndex(
    (line, i) => !fenced[i] && /^##\s+Variable catalog\s*$/.test(line),
  );
  if (heading === -1) {
    return {
      statements: 0,
      catalogRows: null,
      problems: [`${label}: no "## Variable catalog" section`],
    };
  }
  let end = lines.findIndex(
    (line, i) => i > heading && !fenced[i] && /^#{1,2}\s/.test(line),
  );
  if (end === -1) end = lines.length;

  let catalogRows = null;
  for (let i = heading + 1; i < end; i++) {
    if (startsTable(lines, i, fenced)) {
      catalogRows = countTableRows(lines, i);
      break;
    }
  }

  const problems = [];
  if (catalogRows === null) {
    problems.push(
      `${label}:${heading + 1}: "## Variable catalog" has no table`,
    );
  }
  let statements = 0;
  for (let i = heading + 1; i < end; i++) {
    if (fenced[i]) continue;
    for (const match of lines[i].matchAll(VARIABLE_COUNT_RE)) {
      statements += 1;
      if (catalogRows !== null && parseCount(match[1]) !== catalogRows) {
        problems.push(
          `${label}:${i + 1}: states ${JSON.stringify(match[0])} but the catalog table has ${catalogRows} data rows`,
        );
      }
    }
  }
  return { statements, catalogRows, problems };
}

/**
 * Compare every schema-count statement in the file (frontmatter included)
 * and the data rows of the first table under `## Available schemas` with
 * `vendoredCount`, the number of `*.schema.json` files under `public/schemas`.
 *
 * @param {string} text file contents
 * @param {string} label a display name for the file, used in messages
 * @param {number} vendoredCount number of vendored schema files
 * @returns {{statements: number, tableRows: number | null, problems: string[]}}
 */
export function checkSchemaCount(text, label, vendoredCount) {
  const lines = text.split("\n");
  const fenced = fencedLines(lines);
  const problems = [];
  let statements = 0;
  for (let i = 0; i < lines.length; i++) {
    if (fenced[i]) continue;
    for (const match of lines[i].matchAll(SCHEMA_COUNT_RE)) {
      statements += 1;
      if (parseCount(match[1]) !== vendoredCount) {
        problems.push(
          `${label}:${i + 1}: states ${JSON.stringify(match[0])} but public/schemas holds ${vendoredCount} vendored schema files`,
        );
      }
    }
  }

  const heading = lines.findIndex(
    (line, i) => !fenced[i] && /^##\s+Available schemas\s*$/.test(line),
  );
  if (heading === -1) {
    problems.push(`${label}: no "## Available schemas" section`);
    return { statements, tableRows: null, problems };
  }
  let end = lines.findIndex(
    (line, i) => i > heading && !fenced[i] && /^#{1,6}\s/.test(line),
  );
  if (end === -1) end = lines.length;

  let tableRows = null;
  for (let i = heading + 1; i < end; i++) {
    if (startsTable(lines, i, fenced)) {
      tableRows = countTableRows(lines, i);
      break;
    }
  }
  if (tableRows === null) {
    problems.push(
      `${label}:${heading + 1}: "## Available schemas" has no table`,
    );
  } else if (tableRows !== vendoredCount) {
    problems.push(
      `${label}:${heading + 1}: the "## Available schemas" table has ${tableRows} data rows but public/schemas holds ${vendoredCount} vendored schema files`,
    );
  }
  return { statements, tableRows, problems };
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly). Kept behind a direct-run guard so
// importing this module for checkText (the node:test fixture) does NOT
// trigger the filesystem reads or process.exit.
// ---------------------------------------------------------------------------
function main() {
  const problems = [];
  const texts = {};

  for (const rel of [...TARGET_FILES, CATALOG_FILE, SCHEMA_LIST_FILE]) {
    const path = join(contentRoot, rel);
    if (!existsSync(path)) {
      console.error(`check:counts: target file not found: ${path}`);
      process.exit(2);
    }
    try {
      texts[rel] = readFileSync(path, "utf8");
    } catch (error) {
      console.error(`check:counts: could not read ${rel}: ${error.message}`);
      process.exit(2);
    }
  }
  for (const rel of Object.keys(texts)) {
    const openFence = unclosedFenceLine(texts[rel]);
    if (openFence !== null) problems.push(`UNCLOSED-FENCE ${rel}:${openFence}`);
  }
  for (const rel of TARGET_FILES) problems.push(...checkText(texts[rel], rel));

  const printProblems = () => {
    console.log(
      "FAIL: doc count drift (a pinned column/field count disagrees with its adjacent table). Fix the number or the table:",
    );
    for (const p of problems) console.log(`  ${p}`);
  };

  let vendored;
  try {
    vendored = readdirSync(schemaDir).filter((f) =>
      f.endsWith(".schema.json"),
    ).length;
  } catch (error) {
    if (problems.length > 0) printProblems();
    console.error(
      `check:counts: could not read ${schemaDir}: ${error.message}`,
    );
    process.exit(2);
  }
  const catalog = checkVariableCatalogCount(texts[CATALOG_FILE], CATALOG_FILE);
  const schemas = checkSchemaCount(
    texts[SCHEMA_LIST_FILE],
    SCHEMA_LIST_FILE,
    vendored,
  );
  for (const [rel, result] of [
    [CATALOG_FILE, catalog],
    [SCHEMA_LIST_FILE, schemas],
  ]) {
    if (result.statements === 0) {
      if (problems.length > 0) printProblems();
      console.error(
        `check:counts: no count statement found in ${rel}; the gate would check nothing`,
      );
      for (const p of result.problems) console.error(`  ${p}`);
      process.exit(2);
    }
  }
  problems.push(...catalog.problems, ...schemas.problems);

  if (problems.length > 0) {
    printProblems();
    process.exit(1);
  }

  console.log(
    `OK: column/field counts in ${TARGET_FILES.length} doc files match their adjacent tables; ${CATALOG_FILE} states ${catalog.catalogRows} LP variables (${catalog.catalogRows} catalog rows); ${SCHEMA_LIST_FILE} states ${vendored} vendored schemas (${schemas.tableRows} table rows, ${vendored} files in public/schemas).`,
  );
  process.exit(0);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
