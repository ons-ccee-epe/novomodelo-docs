// Unit fixture for the shared zoneOf() predicate (Epic 04 ticket-015).
//
// Pins the zone map so check-doc-voice.mjs and check-doc-version.mjs cannot
// silently drift apart on what counts as strict/lenient/excluded.

import test from "node:test";
import assert from "node:assert/strict";
import { zoneOf, ZONE_STRICT, ZONE_LENIENT, ZONE_EXCLUDED } from "./doc-zones.mjs";

test("math/*.mdx (excluding _impl) is strict", () => {
  assert.equal(zoneOf("math/lp-formulation.mdx"), ZONE_STRICT);
  assert.equal(zoneOf("math/cut-management.mdx"), ZONE_STRICT);
});

test("math/_impl/* is lenient (software layer nested under math/)", () => {
  assert.equal(zoneOf("math/_impl/_hydro.io.mdx"), ZONE_LENIENT);
  assert.equal(zoneOf("math/_impl/_cut-management.configure.mdx"), ZONE_LENIENT);
});

test("reference/* is lenient", () => {
  assert.equal(zoneOf("reference/error-codes.mdx"), ZONE_LENIENT);
  assert.equal(zoneOf("reference/case-format/hydros.mdx"), ZONE_LENIENT);
});

test("reference/glossary.md is strict (math zone, R97)", () => {
  assert.equal(zoneOf("reference/glossary.md"), ZONE_STRICT);
  // One file, not the directory: its siblings stay lenient.
  assert.equal(zoneOf("reference/bibliography.md"), ZONE_LENIENT);
  // Exact path match: a lookalike name is not the glossary.
  assert.equal(zoneOf("reference/glossary.mdx"), ZONE_LENIENT);
});

test("running/* is lenient", () => {
  assert.equal(zoneOf("running/running-studies.mdx"), ZONE_LENIENT);
});

test("getting-started/* is lenient", () => {
  assert.equal(zoneOf("getting-started/quickstart.mdx"), ZONE_LENIENT);
});

test("examples/* is lenient (worked examples carry concrete instance numbers)", () => {
  assert.equal(zoneOf("examples/toy-single-reservoir.md"), ZONE_LENIENT);
});

test("overview/* is strict", () => {
  assert.equal(zoneOf("overview/how-to-read.md"), ZONE_STRICT);
  assert.equal(zoneOf("overview/what-novomodelo-solves.md"), ZONE_STRICT);
});

test("index.mdx is lenient", () => {
  assert.equal(zoneOf("index.mdx"), ZONE_LENIENT);
});

test("pt-br/* is excluded", () => {
  assert.equal(zoneOf("pt-br/index.mdx"), ZONE_EXCLUDED);
  assert.equal(zoneOf("pt-br/math/lp-formulation.mdx"), ZONE_EXCLUDED);
});

test("normalises backslash path separators (platform independence)", () => {
  assert.equal(zoneOf("math\\_impl\\_hydro.io.mdx"), ZONE_LENIENT);
  assert.equal(zoneOf("math\\lp-formulation.mdx"), ZONE_STRICT);
});

test("an unrecognised top-level path defaults to excluded, not strict/lenient", () => {
  assert.equal(zoneOf("some-future-dir/page.mdx"), ZONE_EXCLUDED);
});
