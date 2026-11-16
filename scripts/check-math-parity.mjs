// KaTeX display-math parity gate (E3 ticket-012).
//
// mdbook-katex and the Starlight remark-math + rehype-katex pipeline parse `$$`
// delimiters differently, so a chapter can migrate cleanly to Markdown yet
// silently drop or merge display-math blocks in the built HTML. This script
// proves parity mechanically: for every migrated root-locale chapter it counts
// display-math blocks in the source and asserts the built HTML emits exactly
// that many `.katex-display` nodes.
//
// Counting rule (verified across the corpus): every chapter has an EVEN number
// of `$$` occurrences, and each display block — multi-line or single-line —
// contributes exactly two. So `expected = occurrences("$$") / 2`. An odd count
// is a hard `unbalanced-delimiters` failure. Inline math (`$...$` → `.katex`)
// is out of scope; only `katex-display` is counted.
//
// Run AFTER `npm run build`. Exits 0 when every file passes, 1 on any failure
// (parity mismatch, unbalanced delimiters, missing built HTML) or when
// `dist/` is absent.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { latestDocsDist } from "./docs-dist.mjs";

const contentRoot = fileURLToPath(
  new URL("../src/content/docs/", import.meta.url),
);
const distRoot = fileURLToPath(new URL("../dist/", import.meta.url));

// Recursively collect every .md/.mdx file under src/content/docs/, excluding the
// pt-br/ subtree (future locale; only the root English corpus is gated here) and
// every index.mdx (the landing page and the reference section overviews, which
// carry no display math).
//
// Exported so the underscore-basename exclusion (the
// `if (entry.name.startsWith("_")) continue;` branch below) can be pinned
// directly by a node:test fixture (check-math-parity.test.mjs) without
// depending on dist/ or the rest of the parity-check pipeline.
export function collectSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "pt-br") continue;
    // Skip underscore-prefixed entries (e.g. the math/_impl/_*.mdx interleave
    // partials): Starlight's docsLoader globs `**/[^_]*.{md,mdx}`, so these are
    // NOT routed pages and have no mirrored dist HTML to check parity against.
    // They also carry no display math by the two-layer standard, so excluding
    // them loses no coverage.
    //
    // The exclusion is scoped to FILE basenames only — a directory is always
    // recursed into regardless of its OWN name, so `math/_impl/` itself is
    // entered and a non-underscore file nested inside an underscore-named
    // directory is still collected (exactly the case
    // check-math-parity.test.mjs's `_impl/routed.mdx` fixture pins).
    const full = `${dir}${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(`${full}/`));
      continue;
    }
    if (entry.name.startsWith("_")) continue;
    if (/\.(md|mdx)$/.test(entry.name) && entry.name !== "index.mdx") {
      files.push(full);
    }
  }
  return files;
}

function countOccurrences(text, needle) {
  let count = 0;
  let index = text.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(needle, index + needle.length);
  }
  return count;
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly). Kept behind a direct-run guard so
// `import { collectSourceFiles } from "./check-math-parity.mjs"` is safe for
// check-math-parity.test.mjs, mirroring check-figures.mjs / check-spdx.mjs.
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(distRoot)) {
    console.error(
      "check:math: dist/ not found — run `npm run build` before `npm run check:math`.",
    );
    process.exit(1);
  }

  const docsRoot = latestDocsDist(distRoot);
  const sourceFiles = collectSourceFiles(contentRoot).sort();
  const failures = [];
  let blocksVerified = 0;

  for (const sourcePath of sourceFiles) {
    const rel = sourcePath.slice(contentRoot.length);
    const text = readFileSync(sourcePath, "utf8");

    const delimiters = countOccurrences(text, "$$");
    if (delimiters % 2 !== 0) {
      failures.push({
        rel,
        category: "unbalanced-delimiters",
        expected: "even",
        actual: delimiters,
      });
      continue;
    }
    const expected = delimiters / 2;

    const htmlPath = `${docsRoot}${rel.replace(/\.(md|mdx)$/, "")}/index.html`;
    if (!existsSync(htmlPath)) {
      failures.push({
        rel,
        category: "missing-html",
        expected,
        actual: "(no built HTML)",
      });
      continue;
    }

    const html = readFileSync(htmlPath, "utf8");
    const actual = countOccurrences(html, "katex-display");
    if (actual !== expected) {
      failures.push({ rel, category: "parity-mismatch", expected, actual });
      continue;
    }

    blocksVerified += expected;
  }

  if (failures.length > 0) {
    console.error(
      `check:math: ${failures.length} file(s) failed display-math parity:\n`,
    );
    for (const f of failures) {
      console.error(
        `  ${f.rel}\n    category: ${f.category}\n    expected: ${f.expected}\n    actual:   ${f.actual}\n`,
      );
    }
    process.exit(1);
  }

  console.log(
    `check:math: ${sourceFiles.length} files checked, ${blocksVerified} display-math blocks verified.`,
  );
  process.exit(0);
}

// Run when executed as `node scripts/check-math-parity.mjs`; stay inert when
// imported (the comparison holds because Node sets argv[1] to the entry
// script). `argv[1]` is absent when loaded via `node -e`/an importer with no
// entry file, so guard before pathToFileURL — an import context is never a
// direct run.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
