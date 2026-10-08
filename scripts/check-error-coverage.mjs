// Error-kind coverage gate (E13 ticket-214, GRD-08; R63, R65, R88, ADR-018, ADR-020).
//
// reference/error-codes.mdx documents the variants of novomodelo's `ErrorKind` and
// `LoadError` enums, one kind section per name. This gate keeps the page in step
// with the vendored copy of those variants in scripts/error-kinds.json
// (refresh:error-kinds), which records whether the code ever constructs each
// one, so CI needs no novomodelo checkout.
//
// A kind section is a `###` heading whose text is exactly one backticked
// identifier, outside fenced code; its body runs to the next `#`, `##` or `###`
// heading, so `####` rule headings stay inside it. A reserved kind's body has a
// line starting `**Status:** Reserved.` outside fenced code. A name in both
// enums (`ParseError`) is emitted if either variant is, and has one section.
//
// Violations, each printed as `check:error-coverage: <CODE> <name>`:
//   MISSING-SECTION  an emitted variant with no kind section;
//   NOT-RESERVED     a non-emitted variant whose section lacks the status line
//                    (an undocumented non-emitted variant is not a violation);
//   STALE-RESERVED   an emitted variant whose section carries the status line;
//   DUPLICATE        a vendored name with more than one kind section;
//   STALE-VENDOR     the vendored `ref` differs from DEFAULT_NOVOMODELO_REF.
// Kind sections that name no vendored variant are outside the check.
//
// Usage: node scripts/check-error-coverage.mjs [--vendored <file>] [--page <file>]
// Exit 0 when the page and the vendored variants agree; 1 listing every
// violation; 2 on a usage, I/O or malformed-input error (including a page that
// ends inside an unclosed code fence). Reads source files only.

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DEFAULT_NOVOMODELO_REF } from "./novomodelo-ref.mjs";

const DEFAULT_VENDORED = fileURLToPath(
  new URL("./error-kinds.json", import.meta.url),
);
const DEFAULT_PAGE = fileURLToPath(
  new URL("../src/content/docs/reference/error-codes.mdx", import.meta.url),
);

const KIND_HEADING = /^###\s+`([A-Za-z_]\w*)`\s*$/;
const ANY_HEADING = /^#{1,3}\s/;
const RESERVED_LINE = /^\*\*Status:\*\* Reserved\./;

// --- Pure helpers (exported for scripts/check-error-coverage.test.mjs) ------

// Vendored object -> Map<variant name, emitted>; a name in both enums is
// emitted if either variant is. Throws on any shape it cannot read.
export function variantNames(vendored) {
  if (typeof vendored?.ref !== "string" || !Array.isArray(vendored.enums)) {
    throw new Error("vendored file needs a string `ref` and an `enums` array");
  }
  const names = new Map();
  for (const { name: enumName, variants } of vendored.enums) {
    if (!Array.isArray(variants)) {
      throw new Error(`vendored enum ${enumName} has no \`variants\` array`);
    }
    for (const variant of variants) {
      if (
        typeof variant?.name !== "string" ||
        typeof variant.emitted !== "boolean"
      ) {
        throw new Error(
          `vendored enum ${enumName} has a malformed variant: ${JSON.stringify(variant)}`,
        );
      }
      names.set(
        variant.name,
        (names.get(variant.name) ?? false) || variant.emitted,
      );
    }
  }
  if (names.size === 0) throw new Error("vendored file lists no variants");
  return names;
}

// Page text -> Map<kind name, { count, reserved }>.
export function parseKindSections(text) {
  const sections = new Map();
  let fence = null;
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (marker) {
      if (fence === null) fence = marker[1];
      else if (
        marker[2].trim() === "" &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length
      ) {
        fence = null;
      }
      continue;
    }
    if (fence !== null) continue;
    const kind = line.match(KIND_HEADING);
    if (kind) {
      current = sections.get(kind[1]) ?? { count: 0, reserved: false };
      current.count += 1;
      sections.set(kind[1], current);
    } else if (ANY_HEADING.test(line)) {
      current = null;
    } else if (current !== null && RESERVED_LINE.test(line)) {
      current.reserved = true;
    }
  }
  if (fence !== null) {
    throw new Error("the page ends inside an unclosed code fence");
  }
  return sections;
}

export function checkCoverage(vendored, pageText, defaultRef) {
  const names = variantNames(vendored);
  const sections = parseKindSections(pageText);
  const violations = [];
  if (vendored.ref !== defaultRef) {
    violations.push({
      code: "STALE-VENDOR",
      name: `${vendored.ref} (DEFAULT_NOVOMODELO_REF ${defaultRef})`,
    });
  }
  for (const [name, emitted] of names) {
    const section = sections.get(name);
    if (section !== undefined && section.count > 1) {
      violations.push({ code: "DUPLICATE", name });
    }
    if (emitted && section === undefined) {
      violations.push({ code: "MISSING-SECTION", name });
    } else if (emitted && section.reserved) {
      violations.push({ code: "STALE-RESERVED", name });
    } else if (!emitted && section !== undefined && !section.reserved) {
      violations.push({ code: "NOT-RESERVED", name });
    }
  }
  return violations;
}

// --- CLI ---------------------------------------------------------------------

function parseArgs(argv) {
  let vendored = DEFAULT_VENDORED;
  let page = DEFAULT_PAGE;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--vendored") vendored = argv[++i];
    else if (argv[i] === "--page") page = argv[++i];
    else throw new Error(`unrecognized argument '${argv[i]}'`);
  }
  return { vendored, page };
}

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`cannot read ${path}: ${error.message}`);
  }
}

function run(argv) {
  const { vendored: vendoredPath, page: pagePath } = parseArgs(argv);
  const vendoredText = readText(vendoredPath);
  let vendored;
  try {
    vendored = JSON.parse(vendoredText);
  } catch (error) {
    throw new Error(
      `malformed vendored file ${vendoredPath}: ${error.message}`,
    );
  }
  const violations = checkCoverage(
    vendored,
    readText(pagePath),
    DEFAULT_NOVOMODELO_REF,
  );
  if (violations.length > 0) {
    console.log(
      "FAIL: reference/error-codes.mdx disagrees with the vendored ErrorKind/LoadError variants (scripts/error-kinds.json, npm run refresh:error-kinds):",
    );
    for (const { code, name } of violations) {
      console.log(`check:error-coverage: ${code} ${name}`);
    }
    return 1;
  }
  const names = variantNames(vendored);
  const entries = vendored.enums.reduce((n, e) => n + e.variants.length, 0);
  const reserved = [...names.values()].filter((emitted) => !emitted).length;
  console.log(
    `OK: ${entries} vendored variants at ${vendored.ref} covered by error-codes (${reserved} reserved)`,
  );
  return 0;
}

function main() {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    console.error(`check:error-coverage: ${error.message}`);
    process.exitCode = 2;
  }
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
