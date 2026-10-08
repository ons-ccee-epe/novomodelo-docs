// Unit tests for the check:error-coverage gate (E13 ticket-214, GRD-08).
// node:test + node:assert/strict, inline vendored objects and page texts: one
// seeded violation per code, the parsing edge cases of a kind section, and the
// CLI exit codes on temporary fixtures.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_NOVOMODELO_REF } from "./novomodelo-ref.mjs";
import {
  checkCoverage,
  parseKindSections,
  variantNames,
} from "./check-error-coverage.mjs";

const SCRIPT = fileURLToPath(
  new URL("./check-error-coverage.mjs", import.meta.url),
);
const REF = DEFAULT_NOVOMODELO_REF;
const RESERVED =
  "**Status:** Reserved. Case validation never reports this kind.";

const variant = (name, emitted) => ({
  name,
  emitted,
  emitter: emitted ? "crates/x/src/y.rs:1" : null,
});
const vendored = (variants, extraEnums = [], ref = REF) => ({
  ref,
  enums: [{ name: "ErrorKind", variants }, ...extraEnums],
});
const kind = (name, body = "**Severity:** Error") =>
  `### \`${name}\`\n\n${body}\n`;
const page = (...sections) =>
  `## Validation report kinds\n\n${sections.join("\n---\n\n")}`;

const V = vendored([variant("Alpha", true), variant("Beta", false)]);
const CLEAN = page(kind("Alpha"), kind("Beta", RESERVED));
const check = (v, text) => checkCoverage(v, text, REF);

test("a page with a section per emitted variant and a reserved one per unemitted variant is clean", () => {
  assert.deepEqual(check(V, CLEAN), []);
});

test("MISSING-SECTION: an emitted variant with no kind section", () => {
  assert.deepEqual(check(V, page(kind("Beta", RESERVED))), [
    { code: "MISSING-SECTION", name: "Alpha" },
  ]);
});

test("NOT-RESERVED: a non-emitted variant whose section lacks the status line", () => {
  assert.deepEqual(check(V, page(kind("Alpha"), kind("Beta"))), [
    { code: "NOT-RESERVED", name: "Beta" },
  ]);
});

test("STALE-RESERVED: an emitted variant whose section carries the status line", () => {
  assert.deepEqual(
    check(V, page(kind("Alpha", RESERVED), kind("Beta", RESERVED))),
    [{ code: "STALE-RESERVED", name: "Alpha" }],
  );
});

test("DUPLICATE: a vendored name with two kind sections", () => {
  assert.deepEqual(
    check(V, page(kind("Alpha"), kind("Alpha"), kind("Beta", RESERVED))),
    [{ code: "DUPLICATE", name: "Alpha" }],
  );
});

test("STALE-VENDOR: the vendored ref differs from the default ref", () => {
  const stale = vendored(V.enums[0].variants, [], "v0.0.1");
  assert.deepEqual(checkCoverage(stale, CLEAN, "v0.0.2"), [
    { code: "STALE-VENDOR", name: "v0.0.1 (DEFAULT_NOVOMODELO_REF v0.0.2)" },
  ]);
});

test("every violation is reported, STALE-VENDOR first, then the vendored order", () => {
  const v = vendored(
    [variant("Alpha", true), variant("Beta", false), variant("Gamma", true)],
    [],
    "v0.0.1",
  );
  const text = page(kind("Beta"), kind("Gamma", RESERVED), kind("Gamma"));
  assert.deepEqual(
    checkCoverage(v, text, "v0.0.2").map(({ code, name }) => `${code} ${name}`),
    [
      "STALE-VENDOR v0.0.1 (DEFAULT_NOVOMODELO_REF v0.0.2)",
      "MISSING-SECTION Alpha",
      "NOT-RESERVED Beta",
      "DUPLICATE Gamma",
      "STALE-RESERVED Gamma",
    ],
  );
});

test("a kind heading inside a fenced block is ignored", () => {
  const backticks = page("```text\n### `Alpha`\n```\n", kind("Beta", RESERVED));
  const tildes = page("~~~\n### `Alpha`\n~~~\n", kind("Beta", RESERVED));
  const mixed = page("~~~\n```\n### `Alpha`\n~~~\n", kind("Beta", RESERVED));
  for (const text of [backticks, tildes, mixed]) {
    assert.deepEqual(check(V, text), [
      { code: "MISSING-SECTION", name: "Alpha" },
    ]);
  }
});

test("a shorter fence line inside a longer fence does not close it", () => {
  const text = page(
    "````md\n```\n### `Alpha`\n```\n````\n",
    kind("Beta", RESERVED),
  );
  assert.deepEqual(check(V, text), [
    { code: "MISSING-SECTION", name: "Alpha" },
  ]);
});

test("a fence line with an info string does not close an open fence", () => {
  const text = page("```\n```text\n### `Alpha`\n```\n", kind("Beta", RESERVED));
  assert.deepEqual(check(V, text), [
    { code: "MISSING-SECTION", name: "Alpha" },
  ]);
});

test("a #### heading does not open a kind section", () => {
  const text = page("#### `Alpha`\n\nRule heading.\n", kind("Beta", RESERVED));
  assert.deepEqual(check(V, text), [
    { code: "MISSING-SECTION", name: "Alpha" },
  ]);
});

test("a heading whose backticked text is not one identifier does not open a kind section", () => {
  const text = page(
    "### `Alpha beta`\n\nBody.\n",
    "### The `Alpha` kind\n\nBody.\n",
    kind("Beta", RESERVED),
  );
  assert.deepEqual(check(V, text), [
    { code: "MISSING-SECTION", name: "Alpha" },
  ]);
});

test("a name in both enums is emitted when either variant is", () => {
  const both = (kindEmitted, loadEmitted) =>
    vendored(
      [variant("ParseError", kindEmitted)],
      [{ name: "LoadError", variants: [variant("ParseError", loadEmitted)] }],
    );
  const documented = page(kind("ParseError"));
  assert.deepEqual(check(both(true, false), documented), []);
  assert.deepEqual(check(both(false, true), documented), []);
  assert.deepEqual(check(both(true, true), documented), []);
  assert.deepEqual(
    check(both(true, false), page(kind("ParseError", RESERVED))),
    [{ code: "STALE-RESERVED", name: "ParseError" }],
  );
  assert.deepEqual(check(both(false, false), documented), [
    { code: "NOT-RESERVED", name: "ParseError" },
  ]);
  assert.deepEqual(check(both(true, false), page()), [
    { code: "MISSING-SECTION", name: "ParseError" },
  ]);
});

test("an undocumented non-emitted variant is not a violation", () => {
  assert.deepEqual(check(V, page(kind("Alpha"))), []);
});

test("a kind section naming no vendored variant is outside the check", () => {
  const text = page(
    CLEAN,
    kind("PolicyVersionMismatch"),
    kind("Unknown", RESERVED),
    kind("Unknown"),
  );
  assert.deepEqual(check(V, text), []);
});

test("the status line in a later #### of the section still counts", () => {
  const body = `Prose.\n\n#### A rule\n\n${RESERVED}\n`;
  assert.deepEqual(check(V, page(kind("Alpha"), kind("Beta", body))), []);
});

test("the status line is matched at line start in the body, not anywhere", () => {
  const notAtStart = [
    `See ${RESERVED}`,
    ` ${RESERVED}`,
    `- ${RESERVED}`,
    "**Status:** Reserved without the full stop",
    "**Severity:** Error (Status: Reserved.)",
  ];
  for (const body of notAtStart) {
    assert.deepEqual(check(V, page(kind("Alpha"), kind("Beta", body))), [
      { code: "NOT-RESERVED", name: "Beta" },
    ]);
  }
});

test("the status line of one section, or after the body ends, does not count for another", () => {
  const nextKind = page(kind("Alpha", RESERVED), kind("Beta"));
  assert.deepEqual(check(V, nextKind), [
    { code: "STALE-RESERVED", name: "Alpha" },
    { code: "NOT-RESERVED", name: "Beta" },
  ]);
  for (const heading of ["## Next group", "### Not a kind", "# Top"]) {
    const text = page(
      kind("Alpha"),
      kind("Beta", `Prose.\n\n${heading}\n\n${RESERVED}`),
    );
    assert.deepEqual(check(V, text), [{ code: "NOT-RESERVED", name: "Beta" }]);
  }
});

test("a status line inside a fenced block does not count", () => {
  const body = `Example:\n\n\`\`\`text\n${RESERVED}\n\`\`\`\n`;
  assert.deepEqual(check(V, page(kind("Alpha"), kind("Beta", body))), [
    { code: "NOT-RESERVED", name: "Beta" },
  ]);
});

test("CRLF line endings parse the same as LF", () => {
  const crlf = (text) => text.replaceAll("\n", "\r\n");
  assert.deepEqual(check(V, crlf(CLEAN)), []);
  assert.deepEqual(check(V, crlf(page(kind("Alpha"), kind("Beta")))), [
    { code: "NOT-RESERVED", name: "Beta" },
  ]);
  const fenced = page("```text\n### `Alpha`\n```\n", kind("Beta", RESERVED));
  assert.deepEqual(check(V, crlf(fenced)), [
    { code: "MISSING-SECTION", name: "Alpha" },
  ]);
});

test("parseKindSections counts headings per name and tracks the status line", () => {
  const sections = parseKindSections(
    page(kind("Alpha"), kind("Alpha", RESERVED), kind("Beta")),
  );
  assert.deepEqual(
    [...sections],
    [
      ["Alpha", { count: 2, reserved: true }],
      ["Beta", { count: 1, reserved: false }],
    ],
  );
});

test("variantNames merges by name with OR and throws on a shape it cannot read", () => {
  assert.deepEqual(
    [
      ...variantNames(
        vendored(
          [variant("A", false), variant("B", true)],
          [{ name: "LoadError", variants: [variant("A", true)] }],
        ),
      ),
    ],
    [
      ["A", true],
      ["B", true],
    ],
  );
  const unreadable = [
    null,
    {},
    { ref: REF },
    { ref: REF, enums: "ErrorKind" },
    { ref: 7, enums: [{ name: "E", variants: [variant("A", true)] }] },
    { ref: REF, enums: [] },
    { ref: REF, enums: [{ name: "E", variants: [] }] },
    { ref: REF, enums: [{ name: "E" }] },
    { ref: REF, enums: [{ name: "E", variants: [{ name: "A" }] }] },
    {
      ref: REF,
      enums: [{ name: "E", variants: [{ name: "A", emitted: "yes" }] }],
    },
    { ref: REF, enums: [{ name: "E", variants: [{ emitted: true }] }] },
  ];
  for (const bad of unreadable) {
    assert.throws(() => variantNames(bad), Error, JSON.stringify(bad));
  }
});

// --- CLI exit codes ----------------------------------------------------------

function cli(files, extraArgs = []) {
  const dir = mkdtempSync(join(tmpdir(), "check-error-coverage-"));
  try {
    for (const [name, text] of Object.entries(files)) {
      writeFileSync(join(dir, name), text);
    }
    const args = [
      SCRIPT,
      "--vendored",
      join(dir, "kinds.json"),
      "--page",
      join(dir, "page.mdx"),
      ...extraArgs,
    ];
    return spawnSync(process.execPath, args, { encoding: "utf8" });
  } finally {
    for (const name of readdirSync(dir)) unlinkSync(join(dir, name));
    rmdirSync(dir);
  }
}

test("CLI exits 0 and prints the OK summary on a clean page", () => {
  const three = vendored([
    variant("Alpha", true),
    variant("Beta", false),
    variant("Gamma", true),
  ]);
  const text = page(kind("Alpha"), kind("Beta", RESERVED), kind("Gamma"));
  const result = cli({ "kinds.json": JSON.stringify(three), "page.mdx": text });
  assert.equal(result.status, 0);
  assert.equal(
    result.stdout,
    `OK: 3 vendored variants at ${REF} covered by error-codes (1 reserved)\n`,
  );
  assert.equal(result.stderr, "");
});

test("CLI exits 1 with a FAIL line and one line per violation", () => {
  const result = cli({
    "kinds.json": JSON.stringify(V),
    "page.mdx": page(kind("Beta")),
  });
  assert.equal(result.status, 1);
  const lines = result.stdout.trimEnd().split("\n");
  assert.match(lines[0], /^FAIL: /);
  assert.deepEqual(lines.slice(1), [
    "check:error-coverage: MISSING-SECTION Alpha",
    "check:error-coverage: NOT-RESERVED Beta",
  ]);
});

test("CLI exits 2 with a check:error-coverage message on input it cannot read", () => {
  const good = { "kinds.json": JSON.stringify(V), "page.mdx": CLEAN };
  const cases = {
    "missing page": { ...good, "page.mdx": undefined },
    "missing vendored file": { ...good, "kinds.json": undefined },
    "malformed JSON": { ...good, "kinds.json": "{ not json" },
    "unreadable shape": { ...good, "kinds.json": '{"ref":"v0","enums":"x"}' },
  };
  for (const [label, files] of Object.entries(cases)) {
    const present = Object.fromEntries(
      Object.entries(files).filter(([, text]) => text !== undefined),
    );
    const result = cli(present);
    assert.equal(result.status, 2, label);
    assert.match(result.stderr, /^check:error-coverage: /, label);
    assert.equal(result.stdout, "", label);
  }
  const unknown = cli(good, ["--bogus"]);
  assert.equal(unknown.status, 2);
  assert.match(
    unknown.stderr,
    /^check:error-coverage: unrecognized argument '--bogus'/,
  );
});

test("M1 a page that ends inside an unclosed fence is unreadable, not silently truncated", () => {
  for (const fence of ["```text", "~~~", "````md"]) {
    const text = page(kind("Alpha"), `${fence}\nunterminated\n`, kind("Beta"));
    assert.throws(() => check(V, text), /unclosed code fence/, fence);
  }
});

test("M1b CLI exits 2 on a page that ends inside an unclosed fence", () => {
  const text = page(
    kind("Alpha"),
    kind("Beta", RESERVED),
    "```text\nunterminated\n",
  );
  const result = cli({ "kinds.json": JSON.stringify(V), "page.mdx": text });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /^check:error-coverage: .*unclosed code fence/);
  assert.equal(result.stdout, "");
});

test("M2 CLI reports STALE-VENDOR against DEFAULT_NOVOMODELO_REF", () => {
  const result = cli({
    "kinds.json": JSON.stringify({ ...V, ref: "v0.0.1" }),
    "page.mdx": CLEAN,
  });
  assert.equal(result.status, 1);
  assert.deepEqual(result.stdout.trimEnd().split("\n").slice(1), [
    `check:error-coverage: STALE-VENDOR v0.0.1 (DEFAULT_NOVOMODELO_REF ${REF})`,
  ]);
});

test("M3 CLI OK line counts entries per enum and reserved per name", () => {
  const dual = vendored(
    [variant("Alpha", true), variant("Beta", false)],
    [
      {
        name: "LoadError",
        variants: [variant("Alpha", true), variant("Gamma", false)],
      },
    ],
  );
  const text = page(
    kind("Alpha"),
    kind("Beta", RESERVED),
    kind("Gamma", RESERVED),
  );
  const result = cli({ "kinds.json": JSON.stringify(dual), "page.mdx": text });
  assert.equal(result.status, 0);
  assert.equal(
    result.stdout,
    `OK: 4 vendored variants at ${REF} covered by error-codes (2 reserved)\n`,
  );
});

test("S1 DUPLICATE also applies to a non-emitted (reserved) variant", () => {
  assert.deepEqual(
    check(
      V,
      page(kind("Alpha"), kind("Beta", RESERVED), kind("Beta", RESERVED)),
    ),
    [{ code: "DUPLICATE", name: "Beta" }],
  );
});

test("S2 a flag with no value exits 2", () => {
  for (const flag of ["--vendored", "--page"]) {
    const result = spawnSync(process.execPath, [SCRIPT, flag], {
      encoding: "utf8",
    });
    assert.equal(result.status, 2, flag);
    assert.match(result.stderr, /^check:error-coverage: /, flag);
  }
});

test("S3 a null enum entry is an unreadable shape", () => {
  assert.throws(() => variantNames({ ref: REF, enums: [null] }), Error);
  assert.throws(
    () => variantNames({ ref: REF, enums: [{ name: "E", variants: null }] }),
    Error,
  );
});
