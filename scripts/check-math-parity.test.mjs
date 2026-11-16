// Unit fixture for check-math-parity.mjs's collectSourceFiles (Epic 04
// ticket-015 R5 — folded in from a ticket-006 test-debt note).
//
// check-math-parity.mjs and check-figures.mjs both walk src/content/docs/
// with an underscore-basename exclusion (`math/_impl/_*.mdx` interleave
// partials are not routed Starlight pages, per the docsLoader `**/[^_]*`
// glob). ticket-006 added the exclusion to both walks but shipped no test for
// it; this fixture builds a temp directory tree and asserts the exclusion
// directly against the now-exported collectSourceFiles, without touching
// dist/ or the rest of the parity-check pipeline (safe to import: see the
// direct-run guard this ticket added to check-math-parity.mjs).

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { collectSourceFiles } from "./check-math-parity.mjs";

function buildFixture() {
  const root = mkdtempSync(join(tmpdir(), "check-math-parity-test-"));
  const rootDir = root + sep;
  writeFileSync(join(root, "keep.mdx"), "# Keep\n\n$$x = 1$$\n");
  writeFileSync(join(root, "_skip.mdx"), "# Skip\n\n$$x = 2$$\n");
  mkdirSync(join(root, "_impl"));
  writeFileSync(join(root, "_impl", "_partial.mdx"), "# Partial\n");
  writeFileSync(join(root, "_impl", "routed.mdx"), "# Routed\n");
  return rootDir;
}

test("collects a non-underscore top-level file", () => {
  const root = buildFixture();
  try {
    const files = collectSourceFiles(root);
    assert.ok(
      files.some((f) => f.endsWith(`${sep}keep.mdx`) || f.endsWith("/keep.mdx")),
      `expected keep.mdx to be collected, got: ${JSON.stringify(files)}`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("excludes an underscore-basename file at the top level", () => {
  const root = buildFixture();
  try {
    const files = collectSourceFiles(root);
    assert.ok(
      !files.some((f) => f.includes("_skip.mdx")),
      `expected _skip.mdx to be excluded, got: ${JSON.stringify(files)}`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("collects a non-underscore file nested inside an underscore-named directory", () => {
  // The exclusion is basename-only: `_impl/` the DIRECTORY is walked (it is
  // not itself excluded), but files inside it are excluded individually by
  // their own basename.
  const root = buildFixture();
  try {
    const files = collectSourceFiles(root);
    assert.ok(
      files.some((f) => f.includes("routed.mdx")),
      `expected _impl/routed.mdx to be collected, got: ${JSON.stringify(files)}`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("excludes an underscore-basename file nested inside a directory (_impl/_partial.mdx)", () => {
  const root = buildFixture();
  try {
    const files = collectSourceFiles(root);
    assert.ok(
      !files.some((f) => f.includes("_partial.mdx")),
      `expected _impl/_partial.mdx to be excluded, got: ${JSON.stringify(files)}`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("collects exactly keep.mdx and _impl/routed.mdx, excluding the two underscore files", () => {
  const root = buildFixture();
  try {
    const files = collectSourceFiles(root).map((f) => f.slice(root.length));
    assert.deepEqual(files.sort(), ["_impl/routed.mdx", "keep.mdx"].sort());
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("walks the pt-br/ twin subtree and still excludes its index.mdx", () => {
  const root = buildFixture();
  try {
    mkdirSync(join(root, "pt-br"));
    writeFileSync(join(root, "pt-br", "keep.mdx"), "# Manter\n\n$$x = 1$$\n");
    writeFileSync(join(root, "pt-br", "index.mdx"), "# Início\n");
    const files = collectSourceFiles(root).map((f) => f.slice(root.length));
    assert.ok(
      files.includes("pt-br/keep.mdx"),
      `expected pt-br/keep.mdx to be collected, got: ${JSON.stringify(files)}`,
    );
    assert.ok(
      !files.includes("pt-br/index.mdx"),
      `expected pt-br/index.mdx to be excluded, got: ${JSON.stringify(files)}`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
