// Unit fixture for the refresh:error-kinds pure helpers (ticket-214a).
//
// node:test + node:assert/strict, mirroring refresh-schemas.test.mjs. The unit
// cases run on inline Rust fixtures, with no git and no filesystem. The
// `declare_rules CLI:` cases run a scratch copy of the script on a temp git
// repo.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseEnumVariants,
  helperConstructors,
  stripTestCode,
  isTestOnlyPath,
  listSourcePaths,
  constructorSites,
  buildVendored,
  serialize,
  diffVendored,
  declareRulesRows,
  rulesReferenceSites,
} from "./refresh-error-kinds.mjs";

const rust = (strings) => String.raw(strings).replace(/^\n/, "");

const ENUM_SRC = rust`
use std::path::PathBuf;

/// Doc for E, which mentions E::A.
#[derive(Debug, thiserror::Error)]
pub enum E {
    /// Unit variant.
    A,
    /// Struct variant whose attribute string holds braces.
    #[error("b {path}: {message}")]
    B {
        /// Field doc.
        path: PathBuf,
        message: String,
    },
    #[error(
        "c {x} \
         continued"
    )]
    C(u8, String),
    // a comment with an unbalanced { brace
    D = 4,
}

impl E {
    pub fn b(path: impl AsRef<Path>, message: impl Into<String>) -> Self {
        Self::B {
            path: path.as_ref().to_path_buf(),
            message: message.into(),
        }
    }

    pub fn kind(&self) -> &'static str {
        match self {
            Self::A => "A",
            Self::B { .. } => "B",
        }
    }

    const fn d() -> Self {
        // the variant follows a comment
        Self::D
    }
}

impl Other {
    fn a() -> Self {
        Self::A
    }
}
`;

const VARIANTS = ["A", "B", "C", "D"];
const HELPERS = new Map([
  ["b", "B"],
  ["d", "D"],
]);
const sites = (source) =>
  constructorSites(stripTestCode(source), "E", VARIANTS, HELPERS).map(
    ({ variant, line }) => `${variant}:${line}`,
  );

test("parseEnumVariants reads unit, struct and tuple variants in declaration order", () => {
  assert.deepEqual(parseEnumVariants(ENUM_SRC, "E"), ["A", "B", "C", "D"]);
});

test("parseEnumVariants ignores doc comments, attributes with braces in strings, and a discriminant", () => {
  const source = rust`
#[derive(Debug)]
pub(crate) enum Kind {
    /// Kind::X is only a doc mention.
    #[error("{a} and {b}")]
    First,
    Second = 2,
}
`;
  assert.deepEqual(parseEnumVariants(source, "Kind"), ["First", "Second"]);
});

test("parseEnumVariants throws a named error for a missing enum", () => {
  assert.throws(
    () => parseEnumVariants(ENUM_SRC, "Missing"),
    /refresh:error-kinds: enum Missing not found/,
  );
});

test("helperConstructors maps fns whose body starts Self::Variant", () => {
  assert.deepEqual(helperConstructors(ENUM_SRC, "E"), HELPERS);
});

test("helperConstructors skips fns in other impl blocks and bodies that do not start Self::Variant", () => {
  const helpers = helperConstructors(ENUM_SRC, "E");
  assert.equal(helpers.has("kind"), false);
  assert.equal(helpers.has("a"), false);
});

test("isTestOnlyPath flags tests.rs and test_support.rs only", () => {
  assert.equal(isTestOnlyPath("crates/x/src/tests.rs"), true);
  assert.equal(isTestOnlyPath("crates/x/src/test_support.rs"), true);
  assert.equal(isTestOnlyPath("crates/x/src/lib.rs"), false);
  assert.equal(isTestOnlyPath("crates/x/src/my_tests.rs"), false);
});

test("stripTestCode blanks comment lines and keeps the line count", () => {
  const source = rust`
/// E::A in a doc comment
fn live() -> E {
    // E::B in a line comment
    E::C(1)
}
`;
  const stripped = stripTestCode(source);
  assert.equal(stripped.split("\n").length, source.split("\n").length);
  assert.doesNotMatch(stripped, /E::A|E::B/);
  assert.match(stripped, /E::C\(1\)/);
  assert.deepEqual(sites(source), ["C:4"]);
});

test("stripTestCode drops a #[cfg(test)] mod whose body holds braces in strings and chars", () => {
  const source = rust`
fn live() -> E { E::A }

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    fn one() {
        let s = "}";
        let q = "\"}";
        let c = '{';
    }
    fn two() {
        let e = E::D;
    }
}

fn after() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["A:1", "C:16"]);
});

test("stripTestCode keeps a live constructor that follows a #[cfg(test)] use at the top of the file", () => {
  const source = rust`
#[cfg(test)]
use crate::E::A;

fn live() -> E {
    E::B { path: p, message: m }
}
`;
  assert.deepEqual(sites(source), ["B:5"]);
});

test("stripTestCode drops a single #[cfg(test)] fn in the middle of the file and keeps the rest", () => {
  const source = rust`
fn one() -> E { E::A }

#[cfg(test)]
fn only_in_tests() -> E { E::B { path: p, message: m } }

fn two() -> E { E::C(2) }
`;
  assert.deepEqual(sites(source), ["A:1", "C:6"]);
});

test("constructorSites excludes a single-line match arm pattern but counts the arm's constructor", () => {
  const source = rust`
match x {
    E::A => E::B { path: p, message: m },
    E::B { .. } => 1,
    E::C(..) => 2,
}
`;
  assert.deepEqual(sites(source), ["B:2"]);
});

test("constructorSites excludes a multi-line struct pattern whose => follows the closing brace", () => {
  const source = rust`
match x {
    E::B {
        path,
        message,
    } => path,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites excludes an alternation line that starts with |", () => {
  const source = rust`
match x {
    E::A
    | E::C(_)
    | E::D if ok(x) => 1,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites excludes matches! and let-pattern uses but counts a let-bound constructor", () => {
  const source = rust`
let a = matches!(x, E::A | E::D);
let b = matches!(x, E::B { .. });
if let E::B { path, .. } = x {}
let built = E::C(4);
`;
  assert.deepEqual(sites(source), ["C:4"]);
});

test("constructorSites counts a closure constructor and a qualified path, not a longer enum name", () => {
  const source = rust`
let f = |e| E::C(e);
let g = crate::validation::E::A;
let h = OtherE::A;
let ok = a || E::D == x;
`;
  assert.deepEqual(sites(source), ["C:1", "A:2", "D:4"]);
});

test("constructorSites counts a helper call as its variant and ignores calls to other fns", () => {
  const source = rust`
let a = E::b("p", "m");
let b = E::d();
let c = E::kind(&x);
let d = E::b;
`;
  assert.deepEqual(sites(source), ["B:1", "D:2"]);
});

test("buildVendored keeps declaration order, the D-214a-2 key order, and a null emitter", () => {
  const vendored = buildVendored("v0.0.0", [
    {
      name: "E",
      source: "crates/x/src/e.rs",
      variants: ["A", "B"],
      emitters: new Map([["B", "crates/x/src/use.rs:7"]]),
    },
  ]);
  assert.deepEqual(Object.keys(vendored), ["generatedBy", "ref", "enums"]);
  assert.deepEqual(Object.keys(vendored.enums[0]), [
    "name",
    "source",
    "variants",
  ]);
  assert.deepEqual(vendored.enums[0].variants, [
    { name: "A", emitted: false, emitter: null },
    { name: "B", emitted: true, emitter: "crates/x/src/use.rs:7" },
  ]);
});

test("serialize is deterministic two-space JSON with a trailing newline", () => {
  const vendored = buildVendored("v0.0.0", [
    { name: "E", source: "e.rs", variants: ["A"], emitters: new Map() },
  ]);
  const text = serialize(vendored);
  assert.equal(text, serialize(vendored));
  assert.equal(text.endsWith("}\n"), true);
  assert.equal(text.startsWith('{\n  "generatedBy"'), true);
  assert.deepEqual(JSON.parse(text), vendored);
});

test("diffVendored is empty for a byte-identical copy and names a flipped variant", () => {
  const vendored = buildVendored("v0.0.0", [
    {
      name: "E",
      source: "e.rs",
      variants: ["A", "B"],
      emitters: new Map([["A", "e.rs:1"]]),
    },
  ]);
  const text = serialize(vendored);
  assert.deepEqual(diffVendored(text, vendored), []);

  const flipped = JSON.parse(text);
  flipped.enums[0].variants[1].emitted = true;
  const drift = diffVendored(serialize(flipped), vendored);
  assert.equal(drift.length, 1);
  assert.match(
    drift[0],
    /^E\.B \(vendored emitted=true emitter=null; v0\.0\.0 has emitted=false/,
  );

  const moved = JSON.parse(text);
  moved.enums[0].variants[0].emitter = "e.rs:2";
  const [change] = diffVendored(serialize(moved), vendored);
  assert.match(change, /^E\.A \(vendored emitted=true emitter=e\.rs:2;/);
});

test("diffVendored reports a ref change, a missing variant, an extra variant, and a layout-only change", () => {
  const vendored = buildVendored("v0.0.0", [
    { name: "E", source: "e.rs", variants: ["A", "B"], emitters: new Map() },
  ]);
  const older = buildVendored("v0.0.0", [
    { name: "E", source: "e.rs", variants: ["A", "Gone"], emitters: new Map() },
  ]);
  older.ref = "v0.0.-1";
  const drift = diffVendored(serialize(older), vendored);
  assert.deepEqual(drift, [
    "ref (vendored v0.0.-1, expected v0.0.0)",
    "E.B (missing from the vendored copy)",
    "E.Gone (not declared at v0.0.0)",
  ]);

  const compact = JSON.stringify(vendored);
  assert.deepEqual(diffVendored(compact, vendored), [
    "scripts/error-kinds.json (layout differs from the regenerated file)",
  ]);
});

test("diffVendored reports malformed JSON instead of throwing", () => {
  const vendored = buildVendored("v0.0.0", []);
  const drift = diffVendored("{ not json", vendored);
  assert.equal(drift.length, 1);
  assert.match(drift[0], /not well-formed JSON/);
});

// --- Lexer: raw strings, lifetimes, block comments, nested `;`, string attrs --

test("MA1 stripTestCode skips raw strings holding quotes, braces and a trailing backslash", () => {
  const windowsPath = rust`
#[cfg(test)]
mod tests {
    const WIN: &str = r"C:\dir\";
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(windowsPath), ["C:7"]);
  const jsonBody = rust`
#[cfg(test)]
mod tests {
    const JSON: &str = r#"{"k": "}"#;
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(jsonBody), ["C:7"]);
});

test("MA2 stripTestCode tells lifetimes and labels from char literals, escapes included", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    fn f<'a>(s: &'a str, t: &'a str, u: &'_ str) -> char { '}' }
    fn q() -> char { '\"' }
    fn r() -> char { '\'' }
    fn l() { 'outer: loop { break 'outer; } }
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:10"]);
});

test("MA3 stripTestCode skips a block comment holding a brace inside a #[cfg(test)] mod", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    /* a stray } in a block comment */
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:7"]);
});

test("MA4 stripTestCode ends a #[cfg(test)] item at its own ;, not a ; nested in [ ] or ( )", () => {
  const source = rust`
#[cfg(test)]
const FIXTURE: [E; 1] = [E::A];
#[cfg(test)]
fn t(buf: [u8; 4]) -> E { E::D }

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:6"]);
});

test("MA5 stripTestCode skips a #[cfg(test)] string inside an already-stripped test mod", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    fn split(src: &str) -> &str { src.split("#[cfg(test)]").next().unwrap() }
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  const stripped = stripTestCode(source);
  assert.equal(stripped.split("\n").length, source.split("\n").length);
  assert.deepEqual(sites(source), ["C:7"]);
});

test("stripTestCode resumes after a stripped item, so a #[cfg(test)] nested inside it leaks nothing", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    #[cfg(test)]
    fn inner() -> E { E::A }
    fn other() -> E { E::D }
}

fn live() -> E { E::C(1) }
`;
  const stripped = stripTestCode(source);
  assert.equal(stripped.split("\n").length, source.split("\n").length);
  assert.deepEqual(sites(source), ["C:8"]);
});

test("stripTestCode does not let a lifetime swallow the brace that follows it", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    fn g<'a, 'b>(x: &'a u8) where 'a: 'b{ 1 }
    fn h() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:7"]);
});

test("stripTestCode ignores a #[cfg(test)] that only appears in a live string or comment", () => {
  const source = rust`
let marker = "#[cfg(test)]";
/* #[cfg(test)] */
fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:3"]);
});

// --- Rule: nested patterns, guards, closures, matches!, strings and comments --

test("MD1 constructorSites excludes a variant pattern nested inside another pattern", () => {
  const source = rust`
match err {
    Self::Io(E::B { .. })
    | Self::Other => 1,
    Self::Io(E::A) => 2,
    Some(E::D) => 3,
    Err(E::C(_)) => 4,
}
fn live() -> Result<(), E> {
    if bad { return Err(E::C(1)); }
    match n {
        Some(0) => Err(E::B { path: p, message: m }),
        _ => Ok(()),
    }
}
`;
  assert.deepEqual(sites(source), ["C:9", "B:11"]);
});

test("constructorSites excludes a nested pattern that ends in ] and counts a constructor in a vec!", () => {
  const source = rust`
match x {
    Some([E::D]) => 1,
    _ => 2,
}
let v = vec![E::C(1)];
`;
  assert.deepEqual(sites(source), ["C:5"]);
});

test("SD1 constructorSites excludes a match arm with a guard, single- and multi-line", () => {
  const source = rust`
match x {
    E::A if ok(x) => 1,
    E::B { path, .. }
        if path.exists() =>
    {
        2
    }
    _ => 3,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites excludes a guarded nested pattern", () => {
  const source = rust`
match x {
    Some(E::D) if ok(x) => 1,
    _ => 2,
}
`;
  assert.deepEqual(sites(source), []);
});

test("SD2 constructorSites counts a closure constructor that starts its line", () => {
  const source = rust`
let parsed = parse(x).map_err(
    |message| E::B {
        path: p,
        message,
    },
)?;
let other = y.ok_or_else(
    || E::A,
)?;
`;
  assert.deepEqual(sites(source), ["B:2", "A:8"]);
});

test("constructorSites still excludes an alternation line that starts with | after a closure-free prefix", () => {
  const source = rust`
match x {
    E::C(_)
    | E::A
    | E::B { .. } => 1,
    _ => 2,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites excludes a variant in a tuple pattern on a line that starts with |", () => {
  const source = rust`
match pair {
    Pair::One
    | Pair::Two(E::B, _) => 1,
    _ => 2,
}
match pair {
    | E::A | Pair::Two(E::D, 1) => 1,
    _ => 2,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites counts a constructor on a line after a let without an initializer", () => {
  const source = rust`
let total;
return Err(E::C(1));
`;
  assert.deepEqual(sites(source), ["C:2"]);
});

test("SD3 constructorSites excludes a rustfmt-wrapped multi-line matches! pattern", () => {
  const source = rust`
if matches!(
    err,
    E::B { .. }
) {}
let k = matches!(x, E::A) && emit(E::C(1));
`;
  assert.deepEqual(sites(source), ["C:5"]);
});

test("SD4 constructorSites ignores E::V in strings, trailing comments and block comments", () => {
  const source = rust`
let s = "see E::A for details";
let t = r#"E::B {"#;
let n = 1; // not E::D
/*
 * E::A in a block comment
 */
fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:7"]);
});

test("constructorSites is not opened by a matches!( inside a string", () => {
  const source = rust`
let s = "matches!(";
let c = E::C(1);
`;
  assert.deepEqual(sites(source), ["C:2"]);
});

test("SD5 stripTestCode never strips past the block that encloses a #[cfg(test)] field", () => {
  const source = rust`
struct Counter {
    #[cfg(test)]
    calls: usize,
    n: u8,
}

impl Counter {
    fn fail() -> E { E::C(1) }
}
`;
  assert.deepEqual(sites(source), ["C:8"]);
});

test("SP1 constructorSites excludes a let-else pattern but counts the constructor in its else", () => {
  const source = rust`
let E::B { path, .. } = x else { return Err(E::C(1)) };
let Some(v) = opt else {
    return Err(E::A);
};
`;
  assert.deepEqual(sites(source), ["C:1", "A:3"]);
});

test("SP2 stripTestCode drops a #[cfg(test)] impl block and keeps the next live item", () => {
  const source = rust`
#[cfg(test)]
impl E {
    fn mock() -> Self { E::A }
}
fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:5"]);
});

test("SD7 parseEnumVariants reads a last variant without a trailing comma and a #[from] field", () => {
  const source = rust`
pub enum E {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    Last { x: HashMap<String, Vec<(u8, u8)>> }
}
`;
  assert.deepEqual(parseEnumVariants(source, "E"), ["Io", "Last"]);
});

// --- Guards: empty listing, empty enum, wrong-shape copy ------------------------

test("listSourcePaths keeps sorted crates/*/src .rs paths and drops test-only and other files", () => {
  const stdout = [
    "crates/b/src/lib.rs",
    "crates/a/src/tests.rs",
    "crates/a/src/validation/mod.rs",
    "crates/a/src/test_support.rs",
    "crates/a/tests/integration.rs",
    "crates/a/src/data.json",
    "crates/a/Cargo.toml",
    "",
  ].join("\n");
  assert.deepEqual(listSourcePaths(stdout), [
    "crates/a/src/validation/mod.rs",
    "crates/b/src/lib.rs",
  ]);
});

test("listSourcePaths throws a named error for an empty listing or one without source files", () => {
  assert.throws(
    () => listSourcePaths(""),
    /refresh:error-kinds: no crates\/\*\/src \.rs files/,
  );
  assert.throws(
    () => listSourcePaths("crates/a/src/tests.rs\ncrates/a/Cargo.toml\n"),
    /refresh:error-kinds: no crates\/\*\/src \.rs files/,
  );
});

test("parseEnumVariants throws a named error for an enum with no variants", () => {
  const source = rust`
pub enum E {
    // nothing declared
}
`;
  assert.throws(
    () => parseEnumVariants(source, "E"),
    /refresh:error-kinds: enum E has no variants/,
  );
});

test("SD6 diffVendored names a well-formed but wrong-shape copy instead of throwing", () => {
  const vendored = buildVendored("v0.0.0", [
    { name: "E", source: "e.rs", variants: ["A"], emitters: new Map() },
  ]);
  for (const text of [
    "{}",
    "null",
    "[]",
    '{"ref":"v0.0.0","enums":5}',
    '{"enums":[5]}',
    '{"enums":[{"name":"E"}]}',
    '{"enums":[{"name":"E","variants":[null]}]}',
    '{"enums":[{"variants":[]}]}',
    '{"enums":[{"name":7,"variants":[]}]}',
  ]) {
    const drift = diffVendored(text, vendored);
    assert.equal(drift.length, 1, text);
    assert.match(drift[0], /does not have the vendored shape/, text);
  }
});

test("stripTestCode masks raw byte and raw C strings without swallowing the code after them", () => {
  for (const literal of [
    String.raw`br"C:\"`,
    String.raw`br#"x "y"#`,
    String.raw`cr"z\"`,
  ]) {
    const source = `const S: &[u8] = ${literal};\nfn live() -> E { E::C(1) }\n`;
    assert.deepEqual(sites(source), ["C:2"], literal);
  }
});

test("stripTestCode masks a nested block comment without swallowing the code after it", () => {
  const source = rust`
/* outer /* inner */ "still comment */
fn live() -> E { E::C(1) }
/* outer /* inner */ E::A */
`;
  assert.deepEqual(sites(source), ["C:2"]);
});

test("a #[cfg(test)] field inside an E::V struct literal keeps the literal's own closing brace", () => {
  const source = rust`
let e = E::B {
    #[cfg(test)]
    trace: 1,
    path: p,
};
match y {
    E::A => 1,
}
`;
  assert.deepEqual(sites(source), ["B:1"]);
});

// --- Clause (c): declare_rules! rows and rules::NAME references ---------------

const DEFINITION = rust`
use super::{ErrorKind, Severity};

macro_rules! declare_rules {
    ($($name:ident = $id:literal, $layer:ident, $kind:ident, $severity:ident, $summary:literal;)+) => {
        $(
            pub(crate) const $name: ValidationRule = ValidationRule {
                id: $id,
                kind: ErrorKind::$kind,
                severity: Severity::$severity,
            };
        )+
    };
    (@nested) => {
        declare_rules! {
            IN_DEFINITION = "x.0", Semantic, InvalidValue, Error, "a row in the definition body";
        }
    };
}

`;

const TABLE = rust`
declare_rules! {
    ROW_ONE = "x.1", Structural, FileNotFound, Error, "A required file is missing";
    // A comment between rows, with a , and a ; in it.
    ROW_WRAPPED = "x.2",
        Semantic, InvalidValue, Warning,
        "A summary with ; and , and a \"quoted\" word";
}
`;

const KINDS = ["FileNotFound", "InvalidValue"];
const table = (...rows) =>
  `declare_rules! {\n${rows.map((row) => `    ${row}\n`).join("")}}\n`;
const ROW_ONE = TABLE.split("\n")[1].trim();

test('declare_rules: parses a one-line row and a rustfmt-wrapped row whose summary holds ;, , and \\"', () => {
  assert.deepEqual(declareRulesRows(TABLE, KINDS), [
    {
      name: "ROW_ONE",
      id: '"x.1"',
      layer: "Structural",
      kind: "FileNotFound",
      severity: "Error",
      summary: '"A required file is missing"',
    },
    {
      name: "ROW_WRAPPED",
      id: '"x.2"',
      layer: "Semantic",
      kind: "InvalidValue",
      severity: "Warning",
      summary: String.raw`"A summary with ; and , and a \"quoted\" word"`,
    },
  ]);
});

test("declare_rules: skips the macro_rules! declare_rules definition body", () => {
  const rows = declareRulesRows(DEFINITION + TABLE, KINDS);
  assert.deepEqual(
    rows.map((row) => row.name),
    ["ROW_ONE", "ROW_WRAPPED"],
  );
});

test("declare_rules: throws a named error for a malformed row", () => {
  for (const row of [
    'ROW_X = "x.3", Semantic, InvalidValue, "a row with no severity";',
    'ROW_X = "x.3", Semantic, InvalidValue, Error, "s", Extra;',
    'ROW_X = x.3, Semantic, InvalidValue, Error, "an id that is not a literal";',
    'ROW_X = /* no id */, Semantic, InvalidValue, Error, "a comment for an id";',
    'ROW_X = "x.3", Semantic, InvalidValue, Error, "no terminating semicolon"',
  ]) {
    assert.throws(
      () => declareRulesRows(table(ROW_ONE, row), KINDS),
      (error) =>
        error.message ===
        `refresh:error-kinds: malformed declare_rules! row at line 3: ${row}`,
      row,
    );
  }
});

test("declare_rules: throws a named error for a kind that is not an ErrorKind variant", () => {
  const swapped =
    'ROW_X = "x.3", InvalidValue, Semantic, Error, "layer and kind swapped";';
  assert.throws(
    () => declareRulesRows(table(ROW_ONE, swapped), KINDS),
    /^Error: refresh:error-kinds: declare_rules! row ROW_X \(line 3\) has kind 'Semantic', which is not an ErrorKind variant$/,
  );
});

test("declare_rules: throws a named error for a severity other than Error or Warning", () => {
  const info = 'ROW_X = "x.3", Semantic, InvalidValue, Info, "an info row";';
  assert.throws(
    () => declareRulesRows(table(ROW_ONE, info), KINDS),
    /^Error: refresh:error-kinds: declare_rules! row ROW_X \(line 3\) has severity 'Info', not Error or Warning$/,
  );
});

test("declare_rules: throws a named error when the file holds no declare_rules! row", () => {
  for (const source of [DEFINITION, `${DEFINITION}declare_rules! {}\n`, ""]) {
    assert.throws(
      () => declareRulesRows(source, KINDS),
      /^Error: refresh:error-kinds: no declare_rules! row found$/,
    );
  }
});

const ROWS_BY_NAME = new Map([
  ["ROW_ONE", { kind: "FileNotFound" }],
  ["ROW_WRAPPED", { kind: "InvalidValue" }],
]);
const references = (source) =>
  rulesReferenceSites(stripTestCode(source), ROWS_BY_NAME).map(
    ({ variant, line }) => `${variant}:${line}`,
  );

test("declare_rules: counts a live rules::NAME reference, plain or qualified, as its row's kind", () => {
  const source = rust`
fn check(ctx: &mut ValidationContext) {
    ctx.emit(&rules::ROW_ONE, "a");
    ctx.emit(
        &crate::validation::rules::ROW_WRAPPED,
        "b",
    );
    ctx.emit(&rules::ROW_ONE, "again");
}
`;
  assert.deepEqual(references(source), [
    "FileNotFound:2",
    "InvalidValue:4",
    "FileNotFound:7",
  ]);
});

test("declare_rules: no count inside a comment", () => {
  const source = rust`
/// Emits rules::ROW_ONE.
fn check(ctx: &mut ValidationContext) {
    // ctx.emit(&rules::ROW_ONE, "a");
    /* ctx.emit(&rules::ROW_ONE, "b"); */
    ctx.emit(&rules::ROW_WRAPPED, "live");
}
`;
  assert.deepEqual(references(source), ["InvalidValue:5"]);
});

test("declare_rules: no count inside a string", () => {
  const source = rust`
fn check(ctx: &mut ValidationContext) {
    let s = "rules::ROW_ONE";
    let r = r#"see rules::ROW_ONE"#;
    ctx.emit(&rules::ROW_WRAPPED, "live");
}
`;
  assert.deepEqual(references(source), ["InvalidValue:4"]);
});

test("declare_rules: no count inside a #[cfg(test)] item", () => {
  const source = rust`
fn check(ctx: &mut ValidationContext) {
    ctx.emit(&rules::ROW_WRAPPED, "live");
}

#[cfg(test)]
fn only_in_tests(ctx: &mut ValidationContext) {
    ctx.emit(&rules::ROW_ONE, "a");
}

#[cfg(test)]
mod tests {
    fn t() {
        let _ = super::rules::ROW_ONE;
    }
}
`;
  assert.deepEqual(references(source), ["InvalidValue:2"]);
});

test("declare_rules: no count for rules::RULES", () => {
  const source = rust`
fn ids() -> Vec<&'static str> {
    rules::RULES.iter().map(|rule| rule.id).collect()
}
fn check(ctx: &mut ValidationContext) {
    ctx.emit(&rules::ROW_WRAPPED, "live");
}
`;
  assert.deepEqual(references(source), ["InvalidValue:5"]);
});

test("declare_rules: no count for my_rules::X, even when X names a row", () => {
  const source = rust`
fn check(ctx: &mut ValidationContext) {
    ctx.emit(&my_rules::ROW_ONE, "another module");
    ctx.emit(&rules::ROW_WRAPPED, "live");
}
`;
  assert.deepEqual(references(source), ["InvalidValue:3"]);
});

test("declare_rules: no count for an undeclared rules::X_Y", () => {
  const source = rust`
fn check(ctx: &mut ValidationContext) {
    ctx.emit(&rules::X_Y, "undeclared");
    ctx.emit(&rules::ROW_ONE_EXTRA, "a longer name than a row");
    ctx.emit(&rules::ROW_WRAPPED, "live");
}
`;
  assert.deepEqual(references(source), ["InvalidValue:4"]);
});

// --- Clause (c) end to end: a scratch script copy on a temp git repo ----------

const SCRIPTS_DIR = fileURLToPath(new URL(".", import.meta.url));
const MOD_RS = "crates/novomodelo-io/src/validation/mod.rs";
const RULES_RS = "crates/novomodelo-io/src/validation/rules.rs";
const ERROR_RS = "crates/novomodelo-io/src/error.rs";
const CHECK_RS = "crates/novomodelo-io/src/validation/check.rs";

const ROWS = [
  'ROW_A = "fixture.1", Semantic, A, Error, "Referenced by live code";',
  'ROW_B = "fixture.2", Semantic, B, Warning, "Referenced only by a test";',
  'ROW_C = "fixture.3", Semantic, C, Error, "Unreferenced; C is constructed directly";',
  'ROW_D = "fixture.4", Semantic, D, Error, "Unreferenced";',
];

// LoadError::A shares its name with the kind of the live ROW_A, so a clause (c)
// that leaked past ErrorKind would mark it emitted.
const fixture = (rows = ROWS) => ({
  [MOD_RS]: rust`
pub mod rules;

pub enum ErrorKind {
    A,
    B,
    C,
    D,
}
`,
  [ERROR_RS]: rust`
pub enum LoadError {
    A,
}
`,
  [RULES_RS]: DEFINITION + table(...rows),
  [CHECK_RS]: rust`
use super::{ErrorKind, rules};

pub(crate) fn check(ctx: &mut ValidationContext) {
    ctx.emit(&rules::ROW_A, "a");
    ctx.push(ErrorKind::C, "c");
}

#[cfg(test)]
mod tests {
    #[test]
    fn b() {
        assert_eq!(super::rules::ROW_B.id, "fixture.2");
    }
}
`,
});

const expected = (emitters) =>
  buildVendored("HEAD", [
    {
      name: "ErrorKind",
      source: MOD_RS,
      variants: ["A", "B", "C", "D"],
      emitters: new Map(Object.entries(emitters)),
    },
    {
      name: "LoadError",
      source: ERROR_RS,
      variants: ["A"],
      emitters: new Map(),
    },
  ]);

function git(cwd, ...args) {
  execFileSync(
    "git",
    [
      "-C",
      cwd,
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      "user.name=refresh-error-kinds test",
      "-c",
      "user.email=refresh-error-kinds@test.invalid",
      ...args,
    ],
    { stdio: "ignore" },
  );
}

// Commits `files` (path to text) to a temp git repo and copies the script with
// novomodelo-ref.mjs to a scratch directory, where it writes its error-kinds.json.
function withFixture(files, fn) {
  const root = mkdtempSync(join(tmpdir(), "refresh-error-kinds-"));
  try {
    const repo = join(root, "novomodelo");
    const bin = join(root, "bin");
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(repo, path)), { recursive: true });
      writeFileSync(join(repo, path), text);
    }
    git(repo, "init", "-q");
    git(repo, "add", ".");
    git(repo, "commit", "-q", "-m", "fixture");
    mkdirSync(bin);
    for (const name of ["refresh-error-kinds.mjs", "novomodelo-ref.mjs"]) {
      copyFileSync(join(SCRIPTS_DIR, name), join(bin, name));
    }
    const run = (...args) =>
      spawnSync(
        process.execPath,
        [
          join(bin, "refresh-error-kinds.mjs"),
          "--novomodelo",
          repo,
          "--ref",
          "HEAD",
          ...args,
        ],
        { encoding: "utf8", cwd: root },
      );
    return fn({ run, vendored: join(bin, "error-kinds.json") });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const vendor = (files) =>
  withFixture(files, ({ run, vendored }) => {
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(readFileSync(vendored, "utf8"));
  });

test("declare_rules CLI: row A (live reference) and kind C (direct constructor) are emitted; B (test-only reference) and D (unused) are not", () => {
  assert.deepEqual(
    vendor(fixture()),
    expected({ A: `${CHECK_RS}:4`, C: `${CHECK_RS}:5` }),
  );
});

test("declare_rules CLI: clause (c) adds nothing when the ref holds no rules.rs", () => {
  const files = fixture();
  assert.deepEqual(
    vendor(files),
    expected({ A: `${CHECK_RS}:4`, C: `${CHECK_RS}:5` }),
  );
  delete files[RULES_RS];
  assert.deepEqual(vendor(files), expected({ C: `${CHECK_RS}:5` }));
});

test("declare_rules CLI: a malformed table exits 2 naming the row", () => {
  for (const [row, message] of [
    [
      'ROW_D = "fixture.4", Semantic, D, "Unreferenced";',
      /^refresh:error-kinds: malformed declare_rules! row at line \d+: ROW_D = "fixture\.4", Semantic, D, "Unreferenced";$/m,
    ],
    [
      'ROW_D = "fixture.4", Semantic, E, Error, "Unreferenced";',
      /^refresh:error-kinds: declare_rules! row ROW_D \(line \d+\) has kind 'E', which is not an ErrorKind variant$/m,
    ],
    [
      'ROW_D = "fixture.4", Semantic, D, Fatal, "Unreferenced";',
      /^refresh:error-kinds: declare_rules! row ROW_D \(line \d+\) has severity 'Fatal', not Error or Warning$/m,
    ],
  ]) {
    withFixture(fixture([...ROWS.slice(0, 3), row]), ({ run, vendored }) => {
      const result = run();
      assert.equal(result.status, 2, `${row}\n${result.stderr}`);
      assert.match(result.stderr, message, row);
      assert.equal(existsSync(vendored), false, row);
    });
  }
});

test("declare_rules CLI: --check exits 0 on a matching file, then 1 naming ErrorKind.A after a seeded flip", () => {
  withFixture(fixture(), ({ run, vendored }) => {
    const want = expected({ A: `${CHECK_RS}:4`, C: `${CHECK_RS}:5` });
    writeFileSync(vendored, serialize(want));
    const clean = run("--check");
    assert.equal(clean.status, 0, clean.stderr);
    assert.equal(
      clean.stdout,
      "refresh:error-kinds --check: scripts/error-kinds.json matches HEAD\n",
    );

    const flipped = structuredClone(want);
    Object.assign(flipped.enums[0].variants[0], {
      emitted: false,
      emitter: null,
    });
    writeFileSync(vendored, serialize(flipped));
    const drift = run("--check");
    assert.equal(drift.status, 1, drift.stderr);
    assert.match(drift.stderr, /differs from HEAD in 1 place\(s\)/);
    assert.ok(
      drift.stderr.includes(
        `ErrorKind.A (vendored emitted=false emitter=null; HEAD has emitted=true emitter=${CHECK_RS}:4)`,
      ),
      drift.stderr,
    );
  });
});

test("declare_rules CLI: the emitter is the first site in path, then line, order whichever clause found it", () => {
  const REPORT_RS = "crates/novomodelo-io/src/report.rs";
  const LATER_RS = "crates/novomodelo-io/src/validation/semantic.rs";
  const files = {
    ...fixture(),
    [REPORT_RS]: rust`
use crate::validation::rules;

pub fn rule() -> ValidationRule {
    rules::ROW_D
}
`,
    [CHECK_RS]: rust`
use super::{ErrorKind, rules};

pub(crate) fn check(ctx: &mut ValidationContext) {
    ctx.push(ErrorKind::B, "b");
    ctx.emit(&rules::ROW_A, "a");
    ctx.push(ErrorKind::A, "a");
    ctx.emit(&rules::ROW_B, "b");
    ctx.push(ErrorKind::C, "c");
    ctx.push(ErrorKind::D, "d");
}
`,
    [LATER_RS]: rust`
pub(crate) fn later(ctx: &mut ValidationContext) {
    ctx.emit(&super::rules::ROW_C, "c");
}
`,
  };
  assert.deepEqual(
    vendor(files),
    expected({
      A: `${CHECK_RS}:5`,
      B: `${CHECK_RS}:4`,
      C: `${CHECK_RS}:8`,
      D: `${REPORT_RS}:4`,
    }),
  );
});
