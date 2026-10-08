// Unit fixture for the check:gc-examples detector (E15 ticket-242, GRD-05).
//
// Pure functions are tested directly; runGcExamples is driven against a STUB `novomodelo`
// (a node script in a temp dir), so the suite needs no novomodelo binary and is CI-safe
// before the install step exists. Each violation class is seeded once.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkNovomodeloVersion,
  classifyOutcome,
  extractGcFences,
  runGcExamples,
} from "./check-gc-examples.mjs";
import { DEFAULT_NOVOMODELO_REF } from "./novomodelo-ref.mjs";

const T = "```";
const SCRIPT = fileURLToPath(
  new URL("./check-gc-examples.mjs", import.meta.url),
);
const GC = "constraints/generic_constraints.json";
const GP = "constraints/generic_parameters.json";

const fence = (check, body, title = GC) =>
  [`${T}json title="${title}" gc-check="${check}"`, body, T].join("\n");
const page = (...blocks) =>
  ["# Page", "", ...blocks.flatMap((b) => [b, ""])].join("\n");

// --- extractGcFences --------------------------------------------------------

test("extracts the two checked fences and skips an unmarked json fence and a d2 fence", () => {
  const text = [
    "# Page",
    "",
    `${T}json title="a.json"`,
    "{}",
    T,
    "",
    `${T}d2`,
    "a -> b",
    T,
    "",
    `${T}json title="${GC}" gc-check="accept"`,
    '{"constraints": []}',
    T,
    "",
    `${T}json title="${GP}" gc-check="reject"`,
    "{",
    '  "x": 1',
    "}",
    T,
  ].join("\n");
  const { fences, problems } = extractGcFences(text);
  assert.deepEqual(problems, []);
  assert.deepEqual(fences, [
    { line: 11, title: GC, check: "accept", body: '{"constraints": []}' },
    { line: 15, title: GP, check: "reject", body: '{\n  "x": 1\n}' },
  ]);
});

test("BAD-META: a checked fence whose language is not json", () => {
  const text = `${T}yaml title="a.json" gc-check="accept"\nx\n${T}`;
  const { fences, problems } = extractGcFences(text);
  assert.deepEqual(fences, []);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].code, "BAD-META");
  assert.equal(problems[0].line, 1);
  assert.match(problems[0].detail, /language must be json, found yaml/);
});

test("BAD-META: gc-check is neither accept nor reject, or not double-quoted", () => {
  for (const value of [
    'gc-check="maybe"',
    "gc-check=accept",
    'gc-check=""',
    "gc-check='accept'",
  ]) {
    const { fences, problems } = extractGcFences(
      `${T}json title="a.json" ${value}\n{}\n${T}`,
    );
    assert.deepEqual(fences, [], value);
    assert.equal(problems.length, 1, value);
    assert.equal(problems[0].code, "BAD-META", value);
    assert.match(problems[0].detail, /gc-check must be/, value);
  }
});

test("BAD-META: title missing or not a lowercase case-relative .json path", () => {
  const titles = [
    "",
    'title=""',
    'title="/abs/x.json"',
    'title="../x.json"',
    'title="constraints/Generic.json"',
    'title="constraints/x.txt"',
    'title="a//b.json"',
    "title=a.json",
  ];
  for (const title of titles) {
    const { fences, problems } = extractGcFences(
      `${T}json ${title} gc-check="accept"\n{}\n${T}`,
    );
    assert.deepEqual(fences, [], title);
    assert.equal(problems.length, 1, title);
    assert.equal(problems[0].code, "BAD-META", title);
    assert.match(problems[0].detail, /title must be/, title);
  }
});

test("BAD-META: a misspelled or valueless gc-check is reported, not skipped as illustrative", () => {
  const value = 'gc-check must be "accept" or "reject", in double quotes';
  const unknown = (name) =>
    `unknown option ${name}; a checked fence uses gc-check`;
  const cases = [
    ['json title="a.json" gc-chek="accept"', [unknown("gc-chek")]],
    ['json title="a.json" gc_check="reject"', [unknown("gc_check")]],
    ['json title="a.json" GC-check="accept"', [unknown("GC-check")]],
    ['json title="a.json" check="accept"', [unknown("check")]],
    ['json title="a.json" gc-check', [value]],
    ['json title="a.json" gc-check = "accept"', [value]],
    [
      'gc-check="accept" title="a.json"',
      ['language must be json, found gc-check="accept"', value],
    ],
  ];
  for (const [info, details] of cases) {
    const { fences, problems } = extractGcFences(`${T}${info}\n{}\n${T}`);
    assert.deepEqual(fences, [], info);
    assert.deepEqual(
      problems,
      details.map((detail) => ({ code: "BAD-META", line: 1, detail })),
      info,
    );
  }
  assert.deepEqual(extractGcFences(`${T}json title="x gc y"\n{}\n${T}`), {
    fences: [],
    problems: [],
  });
});

test("BAD-META: an unclosed checked fence is reported and not returned", () => {
  const { fences, problems } = extractGcFences(
    `# Page\n${T}json title="a.json" gc-check="reject"\nBAD\n`,
  );
  assert.deepEqual(fences, []);
  assert.deepEqual(problems, [
    { code: "BAD-META", line: 2, detail: "the fence is not closed" },
  ]);
});

test("a checked fence nested in a four-backtick fence is text", () => {
  const text = [
    "````text",
    `${T}json title="${GC}" gc-check="accept"`,
    "{}",
    T,
    "````",
    fence("reject", "BAD"),
  ].join("\n");
  const { fences, problems } = extractGcFences(text);
  assert.deepEqual(problems, []);
  assert.deepEqual(fences, [
    { line: 6, title: GC, check: "reject", body: "BAD" },
  ]);
});

test("a backtick line that carries text does not close a fence, and two backticks open none", () => {
  const text = [
    fence("accept", `{"a": 1}\n${T}json\n{"b": 2}`),
    '``json title="a.json" gc-check="reject"',
    "x",
    "``",
  ].join("\n");
  const { fences, problems } = extractGcFences(text);
  assert.deepEqual(problems, []);
  assert.deepEqual(fences, [
    {
      line: 1,
      title: GC,
      check: "accept",
      body: `{"a": 1}\n${T}json\n{"b": 2}`,
    },
  ]);
});

// --- classifyOutcome --------------------------------------------------------

const success = JSON.stringify({
  configured: false,
  boundary_date: null,
  report: null,
});
const refusal = JSON.stringify({
  configured: null,
  boundary_date: null,
  report: null,
  error: { phase: "ConstraintError", message: "[SchemaViolation] x" },
});

test("classifyOutcome matrix", () => {
  const cases = [
    ["accept", 0, success, null, undefined],
    ["accept", 0, refusal, "UNEXPECTED-REJECT", "[SchemaViolation] x"],
    ["accept", 1, refusal, "UNEXPECTED-REJECT", "[SchemaViolation] x"],
    ["accept", 2, success, "UNEXPECTED-REJECT", "exit status 2"],
    ["reject", 1, refusal, null, undefined],
    ["reject", 0, success, "UNEXPECTED-ACCEPT", undefined],
    ["reject", 101, success, "NOT-A-REFUSAL", undefined],
    ["reject", 1, success, "NOT-A-REFUSAL", undefined],
    ["reject", 2, refusal, "NOT-A-REFUSAL", undefined],
  ];
  for (const [check, status, stdout, code, detail] of cases) {
    const outcome = classifyOutcome(check, { status, stdout });
    const label = `${check} exit ${status}`;
    if (code === null) {
      assert.equal(outcome, null, label);
      continue;
    }
    assert.equal(outcome.code, code, label);
    if (detail !== undefined) assert.equal(outcome.detail, detail, label);
  }
});

test("classifyOutcome: stdout that is not a JSON object is BAD-OUTPUT for either mark", () => {
  for (const check of ["accept", "reject"]) {
    for (const stdout of ["", "not json", "null", "[]", "3"]) {
      const outcome = classifyOutcome(check, { status: 2, stdout });
      assert.equal(
        outcome.code,
        "BAD-OUTPUT",
        `${check} ${JSON.stringify(stdout)}`,
      );
    }
  }
});

// --- checkNovomodeloVersion ------------------------------------------------------

test("checkNovomodeloVersion: match, mismatch and unreadable", () => {
  assert.equal(
    checkNovomodeloVersion("novomodelo   v0.17.0\nsolver: HiGHS\n", "v0.17.0"),
    null,
  );
  assert.equal(
    checkNovomodeloVersion("novomodelo   v0.17.0\r\nsolver: HiGHS", "v0.17.0"),
    null,
  );
  assert.equal(
    checkNovomodeloVersion("novomodelo   v0.16.0\n", "v0.17.0"),
    "novomodelo version v0.16.0 differs from DEFAULT_NOVOMODELO_REF v0.17.0",
  );
  assert.equal(
    checkNovomodeloVersion("novomodelo   v0.17.0-rc1\n", "v0.17.0"),
    "novomodelo version v0.17.0-rc1 differs from DEFAULT_NOVOMODELO_REF v0.17.0",
  );
  for (const text of [
    "",
    "garbage\n",
    "novomodelo\n",
    "banner\nnovomodelo   v0.17.0\n",
    "novomodelo   0.17.0\n",
  ]) {
    assert.equal(
      checkNovomodeloVersion(text, "v0.17.0"),
      "unreadable novomodelo version output",
      JSON.stringify(text),
    );
  }
});

// --- runGcExamples against a stub binary ------------------------------------

const STUB = `#!/usr/bin/env node
const fs = process.getBuiltinModule("node:fs");
const path = process.getBuiltinModule("node:path");
const [command, ...args] = process.argv.slice(2);
const out = (value) => process.stdout.write(JSON.stringify(value) + "\\n");
const fail = (code, message) => {
  process.stderr.write(message + "\\n");
  process.exitCode = code;
};
const ok = { configured: false, boundary_date: null, report: null };

if (process.env.NO_COLOR !== "1") {
  fail(65, "NO_COLOR is not set to 1");
} else if (command === "version") {
  process.stdout.write((process.env.STUB_VERSION || "novomodelo   v0.17.0") + "\\nsolver: stub\\n");
} else if (command === "init" && args.length === 3 && args[0] === "--template" && args[1] === "1dtoy") {
  const dir = args[2];
  if (process.env.STUB_INIT_FAIL) {
    fail(2, "init boom");
  } else if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) {
    fail(2, "directory is not empty");
  } else {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "config.json"), "{}\\n");
    if (process.env.STUB_INIT_BAD) {
      fs.mkdirSync(path.join(dir, "constraints"));
      fs.writeFileSync(path.join(dir, "constraints", "generic_constraints.json"), "BAD\\n");
    }
    process.stderr.write("initialised\\n");
  }
} else if (command === "validate" && args.length === 2 && args[0] === "--json") {
  const dir = args[1];
  if (process.env.STUB_LOG) fs.appendFileSync(process.env.STUB_LOG, dir + "\\n");
  const file = path.join(dir, "constraints", "generic_constraints.json");
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const refuse = (message) => {
    out({ configured: null, boundary_date: null, report: null, error: { phase: "ConstraintError", message } });
    process.exitCode = 1;
  };
  const required = process.env.STUB_REQUIRE;
  const forbidden = process.env.STUB_FORBID;
  if (text.includes("PANIC")) {
    out(ok);
    process.exitCode = 101;
  } else if (text.includes("GARBAGE")) {
    process.stdout.write("not json\\n");
  } else if (text.includes("BAD")) {
    refuse("[SchemaViolation] constraints/generic_constraints.json: BAD");
  } else if (required && !fs.existsSync(path.join(dir, required))) {
    refuse("[InvalidReference] missing " + required);
  } else if (forbidden && fs.existsSync(path.join(dir, forbidden))) {
    refuse("[Unexpected] present " + forbidden);
  } else {
    out(ok);
  }
} else {
  fail(64, "unexpected arguments: " + process.argv.slice(2).join(" "));
}
`;

const OVERLAY = { [GC]: "{}\n", [GP]: "{}\n" };

function workspace(overlay = OVERLAY) {
  const root = mkdtempSync(join(tmpdir(), "check-gc-examples-test-"));
  const bin = join(root, "novomodelo");
  writeFileSync(bin, STUB);
  chmodSync(bin, 0o755);
  const fixtureDir = join(root, "overlay");
  mkdirSync(fixtureDir);
  for (const [rel, content] of Object.entries(overlay)) {
    mkdirSync(dirname(join(fixtureDir, rel)), { recursive: true });
    writeFileSync(join(fixtureDir, rel), content);
  }
  return {
    root,
    bin,
    fixtureDir,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

const withoutColorFlag = () => {
  const env = { ...process.env };
  delete env.NO_COLOR;
  return env;
};

const run = (ws, pageText, env = {}, overrides = {}) =>
  runGcExamples({
    pageText,
    pageLabel: "page.mdx",
    fixtureDir: ws.fixtureDir,
    novomodeloBin: ws.bin,
    defaultRef: "v0.17.0",
    env: { ...withoutColorFlag(), ...env },
    ...overrides,
  });

test("a clean page: accept and reject fences behave as marked", () => {
  const ws = workspace();
  try {
    const result = run(
      ws,
      page(
        fence("accept", '{"constraints": []}'),
        fence("reject", "BAD"),
        fence("accept", "{}", GP),
      ),
    );
    assert.deepEqual(result, {
      setupError: null,
      problems: [],
      accepted: 2,
      rejected: 1,
    });
  } finally {
    ws.cleanup();
  }
});

test("BAD-META: an accept fence whose title names no file of the assembled case is not run and not counted", () => {
  const ws = workspace();
  const log = join(ws.root, "validate.log");
  try {
    const result = run(
      ws,
      page(
        fence("accept", "{}", "constraints/generic_constraint.json"),
        fence("accept", "{}"),
      ),
      { STUB_LOG: log },
    );
    assert.equal(result.setupError, null);
    assert.equal(result.accepted, 1);
    assert.equal(result.rejected, 0);
    assert.deepEqual(
      result.problems.map((p) => [p.code, p.line, p.at]),
      [["BAD-META", 3, "page.mdx:3"]],
    );
    assert.match(
      result.problems[0].detail,
      /title constraints\/generic_constraint\.json names no file of the assembled case/,
    );
    assert.equal(readFileSync(log, "utf8").trim().split("\n").length, 2);
  } finally {
    ws.cleanup();
  }
});

test("BAD-META: a reject fence whose title names no file of the assembled case is not counted as rejected", () => {
  const ws = workspace();
  try {
    const result = run(
      ws,
      page(fence("reject", "BAD", "system/new_file.json")),
    );
    assert.equal(result.rejected, 0);
    assert.deepEqual(
      result.problems.map((p) => [p.code, p.line]),
      [["BAD-META", 3]],
    );
  } finally {
    ws.cleanup();
  }
});

test("BAD-META: a title naming a directory of the assembled case is not a file", () => {
  const ws = workspace({ ...OVERLAY, "system/marker.json/inner.json": "{}\n" });
  try {
    const result = run(ws, page(fence("accept", "{}", "system/marker.json")));
    assert.equal(result.accepted, 0);
    assert.deepEqual(
      result.problems.map((p) => [p.code, p.line]),
      [["BAD-META", 3]],
    );
  } finally {
    ws.cleanup();
  }
});

test("a title naming a scaffold file or an overlay file of the assembled case is run", () => {
  const ws = workspace({ ...OVERLAY, "system/marker.json": "{}\n" });
  try {
    const result = run(
      ws,
      page(
        fence("accept", "{}", "config.json"),
        fence("accept", "{}", "system/marker.json"),
        fence("reject", "BAD"),
      ),
    );
    assert.deepEqual(result, {
      setupError: null,
      problems: [],
      accepted: 2,
      rejected: 1,
    });
  } finally {
    ws.cleanup();
  }
});

test("UNEXPECTED-REJECT: an accept fence that novomodelo refuses, with its line and message", () => {
  const ws = workspace();
  try {
    const result = run(ws, page(fence("accept", "BAD")));
    assert.equal(result.setupError, null);
    assert.equal(result.accepted, 0);
    assert.equal(result.problems.length, 1);
    const [problem] = result.problems;
    assert.equal(problem.code, "UNEXPECTED-REJECT");
    assert.equal(problem.line, 3);
    assert.equal(problem.at, "page.mdx:3");
    assert.match(problem.detail, /\[SchemaViolation\].*BAD/);
  } finally {
    ws.cleanup();
  }
});

test("UNEXPECTED-ACCEPT: a reject fence that validates", () => {
  const ws = workspace();
  try {
    const result = run(ws, page(fence("reject", '{"constraints": []}')));
    assert.equal(result.rejected, 0);
    assert.deepEqual(
      result.problems.map((p) => [p.code, p.line]),
      [["UNEXPECTED-ACCEPT", 3]],
    );
  } finally {
    ws.cleanup();
  }
});

test("NOT-A-REFUSAL: a reject fence that ends in a panic (exit 101, no error object)", () => {
  const ws = workspace();
  try {
    const result = run(ws, page(fence("reject", "PANIC")));
    assert.deepEqual(
      result.problems.map((p) => [p.code, p.line]),
      [["NOT-A-REFUSAL", 3]],
    );
    assert.match(result.problems[0].detail, /exit status 101/);
  } finally {
    ws.cleanup();
  }
});

test("BAD-OUTPUT: stdout that is not JSON", () => {
  const ws = workspace();
  try {
    const result = run(ws, page(fence("accept", "GARBAGE")));
    assert.deepEqual(
      result.problems.map((p) => [p.code, p.line]),
      [["BAD-OUTPUT", 3]],
    );
  } finally {
    ws.cleanup();
  }
});

test("BAD-META reaches the result with its line, and the valid fence still runs", () => {
  const ws = workspace();
  try {
    const bad = `${T}json title="${GC}" gc-check="maybe"\n{}\n${T}`;
    const result = run(ws, page(bad, fence("accept", "{}")));
    assert.equal(result.accepted, 1);
    assert.deepEqual(
      result.problems.map((p) => [p.code, p.line, p.at]),
      [["BAD-META", 3, "page.mdx:3"]],
    );
  } finally {
    ws.cleanup();
  }
});

test("setupError: a missing binary names the path and the remedy", () => {
  const ws = workspace();
  try {
    const missing = join(ws.root, "nope", "novomodelo");
    const result = run(
      ws,
      page(fence("accept", "{}")),
      {},
      { novomodeloBin: missing },
    );
    assert.equal(
      result.setupError,
      `novomodelo binary not found: ${missing}; set NOVOMODELO_BIN or put novomodelo on PATH`,
    );
    assert.deepEqual(result.problems, []);
  } finally {
    ws.cleanup();
  }
});

test("setupError: a binary that cannot be executed names the path and the cause", () => {
  const ws = workspace();
  try {
    chmodSync(ws.bin, 0o644);
    const result = run(ws, page(fence("accept", "{}")));
    assert.ok(
      result.setupError?.startsWith(`cannot run novomodelo binary ${ws.bin}: `),
      result.setupError,
    );
    assert.match(result.setupError, /EACCES/);
    assert.deepEqual(result.problems, []);
  } finally {
    ws.cleanup();
  }
});

// A copy of the stub under `<ws.root>/<dir>/novomodelo`; `ran` is written by any run of it.
function stubAt(ws, dir) {
  const folder = join(ws.root, dir);
  mkdirSync(folder, { recursive: true });
  const bin = join(folder, "novomodelo");
  writeFileSync(
    bin,
    STUB.replace(
      "const [command, ...args]",
      'fs.writeFileSync(process.env.STUB_RAN, "ran\\n");\nconst [command, ...args]',
    ),
  );
  chmodSync(bin, 0o755);
  return bin;
}

test("setupError: a binary inside a cargo build tree is refused, named by its real path, and never run", () => {
  const ws = workspace();
  const ran = join(ws.root, "ran");
  try {
    for (const dir of ["target/release", "target/debug", "x/target/release"]) {
      const bin = stubAt(ws, dir);
      const result = run(
        ws,
        page(fence("accept", "{}")),
        { STUB_RAN: ran },
        {
          novomodeloBin: bin,
        },
      );
      const real = realpathSync(bin);
      assert.equal(
        result.setupError,
        `novomodelo binary ${real} lies inside a cargo build tree (/target/release/ or /target/debug/); set NOVOMODELO_BIN or PATH to the pinned release binary`,
        dir,
      );
      assert.deepEqual(result.problems, [], dir);
      assert.equal(existsSync(ran), false, dir);
    }
  } finally {
    ws.cleanup();
  }
});

test("setupError: a bare novomodelo that PATH resolves into a cargo build tree is refused", () => {
  const ws = workspace();
  const ran = join(ws.root, "ran");
  try {
    const bin = stubAt(ws, "target/release");
    const result = run(
      ws,
      page(fence("accept", "{}")),
      { STUB_RAN: ran, PATH: `${dirname(bin)}${delimiter}${process.env.PATH}` },
      { novomodeloBin: "novomodelo" },
    );
    assert.match(
      result.setupError,
      new RegExp(
        `^novomodelo binary ${realpathSync(bin)} lies inside a cargo build tree`,
      ),
    );
    assert.equal(existsSync(ran), false);
  } finally {
    ws.cleanup();
  }
});

test("setupError: a symlink whose real path is inside a cargo build tree is refused", () => {
  const ws = workspace();
  const ran = join(ws.root, "ran");
  try {
    const bin = stubAt(ws, "target/release");
    mkdirSync(join(ws.root, "bin"));
    const link = join(ws.root, "bin", "novomodelo");
    symlinkSync(bin, link);
    const result = run(
      ws,
      page(fence("accept", "{}")),
      { STUB_RAN: ran },
      {
        novomodeloBin: link,
      },
    );
    assert.match(
      result.setupError,
      new RegExp(
        `^novomodelo binary ${realpathSync(bin)} lies inside a cargo build tree`,
      ),
    );
    assert.equal(existsSync(ran), false);
  } finally {
    ws.cleanup();
  }
});

test("a binary outside any cargo build tree runs, by path and as a bare novomodelo on PATH", () => {
  const ws = workspace();
  const ran = join(ws.root, "ran");
  try {
    for (const dir of ["bin", "mytarget/release", "target/release-notes"]) {
      const bin = stubAt(ws, dir);
      const text = page(fence("accept", "{}"), fence("reject", "BAD"));
      const byPath = run(ws, text, { STUB_RAN: ran }, { novomodeloBin: bin });
      assert.deepEqual(
        byPath,
        { setupError: null, problems: [], accepted: 1, rejected: 1 },
        dir,
      );
      assert.equal(existsSync(ran), true, dir);
      rmSync(ran);
      const bare = run(
        ws,
        text,
        {
          STUB_RAN: ran,
          PATH: `${dirname(bin)}${delimiter}${process.env.PATH}`,
        },
        { novomodeloBin: "novomodelo" },
      );
      assert.deepEqual(bare, byPath, dir);
      assert.equal(existsSync(ran), true, dir);
      rmSync(ran);
    }
  } finally {
    ws.cleanup();
  }
});

test("setupError: unreadable novomodelo version output", () => {
  const ws = workspace();
  try {
    const result = run(ws, page(fence("accept", "{}")), {
      STUB_VERSION: "garbage",
    });
    assert.equal(result.setupError, "unreadable novomodelo version output");
    assert.deepEqual(result.problems, []);
  } finally {
    ws.cleanup();
  }
});

test("setupError: a binary of another version", () => {
  const ws = workspace();
  try {
    const result = run(ws, page(fence("accept", "{}")), {
      STUB_VERSION: "novomodelo   v0.16.0",
    });
    assert.equal(
      result.setupError,
      "novomodelo version v0.16.0 differs from DEFAULT_NOVOMODELO_REF v0.17.0",
    );
    assert.deepEqual(result.problems, []);
  } finally {
    ws.cleanup();
  }
});

test("setupError: a missing fixture directory", () => {
  const ws = workspace();
  try {
    const fixtureDir = join(ws.root, "no-overlay");
    const result = run(ws, page(fence("accept", "{}")), {}, { fixtureDir });
    assert.equal(
      result.setupError,
      `fixture directory not found: ${fixtureDir}`,
    );
  } finally {
    ws.cleanup();
  }
});

test("setupError: novomodelo init failing carries its stderr", () => {
  const ws = workspace();
  try {
    const result = run(ws, page(fence("accept", "{}")), {
      STUB_INIT_FAIL: "1",
    });
    assert.equal(
      result.setupError,
      "novomodelo init failed (exit status 2): init boom",
    );
    assert.deepEqual(result.problems, []);
  } finally {
    ws.cleanup();
  }
});

test("NO-FENCES: an empty page and a page with only illustrative fences", () => {
  const ws = workspace();
  try {
    for (const text of ["", page(`${T}json title="${GC}"\n{}\n${T}`)]) {
      const result = run(ws, text);
      assert.equal(result.setupError, null);
      assert.deepEqual(result.problems, [
        {
          code: "NO-FENCES",
          line: null,
          detail: "the page holds no gc-check fence",
          at: "page.mdx",
        },
      ]);
    }
  } finally {
    ws.cleanup();
  }
});

test("FIXTURE-INVALID: an overlay novomodelo refuses, and no fence runs", () => {
  const ws = workspace({ [GC]: "BAD\n" });
  try {
    const result = run(ws, page(fence("accept", "{}"), fence("reject", "BAD")));
    assert.equal(result.accepted, 0);
    assert.equal(result.rejected, 0);
    assert.equal(result.problems.length, 1);
    assert.equal(result.problems[0].code, "FIXTURE-INVALID");
    assert.equal(result.problems[0].line, null);
    assert.ok(result.problems[0].detail.includes(ws.fixtureDir));
    assert.match(result.problems[0].detail, /\[SchemaViolation\].*BAD/);
  } finally {
    ws.cleanup();
  }
});

test("an overlay file reaches every spliced case, nested paths included", () => {
  const withMarker = workspace({ ...OVERLAY, "system/marker.json": "{}\n" });
  const without = workspace();
  try {
    const env = { STUB_REQUIRE: "system/marker.json" };
    const text = page(fence("accept", "{}"), fence("reject", "BAD"));
    assert.deepEqual(run(withMarker, text, env), {
      setupError: null,
      problems: [],
      accepted: 1,
      rejected: 1,
    });
    assert.deepEqual(
      run(without, text, env).problems.map((p) => p.code),
      ["FIXTURE-INVALID"],
    );
  } finally {
    withMarker.cleanup();
    without.cleanup();
  }
});

test("an overlay file replaces the scaffold file at the same path", () => {
  const ws = workspace();
  try {
    const result = run(ws, page(fence("accept", "{}", GP)), {
      STUB_INIT_BAD: "1",
    });
    assert.deepEqual(result, {
      setupError: null,
      problems: [],
      accepted: 1,
      rejected: 0,
    });
  } finally {
    ws.cleanup();
  }
});

test("the overlay's root README.md is not copied; a nested README.md is", () => {
  const ws = workspace({
    ...OVERLAY,
    "README.md": "# doc\n",
    "system/README.md": "# nested\n",
  });
  try {
    const result = run(ws, page(fence("accept", "{}")), {
      STUB_FORBID: "README.md",
      STUB_REQUIRE: "system/README.md",
    });
    assert.deepEqual(result, {
      setupError: null,
      problems: [],
      accepted: 1,
      rejected: 0,
    });
  } finally {
    ws.cleanup();
  }
});

test("each fence is spliced alone: an earlier fence does not leak into the next case", () => {
  const ws = workspace();
  try {
    const result = run(
      ws,
      page(fence("reject", "BAD"), fence("accept", "{}", GP)),
    );
    assert.deepEqual(result, {
      setupError: null,
      problems: [],
      accepted: 1,
      rejected: 1,
    });
  } finally {
    ws.cleanup();
  }
});

test("the temp directory is created under TMPDIR and removed, on success and on setupError", () => {
  const ws = workspace();
  const fresh = mkdtempSync(join(tmpdir(), "check-gc-examples-tmpdir-"));
  const log = join(ws.root, "validate.log");
  const saved = process.env.TMPDIR;
  process.env.TMPDIR = fresh;
  try {
    const text = page(fence("accept", "{}"), fence("reject", "BAD"));
    assert.equal(run(ws, text, { STUB_LOG: log }).problems.length, 0);
    const dirs = readFileSync(log, "utf8").trim().split("\n");
    assert.equal(dirs.length, 3);
    for (const dir of dirs) {
      assert.ok(dir.startsWith(join(fresh, "gc-examples-")), dir);
      assert.equal(existsSync(dir), false, dir);
    }
    assert.equal(
      run(ws, text, { STUB_INIT_FAIL: "1" }).setupError?.startsWith(
        "novomodelo init failed",
      ),
      true,
    );
    assert.deepEqual(
      readdirSync(fresh).filter((n) => n.startsWith("gc-examples-")),
      [],
    );
  } finally {
    if (saved === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = saved;
    rmSync(fresh, { recursive: true, force: true });
    ws.cleanup();
  }
});

// --- CLI (a copy of the script in a scratch repo layout, so the live page and
// overlay state never matter) -------------------------------------------------

const PAGE_REL = "src/content/docs/reference/generic-constraints.mdx";

function cliWorkspace({ pageText, overlay }) {
  const root = mkdtempSync(join(tmpdir(), "check-gc-examples-cli-"));
  mkdirSync(join(root, "scripts"));
  for (const name of ["check-gc-examples.mjs", "novomodelo-ref.mjs"]) {
    copyFileSync(join(dirname(SCRIPT), name), join(root, "scripts", name));
  }
  if (pageText !== undefined) {
    mkdirSync(join(root, dirname(PAGE_REL)), { recursive: true });
    writeFileSync(join(root, PAGE_REL), pageText);
  }
  if (overlay !== undefined) {
    const dir = join(root, "scripts", "fixtures", "gc-overlay");
    mkdirSync(dir, { recursive: true });
    for (const [rel, content] of Object.entries(overlay)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), content);
    }
  }
  const bin = join(root, "novomodelo");
  writeFileSync(bin, STUB);
  chmodSync(bin, 0o755);
  const exec = (env = {}) =>
    spawnSync(
      process.execPath,
      [join(root, "scripts", "check-gc-examples.mjs")],
      {
        encoding: "utf8",
        env: {
          ...withoutColorFlag(),
          NOVOMODELO_BIN: bin,
          STUB_VERSION: `novomodelo   ${DEFAULT_NOVOMODELO_REF}`,
          ...env,
        },
      },
    );
  return {
    root,
    exec,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test("CLI: every example behaves as marked -> one OK line, exit 0", () => {
  const cw = cliWorkspace({
    pageText: page(
      fence("accept", "{}"),
      fence("reject", "BAD"),
      fence("accept", "{}", GP),
    ),
    overlay: OVERLAY,
  });
  try {
    const result = cw.exec();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      result.stdout,
      `OK: 3 generic-constraint examples behave as marked under novomodelo ${DEFAULT_NOVOMODELO_REF} (2 accepted, 1 rejected)\n`,
    );
    assert.equal(result.stderr, "");
  } finally {
    cw.cleanup();
  }
});

test("CLI: problems -> FAIL count, one line per problem, exit 1", () => {
  const cw = cliWorkspace({
    pageText: page(fence("accept", "BAD"), fence("reject", "{}")),
    overlay: OVERLAY,
  });
  try {
    const result = cw.exec();
    assert.equal(result.status, 1);
    const lines = result.stdout.trimEnd().split("\n");
    assert.deepEqual(lines[0], "FAIL: 2 problem(s)");
    assert.match(
      lines[1],
      new RegExp(
        `^check:gc-examples: UNEXPECTED-REJECT ${PAGE_REL}:3 \\[SchemaViolation\\].*BAD$`,
      ),
    );
    assert.equal(
      lines[2],
      `check:gc-examples: UNEXPECTED-ACCEPT ${PAGE_REL}:7 novomodelo validate accepted the fence (exit status 0)`,
    );
    assert.equal(lines.length, 3);
  } finally {
    cw.cleanup();
  }
});

test("CLI: a missing binary prints one setup line and exits 2", () => {
  const cw = cliWorkspace({
    pageText: page(fence("accept", "{}")),
    overlay: OVERLAY,
  });
  try {
    const result = cw.exec({ NOVOMODELO_BIN: "/nonexistent/novomodelo" });
    assert.equal(result.status, 2);
    assert.equal(
      result.stderr,
      "check:gc-examples: novomodelo binary not found: /nonexistent/novomodelo; set NOVOMODELO_BIN or put novomodelo on PATH\n",
    );
    assert.equal(result.stdout, "");
  } finally {
    cw.cleanup();
  }
});

test("CLI: a binary of another version exits 2 naming DEFAULT_NOVOMODELO_REF", () => {
  const cw = cliWorkspace({
    pageText: page(fence("accept", "{}")),
    overlay: OVERLAY,
  });
  try {
    const result = cw.exec({ STUB_VERSION: "novomodelo   v0.0.1" });
    assert.equal(result.status, 2);
    assert.equal(
      result.stderr,
      `check:gc-examples: novomodelo version v0.0.1 differs from DEFAULT_NOVOMODELO_REF ${DEFAULT_NOVOMODELO_REF}\n`,
    );
  } finally {
    cw.cleanup();
  }
});

test("CLI: no scripts/fixtures/gc-overlay exits 2 naming that directory", () => {
  const cw = cliWorkspace({ pageText: page(fence("accept", "{}")) });
  try {
    const result = cw.exec();
    assert.equal(result.status, 2);
    assert.equal(
      result.stderr,
      `check:gc-examples: fixture directory not found: ${join(cw.root, "scripts", "fixtures", "gc-overlay")}\n`,
    );
  } finally {
    cw.cleanup();
  }
});

test("CLI: an unreadable page exits 2", () => {
  const cw = cliWorkspace({ overlay: OVERLAY });
  try {
    const result = cw.exec();
    assert.equal(result.status, 2);
    assert.match(
      result.stderr,
      new RegExp(`^check:gc-examples: could not read ${PAGE_REL}: `),
    );
  } finally {
    cw.cleanup();
  }
});

test("CLI: NOVOMODELO_BIN inside target/release exits 2 naming the real path, and a bare novomodelo on PATH does too", () => {
  const cw = cliWorkspace({
    pageText: page(fence("accept", "{}")),
    overlay: OVERLAY,
  });
  try {
    const dir = join(cw.root, "target", "release");
    mkdirSync(dir, { recursive: true });
    const bin = join(dir, "novomodelo");
    copyFileSync(join(cw.root, "novomodelo"), bin);
    chmodSync(bin, 0o755);
    const message = `check:gc-examples: novomodelo binary ${realpathSync(bin)} lies inside a cargo build tree (/target/release/ or /target/debug/); set NOVOMODELO_BIN or PATH to the pinned release binary\n`;
    const byPath = cw.exec({ NOVOMODELO_BIN: bin });
    assert.equal(byPath.status, 2);
    assert.equal(byPath.stderr, message);
    assert.equal(byPath.stdout, "");
    const bare = cw.exec({
      NOVOMODELO_BIN: "",
      PATH: `${dir}${delimiter}${process.env.PATH}`,
    });
    assert.equal(bare.status, 2);
    assert.equal(bare.stderr, message);
  } finally {
    cw.cleanup();
  }
});
