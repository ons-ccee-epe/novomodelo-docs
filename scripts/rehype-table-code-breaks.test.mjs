// Break points in table code: node:test fixture for
// scripts/rehype-table-code-breaks.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import rehypeTableCodeBreaks, { breakPieces } from "./rehype-table-code-breaks.mjs";

const text = (value) => ({ type: "text", value });
const el = (tagName, children) => ({ type: "element", tagName, properties: {}, children });
const code = (value) => el("code", [text(value)]);
const toText = (node) => (node.type === "text" ? node.value : (node.children ?? []).map(toText).join(""));
const run = (tree) => {
  rehypeTableCodeBreaks()(tree);
  return tree;
};
const pieces = (node) => {
  const out = [""];
  for (const c of node.children) c.type === "element" && c.tagName === "wbr" ? out.push("") : (out[out.length - 1] += toText(c));
  return out;
};

test("a nested key breaks before each dot that starts a key", () => {
  assert.deepEqual(breakPieces("thermals[].anticipated_config.lead_time_hours"), [
    "thermals[]",
    ".anticipated_config",
    ".lead_time_hours",
  ]);
  assert.deepEqual(breakPieces("thermals[].operational_start_date"), ["thermals[]", ".operational_start_date"]);
});

test("a path breaks after each slash and before its extension", () => {
  assert.deepEqual(breakPieces("system/hydro_production_models.json"), ["system/", "hydro_production_models", ".json"]);
  assert.deepEqual(breakPieces('"./policy"'), ['"./', 'policy"']);
});

test("a piece longer than 24 characters also breaks after each underscore", () => {
  assert.deepEqual(breakPieces("integrated_equivalent_productivity_mw_per_m3s"), [
    "integrated_",
    "equivalent_",
    "productivity_",
    "mw_",
    "per_",
    "m3s",
  ]);
  assert.deepEqual(breakPieces("annual_discount_rate"), ["annual_discount_rate"]);
});

test("numbers, versions and code with spaces keep their text whole", () => {
  for (const value of ["0.0", "v0.22.0", "1e-10", ">= 0", '"parallel" | "serial"', "null"]) {
    assert.deepEqual(breakPieces(value), [value]);
  }
  assert.deepEqual(breakPieces("a.b c.d"), ["a", ".b c", ".d"]);
});

test("joined, the pieces give back the text", () => {
  for (const value of ["", " ", "x", "hydros[].penalties.generation_violation_below_cost", "a / b", "worst_pre_scaling_matrix_ratio / x"]) {
    assert.equal(breakPieces(value).join(""), value);
  }
});

test("only inline code inside a table gets break points", () => {
  const inCell = code("buses[].deficit_segments[].depth_mw");
  const outside = code("buses[].deficit_segments[].depth_mw");
  const inPre = el("pre", [code("a.b/c")]);
  const table = el("table", [el("tbody", [el("tr", [el("td", [inCell, inPre])])])]);
  run({ type: "root", children: [el("p", [outside]), table] });
  assert.deepEqual(pieces(inCell), ["buses[]", ".deficit_segments[]", ".depth_mw"]);
  assert.equal(outside.children.length, 1);
  assert.equal(inPre.children[0].children.length, 1);
  assert.equal(toText(table), "buses[].deficit_segments[].depth_mw" + "a.b/c");
});

test("a table inside an MDX component is reached", () => {
  const inCell = code("lines[].capacity.direct_mw");
  const tabs = { type: "mdxJsxFlowElement", name: "TabItem", children: [el("table", [el("tr", [el("td", [inCell])])])] };
  run({ type: "root", children: [tabs] });
  assert.deepEqual(pieces(inCell), ["lines[]", ".capacity", ".direct_mw"]);
});
