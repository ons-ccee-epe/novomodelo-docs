// Unit tests for the check:glossary gate (E13 ticket-218, GRD-07).
//
// Pins detectGlossaryViolations(text): one seeded violation per rule id, the
// regions that are blanked before matching, the index rule (missing row, extra
// entry, wrong section, order, sort key, slug), the allowlist ratchet on
// detector output, and the CLI exit codes on a temporary copy of the script.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkGlossary,
  detectGlossaryViolations,
  GLOSSARY_RULE_IDS,
} from "./check-glossary.mjs";

const SCRIPT = fileURLToPath(new URL("./check-glossary.mjs", import.meta.url));
const ALLOWLIST_LIB = fileURLToPath(
  new URL("./doc-lint-allowlist.mjs", import.meta.url),
);

const CLEAN = [
  "---", // 1
  "title: Glossary", // 2
  "---", // 3
  "", // 4
  "Terminology used across this site.", // 5
  "", // 6
  "## Index", // 7
  "", // 8
  "**A** — [Alpha](#first-section) · [Apple](#second-section)", // 9
  "", // 10
  "**B** — [Beta](#first-section)", // 11
  "", // 12
  "---", // 13
  "", // 14
  "## First Section", // 15
  "", // 16
  "| English | Portuguese | Definition |", // 17
  "| ------- | ---------- | ---------- |", // 18
  "| Alpha   | Alfa       | The first term. |", // 19
  "| Beta    | -          | The second term. |", // 20
  "", // 21
  "## Second Section", // 22
  "", // 23
  "| Term  | Portuguese | Definition |", // 24
  "| ----- | ---------- | ---------- |", // 25
  "| Apple | Maçã       | A fruit. |", // 26
].join("\n");

const LEAD = "Terminology used across this site.";
const ALPHA_ROW = "| Alpha   |";
const BETA_ROW = "| Beta    |";

// Replace one anchor exactly once; a drifted anchor fails the test instead of
// turning it into a silent no-op.
function edit(text, anchor, replacement) {
  assert.equal(text.split(anchor).length - 1, 1, JSON.stringify(anchor));
  return text.replace(anchor, () => replacement);
}
const lead = (line) => edit(CLEAN, LEAD, line);
const lineOf = (text, needle) =>
  text.split("\n").findIndex((line) => line.includes(needle)) + 1;
const hits = (text) =>
  detectGlossaryViolations(text).map((v) => [v.lineno, v.rule]);
const snippets = (text) => detectGlossaryViolations(text).map((v) => v.snippet);

// One table per section, the index generated from `order` (default: the terms
// sorted by the caller).
function page(terms, order = terms) {
  return [
    "## Index",
    "",
    order.map((term) => `[${term}](#terms)`).join(" · "),
    "",
    "## Terms",
    "",
    "| Term | Definition |",
    "| ---- | ---------- |",
    ...terms.map((term) => `| ${term} | x |`),
  ].join("\n");
}

const SEEDED = edit(CLEAN, ALPHA_ROW, "| Alpha `buses.json` |");

// ---- clean page ---------------------------------------------------------------

test("a page with an index and tables that agree has no hit", () => {
  assert.deepEqual(detectGlossaryViolations(CLEAN), []);
});

test("GLOSSARY_RULE_IDS lists the four rule ids", () => {
  assert.deepEqual([...GLOSSARY_RULE_IDS].sort(), [
    "glossary-config-key",
    "glossary-file",
    "glossary-index",
    "glossary-path",
  ]);
});

// ---- token rules ----------------------------------------------------------------

test("flags a backticked file name (glossary-file)", () => {
  const text = lead("The input is `buses.json` here.");
  assert.deepEqual(hits(text), [[5, "glossary-file"]]);
  assert.deepEqual(snippets(text), ["`buses.json`"]);
});

test("flags every listed file extension as glossary-file", () => {
  for (const name of ["a.json", "b.parquet", "c.csv", "d.bin", "e.fbs"]) {
    assert.deepEqual(hits(lead(`See \`${name}\` here.`)), [
      [5, "glossary-file"],
    ]);
  }
});

test("flags a backticked path (glossary-path)", () => {
  const text = lead("Written to `simulation/transit_seed/` by a run.");
  assert.deepEqual(hits(text), [[5, "glossary-path"]]);
  assert.deepEqual(snippets(text), ["`simulation/transit_seed/`"]);
});

test("flags any other backticked span as a config key (glossary-config-key)", () => {
  for (const span of [
    "lead_stages",
    'selection = "dynamic"',
    "{id, stage_id}",
  ]) {
    assert.deepEqual(hits(lead(`Set \`${span}\` to choose.`)), [
      [5, "glossary-config-key"],
    ]);
  }
});

test("a file extension outranks a slash: a backticked path to a file is glossary-file", () => {
  assert.deepEqual(hits(lead("Read `system/buses.json` first.")), [
    [5, "glossary-file"],
  ]);
});

test("a name that only starts like a listed extension is a config key", () => {
  for (const name of ["a.jsonl", "b.json5", "c.binx"]) {
    assert.deepEqual(hits(lead(`See \`${name}\` here.`)), [
      [5, "glossary-config-key"],
    ]);
  }
});

test("flags a bare file name in prose (glossary-file)", () => {
  const text = lead("The buses are read from stages.json at load.");
  assert.deepEqual(hits(text), [[5, "glossary-file"]]);
  assert.deepEqual(snippets(text), ["stages.json"]);
});

test("flags a bare file name inside a table row at the row's line", () => {
  const text = edit(CLEAN, "The first term.", "The first term, see x.parquet.");
  assert.deepEqual(hits(text), [[19, "glossary-file"]]);
});

test("a word that merely contains an extension is prose", () => {
  assert.deepEqual(
    hits(lead("The stagesjson anchor, a json file, and a binary cut.")),
    [],
  );
});

test("a double-backtick span is one hit", () => {
  const text = lead("A ``a`b`` span.");
  assert.deepEqual(hits(text), [[5, "glossary-config-key"]]);
  assert.deepEqual(snippets(text), ["``a`b``"]);
});

test("a span wrapped across lines is one hit at its first line, whitespace collapsed", () => {
  const text = lead("A span `lead_stages\nis_wrapped` ends.");
  assert.deepEqual(hits(text), [[5, "glossary-config-key"]]);
  assert.deepEqual(snippets(text), ["`lead_stages is_wrapped`"]);
});

test("a stray backtick that no span closes in its paragraph is prose", () => {
  assert.deepEqual(
    hits(lead("An open `tick here.\n\nAnd a close` there.")),
    [],
  );
});

// ---- blanking: regions that never fire ---------------------------------------

test("a link target with .json and an anchor such as #stagesjson are not flagged", () => {
  const text = lead(
    "See [Stage Files](/reference/case-format/stages/#post_study_stagesjson), [Stages](#stagesjson) and [Buses](/data/buses.json).",
  );
  assert.deepEqual(hits(text), []);
});

test("the text of a link is still prose", () => {
  assert.deepEqual(hits(lead("See [buses.json](/reference/x) first.")), [
    [5, "glossary-file"],
  ]);
});

test("inline and display math are blanked, also when the display block spans lines", () => {
  const text = lead(
    "Holds $a.json$ and $`k`$ and\n\n$$\n`x`\nb.csv\n$$\n\nafter.",
  );
  assert.deepEqual(hits(text), []);
});

test("an unpaired dollar sign does not swallow the next line", () => {
  const text = edit(
    edit(CLEAN, "The first term.", "The first term costs $5."),
    "The second term.",
    "The second term uses `lead_stages` for $6.",
  );
  assert.deepEqual(hits(text), [[20, "glossary-config-key"]]);
});

test("HTML and MDX comments are blanked, also when multi-line", () => {
  const text = lead(
    "<!-- `lead_stages`\nx.json -->\n\n{/* `a/b`\n   c.csv */}\n\nText.",
  );
  assert.deepEqual(hits(text), []);
});

test("fenced code is blanked for ``` and ~~~ and a nested longer fence", () => {
  const text = lead(
    [
      "```json",
      '{ "a": `x.json` }',
      "```",
      "",
      "~~~",
      "foo.parquet",
      "~~~",
      "",
      "````md",
      "```",
      "`x`",
      "```",
      "`y`",
      "````",
    ].join("\n"),
  );
  assert.deepEqual(hits(text), []);
});

test("line numbers survive blanking", () => {
  const text = lead(
    "<!-- a\nb -->\n\n```\nfenced\n```\n\n$$\nm\n$$\n\nSet `lead_stages`.",
  );
  assert.deepEqual(hits(text), [
    [lineOf(text, "Set `lead_stages`"), "glossary-config-key"],
  ]);
  assert.equal(lineOf(text, "Set `lead_stages`"), 16);
});

test("a span that holds a dollar sign is a span, not the start of math", () => {
  const text = lead("Set `$HOME/x` and `lead_stages`, costs $5.");
  assert.deepEqual(hits(text), [
    [5, "glossary-path"],
    [5, "glossary-config-key"],
  ]);
});

test("a span that holds a comment marker is a span, not the start of a comment", () => {
  const text = lead("A `<!--` marker, `lead_stages`, and a `-->` end.");
  assert.deepEqual(hits(text), [
    [5, "glossary-config-key"],
    [5, "glossary-config-key"],
    [5, "glossary-config-key"],
  ]);
});

test("a page that ends inside a code fence throws", () => {
  assert.throws(
    () => detectGlossaryViolations(`${CLEAN}\n\n\`\`\`\nunclosed\n`),
    /unclosed code fence/,
  );
});

test("CRLF line endings give the same hits as LF", () => {
  const crlf = (text) => text.replaceAll("\n", "\r\n");
  assert.deepEqual(hits(crlf(CLEAN)), []);
  assert.deepEqual(hits(crlf(SEEDED)), hits(SEEDED));
});

// ---- index rule --------------------------------------------------------------

test("a renamed row with a token is reported by its token rule and by the index rule at both lines", () => {
  assert.deepEqual(hits(SEEDED), [
    [9, "glossary-index"],
    [19, "glossary-file"],
    [19, "glossary-index"],
  ]);
});

test("a table row missing from the index is reported at the row", () => {
  const text = edit(CLEAN, " · [Apple](#second-section)", "");
  assert.deepEqual(hits(text), [[26, "glossary-index"]]);
  assert.match(
    snippets(text)[0],
    /"Apple" has no Index entry linking #second-section/,
  );
});

test("an index entry with no row is reported at the entry", () => {
  const text = edit(
    CLEAN,
    "[Beta](#first-section)",
    "[Beta](#first-section) · [Zed](#first-section)",
  );
  assert.deepEqual(hits(text), [[11, "glossary-index"]]);
  assert.match(
    snippets(text)[0],
    /Index entry "Zed" \(#first-section\) has no row/,
  );
});

test("an index entry that names the wrong section is reported with its row", () => {
  const text = edit(CLEAN, "[Beta](#first-section)", "[Beta](#second-section)");
  assert.deepEqual(hits(text), [
    [11, "glossary-index"],
    [20, "glossary-index"],
  ]);
});

test("a duplicate index entry is an entry with no row", () => {
  const text = edit(
    CLEAN,
    "[Alpha](#first-section)",
    "[Alpha](#first-section) · [Alpha](#first-section)",
  );
  assert.deepEqual(hits(text), [[9, "glossary-index"]]);
});

test("a duplicate row with one entry leaves the second row missing", () => {
  const text = edit(CLEAN, BETA_ROW, "| Alpha   | Alfa | again |\n| Beta    |");
  assert.deepEqual(hits(text), [[20, "glossary-index"]]);
});

test("an index out of order is reported at the entry that sorts before its predecessor", () => {
  const text = edit(
    CLEAN,
    "[Alpha](#first-section) · [Apple](#second-section)",
    "[Apple](#second-section) · [Alpha](#first-section)",
  );
  assert.deepEqual(hits(text), [[9, "glossary-index"]]);
  assert.match(snippets(text)[0], /"Alpha" sorts before "Apple"/);
});

test("the sort key is case-insensitive", () => {
  assert.deepEqual(
    detectGlossaryViolations(page(["Anticipated dispatch", "AR lag"])),
    [],
  );
});

test("the sort key drops inline math", () => {
  assert.deepEqual(detectGlossaryViolations(page(["A ($z$)", "Ab"])), []);
});

test("the sort key drops punctuation and keeps digits", () => {
  assert.deepEqual(
    detectGlossaryViolations(
      page(["Outer approximation", "Out-of-sample sampling"]),
    ),
    [],
  );
  assert.deepEqual(
    detectGlossaryViolations(page(["0-order inflow", "Anticipated dispatch"])),
    [],
  );
  assert.deepEqual(
    hits(
      page(
        ["Anticipated dispatch", "0-order inflow"],
        ["Anticipated dispatch", "0-order inflow"],
      ),
    ),
    [[3, "glossary-index"]],
  );
});

test("an entry reproduces the first cell verbatim, math included", () => {
  assert.deepEqual(detectGlossaryViolations(page(["Lead ($K_i$)"])), []);
  const text = page(["Lead ($K_i$)"], ["Lead"]);
  assert.deepEqual(hits(text), [
    [3, "glossary-index"],
    [9, "glossary-index"],
  ]);
});

test("an index link that is not an in-page anchor is not an entry", () => {
  const text = edit(
    CLEAN,
    "[Apple](#second-section)",
    "[Apple](second-section)",
  );
  assert.deepEqual(hits(text), [[26, "glossary-index"]]);
});

test("the section slug follows the heading: hyphens kept, spaces joined", () => {
  const text = [
    "## Index",
    "",
    "[Alpha](#brazilian-power-system-ecosystem) · [Beta](#solver-and-lp)",
    "",
    "## Brazilian Power-System Ecosystem",
    "",
    "| Term | Definition |",
    "| --- | --- |",
    "| Alpha | x |",
    "",
    "## Solver and LP",
    "",
    "| English | Definition |",
    "| --- | --- |",
    "| Beta | x |",
  ].join("\n");
  assert.deepEqual(detectGlossaryViolations(text), []);
});

test("a header row with any name and an aligned separator is not a term row", () => {
  const text = `${CLEAN}\n\n## Third Section\n\n| Concept | Note |\n| :---: | ---: |\n`;
  assert.deepEqual(hits(text), []);
});

test("a table before the first section heading is not indexed", () => {
  const text = `| Term | Definition |\n| ---- | ---------- |\n| Yak | x |\n\n${CLEAN}`;
  assert.deepEqual(hits(text), []);
});

test("the equivalent-terms tables are exempt from the index but not from the token rules", () => {
  const exempt = `${CLEAN}\n\n## Equivalent terms in other planning tools\n\n| Novomodelo concept | Term elsewhere | Note |\n| --- | --- | --- |\n| Zulu | Zulu | A note. |\n`;
  assert.deepEqual(hits(exempt), []);
  const tokens = edit(
    exempt,
    "| Zulu | Zulu | A note. |",
    "| Zulu | `x.json` | A note. |",
  );
  assert.deepEqual(hits(tokens), [
    [lineOf(tokens, "`x.json`"), "glossary-file"],
  ]);
});

test("a page without an index reports every row", () => {
  const noIndex = CLEAN.split("\n")
    .filter((_, i) => i < 6 || i > 12)
    .join("\n");
  assert.deepEqual(
    hits(noIndex).map(([, rule]) => rule),
    ["glossary-index", "glossary-index", "glossary-index"],
  );
});

test("hits come out ordered by line", () => {
  const text = edit(
    lead("Set `lead_stages`."),
    " · [Apple](#second-section)",
    "",
  );
  assert.deepEqual(hits(text), [
    [5, "glossary-config-key"],
    [26, "glossary-index"],
  ]);
});

test("text between two comments, two inline maths or two display maths stays prose", () => {
  assert.deepEqual(
    hits(lead("<!-- a -->\n\nSet `lead_stages`.\n\n<!-- b -->")),
    [[7, "glossary-config-key"]],
  );
  assert.deepEqual(hits(lead("Set $a$ then `lead_stages` then $b$.")), [
    [5, "glossary-config-key"],
  ]);
  assert.deepEqual(hits(lead("$$a$$ then `lead_stages` then $$b$$.")), [
    [5, "glossary-config-key"],
  ]);
});

test("an unclosed $$ does not pair with a later single dollar sign", () => {
  assert.deepEqual(hits(lead("A $$ then `lead_stages` and $ end.")), [
    [5, "glossary-config-key"],
  ]);
});

test("two spans on one line are two hits", () => {
  assert.deepEqual(hits(lead("Set `lead_stages` and `lead_time_hours`.")), [
    [5, "glossary-config-key"],
    [5, "glossary-config-key"],
  ]);
});

test("a bare file name in parentheses is still prose", () => {
  assert.deepEqual(hits(lead("The input (stages.json) is read.")), [
    [5, "glossary-file"],
  ]);
});

test("comments hide table rows and index entries and keep the lines of what follows", () => {
  const hidden = edit(
    CLEAN,
    "| Apple | Maçã       | A fruit. |",
    "<!--\n| Ghost | x |\n[Ghost](#second-section)\n-->\n| Apple | Maçã       | A fruit. |",
  );
  assert.deepEqual(hits(hidden), []);
  const shifted = edit(hidden, " · [Apple](#second-section)", "");
  assert.deepEqual(hits(shifted), [
    [lineOf(shifted, "| Apple |"), "glossary-index"],
  ]);
  assert.equal(lineOf(shifted, "| Apple |"), 30);
  const inIndex = edit(
    CLEAN,
    "**B** — [Beta](#first-section)",
    "{/* [Ghost](#first-section) */}\n**B** — [Beta](#first-section)",
  );
  assert.deepEqual(hits(inIndex), []);
});

test("a table row directly followed by a horizontal rule is still a row", () => {
  const text = edit(
    CLEAN,
    "| Apple | Maçã       | A fruit. |",
    "| Apple | Maçã       | A fruit. |\n---",
  );
  assert.deepEqual(hits(text), []);
});

test("a subheading does not change the section its rows belong to", () => {
  const text = edit(
    CLEAN,
    "## Second Section\n",
    "## Second Section\n\n### Subsection\n",
  );
  assert.deepEqual(hits(text), []);
});

test("a heading with trailing spaces names the same section", () => {
  assert.deepEqual(
    hits(edit(CLEAN, "## First Section", "## First Section  ")),
    [],
  );
});

test("punctuation in a heading is dropped from its slug; underscores and digits stay", () => {
  const text = [
    "## Index",
    "",
    "[Alpha](#cost_scaling-notes-2)",
    "",
    "## Cost_scaling (Notes) 2",
    "",
    "| Term | Definition |",
    "| --- | --- |",
    "| Alpha | x |",
  ].join("\n");
  assert.deepEqual(detectGlossaryViolations(text), []);
});

// github-slugger 2.0.0: lowercase, drop every character that is not a letter,
// digit, underscore, space or hyphen, then map each space to a hyphen. Runs of
// spaces and hyphens are kept, so a dropped "/" between two spaces leaves "--".
const SLUGGER_2_0_0 = [
  ["Hydro / Thermal", "hydro--thermal"],
  ["Cut (Benders)", "cut-benders"],
  ["State-space", "state-space"],
  ["Cut_off (x)", "cut_off-x"],
  ["A  B", "a--b"],
  ["A - B", "a---b"],
  ["Cost: Notes, 2", "cost-notes-2"],
  ["A\tB", "ab"],
];

const sectionPage = (heading, anchor) =>
  [
    "## Index",
    "",
    `[Alpha](#${anchor})`,
    "",
    `## ${heading}`,
    "",
    "| Term | Definition |",
    "| --- | --- |",
    "| Alpha | x |",
  ].join("\n");

test("the section slug is github-slugger 2.0.0's, runs of spaces and hyphens kept", () => {
  for (const [heading, slug] of SLUGGER_2_0_0) {
    assert.deepEqual(
      detectGlossaryViolations(sectionPage(heading, slug)),
      [],
      heading,
    );
    assert.ok(
      snippets(sectionPage(heading, "other")).includes(
        `"Alpha" has no Index entry linking #${slug}`,
      ),
      heading,
    );
  }
});

test("an index entry that collapses a run the heading keeps does not match", () => {
  const text = sectionPage("Hydro / Thermal", "hydro-thermal");
  assert.deepEqual(hits(text), [
    [3, "glossary-index"],
    [9, "glossary-index"],
  ]);
});

test("a line that starts with a backtick or two is not a fence", () => {
  assert.deepEqual(hits(lead("`tick at the start of a line, no close.")), []);
  assert.deepEqual(hits(lead("``\nText.")), []);
});

test("a fence closes only on its own fence character", () => {
  assert.deepEqual(hits(lead("```\n~~~\n`x`\n```\n`y`")), [
    [9, "glossary-config-key"],
  ]);
});

test("the info string of a fence is blanked with the fence", () => {
  assert.deepEqual(hits(lead('```json title="buses.json"\nbody\n```')), []);
});

test("text between two MDX comments stays prose", () => {
  assert.deepEqual(hits(lead("{/* a */}\n\nSet `lead_stages`.\n\n{/* b */}")), [
    [7, "glossary-config-key"],
  ]);
});

test("a backtick run of another length does not close a span", () => {
  assert.deepEqual(hits(lead("Set `a``b` here.")), [
    [5, "glossary-config-key"],
  ]);
  assert.deepEqual(snippets(lead("Set `a``b` here.")), ["`a``b`"]);
  assert.deepEqual(hits(lead("Set `a`` here.")), []);
});

test("a link target stops at the end of its line", () => {
  assert.deepEqual(hits(lead("A stray ](x\nset `lead_stages` here).")), [
    [6, "glossary-config-key"],
  ]);
});

test("a blanked region separates words instead of joining them", () => {
  assert.deepEqual(hits(lead("Set a`b`.json here.")), [
    [5, "glossary-config-key"],
  ]);
});

test("an empty table row is a row without an index entry", () => {
  const text = edit(
    CLEAN,
    "| Apple | Maçã       | A fruit. |",
    "| Apple | Maçã       | A fruit. |\n|  |  |  |",
  );
  assert.deepEqual(hits(text), [[27, "glossary-index"]]);
});

test("an indented table is read like any other", () => {
  const text = `${CLEAN}\n\n## Third Section\n\n  | Term | Definition |\n  | --- | --- |\n  | Gamma | x |\n`;
  assert.deepEqual(hits(text), [[lineOf(text, "Gamma"), "glossary-index"]]);
  assert.match(
    snippets(text)[0],
    /^"Gamma" has no Index entry linking #third-section/,
  );
});

test("an out-of-order entry on a later line is reported at its own line", () => {
  const text = edit(
    edit(
      CLEAN,
      "**A** — [Alpha](#first-section) · [Apple](#second-section)",
      "**B** — [Beta](#first-section)",
    ),
    "\n**B** — [Beta](#first-section)\n\n---",
    "\n**A** — [Alpha](#first-section) · [Apple](#second-section)\n\n---",
  );
  assert.deepEqual(hits(text), [[11, "glossary-index"]]);
});

test("the sort key drops spaces and reads inline maths one by one", () => {
  assert.deepEqual(detectGlossaryViolations(page(["Cutoff", "Cut pool"])), []);
  assert.deepEqual(
    detectGlossaryViolations(page(["Pairing", "Pair ($a$) of ($b$)"])),
    [],
  );
});

// ---- allowlist ratchet on checkGlossary -----------------------------------------

const allow = (...entries) => {
  const map = new Map();
  entries.forEach(([key, ruleId], i) => {
    map.set(key, [...(map.get(key) ?? []), { ruleId, fileLine: i + 1 }]);
  });
  return map;
};
const lines = (violations) => violations.map((v) => [v.lineno, v.rule]);

test("an allowlist entry grandfathers only the rule it names", () => {
  const { failing, grandfathered, stale } = checkGlossary(
    SEEDED,
    allow(["reference/glossary.md:19", "glossary-file"]),
  );
  assert.deepEqual(lines(grandfathered), [[19, "glossary-file"]]);
  assert.deepEqual(lines(failing), [
    [9, "glossary-index"],
    [19, "glossary-index"],
  ]);
  assert.deepEqual(stale, []);
});

test("entries for every hit of the page clear it", () => {
  const { failing, grandfathered, stale } = checkGlossary(
    SEEDED,
    allow(
      ["reference/glossary.md:9", "glossary-index"],
      ["reference/glossary.md:19", "glossary-file"],
      ["reference/glossary.md:19", "glossary-index"],
    ),
  );
  assert.deepEqual(failing, []);
  assert.equal(grandfathered.length, 3);
  assert.deepEqual(stale, []);
});

test("an entry whose rule has no hit at its line is stale and grandfathers nothing", () => {
  const { failing, grandfathered, stale } = checkGlossary(
    SEEDED,
    allow(["reference/glossary.md:19", "glossary-path"]),
  );
  assert.equal(failing.length, 3);
  assert.deepEqual(grandfathered, []);
  assert.deepEqual(stale, [
    { key: "reference/glossary.md:19", ruleId: "glossary-path", fileLine: 1 },
  ]);
});

test("an entry on a clean page is stale", () => {
  const { failing, stale } = checkGlossary(
    CLEAN,
    allow(["reference/glossary.md:40", "glossary-file"]),
  );
  assert.deepEqual(failing, []);
  assert.deepEqual(stale, [
    { key: "reference/glossary.md:40", ruleId: "glossary-file", fileLine: 1 },
  ]);
});

test("the allowlist key is the page's relative path", () => {
  const { failing, stale } = checkGlossary(
    SEEDED,
    allow(["math/glossary.md:19", "glossary-file"]),
  );
  assert.equal(failing.length, 3);
  assert.equal(stale.length, 1);
});

test("this gate owns every glossary- id and no other gate's", () => {
  const { stale } = checkGlossary(
    SEEDED,
    allow(
      ["reference/glossary.md:19", "glossary-unknown"],
      ["reference/glossary.md:19", "narration-no-longer"],
    ),
  );
  assert.deepEqual(
    stale.map((s) => s.ruleId),
    ["glossary-unknown"],
  );
});

// ---- CLI ----------------------------------------------------------------------------

const DEFAULT_GLOSSARY = "src/content/docs/reference/glossary.md";

// Runs a copy of the script in a scratch tree whose own allowlist and default
// glossary are the ones given, so the repo's allowlist never changes a result.
function cli(glossary, { allowlist, args = [], extra = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "check-glossary-"));
  const files = {
    "scripts/check-glossary.mjs": readFileSync(SCRIPT),
    "scripts/doc-lint-allowlist.mjs": readFileSync(ALLOWLIST_LIB),
    [DEFAULT_GLOSSARY]: glossary,
    ...(allowlist === undefined
      ? {}
      : { "scripts/doc-lint-allow.txt": allowlist }),
    ...extra,
  };
  const paths = [];
  try {
    for (const [rel, body] of Object.entries(files)) {
      const path = join(root, rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body);
      paths.push(path);
    }
    return spawnSync(
      process.execPath,
      [
        join(root, "scripts/check-glossary.mjs"),
        ...args.map((a) => join(root, a)),
      ],
      { encoding: "utf8" },
    );
  } finally {
    const dirs = new Set();
    for (const path of paths) {
      unlinkSync(path);
      for (let dir = dirname(path); dir !== root; dir = dirname(dir)) {
        dirs.add(dir);
      }
    }
    for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
      rmdirSync(dir);
    }
    rmdirSync(root);
  }
}

test("CLI exits 0 and prints the OK line on a clean default glossary", () => {
  const result = cli(CLEAN);
  assert.equal(result.status, 0);
  assert.equal(
    result.stdout,
    "OK: reference/glossary.md has no software token and a complete A–Z index.\n",
  );
  assert.equal(result.stderr, "");
});

test("CLI exits 1 with one line per hit and a FAIL line on a seeded page", () => {
  const result = cli(SEEDED);
  assert.equal(result.status, 1);
  const out = result.stdout.trimEnd().split("\n");
  assert.deepEqual(out.slice(0, 3), [
    'reference/glossary.md:9: [glossary-index] Index entry "Alpha" (#first-section) has no row in that section',
    "reference/glossary.md:19: [glossary-file] `buses.json`",
    'reference/glossary.md:19: [glossary-index] "Alpha `buses.json`" has no Index entry linking #first-section',
  ]);
  assert.equal(out.length, 4);
  assert.match(
    out[3],
    /^FAIL: 3 glossary violation\(s\), 0 stale allowlist entry\(ies\)\./,
  );
});

test("CLI reads the file named by its first argument, not the default glossary", () => {
  const result = cli(CLEAN, {
    args: ["seeded.md"],
    extra: { "seeded.md": SEEDED },
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[glossary-file\] `buses.json`/);
});

test("CLI grandfathers a hit through scripts/doc-lint-allow.txt and says so", () => {
  const result = cli(SEEDED, {
    allowlist: [
      "reference/glossary.md:9  glossary-index  # reason",
      "reference/glossary.md:19  glossary-file,glossary-index  # reason",
    ].join("\n"),
  });
  assert.equal(result.status, 0);
  assert.equal(
    result.stdout,
    "OK: reference/glossary.md has no software token and a complete A–Z index (3 pre-existing hit(s) grandfathered via scripts/doc-lint-allow.txt).\n",
  );
});

test("CLI fails on a stale glossary- entry and prints the STALE line", () => {
  const result = cli(CLEAN, {
    allowlist: "# header\nreference/glossary.md:40  glossary-file  # reason\n",
  });
  assert.equal(result.status, 1);
  const out = result.stdout.trimEnd().split("\n");
  assert.equal(
    out[0],
    "STALE [glossary-file]: reference/glossary.md:40 — doc-lint-allow.txt:2 matches no glossary hit",
  );
  assert.match(
    out[1],
    /^FAIL: 0 glossary violation\(s\), 1 stale allowlist entry\(ies\)\./,
  );
});

test("CLI exits 2 on a malformed allowlist", () => {
  const result = cli(CLEAN, {
    allowlist: "reference/glossary.md:40 no rationale\n",
  });
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(
    result.stderr,
    /^check:glossary: doc-lint-allow\.txt:1: malformed entry/,
  );
});

test("CLI exits 2 on a missing glossary file", () => {
  const result = cli(CLEAN, { args: ["missing.md"] });
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^check:glossary: ENOENT/);
});

test("CLI exits 2 on a page that ends inside a code fence", () => {
  const result = cli(`${CLEAN}\n\n\`\`\`\nunclosed\n`);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(
    result.stderr,
    /^check:glossary: the page ends inside an unclosed code fence/,
  );
});
