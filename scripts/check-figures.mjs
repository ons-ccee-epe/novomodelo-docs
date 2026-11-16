// Figure-dependency gate: the content must not reference a retired
// matplotlib/Excalidraw figure, and every Observable Plot island must be a thin
// render shell over a tested compute module. The gate needs no dependency beyond
// Node and is bound to CI, so a retired figure path cannot re-enter the content
// unnoticed.
//
// It makes three checks.
//
// 1. Retired figure references. It walks every routed `*.md`/`*.mdx` under
//    `src/content/docs/` (index.mdx and the `pt-br/` twins included, underscore-
//    prefixed partials skipped) and exits non-zero, with a per-file message
//    naming the file + the offending substring + the rule violated, if it finds
//    any of:
//   (a) an image-asset reference: `../../images/` or `/images/`  (a Python/
//       Excalidraw SVG would manifest here),
//   (b) a residual figure-deferral aside: `Figure — retooled in E4`  (the
//       placeholder text that a real figure replaces),
//   (c) a reference to a retired figure stem: the nine matplotlib stems
//       (d02…d24) plus the Excalidraw `system-element-overview`.
//
// 2. Scope assertions, which FAIL the gate when violated:
//   • the three HPC stems (d07/d08/d09) appear in ZERO content files (no HPC
//     figure belongs to the corpus);
//   • a `ConvergencePanelsPlot` embed (the d21 convergence-bounds figure) is
//     present in `math/stopping-rules`.
//
// 3. Plot-island contract: each `src/components/*Plot.astro` must import a
//    `src/figures/<name>.ts` module that has a sibling `<name>.test.ts`, and
//    carry `role="img"` with a non-empty `aria-label`. It also fails when no
//    island is found at all (a vacuous pass).
//
// Run with `npm run check:figures` (or `node scripts/check-figures.mjs`) any
// time (no build needed — it reads source content, not dist/). Exits 0
// with a one-line summary when clean; exits 1 listing each violation, or with a
// clear message if the content root is missing or a file cannot be read.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const contentRoot = fileURLToPath(
  new URL("../src/content/docs/", import.meta.url),
);
const componentsRoot = fileURLToPath(
  new URL("../src/components/", import.meta.url),
);
const figuresRoot = fileURLToPath(new URL("../src/figures/", import.meta.url));

// --- Retired figure stems ---------------------------------------------------
// The exact hyphenated filename stems of the 10 retired assets (9 matplotlib +
// 1 Excalidraw), matched as full stems — NOT bare prefixes like `d02` or
// `system-element`. Matching the full stem avoids false positives against the
// legitimate `/math/system-elements` chapter slug (which appears in many prose
// cross-links) and against math/section tokens that merely start with `d` + digit.
const RETIRED_STEMS = [
  "d02-value-function",
  "d03-scenario-tree",
  "d07-hybrid-parallelism",
  "d08-memory-architecture",
  "d09-forward-pass-distribution",
  "d21-convergence-bounds",
  "d22-risk-measure-cvar",
  "d23-par-stored-vs-computed",
  "d24-lp-column-layout",
  "system-element-overview",
];

// The HPC subset that scope dropped (must appear in ZERO content files).
const HPC_STEMS = [
  "d07-hybrid-parallelism",
  "d08-memory-architecture",
  "d09-forward-pass-distribution",
];

// --- Pure detector (exported for the node:test fixture) ---------------------
// Given the text of a single content file, return an array of { rule, match }
// describing every banned-pattern occurrence. Pure and synchronous so it can be
// unit-tested without touching the filesystem (see check-figures.test.mjs).
export function detectFigureViolations(text) {
  const violations = [];

  // (a) Image-asset references. `../../images/` is the mdBook-era relative path;
  // `/images/` is its root-relative form. Either means a static SVG dependency.
  for (const needle of ["../../images/", "/images/"]) {
    let index = text.indexOf(needle);
    while (index !== -1) {
      // A genuine retired root ref (`](/images/…`, `"/images/…`) is preceded by a
      // markdown delimiter. Skip a bare `/images/` that merely continues a longer
      // path or an external URL (`https://host/images/…`, `/math/images/…`) — there
      // the char before `/images/` is an alphanumeric host/path char, not a ref.
      const prev = index > 0 ? text[index - 1] : "";
      const isPathContinuation = needle === "/images/" && /[A-Za-z0-9]/.test(prev);
      if (!isPathContinuation) {
        violations.push({
          rule: `image-asset reference ('${needle}' — retired Python/Excalidraw SVG path)`,
          match: extractContext(text, index, needle.length),
        });
      }
      index = text.indexOf(needle, index + needle.length);
    }
  }

  // (b) Residual figure-deferral aside (the placeholder text that a real
  // figure replaces). The em-dash (—, U+2014) is part of the marker; match it
  // literally.
  {
    const needle = "Figure — retooled in E4";
    let index = text.indexOf(needle);
    while (index !== -1) {
      violations.push({
        rule: "residual figure-deferral aside ('Figure — retooled in E4' — should have been replaced by 017/018)",
        match: extractContext(text, index, needle.length),
      });
      index = text.indexOf(needle, index + needle.length);
    }
  }

  // (c) Retired figure-stem references.
  for (const stem of RETIRED_STEMS) {
    let index = text.indexOf(stem);
    while (index !== -1) {
      violations.push({
        rule: `retired figure stem ('${stem}')`,
        match: extractContext(text, index, stem.length),
      });
      index = text.indexOf(stem, index + stem.length);
    }
  }

  return violations;
}

// Return the line containing the match at `index`, trimmed, so the error message
// points at the offending substring in context.
function extractContext(text, index, length) {
  const lineStart = text.lastIndexOf("\n", index) + 1;
  let lineEnd = text.indexOf("\n", index + length);
  if (lineEnd === -1) lineEnd = text.length;
  return text.slice(lineStart, lineEnd).trim();
}

// --- File walk --------------------------------------------------------------
// Recursively collect every .md/.mdx under src/content/docs/, the pt-br/ twins
// included (the checks are language-neutral; mirrors check-math-parity.mjs).
// index.mdx is intentionally INCLUDED (it is walked like every other page, not
// special-cased).
//
// Exported so check-figures.test.mjs can pin the underscore-basename exclusion
// below directly; importing this module is safe because main() sits behind a
// direct-run guard at the bottom.
//
// The underscore-basename exclusion is scoped to FILES only (the same rule as
// check-math-parity.mjs): a directory is always recursed into regardless of its
// own name, so a non-underscore file nested inside `math/_impl/` is still
// collected.
export function collectSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(`${full}/`));
      continue;
    }
    // Skip underscore-prefixed FILE basenames (e.g. the math/_impl/_*.mdx
    // interleave partials): Starlight's docsLoader globs `**/[^_]*.{md,mdx}`,
    // so these are NOT routed pages — mirrors check-math-parity.mjs.
    if (entry.name.startsWith("_")) continue;
    if (/\.(md|mdx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// --- Plot-island contract ----------------------------------------------------
// An Observable Plot island is a thin render shell over a tested compute module.
// Given the text of one `*Plot.astro` and a Set of the basenames present in
// `src/figures/`, return { rule, match } for each broken clause: no
// `../figures/<m>` (or `<m>.ts`) import, an imported `<m>.ts` or its sibling
// `<m>.test.ts` absent from `src/figures/`, no `role="img"`, and no `aria-label`
// or one that is blank. The `aria-label` must be a quoted literal: a computed
// value cannot be checked statically. Pure and synchronous like
// detectFigureViolations; a clean island returns [].
const FIGURE_IMPORT = /from\s+["']\.\.\/figures\/([A-Za-z0-9_]+)(?:\.ts)?["']/g;
const ROLE_IMG = /(?<![\w-])role\s*=\s*(["'])img\1/;
const ARIA_LABEL = /(?<![\w-])aria-label\s*=\s*(["'])(.*?)\1/gs;

export function detectPlotIslandViolations(source, figureFiles) {
  const violations = [];

  const imports = [...source.matchAll(FIGURE_IMPORT)];
  if (imports.length === 0) {
    violations.push({
      rule: "no src/figures module import (an island must import a tested ../figures/<name>.ts)",
      match: "(no ../figures/<name> import found)",
    });
  }
  for (const found of imports) {
    const name = found[1];
    const match = extractContext(source, found.index, found[0].length);
    if (!figureFiles.has(`${name}.ts`)) {
      violations.push({
        rule: `imported module absent from src/figures ('${name}.ts')`,
        match,
      });
    }
    if (!figureFiles.has(`${name}.test.ts`)) {
      violations.push({
        rule: `imported module has no sibling test ('${name}.test.ts' absent from src/figures)`,
        match,
      });
    }
  }

  if (!ROLE_IMG.test(source)) {
    violations.push({
      rule: 'no role="img" attribute',
      match: "(attribute not found)",
    });
  }

  const labels = [...source.matchAll(ARIA_LABEL)];
  const blank = labels.find((label) => label[2].trim() === "");
  if (labels.length === 0 || blank) {
    violations.push({
      rule: "no aria-label attribute with a non-empty value",
      match: blank ? blank[0] : "(no literal aria-label found; a computed {expression} value is not accepted)",
    });
  }

  return violations;
}

// Walk the islands directly under `componentsDir`: the `Plot.astro` suffix selects
// an island (Footer.astro, VersionPicker.astro and the rest are ignored by name).
// Returns the island basenames (sorted, so reports are stable) and every failure
// as { file, rule, match }; an unreadable island is a failure, never a skip.
export function checkPlotIslands(componentsDir, figuresDir) {
  const figureFiles = new Set(readdirSync(figuresDir));
  const islands = readdirSync(componentsDir)
    .filter((name) => /Plot\.astro$/.test(name))
    .sort();
  const failures = [];

  for (const file of islands) {
    let source;
    try {
      source = readFileSync(join(componentsDir, file), "utf8");
    } catch (error) {
      failures.push({
        file,
        rule: `unreadable file (${error.code ?? error.name}: ${error.message})`,
        match: "(could not read file)",
      });
      continue;
    }
    for (const violation of detectPlotIslandViolations(source, figureFiles)) {
      failures.push({ file, ...violation });
    }
  }

  return { islands, failures };
}

// --- Main (run only when invoked directly, not when imported by a test) ------
// Walk the corpus, collect violations + scope evidence, print, and exit. Kept
// behind a direct-run guard so importing this module for `detectFigureViolations`
// (the node:test fixture) does NOT trigger the walk or process.exit.
function main() {
  if (!existsSync(contentRoot)) {
    console.error(
      "check:figures: src/content/docs/ not found — run this from the `site/` package.",
    );
    process.exit(1);
  }

  const sourceFiles = collectSourceFiles(contentRoot).sort();
  const failures = [];

  // Track scope-confirmation evidence while walking.
  const hpcHits = []; // { rel, stem } — must stay empty
  let convergencePanelsPlotHost = null; // rel of the file embedding <ConvergencePanelsPlot ...

  for (const sourcePath of sourceFiles) {
    const rel = sourcePath.slice(contentRoot.length);

    let text;
    try {
      text = readFileSync(sourcePath, "utf8");
    } catch (error) {
      // Surface the unreadable path with a clear message — no bare catch.
      failures.push({
        rel,
        rule: `unreadable file (${error.code ?? error.name}: ${error.message})`,
        match: "(could not read file)",
      });
      continue;
    }

    for (const violation of detectFigureViolations(text)) {
      failures.push({ rel, ...violation });
    }

    // Scope evidence: record any HPC-stem hit (these are also caught above as
    // retired-stem violations; here we surface them specifically for the scope
    // assertion's message).
    for (const stem of HPC_STEMS) {
      if (text.includes(stem)) hpcHits.push({ rel, stem });
    }

    // Scope evidence: the re-homed d21 figure is a <ConvergencePanelsPlot ... embed in
    // math/stopping-rules. Match the embed tag (a usage, not just the import) so
    // a dangling import without a render does not satisfy the assertion.
    if (
      rel.replace(/\\/g, "/").startsWith("math/stopping-rules") &&
      /<ConvergencePanelsPlot[\s/>]/.test(text)
    ) {
      convergencePanelsPlotHost = rel;
    }
  }

  // --- Scope-confirmation assertions ----------------------------------------
  // These assert the content scope (no HPC figure stem, the d21 embed in
  // math/stopping-rules) and FAIL the gate if violated.
  const scopeErrors = [];

  for (const hit of hpcHits) {
    scopeErrors.push(
      `scope: HPC figure stem '${hit.stem}' must appear in 0 content files but was found in ${hit.rel} (d07/d08/d09 were dropped, never ported).`,
    );
  }

  if (convergencePanelsPlotHost === null) {
    scopeErrors.push(
      "scope: expected a <ConvergencePanelsPlot /> embed (the re-homed d21 figure) in math/stopping-rules, but none was found.",
    );
  }

  // --- Plot-island contract -------------------------------------------------
  // Zero islands is a vacuous pass (a renamed suffix or directory would silence
  // the check), so it fails like a scope assertion.
  const { islands, failures: islandFailures } = checkPlotIslands(
    componentsRoot,
    figuresRoot,
  );
  if (islands.length === 0) {
    scopeErrors.push(
      "scope: expected at least one src/components/*Plot.astro island, but none was found.",
    );
  }

  // --- Report ---------------------------------------------------------------
  if (
    failures.length > 0 ||
    scopeErrors.length > 0 ||
    islandFailures.length > 0
  ) {
    if (failures.length > 0) {
      console.error(
        `check:figures: ${failures.length} retired-figure reference(s) across ${sourceFiles.length} content file(s):\n`,
      );
      for (const f of failures) {
        console.error(
          `  ${f.rel}\n    rule:  ${f.rule}\n    found: ${f.match}\n`,
        );
      }
    }
    if (scopeErrors.length > 0) {
      console.error("check:figures: scope-confirmation assertion(s) failed:\n");
      for (const message of scopeErrors) {
        console.error(`  ${message}`);
      }
      console.error("");
    }
    if (islandFailures.length > 0) {
      console.error(
        `check:figures: ${islandFailures.length} Plot-island violation(s) across ${islands.length} island(s) in src/components/:\n`,
      );
      for (const f of islandFailures) {
        console.error(
          `  ${f.file}\n    rule:  ${f.rule}\n    found: ${f.match}\n`,
        );
      }
    }
    process.exit(1);
  }

  console.log(
    `check:figures: ${sourceFiles.length} content files checked, 0 retired-figure references; ` +
      `d07/d08/d09 absent, ConvergencePanelsPlot (d21) present in ${convergencePanelsPlotHost}; ` +
      `${islands.length} Plot islands import a tested src/figures module with role=img and a non-empty aria-label.`,
  );
  process.exit(0);
}

// Run when executed as `node scripts/check-figures.mjs`; stay inert when
// imported (the comparison holds because Node sets argv[1] to the entry script).
// `argv[1]` is absent when loaded via `node -e`/an importer with no entry file,
// so guard before pathToFileURL — an import context is never a direct run.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
