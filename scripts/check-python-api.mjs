// Python API coverage gate (E14 ticket-233, GRD-04; R87, R98, ADR-025).
//
// reference/python-api.mdx is hand-written (ADR-025); this gate keeps it in step
// with the vendored novomodelo-python stubs in scripts/pystubs/ (refresh:pystubs) in
// both directions:
//   - every public stub symbol has an identifier heading on the page, written as
//     its qualified name in backticks (`### \`novomodelo.results.load_convergence\``);
//     the heading's slug is the symbol's anchor;
//   - every such heading names a symbol the stubs declare (no phantom anchor);
//   - every annotated field of a stub class (model attributes, TypedDict keys,
//     SolverError attributes) is a row of a table under that class heading,
//     first cell the backticked field name, and every such row names a field
//     (checked only for classes that declare fields, so a constructor or
//     parameter table under a field-less class such as novomodelo.Study is free).
// Symbols: one per stub module (`novomodelo` for __init__.pyi, else `novomodelo.<stem>`),
// per module-level def, class and annotated name, and per method or property of
// a module-level class. A name is public unless it starts with `_`; dunder names
// such as `__version__` are public, and `__init__` is documented by its class
// heading. Import lines are re-exports, never new symbols. Headings inside
// fenced code are ignored.
//
// Usage: node scripts/check-python-api.mjs [--stubs <dir>] [--page <file>]
// Exit 0 when the page and the stubs agree; 1 listing every finding; 2 on a
// usage or I/O error. Reads source files only (no build).

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_STUBS = fileURLToPath(new URL("./pystubs/", import.meta.url));
const DEFAULT_PAGE = fileURLToPath(
  new URL("../src/content/docs/reference/python-api.mdx", import.meta.url),
);

// --- Pure helpers (exported for scripts/check-python-api.test.mjs) ----------

export function isPublic(name) {
  if (name === "__init__") return false;
  return !name.startsWith("_") || /^__\w+__$/.test(name);
}

export function moduleName(fileName) {
  const stem = basename(fileName).replace(/\.pyi$/, "");
  return stem === "__init__" ? "novomodelo" : `novomodelo.${stem}`;
}

// One stub's text -> { headings: [qualified names], fields: Map<class, [field]> }.
export function parseStub(text, mod) {
  const headings = [mod];
  const fields = new Map();
  let inDocstring = false;
  let cls = null;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const quotes = (line.match(/"""/g) ?? []).length;
    if (inDocstring) {
      if (quotes % 2 === 1) inDocstring = false;
      continue;
    }
    if (quotes % 2 === 1) inDocstring = true;
    const code = line.split('"""')[0].replace(/\s+$/, "");
    if (code.length === 0) continue;
    const indent = code.length - code.trimStart().length;
    const body = code.trim();
    let m;
    if (indent === 0) {
      cls = null;
      if ((m = body.match(/^class\s+([A-Za-z_]\w*)/))) {
        if (isPublic(m[1])) {
          cls = `${mod}.${m[1]}`;
          headings.push(cls);
          fields.set(cls, []);
        }
      } else if ((m = body.match(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/)) && isPublic(m[1])) {
        headings.push(`${mod}.${m[1]}`);
      } else if ((m = body.match(/^([A-Za-z_]\w*)\s*:/)) && isPublic(m[1])) {
        headings.push(`${mod}.${m[1]}`);
      }
    } else if (cls !== null && indent === 4) {
      if ((m = body.match(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/)) && isPublic(m[1])) {
        headings.push(`${cls}.${m[1]}`);
      } else if ((m = body.match(/^([A-Za-z_]\w*)\s*:/)) && isPublic(m[1])) {
        fields.get(cls).push(m[1]);
      }
    }
  }
  return { headings, fields };
}

// Merge every stub of a directory listing ([{ name, text }]).
export function collectSymbols(stubs) {
  const headings = [];
  const fields = new Map();
  for (const { name, text } of stubs) {
    const parsed = parseStub(text, moduleName(name));
    headings.push(...parsed.headings);
    for (const [cls, list] of parsed.fields) fields.set(cls, list);
  }
  return { headings, fields };
}

// The page's identifier headings and the backticked first cells of the table
// rows under each of them.
export function parsePage(text) {
  const headings = [];
  const rows = new Map();
  let fence = null;
  let current = null;
  text.split("\n").forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (fence === null) fence = marker[1];
      else if (line.trim().startsWith(fence)) fence = null;
      return;
    }
    if (fence !== null) return;
    const heading = line.match(/^(#{2,6})\s+`(novomodelo(?:\.[A-Za-z_]\w*)*)`\s*$/);
    if (heading) {
      current = heading[2];
      headings.push({ name: current, line: index + 1 });
      if (!rows.has(current)) rows.set(current, []);
      return;
    }
    if (/^#{1,6}\s/.test(line)) {
      current = null;
      return;
    }
    const row = line.match(/^\|\s*`([A-Za-z_]\w*)`\s*\|/);
    if (row && current !== null) rows.get(current).push(row[1]);
  });
  return { headings, rows };
}

export function checkCoverage(symbols, page) {
  const findings = [];
  const expected = new Set(symbols.headings);
  const seen = new Set();
  for (const { name, line } of page.headings) {
    if (seen.has(name)) findings.push(`DUPLICATE\t${name}\tline ${line}`);
    seen.add(name);
    if (!expected.has(name)) findings.push(`PHANTOM\t${name}\tline ${line}`);
  }
  for (const name of symbols.headings) {
    if (!seen.has(name)) findings.push(`MISSING\t${name}`);
  }
  for (const [cls, list] of symbols.fields) {
    if (list.length === 0 || !seen.has(cls)) continue;
    const documented = page.rows.get(cls) ?? [];
    for (const field of list) {
      if (!documented.includes(field)) findings.push(`MISSING-FIELD\t${cls}.${field}`);
    }
    for (const field of documented) {
      if (!list.includes(field)) findings.push(`PHANTOM-FIELD\t${cls}.${field}`);
    }
  }
  return findings;
}

// --- CLI ---------------------------------------------------------------------

function parseArgs(argv) {
  let stubs = DEFAULT_STUBS;
  let page = DEFAULT_PAGE;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--stubs") stubs = argv[++i];
    else if (argv[i] === "--page") page = argv[++i];
    else throw new Error(`check:python-api: unrecognized argument '${argv[i]}'`);
  }
  return { stubs, page };
}

function main() {
  const { stubs, page } = parseArgs(process.argv.slice(2));
  if (!existsSync(join(stubs, "__init__.pyi"))) {
    throw new Error(`check:python-api: no vendored stubs at ${stubs} (run npm run refresh:pystubs)`);
  }
  if (!existsSync(page)) throw new Error(`check:python-api: page not found: ${page}`);
  const files = readdirSync(stubs)
    .filter((name) => name.endsWith(".pyi"))
    .sort()
    .map((name) => ({ name, text: readFileSync(join(stubs, name), "utf8") }));
  const symbols = collectSymbols(files);
  const findings = checkCoverage(symbols, parsePage(readFileSync(page, "utf8")));
  const fieldCount = [...symbols.fields.values()].reduce((n, list) => n + list.length, 0);
  if (findings.length > 0) {
    for (const finding of findings) console.log(finding);
    console.error(`check:python-api: ${findings.length} finding(s) against ${files.length} stubs`);
    process.exit(1);
  }
  console.log(
    `OK: ${symbols.headings.length} public stub symbols and ${fieldCount} fields from ${files.length} stubs are documented in reference/python-api.mdx`,
  );
  process.exit(0);
}

const entryHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;
if (import.meta.url === entryHref) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}
