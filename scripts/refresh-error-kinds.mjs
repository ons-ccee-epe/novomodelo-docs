// Vendored error-kind variants refresh (ticket-214a, R63, ADR-020).
//
// `reference/error-codes.mdx` documents the variants of novomodelo's `ErrorKind`
// (novomodelo-io validation) and `LoadError` (novomodelo-io loader) enums. The interim
// error-coverage gate needs, in CI and without a novomodelo checkout, the declared
// variants of both and whether the code ever emits each one. This script
// vendors that data into scripts/error-kinds.json.
//
// Released-baseline rule (as refresh-schemas.mjs): content is read from an
// immutable git TAG via `git -C <novomodelo> ls-tree` / `show <ref>:<path>`, NEVER
// the novomodelo working tree, which can sit past the tag.
//
// Emitted rule (D-214a-1, XD-315, v0.18.0 ADR-008). A variant V of enum E is emitted
// iff some `crates/<crate>/src/**/*.rs` file, other than `tests.rs` /
// `test_support.rs`, holds a site of V outside comments, string literals and
// each item that follows a `#[cfg(test)]` attribute (the next `;`-terminated
// item or brace-matched block, never past the enclosing `}`). A site is
//   (a) an `E::V` that is not a pattern. A pattern is an occurrence inside a
//       `matches!(...)` call; preceded on its line by a `let` whose `=` has not
//       yet appeared, or by a leading `|` that is not a closure head (`|args|`
//       or `||`); or followed (after an optional brace- or paren-matched group
//       and any run of closing `)` / `]`) by `=>`, `|` or a guard `if`;
//   (b) a call `E::<helper>(` where <helper> is an associated fn of an
//       `impl E {` block, in E's defining file, whose body starts `Self::V`; or
//   (c) for `ErrorKind` only, when the ref holds
//       `crates/novomodelo-io/src/validation/rules.rs`: a `rules::NAME` (not
//       `my_rules::NAME`) where NAME is a row of that file's `declare_rules!`
//       table whose kind is V. A row is
//       `NAME = "id", Layer, Kind, Severity, "summary";`, read with comments
//       and literals masked; the `macro_rules! declare_rules` body holds none.
//       A malformed row, a Kind that is not an `ErrorKind` variant or a
//       Severity other than `Error` / `Warning` exits 2.
// `emitter` is the first site in path order, then line order, whichever clause
// found it.
//
// Usage:
//   node scripts/refresh-error-kinds.mjs [--novomodelo <path>] [--ref <git-ref>] [--check]
//     --novomodelo   path to a novomodelo checkout (default: $NOVOMODELO_REPO or ~/git/novomodelo);
//               used only to resolve the git object database.
//     --ref     git ref/tag to vendor from (default: DEFAULT_NOVOMODELO_REF).
//     --check   verify-only: compare scripts/error-kinds.json against <ref>,
//               write nothing; exit 1 naming each differing variant, else 0.
// A git failure, a missing enum, a bad `declare_rules!` table or an unknown
// flag exits 2.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DEFAULT_NOVOMODELO_REF } from "./novomodelo-ref.mjs";

const ENUMS = [
  {
    name: "ErrorKind",
    source: "crates/novomodelo-io/src/validation/mod.rs",
    rules: "crates/novomodelo-io/src/validation/rules.rs",
  },
  { name: "LoadError", source: "crates/novomodelo-io/src/error.rs" },
];
const SRC_FILE = /^crates\/[^/]+\/src\/.+\.rs$/;
const SEVERITIES = ["Error", "Warning"];
const STRING_LITERAL = /^(?:r#*)?"[\s\S]*"#*$/;
const GIT_MAX_BUFFER = 16 * 1024 * 1024;
const vendoredPath = fileURLToPath(
  new URL("./error-kinds.json", import.meta.url),
);

// --- Rust lexing (just enough to match braces and find items) ---------------

const IDENT_CHAR = /\w/;
const CLOSER = { "{": "}", "(": ")", "[": "]" };

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

// Index just past the comment, string, raw string or char literal that starts
// at `i` (a lifetime consumes only its quote); `i` itself when none starts.
function skipNonCode(text, i) {
  const c = text[i];
  if (c === "/" && text[i + 1] === "/") {
    const eol = text.indexOf("\n", i);
    return eol === -1 ? text.length : eol;
  }
  if (c === "/" && text[i + 1] === "*") {
    let depth = 1;
    let j = i + 2;
    while (j < text.length && depth > 0) {
      if (text.startsWith("/*", j)) {
        depth += 1;
        j += 2;
      } else if (text.startsWith("*/", j)) {
        depth -= 1;
        j += 2;
      } else {
        j += 1;
      }
    }
    return j;
  }
  const bytePrefixed =
    (text[i - 1] === "b" || text[i - 1] === "c") &&
    !IDENT_CHAR.test(text[i - 2] ?? "");
  if (c === "r" && (!IDENT_CHAR.test(text[i - 1] ?? "") || bytePrefixed)) {
    let hashes = i + 1;
    while (text[hashes] === "#") hashes++;
    if (text[hashes] === '"') {
      const close = `"${"#".repeat(hashes - i - 1)}`;
      const end = text.indexOf(close, hashes + 1);
      return end === -1 ? text.length : end + close.length;
    }
  }
  if (c === '"') {
    let j = i + 1;
    while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
    return j + 1;
  }
  if (c === "'") {
    if (text[i + 1] === "\\") {
      const end = text.indexOf("'", i + 3);
      return end === -1 ? text.length : end + 1;
    }
    return text[i + 2] === "'" ? i + 3 : i + 1;
  }
  return i;
}

function skipTrivia(text, i) {
  for (;;) {
    while (/\s/.test(text[i] ?? "")) i++;
    const next = text[i] === "/" ? skipNonCode(text, i) : i;
    if (next === i) return i;
    i = next;
  }
}

// Index of the bracket that closes the `{`, `(` or `[` at `open`.
function matchClose(text, open) {
  const opener = text[open];
  const closer = CLOSER[opener];
  let depth = 0;
  for (let i = open; i < text.length; ) {
    const next = skipNonCode(text, i);
    if (next !== i) {
      i = next;
      continue;
    }
    if (text[i] === opener) depth++;
    else if (text[i] === closer && --depth === 0) return i;
    i++;
  }
  throw new Error(
    `refresh:error-kinds: unbalanced '${opener}' opened at line ${lineOf(text, open)}`,
  );
}

// Index just past the item that starts at `i`: a `;`, or a brace-matched block.
// An unmatched `}` closes the block that encloses the item (an attribute on a
// field, variant or match arm) and ends it without being consumed; the later
// siblings in that block are stripped with it.
function itemEnd(text, i) {
  while (i < text.length) {
    const next = skipNonCode(text, i);
    if (next !== i) {
      i = next;
      continue;
    }
    const c = text[i];
    if (c === ";") return i + 1;
    if (c === "}") return i;
    if (c === "{") return matchClose(text, i) + 1;
    i = c === "(" || c === "[" ? matchClose(text, i) + 1 : i + 1;
  }
  return text.length;
}

// `text` with every comment, string literal and char literal blanked to spaces
// (newlines kept), so later scans see code only and keep their line numbers.
function maskNonCode(text) {
  let masked = "";
  let from = 0;
  for (let i = 0; i < text.length; ) {
    const next = skipNonCode(text, i);
    if (next - i > 1) {
      masked +=
        text.slice(from, i) + text.slice(i, next).replace(/[^\n]/g, " ");
      from = next;
    }
    i = next === i ? i + 1 : next;
  }
  return masked + text.slice(from);
}

// --- Pure helpers (exported for the node:test fixture) ----------------------

// Top-level variant names of `enum <enumName>` in declaration order.
export function parseEnumVariants(source, enumName) {
  const head = new RegExp(
    `^[ \\t]*(?:pub(?:\\([^)]*\\))?[ \\t]+)?enum[ \\t]+${enumName}[ \\t]*\\{`,
    "m",
  ).exec(source);
  if (!head) {
    throw new Error(`refresh:error-kinds: enum ${enumName} not found`);
  }
  const open = head.index + head[0].length - 1;
  const close = matchClose(source, open);
  const variants = [];
  let i = open + 1;
  while ((i = skipTrivia(source, i)) < close) {
    if (source[i] === ",") {
      i++;
    } else if (source[i] === "#") {
      i = matchClose(source, source.indexOf("[", i)) + 1;
    } else {
      const name = /^[A-Za-z_]\w*/.exec(source.slice(i, close))?.[0];
      if (name === undefined) {
        throw new Error(
          `refresh:error-kinds: unexpected '${source[i]}' in enum ${enumName} at line ${lineOf(source, i)}`,
        );
      }
      variants.push(name);
      i += name.length;
      while (i < close && source[i] !== ",") {
        const next = skipNonCode(source, i);
        if (next !== i) i = next;
        else i = source[i] in CLOSER ? matchClose(source, i) + 1 : i + 1;
      }
    }
  }
  if (variants.length === 0) {
    throw new Error(`refresh:error-kinds: enum ${enumName} has no variants`);
  }
  return variants;
}

// Associated fns of every `impl <enumName> {` block whose body starts
// `Self::<Variant>`, as a Map of fn name to variant name.
export function helperConstructors(source, enumName) {
  const helpers = new Map();
  const impl = new RegExp(`^[ \\t]*impl[ \\t]+${enumName}[ \\t]*\\{`, "gm");
  for (const block of source.matchAll(impl)) {
    const open = block.index + block[0].length - 1;
    const close = matchClose(source, open);
    let i = open + 1;
    while (i < close) {
      const next = skipNonCode(source, i);
      if (next !== i) {
        i = next;
        continue;
      }
      const fn = /^fn\s+(\w+)/.exec(source.slice(i, i + 80));
      if (fn && !IDENT_CHAR.test(source[i - 1])) {
        let j = matchClose(source, source.indexOf("(", i)) + 1;
        while (j < close && source[j] !== "{" && source[j] !== ";") {
          const skipped = skipNonCode(source, j);
          if (skipped !== j) j = skipped;
          else
            j =
              source[j] === "(" || source[j] === "["
                ? matchClose(source, j) + 1
                : j + 1;
        }
        if (source[j] === "{") {
          const body = skipTrivia(source, j + 1);
          const variant = /^Self::(\w+)/.exec(source.slice(body, body + 80));
          if (variant) helpers.set(fn[1], variant[1]);
          j = matchClose(source, j);
        }
        i = j + 1;
      } else {
        i = source[i] in CLOSER ? matchClose(source, i) + 1 : i + 1;
      }
    }
  }
  return helpers;
}

export function isTestOnlyPath(path) {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return name === "tests.rs" || name === "test_support.rs";
}

// Sorted `crates/<crate>/src/**/*.rs` paths of `git ls-tree -r --name-only`
// output, without the test-only files; throws when none is left (wrong ref, or
// a partial tree).
export function listSourcePaths(lsTreeStdout) {
  const paths = lsTreeStdout
    .split("\n")
    .filter((path) => SRC_FILE.test(path) && !isTestOnlyPath(path))
    .sort();
  if (paths.length === 0) {
    throw new Error(
      "refresh:error-kinds: no crates/*/src .rs files in the ref listing — wrong ref, or a partial tree?",
    );
  }
  return paths;
}

// `source` with comments, string and char literals, and every item that follows
// `#[cfg(test)]` blanked, keeping the line count so reported line numbers stay
// those of the original file.
export function stripTestCode(source) {
  const text = maskNonCode(source);
  const attribute = /#\[cfg\(test\)\]/g;
  let stripped = "";
  let from = 0;
  for (let m = attribute.exec(text); m; m = attribute.exec(text)) {
    const end = itemEnd(text, m.index + m[0].length);
    stripped +=
      text.slice(from, m.index) +
      text.slice(m.index, end).replace(/[^\n]/g, "");
    from = end;
    attribute.lastIndex = end;
  }
  return stripped + text.slice(from);
}

// `matchesCalls`: the [open, close] index pair of every `matches!(` call.
function isPattern(text, start, end, matchesCalls) {
  if (matchesCalls.some(([open, close]) => open < start && start < close)) {
    return true;
  }
  const prefix = text.slice(text.lastIndexOf("\n", start - 1) + 1, start);
  const closureHead = /\|[^|]*\|\s*$/.test(prefix);
  if (/\blet\s[^=]*$/.test(prefix) || (/^\s*\|/.test(prefix) && !closureHead)) {
    return true;
  }
  let i = skipTrivia(text, end);
  if (text[i] === "{" || text[i] === "(") {
    i = skipTrivia(text, matchClose(text, i) + 1);
  }
  while (text[i] === ")" || text[i] === "]") i = skipTrivia(text, i + 1);
  return (
    text.startsWith("=>", i) ||
    text[i] === "|" ||
    /^if\b/.test(text.slice(i, i + 3))
  );
}

// Constructor sites of `variants` of `enumName` in `source` (already run
// through stripTestCode), as [{ variant, line }] in source order.
export function constructorSites(source, enumName, variants, helpers) {
  const sites = [];
  const matchesCalls = [...source.matchAll(/\bmatches!\(/g)].map((m) => [
    m.index,
    matchClose(source, m.index + m[0].length - 1),
  ]);
  for (const m of source.matchAll(new RegExp(`\\b${enumName}::(\\w+)`, "g"))) {
    const end = m.index + m[0].length;
    let variant;
    if (variants.includes(m[1])) {
      if (!isPattern(source, m.index, end, matchesCalls)) variant = m[1];
    } else if (source[end] === "(") {
      variant = helpers.get(m[1]);
    }
    if (variants.includes(variant)) {
      sites.push({ variant, line: lineOf(source, m.index) });
    }
  }
  return sites;
}

// Rows of the `declare_rules!` table in `source`, as [{ name, id, layer, kind,
// severity, summary }] in declaration order, `id` and `summary` as literal
// source text. Throws a named error for a malformed row, a kind not in `kinds`,
// a severity other than Error or Warning, or a source with no row.
export function declareRulesRows(source, kinds) {
  const text = maskNonCode(source);
  const definitions = [
    ...text.matchAll(/\bmacro_rules!\s*declare_rules\s*\{/g),
  ].map((m) => [m.index, matchClose(text, m.index + m[0].length - 1)]);
  const rows = [];
  for (const m of text.matchAll(/\bdeclare_rules!\s*\{/g)) {
    if (definitions.some(([open, close]) => open < m.index && m.index < close))
      continue;
    const close = matchClose(text, m.index + m[0].length - 1);
    const malformed = (at) => {
      const semi = text.indexOf(";", at);
      const end = semi === -1 || semi > close ? close : semi + 1;
      const row = source.slice(at, end).replace(/\s+/g, " ").trim();
      return new Error(
        `refresh:error-kinds: malformed declare_rules! row at line ${lineOf(source, at)}: ${row}`,
      );
    };
    // On masked text each literal field is blank; `d` locates it in `source`.
    const rowPattern =
      /\s*([A-Za-z_]\w*)\s*=(\s*),\s*([A-Za-z_]\w*)\s*,\s*([A-Za-z_]\w*)\s*,\s*([A-Za-z_]\w*)\s*,(\s*);/dy;
    let end = m.index + m[0].length;
    rowPattern.lastIndex = end;
    let row;
    while ((row = rowPattern.exec(text))) {
      end = rowPattern.lastIndex;
      const [, name, , layer, kind, severity] = row;
      const at = row.indices[1][0];
      const [id, summary] = [2, 6].map((g) =>
        source.slice(...row.indices[g]).trim(),
      );
      if (!STRING_LITERAL.test(id) || !STRING_LITERAL.test(summary)) {
        throw malformed(at);
      }
      const named = `refresh:error-kinds: declare_rules! row ${name} (line ${lineOf(source, at)})`;
      if (!kinds.includes(kind)) {
        throw new Error(
          `${named} has kind '${kind}', which is not an ErrorKind variant`,
        );
      }
      if (!SEVERITIES.includes(severity)) {
        throw new Error(
          `${named} has severity '${severity}', not Error or Warning`,
        );
      }
      rows.push({ name, id, layer, kind, severity, summary });
    }
    const rest = text.slice(end, close).search(/\S/);
    if (rest !== -1) throw malformed(end + rest);
  }
  if (rows.length === 0) {
    throw new Error("refresh:error-kinds: no declare_rules! row found");
  }
  return rows;
}

// `rules::NAME` sites in `source` (already run through stripTestCode) whose
// NAME is a key of `rowsByName`, as [{ variant: the row's kind, line }].
export function rulesReferenceSites(source, rowsByName) {
  const sites = [];
  for (const m of source.matchAll(/\brules::(\w+)/g)) {
    const row = rowsByName.get(m[1]);
    if (row) sites.push({ variant: row.kind, line: lineOf(source, m.index) });
  }
  return sites;
}

// `enums`: [{ name, source, variants, emitters }], `emitters` a Map of variant
// name to the first "path:line" site. Key order is the file order.
export function buildVendored(ref, enums) {
  return {
    generatedBy: "scripts/refresh-error-kinds.mjs",
    ref,
    enums: enums.map(({ name, source, variants, emitters }) => ({
      name,
      source,
      variants: variants.map((variant) => ({
        name: variant,
        emitted: emitters.has(variant),
        emitter: emitters.get(variant) ?? null,
      })),
    })),
  };
}

export function serialize(vendored) {
  return `${JSON.stringify(vendored, null, 2)}\n`;
}

// Named differences between a committed scripts/error-kinds.json and the data
// just read from the ref; empty when the file is byte-identical to serialize().
export function diffVendored(committedText, vendored) {
  let committed;
  try {
    committed = JSON.parse(committedText);
  } catch (error) {
    return [
      `scripts/error-kinds.json is not well-formed JSON (${error.message})`,
    ];
  }
  const wellShaped =
    Array.isArray(committed?.enums) &&
    committed.enums.every(
      (e) =>
        typeof e?.name === "string" &&
        Array.isArray(e.variants) &&
        e.variants.every((x) => typeof x?.name === "string"),
    );
  if (!wellShaped) {
    return [
      "scripts/error-kinds.json does not have the vendored shape (enums[].variants[].name)",
    ];
  }
  const flatten = (v) =>
    new Map(
      v.enums.flatMap((e) => e.variants.map((x) => [`${e.name}.${x.name}`, x])),
    );
  const have = flatten(committed);
  const want = flatten(vendored);
  const diffs = [];
  if (committed.ref !== vendored.ref) {
    diffs.push(`ref (vendored ${committed.ref}, expected ${vendored.ref})`);
  }
  for (const [key, x] of want) {
    const old = have.get(key);
    if (!old) {
      diffs.push(`${key} (missing from the vendored copy)`);
    } else if (old.emitted !== x.emitted || old.emitter !== x.emitter) {
      diffs.push(
        `${key} (vendored emitted=${old.emitted} emitter=${old.emitter}; ${vendored.ref} has emitted=${x.emitted} emitter=${x.emitter})`,
      );
    }
  }
  for (const key of have.keys()) {
    if (!want.has(key)) diffs.push(`${key} (not declared at ${vendored.ref})`);
  }
  if (diffs.length === 0 && committedText !== serialize(vendored)) {
    diffs.push(
      "scripts/error-kinds.json (layout differs from the regenerated file)",
    );
  }
  return diffs;
}

// --- Git plumbing (execFileSync with an ARGS ARRAY — never a shell string) --

function git(novomodelo, args) {
  try {
    return execFileSync("git", ["-C", novomodelo, ...args], {
      encoding: "utf8",
      maxBuffer: GIT_MAX_BUFFER,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(
      `refresh:error-kinds: git ${args.join(" ")} failed in ${novomodelo} — is the tag fetched? (${error.message})`,
    );
  }
}

function readVendored(novomodelo, ref) {
  const show = (path) => git(novomodelo, ["show", `${ref}:${path}`]);
  const paths = listSourcePaths(
    git(novomodelo, ["ls-tree", "-r", "--name-only", ref, "--", "crates"]),
  );
  const enums = ENUMS.map(({ name, source, rules }) => {
    const text = show(source);
    const variants = parseEnumVariants(text, name);
    const rows = paths.includes(rules)
      ? declareRulesRows(show(rules), variants)
      : [];
    return {
      name,
      source,
      variants,
      helpers: helperConstructors(text, name),
      rowsByName: new Map(rows.map((row) => [row.name, row])),
      emitters: new Map(),
    };
  });
  for (const path of paths) {
    const text = show(path);
    const mentioned = enums.filter(
      (e) =>
        text.includes(`${e.name}::`) ||
        (e.rowsByName.size > 0 && text.includes("rules::")),
    );
    if (mentioned.length === 0) continue;
    try {
      const live = stripTestCode(text);
      for (const e of mentioned) {
        const sites = [
          ...constructorSites(live, e.name, e.variants, e.helpers),
          ...rulesReferenceSites(live, e.rowsByName),
        ].sort((x, y) => x.line - y.line);
        for (const { variant, line } of sites) {
          if (!e.emitters.has(variant))
            e.emitters.set(variant, `${path}:${line}`);
        }
      }
    } catch (error) {
      throw new Error(`${error.message} (${path})`);
    }
  }
  return buildVendored(ref, enums);
}

// --- Arg parsing and main ---------------------------------------------------

function parseArgs(argv) {
  let novomodelo = process.env.NOVOMODELO_REPO ?? join(homedir(), "git", "novomodelo");
  let ref = DEFAULT_NOVOMODELO_REF;
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--novomodelo") {
      novomodelo = argv[++i];
    } else if (arg === "--ref") {
      ref = argv[++i];
    } else if (arg === "--check") {
      check = true;
    } else {
      throw new Error(`refresh:error-kinds: unrecognized argument '${arg}'`);
    }
  }
  return { novomodelo, ref, check };
}

function main() {
  const { novomodelo, ref, check } = parseArgs(process.argv.slice(2));
  const vendored = readVendored(novomodelo, ref);

  if (check) {
    const drift = existsSync(vendoredPath)
      ? diffVendored(readFileSync(vendoredPath, "utf8"), vendored)
      : ["scripts/error-kinds.json (missing)"];
    if (drift.length > 0) {
      console.error(
        `refresh:error-kinds --check: scripts/error-kinds.json differs from ${ref} in ${drift.length} place(s):\n`,
      );
      for (const d of drift) console.error(`  ${d}`);
      process.exit(1);
    }
    console.log(
      `refresh:error-kinds --check: scripts/error-kinds.json matches ${ref}`,
    );
    return;
  }

  writeFileSync(vendoredPath, serialize(vendored));
  const count = vendored.enums.reduce((n, e) => n + e.variants.length, 0);
  console.log(
    `refresh:error-kinds: vendored ${count} variants of ${vendored.enums.length} enums from ${ref}`,
  );
}

// Run when executed as `node scripts/refresh-error-kinds.mjs`; stay inert when
// imported (mirrors refresh-schemas.mjs's direct-run guard).
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}
