// Unit tests for the refresh:pystubs pure helpers (E14 ticket-233a).
// node:test + node:assert/strict, inline fixtures, no filesystem or subprocess.
import test from "node:test";
import assert from "node:assert/strict";
import { diffStubs, parseStubNames } from "./refresh-pystubs.mjs";

const DIR = "crates/novomodelo-python/python/novomodelo";

test("parseStubNames keeps sorted .pyi basenames and drops other files", () => {
  const stdout =
    [
      `${DIR}/run.pyi`,
      `${DIR}/.gitignore`,
      `${DIR}/__init__.py`,
      `${DIR}/__init__.pyi`,
      `${DIR}/_types.pyi`,
      `${DIR}/py.typed`,
    ].join("\n") + "\n";
  assert.deepEqual(parseStubNames(stdout), ["__init__.pyi", "_types.pyi", "run.pyi"]);
});

test("parseStubNames throws without __init__.pyi or on an empty tree", () => {
  assert.throws(() => parseStubNames(`${DIR}/run.pyi\n`), /no __init__\.pyi/);
  assert.throws(() => parseStubNames(""), /no __init__\.pyi/);
});

test("diffStubs is empty when the vendored stubs equal the ref", () => {
  const a = new Map([["__init__.pyi", Buffer.from("x")]]);
  const b = new Map([["__init__.pyi", Buffer.from("x")]]);
  assert.deepEqual(diffStubs(a, b), []);
});

test("diffStubs reports drifted, missing and extra stubs", () => {
  const released = new Map([
    ["__init__.pyi", Buffer.from("a")],
    ["run.pyi", Buffer.from("b")],
  ]);
  const vendored = new Map([
    ["__init__.pyi", Buffer.from("A")],
    ["old.pyi", Buffer.from("c")],
  ]);
  assert.deepEqual(diffStubs(released, vendored), [
    "DRIFTED __init__.pyi",
    "MISSING run.pyi",
    "EXTRA old.pyi",
  ]);
});
