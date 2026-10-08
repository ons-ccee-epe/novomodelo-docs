// Unit tests for the check:python-api helpers (E14 ticket-233).
// node:test + node:assert/strict, inline fixtures, plus one seeded-violation
// test on the vendored stubs in scripts/pystubs/.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  checkCoverage,
  collectSymbols,
  isPublic,
  moduleName,
  parsePage,
  parseStub,
} from "./check-python-api.mjs";

const STUB = [
  '"""Module docstring.',
  "class NotASymbol: mentioned inside the docstring",
  '"""',
  "from . import errors as errors",
  "from ._types import Shape",
  "__version__: str",
  "_private: int",
  "def top(",
  "    path: str,",
  "    flag: bool = False,",
  ") -> None:",
  '    """Doc with a fake field:',
  "    fake: int",
  '    """',
  "    ...",
  "class Thing:",
  '    """One-line class docstring."""',
  "    size: int",
  "    def __init__(self, size: int) -> None: ...",
  "    @property",
  "    def area(self) -> float: ...",
  "    def grow(",
  "        self,",
  "        by: int,",
  "    ) -> None: ...",
  "    def _hidden(self) -> None: ...",
  "class _Private:",
  "    secret: int",
].join("\n");

test("isPublic keeps dunders except __init__ and drops _names", () => {
  assert.equal(isPublic("run"), true);
  assert.equal(isPublic("__version__"), true);
  assert.equal(isPublic("__init__"), false);
  assert.equal(isPublic("_types_helper"), false);
});

test("moduleName maps __init__.pyi to novomodelo and others to novomodelo.<stem>", () => {
  assert.equal(moduleName("__init__.pyi"), "novomodelo");
  assert.equal(moduleName("results.pyi"), "novomodelo.results");
  assert.equal(moduleName("_types.pyi"), "novomodelo._types");
});

test("parseStub extracts module, defs, classes, members and fields only", () => {
  const { headings, fields } = parseStub(STUB, "novomodelo.x");
  assert.deepEqual(headings, [
    "novomodelo.x",
    "novomodelo.x.__version__",
    "novomodelo.x.top",
    "novomodelo.x.Thing",
    "novomodelo.x.Thing.area",
    "novomodelo.x.Thing.grow",
  ]);
  assert.deepEqual([...fields.entries()], [["novomodelo.x.Thing", ["size"]]]);
});

test("parsePage ignores fenced headings and assigns rows to the open class", () => {
  const page = [
    "## `novomodelo.x`",
    "```python",
    "### `novomodelo.x.fenced`",
    "| `fake` | row in a fence |",
    "```",
    "### `novomodelo.x.Thing`",
    "| Field | Type | Description |",
    "| --- | --- | --- |",
    "| `size` | `int` | Size. |",
    "### Notes",
    "| `loose` | not under an identifier heading |",
  ].join("\n");
  const { headings, rows } = parsePage(page);
  assert.deepEqual(headings.map((h) => h.name), ["novomodelo.x", "novomodelo.x.Thing"]);
  assert.deepEqual(rows.get("novomodelo.x.Thing"), ["size"]);
  assert.deepEqual(rows.get("novomodelo.x"), []);
});

const COMPLETE = [
  "## `novomodelo.x`",
  "### `novomodelo.x.__version__`",
  "### `novomodelo.x.top`",
  "| `path` | a parameter table under a function is free |",
  "### `novomodelo.x.Thing`",
  "| `size` | `int` | Size. |",
  "#### `novomodelo.x.Thing.area`",
  "#### `novomodelo.x.Thing.grow`",
].join("\n");

test("checkCoverage passes a complete page", () => {
  const symbols = parseStub(STUB, "novomodelo.x");
  assert.deepEqual(checkCoverage(symbols, parsePage(COMPLETE)), []);
});

test("checkCoverage reports missing, phantom and duplicate headings", () => {
  const symbols = parseStub(STUB, "novomodelo.x");
  const page = COMPLETE.replace("#### `novomodelo.x.Thing.grow`", "#### `novomodelo.x.Thing.shrink`") + "\n### `novomodelo.x.top`";
  assert.deepEqual(checkCoverage(symbols, parsePage(page)).sort(), [
    "DUPLICATE\tnovomodelo.x.top\tline 9",
    "MISSING\tnovomodelo.x.Thing.grow",
    "PHANTOM\tnovomodelo.x.Thing.shrink\tline 8",
  ]);
});

test("checkCoverage reports missing and phantom field rows", () => {
  const symbols = parseStub(STUB, "novomodelo.x");
  const page = COMPLETE.replace("| `size` | `int` | Size. |", "| `width` | `int` | Not a field. |");
  assert.deepEqual(checkCoverage(symbols, parsePage(page)).sort(), [
    "MISSING-FIELD\tnovomodelo.x.Thing.size",
    "PHANTOM-FIELD\tnovomodelo.x.Thing.width",
  ]);
});

test("a field-less class may carry a parameter table", () => {
  const symbols = parseStub("class Plain:\n    def go(self) -> None: ...", "novomodelo.y");
  const page = "## `novomodelo.y`\n### `novomodelo.y.Plain`\n| `case_dir` | constructor parameter |\n#### `novomodelo.y.Plain.go`";
  assert.deepEqual(checkCoverage(symbols, parsePage(page)), []);
});

test("seeded violation on the vendored stubs: one dropped heading is the only finding", () => {
  const dir = fileURLToPath(new URL("./pystubs/", import.meta.url));
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".pyi"))
    .sort()
    .map((name) => ({ name, text: readFileSync(dir + name, "utf8") }));
  const symbols = collectSymbols(files);
  assert.ok(symbols.headings.includes("novomodelo.run.run"));
  const lines = [];
  for (const name of symbols.headings) {
    lines.push(`### \`${name}\``);
    for (const field of symbols.fields.get(name) ?? []) lines.push(`| \`${field}\` | x |`);
  }
  const complete = lines.join("\n");
  assert.deepEqual(checkCoverage(symbols, parsePage(complete)), []);
  const seeded = complete.replace("### `novomodelo.run.run`\n", "");
  assert.deepEqual(checkCoverage(symbols, parsePage(seeded)), ["MISSING\tnovomodelo.run.run"]);
});

test("a def or class line that carries its own docstring, and async def, are symbols", () => {
  const { headings, fields } = parseStub(
    'async def a() -> None: ...\ndef b() -> None: """Doc."""\nclass C: """Doc."""\n    n: int',
    "novomodelo.z",
  );
  assert.deepEqual(headings, ["novomodelo.z", "novomodelo.z.a", "novomodelo.z.b", "novomodelo.z.C"]);
  assert.deepEqual([...fields.entries()], [["novomodelo.z.C", ["n"]]]);
});
