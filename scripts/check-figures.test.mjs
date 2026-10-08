// Unit fixture for the check:figures detector (E4 ticket-020).
//
// The detect-on-scratch-file AC already proves the gate catches a violation
// end-to-end; this colocated node:test fixture additionally pins the pure
// detector's behaviour (banned-pattern in → violation out, clean string in →
// empty) so a future refactor of check-figures.mjs cannot silently weaken it.
// node:test + node:assert/strict, mirroring src/figures/*.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import {
  detectFigureViolations,
  collectSourceFiles,
  detectPlotIslandViolations,
  checkPlotIslands,
} from "./check-figures.mjs";

test("flags an ../../images/ asset reference", () => {
  const text = "![value function](../../images/d02-value-function.svg)";
  const v = detectFigureViolations(text);
  assert.ok(
    v.length >= 1,
    "expected at least one violation for ../../images/ path",
  );
  assert.ok(
    v.some((x) => x.rule.includes("../../images/")),
    "expected the image-asset rule to fire",
  );
});

test("flags a root-relative /images/ asset reference", () => {
  const v = detectFigureViolations("see /images/d22-risk-measure-cvar.svg");
  assert.ok(v.some((x) => x.rule.includes("/images/")));
});

test("flags a residual 'Figure — retooled in E4' aside", () => {
  const v = detectFigureViolations(":::note[Figure — retooled in E4]\n:::");
  assert.ok(v.some((x) => x.rule.includes("retooled in E4")));
});

test("flags each retired figure stem", () => {
  const stems = [
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
  for (const stem of stems) {
    const v = detectFigureViolations(`reference to ${stem} here`);
    assert.ok(
      v.some((x) => x.rule.includes(stem)),
      `expected stem '${stem}' to be flagged`,
    );
  }
});

test("does NOT flag an external URL whose path contains /images/", () => {
  // `/images/` must catch a retired ROOT ref (`](/images/…`), not a path segment
  // inside an external URL — otherwise future attribution/links would misfire CI.
  const text = "logo at https://docs.novomodelo.invalid/images/logo.png and /math/images/x";
  assert.deepEqual(detectFigureViolations(text), []);
});

test("does NOT flag the legitimate /math/system-elements chapter slug", () => {
  // The retired Excalidraw stem is `system-element-overview`; the bare
  // `system-element(s)` chapter slug appears in many prose cross-links and must
  // NOT be a false positive.
  const text = "see [system elements](/math/system-elements) for the cascade";
  assert.deepEqual(detectFigureViolations(text), []);
});

test("does NOT flag a component import, fenced diagram blocks or a component tag", () => {
  // A relative component import, fenced diagram blocks and a component tag carry
  // no image-asset path and no retired stem.
  const text = [
    'import ValueFunctionPlot from "../../components/ValueFunctionPlot.astro";',
    "```mermaid\nflowchart LR\n  A --> B\n```",
    "```d2\nforward -> backward\n```",
    "<ValueFunctionPlot />",
  ].join("\n");
  assert.deepEqual(detectFigureViolations(text), []);
});

test("returns empty for clean migrated prose", () => {
  const text = "## 1 Purpose\n\nThe value function is convex. See [LP](/math/lp-formulation).";
  assert.deepEqual(detectFigureViolations(text), []);
});

test("reports multiple violations in one file", () => {
  const text = "../../images/d02-value-function.svg and also d24-lp-column-layout";
  const v = detectFigureViolations(text);
  // 1 image-path hit + 2 stem hits (d02-value-function appears inside the path
  // AND d24-lp-column-layout) → at least 3.
  assert.ok(v.length >= 3, `expected >=3 violations, got ${v.length}`);
});

// ---- collectSourceFiles underscore-basename exclusion (Epic 04 ticket-015 R5
// fold-in) — the equivalent of check-math-parity.test.mjs's fixture, pinning
// the SAME exclusion rule in check-figures.mjs's own walk.

function buildFixture() {
  const root = mkdtempSync(join(tmpdir(), "check-figures-test-"));
  const rootDir = root + sep;
  writeFileSync(join(root, "keep.mdx"), "# Keep\n");
  writeFileSync(join(root, "_skip.mdx"), "# Skip\n");
  mkdirSync(join(root, "_impl"));
  writeFileSync(join(root, "_impl", "_partial.mdx"), "# Partial\n");
  writeFileSync(join(root, "_impl", "routed.mdx"), "# Routed\n");
  return rootDir;
}

test("collectSourceFiles collects exactly keep.mdx and _impl/routed.mdx, excluding the two underscore-basename files", () => {
  const root = buildFixture();
  try {
    const files = collectSourceFiles(root).map((f) => f.slice(root.length));
    assert.deepEqual(files.sort(), ["_impl/routed.mdx", "keep.mdx"].sort());
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---- Plot-island contract (E07 ticket-084, R86 / ADR-023). One seeded-violation
// test per clause of the contract (R65: the gate must prove it detects each),
// plus a clean island and a fixture walk of checkPlotIslands.

const island = (parts = {}) =>
  [
    "---",
    parts.import ?? 'import { samples } from "../figures/good.ts";',
    "---",
    parts.role ?? '<div id="good-plot" role="img"',
    parts.label ?? '  aria-label="Good plot"></div>',
  ].join("\n");
const goodFigures = new Set(["good.ts", "good.test.ts"]);

test("island: a clean island with a tested module, role=img and aria-label returns no violations", () => {
  assert.deepEqual(detectPlotIslandViolations(island(), goodFigures), []);
  const bare = island({ import: 'import { samples } from "../figures/good";' });
  assert.deepEqual(detectPlotIslandViolations(bare, goodFigures), []);
});

test("island: flags a missing src/figures module import", () => {
  const v = detectPlotIslandViolations(
    island({ import: 'import { x } from "../lib/other.ts";' }),
    goodFigures,
  );
  assert.equal(v.length, 1);
  assert.ok(v[0].rule.includes("no src/figures module import"));
});

test("island: flags an imported module absent from src/figures", () => {
  const v = detectPlotIslandViolations(island(), new Set(["good.test.ts"]));
  assert.equal(v.length, 1);
  assert.ok(v[0].rule.includes("absent from src/figures ('good.ts')"));
  assert.ok(v[0].match.includes("../figures/good.ts"));
});

test("island: flags an imported module whose sibling test is absent", () => {
  const v = detectPlotIslandViolations(island(), new Set(["good.ts"]));
  assert.equal(v.length, 1);
  assert.ok(v[0].rule.includes("no sibling test ('good.test.ts'"));
});

test("island: flags a missing role=img (single or double quotes accepted)", () => {
  const none = detectPlotIslandViolations(
    island({ role: '<div id="good-plot"' }),
    goodFigures,
  );
  assert.equal(none.length, 1);
  assert.ok(none[0].rule.includes('role="img"'));
  const other = detectPlotIslandViolations(
    island({ role: '<div role="presentation"' }),
    goodFigures,
  );
  assert.equal(other.length, 1);
  const single = detectPlotIslandViolations(
    island({ role: "<div role='img'" }),
    goodFigures,
  );
  assert.deepEqual(single, []);
});

test("island: flags a missing, empty or whitespace-only aria-label", () => {
  for (const label of [
    "></div>",
    '  aria-label=""></div>',
    '  aria-label="   "></div>',
    "  aria-label='\t'></div>",
  ]) {
    const v = detectPlotIslandViolations(island({ label }), goodFigures);
    assert.equal(v.length, 1, `expected one violation for ${JSON.stringify(label)}`);
    assert.ok(v[0].rule.includes("aria-label"));
  }
});

test("island: an aria-label elsewhere in the file does not stand in for the island's blank one", () => {
  const source = island({ label: '  aria-label=""></div>\n<p aria-label="x"></p>' });
  const v = detectPlotIslandViolations(source, goodFigures);
  assert.equal(v.length, 1);
  assert.ok(v[0].rule.includes("aria-label"));
});

test("island: a data-role or data-aria-label attribute satisfies neither clause", () => {
  const v = detectPlotIslandViolations(
    island({
      role: '<div id="good-plot" data-role="img"',
      label: '  data-aria-label="Good plot"></div>',
    }),
    goodFigures,
  );
  assert.equal(v.length, 2);
  assert.ok(v.some((x) => x.rule.includes('role="img"')));
  assert.ok(v.some((x) => x.rule.includes("aria-label")));
});

function buildIslandFixture() {
  const root = mkdtempSync(join(tmpdir(), "check-figures-islands-"));
  const components = join(root, "components");
  const figures = join(root, "figures");
  mkdirSync(components);
  mkdirSync(figures);
  const shell = (name, label) =>
    `---\nimport { x } from "../figures/${name}.ts";\n---\n<div role="img"${label}></div>\n`;
  writeFileSync(join(components, "GoodPlot.astro"), shell("good", ' aria-label="Good"'));
  writeFileSync(join(components, "BadPlot.astro"), shell("bad", ""));
  writeFileSync(join(components, "Footer.astro"), "<footer></footer>\n");
  for (const name of ["good.ts", "good.test.ts", "bad.ts"]) {
    writeFileSync(join(figures, name), "export {};\n");
  }
  return { root, components, figures };
}

test("checkPlotIslands lists exactly the *Plot.astro islands and fails only BadPlot.astro", () => {
  const { root, components, figures } = buildIslandFixture();
  try {
    const { islands, failures } = checkPlotIslands(components, figures);
    assert.deepEqual(islands, ["BadPlot.astro", "GoodPlot.astro"]);
    assert.equal(failures.length, 2);
    assert.ok(failures.every((f) => f.file === "BadPlot.astro"));
    assert.ok(failures.some((f) => f.rule.includes("aria-label")));
    assert.ok(failures.some((f) => f.rule.includes("no sibling test ('bad.test.ts'")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("checkPlotIslands reports an unreadable island as a failure, never a skip", () => {
  const { root, components, figures } = buildIslandFixture();
  try {
    mkdirSync(join(components, "DirPlot.astro"));
    const { islands, failures } = checkPlotIslands(components, figures);
    assert.ok(islands.includes("DirPlot.astro"));
    const unreadable = failures.filter((f) => f.file === "DirPlot.astro");
    assert.equal(unreadable.length, 1);
    assert.ok(unreadable[0].rule.startsWith("unreadable file (EISDIR"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
