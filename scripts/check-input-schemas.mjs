// Input-schema gate, checker logic (E13 ticket-202a, GRD-03; ticket-215 wires
// it as `check:input-schemas`).
//
// The 19 vendored JSON Schemas (`public/schemas/*.schema.json`) describe every
// JSON input file of a case. The case-format pages state the same fields in
// input tables (`docs/design/reference-conventions.md` section 2, header
// exactly `Name | Type | Required | Default | Units | Description`). This
// script checks the two against each other in both directions: every schema
// path has its row, every row names a schema path, the `Required` cell agrees
// with the schema, and an enumerated field lists exactly the schema's values.
//
// Decisions (ticket-202a):
//   D-202a-1  The root `$schema` key has no row on any table; it is never a path.
//   D-202a-2  A path with descendants is covered by its own row or by any row
//             whose Name starts with `<path>.` or `<path>[]`; a leaf needs its
//             own row. An uncovered path of either kind is reported.
//   D-202a-3  A file's rows are the input tables under the heading whose text
//             is only that file's backticked path, up to the next heading of
//             the same or a higher level. Other tables are not read; fenced
//             code is skipped.
//   D-202a-4  A property is required when its enclosing object lists it in
//             `required` in every `oneOf`/`anyOf` branch of that object (a
//             `{"type": "null"}` branch is the nullable marker, not a branch).
//             `Yes` needs schema-required; `No` and `Conditional` need
//             schema-optional. The cell is read against the enclosing object,
//             so a required field inside an optional parent is `Yes`.
//   D-202a-5  A path with a value set (an enum `$def` whose `oneOf` branches
//             are string `const`s, or a tagged-union tag: the union of its
//             branches' `const`s) needs a Description that opens `One of `
//             and holds exactly that set, as backticked JSON literals, in its
//             first sentence.
//
// Paths: a property appends `.<key>`; an array of objects appends `[]` to its
// children and is itself the container path (`hydros`, children
// `hydros[].id`); an array of non-objects (scalars, or arrays of scalars) is
// one leaf; an object-valued `additionalProperties` appends `.<name>` and has
// no path of its own (`profiles` is the container, its children are
// `profiles.<name>.correlation_groups`).
//
// Report lines, tab separated, then the SUMMARY line:
//   MISSING    file  path
//   PHANTOM    file  name
//   REQUIRED   file  path  page=<cell>  schema=<required|optional>
//   ENUM       file  path  page=<set>   schema=<set>
//   NOSECTION  file
//   DUPSECTION file  <pages>
//   SUMMARY files=N rows=N missing=N phantom=N required=N enum=N nosection=N dupsection=N
//
// Exports `schemaPaths(schema)`, `pageRows(text, file)`, `checkFile(schema,
// text, file)`, `readSchema(path)` and `BINDINGS` behind a direct-run guard,
// mirroring check-doc-counts.mjs. Reads source content only (no build).
//
// Run any time:
//   node scripts/check-input-schemas.mjs [--dir <dir>] [--file <case path>] [--list <schema basename>]
// --dir   case-format pages (default src/content/docs/reference/case-format);
//         every *.md and *.mdx in it is read, not its subdirectories
// --file  check only this bound case file (default: every binding)
// --list  print each path of public/schemas/<basename>.schema.json as
//         `path<TAB>required|optional<TAB>values or -`, then exit 0
// Exit 0: clean. Exit 1: a problem count is not 0. Exit 2: an unknown or
// incomplete option, an unbound --file, an unreadable directory or schema, bad
// JSON, or a `$ref` outside `#/$defs/`.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(scriptDir, "..", "public", "schemas");

// Case path of each bound JSON file -> vendored schema basename. `config.json`
// is not bound (D-215-1, ticket-215; revisit when configuration adopts full-Name input tables).
export const BINDINGS = {
  "penalties.json": "penalties",
  "stages.json": "stages",
  "boundary_conditions.json": "boundary_conditions",
  "initial_conditions.json": "initial_conditions",
  "post_study_stages.json": "post_study_stages",
  "system/buses.json": "buses",
  "system/lines.json": "lines",
  "system/hydros.json": "hydros",
  "system/thermals.json": "thermals",
  "system/non_controllable_sources.json": "non_controllable_sources",
  "system/pumping_stations.json": "pumping_stations",
  "system/energy_contracts.json": "energy_contracts",
  "system/hydro_production_models.json": "production_models",
  "scenarios/load_factors.json": "load_factors",
  "scenarios/non_controllable_factors.json": "non_controllable_factors",
  "scenarios/correlation.json": "correlation",
  "constraints/generic_constraints.json": "generic_constraints",
  "constraints/generic_parameters.json": "generic_parameters",
};

const DEFS = "#/$defs/";
const INPUT_HEADER = "Name|Type|Required|Default|Units|Description";

// ---------------------------------------------------------------------------
// Schema side
// ---------------------------------------------------------------------------

const isObject = (value) => value !== null && typeof value === "object";
const extend = (path, key) => (path === "" ? key : `${path}.${key}`);
const variants = (node, key) =>
  (node[key] ?? []).filter((branch) => branch.type !== "null");

// `node` with its `$ref` chain followed, or null when a `$def` on the current
// path (`seen`) would be entered again.
function deref(node, seen, defs) {
  if (node.$ref === undefined) return { node, seen };
  const name = node.$ref.slice(DEFS.length);
  if (!node.$ref.startsWith(DEFS) || defs[name] === undefined) {
    throw new Error(
      `cannot resolve $ref '${node.$ref}' (only '${DEFS}<name>')`,
    );
  }
  return seen.includes(name) ? null : deref(defs[name], [...seen, name], defs);
}

// `node` and every union branch below it, each with its own `$ref` chain
// resolved.
function fragments(node, seen, defs) {
  const resolved = deref(node, seen, defs);
  if (resolved === null) return [];
  const branches = ["oneOf", "anyOf", "allOf"].flatMap((key) =>
    variants(resolved.node, key),
  );
  return [
    resolved,
    ...branches.flatMap((branch) => fragments(branch, resolved.seen, defs)),
  ];
}

// Property names the object `node` requires: its own `required`, plus the
// names every `oneOf` (or `anyOf`) branch requires, plus each `allOf` branch's.
function requiredOf(node, seen, defs) {
  const resolved = deref(node, seen, defs);
  if (resolved === null) return new Set();
  const required = new Set(resolved.node.required ?? []);
  for (const key of ["oneOf", "anyOf"]) {
    const sets = variants(resolved.node, key).map((branch) =>
      requiredOf(branch, resolved.seen, defs),
    );
    for (const name of sets[0] ?? []) {
      if (sets.every((set) => set.has(name))) required.add(name);
    }
  }
  for (const branch of variants(resolved.node, "allOf")) {
    for (const name of requiredOf(branch, resolved.seen, defs)) {
      required.add(name);
    }
  }
  return required;
}

/**
 * Every field path of a vendored input schema, containers included.
 *
 * @param {object} schema parsed `*.schema.json`
 * @returns {{path: string, required: boolean, values: string[]}[]}
 *   `values` are the sorted JSON literals of the path's value set, `[]` for
 *   none; paths come parent before children, in schema order
 * @throws {Error} on a `$ref` outside `#/$defs/`
 */
export function schemaPaths(schema) {
  const defs = schema.$defs ?? {};
  const records = new Map();

  const walk = (node, path, seen, record) => {
    const required = requiredOf(node, seen, defs);
    for (const fragment of fragments(node, seen, defs)) {
      const { node: body, seen: bodySeen } = fragment;
      if (body.enum !== undefined) {
        throw new Error(
          `unsupported 'enum' keyword at '${path}' (value sets are read from 'const' branches)`,
        );
      }
      if (record !== null && body.const !== undefined) {
        record.values.add(JSON.stringify(body.const));
      }
      for (const [key, child] of Object.entries(body.properties ?? {})) {
        if (path === "" && key === "$schema") continue;
        const childPath = extend(path, key);
        if (!records.has(childPath)) {
          records.set(childPath, {
            path: childPath,
            required: required.has(key),
            values: new Set(),
          });
        }
        walk(child, childPath, bodySeen, records.get(childPath));
      }
      if (isObject(body.additionalProperties)) {
        walk(body.additionalProperties, extend(path, "<name>"), bodySeen, null);
      }
      if (body.items !== undefined) {
        walk(body.items, `${path}[]`, bodySeen, null);
      }
    }
  };
  walk(schema, "", [], null);
  if (records.size === 0) {
    throw new Error("schema declares no properties");
  }

  return [...records.values()].map(({ path, required, values }) => ({
    path,
    required,
    values: [...values].sort(),
  }));
}

/**
 * Read and parse one vendored schema.
 *
 * @param {string} path file path
 * @throws {Error} when the file is unreadable or not JSON
 */
export function readSchema(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`could not read schema ${path}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Page side
// ---------------------------------------------------------------------------

const isSeparator = (line) => /^\|[|:\- ]*-[|:\- ]*$/.test(line.trim());

// Cells of a table row; `\|` stays inside its cell.
function splitCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());
}

// Per-line flags: true for a fence delimiter and every line inside a fence. A
// closing fence repeats the opening character at least as many times.
function fencedLines(lines) {
  let open = null;
  return lines.map((line) => {
    const fence = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (open === null) {
      if (fence === null) return false;
      open = fence[1];
      return true;
    }
    if (
      fence !== null &&
      fence[2].trim() === "" &&
      fence[1][0] === open[0] &&
      fence[1].length >= open.length
    ) {
      open = null;
    }
    return true;
  });
}

// Rows of every input table in `lines`.
function inputRows(lines, fenced) {
  const rows = [];
  for (let i = 0; i + 1 < lines.length; i++) {
    if (
      fenced[i] ||
      !lines[i].trimStart().startsWith("|") ||
      !isSeparator(lines[i + 1]) ||
      splitCells(lines[i]).join("|") !== INPUT_HEADER
    ) {
      continue;
    }
    for (
      i += 2;
      i < lines.length && lines[i].trimStart().startsWith("|");
      i++
    ) {
      const cells = splitCells(lines[i]);
      rows.push({
        name: (cells[0] ?? "").replaceAll("`", ""),
        required: cells[2] ?? "",
        description: cells[5] ?? "",
      });
    }
  }
  return rows;
}

/**
 * The input-table rows of each section of one page that is headed by the
 * backticked path `file` (D-202a-3).
 *
 * @param {string} text page contents
 * @param {string} file case path, e.g. `system/hydros.json`
 * @returns {{name: string, required: string, description: string}[][]}
 *   one array of rows per such heading; `[]` when the page has none. `name`
 *   is the Name cell without backticks.
 */
export function pageRows(text, file) {
  const lines = text.split(/\r?\n/);
  const fenced = fencedLines(lines);
  const headings = lines.flatMap((line, i) => {
    const match = fenced[i] ? null : /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    return match === null
      ? []
      : [{ index: i, level: match[1].length, text: match[2] }];
  });
  return headings.flatMap((heading, h) => {
    if (heading.text !== `\`${file}\``) return [];
    const end =
      headings.slice(h + 1).find((next) => next.level <= heading.level)
        ?.index ?? lines.length;
    return [
      inputRows(
        lines.slice(heading.index + 1, end),
        fenced.slice(heading.index + 1, end),
      ),
    ];
  });
}

// The backticked literals of the first sentence of a Description that opens
// `One of `, sorted and distinct; null when it does not open so.
function listedValues(description) {
  if (!description.startsWith("One of ")) return null;
  const sentence = description.split(/\.(?:\s|$)/)[0];
  const literals = [...sentence.matchAll(/`([^`]*)`/g)].map(([, v]) => v);
  return [...new Set(literals)].sort();
}

/**
 * Compare the rows of `file` on one page with its schema.
 *
 * @param {object} schema parsed `*.schema.json`
 * @param {string} text page contents
 * @param {string} file case path, e.g. `system/hydros.json`
 * @returns {{rows: number, problems: string[][]}} `problems` are
 *   `[CODE, ...fields]` in the report-line order MISSING, PHANTOM, REQUIRED,
 *   ENUM, without the file column
 */
export function checkFile(schema, text, file) {
  const paths = schemaPaths(schema);
  const rows = pageRows(text, file).flat();
  const names = new Set(rows.map((row) => row.name));
  const byPath = new Map(paths.map((record) => [record.path, record]));
  const problems = [];

  for (const { path } of paths) {
    const isContainer = paths.some(
      (other) =>
        other.path.startsWith(`${path}.`) || other.path.startsWith(`${path}[]`),
    );
    const covered =
      names.has(path) ||
      (isContainer &&
        rows.some(
          (row) =>
            row.name.startsWith(`${path}.`) || row.name.startsWith(`${path}[]`),
        ));
    if (!covered) problems.push(["MISSING", path]);
  }
  for (const row of rows) {
    if (!byPath.has(row.name)) problems.push(["PHANTOM", row.name]);
  }
  const matched = rows.filter((row) => byPath.has(row.name));
  for (const row of matched) {
    const { path, required } = byPath.get(row.name);
    if (
      { Yes: true, No: false, Conditional: false }[row.required] !== required
    ) {
      problems.push([
        "REQUIRED",
        path,
        `page=${row.required}`,
        `schema=${required ? "required" : "optional"}`,
      ]);
    }
  }
  for (const row of matched) {
    const { path, values } = byPath.get(row.name);
    if (values.length === 0) continue;
    const listed = listedValues(row.description);
    if (listed === null || listed.join() !== values.join()) {
      problems.push([
        "ENUM",
        path,
        `page=${listed?.join(",") || "-"}`,
        `schema=${values.join(",")}`,
      ]);
    }
  }
  return { rows: rows.length, problems };
}

// ---------------------------------------------------------------------------
// Main (direct run only).
// ---------------------------------------------------------------------------
const DEFAULT_DIR = join(
  scriptDir,
  "..",
  "src",
  "content",
  "docs",
  "reference",
  "case-format",
);

// Prints the report and returns the exit status; throws on a usage or I/O error.
function run(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      dir: { type: "string" },
      file: { type: "string" },
      list: { type: "string" },
    },
  });
  const schemaOf = (basename) =>
    readSchema(join(schemasDir, `${basename}.schema.json`));

  if (values.list !== undefined) {
    for (const { path, required, values: set } of schemaPaths(
      schemaOf(values.list),
    )) {
      console.log(
        `${path}\t${required ? "required" : "optional"}\t${set.join(",") || "-"}`,
      );
    }
    return 0;
  }

  if (values.file !== undefined && !Object.hasOwn(BINDINGS, values.file)) {
    throw new Error(`'${values.file}' is not a bound case file`);
  }
  const files =
    values.file === undefined ? Object.keys(BINDINGS) : [values.file];
  const dir = resolve(values.dir ?? DEFAULT_DIR);
  const pages = readdirSync(dir)
    .filter((name) => /\.mdx?$/.test(name))
    .sort()
    .map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") }));

  const counts = {
    MISSING: 0,
    PHANTOM: 0,
    REQUIRED: 0,
    ENUM: 0,
    NOSECTION: 0,
    DUPSECTION: 0,
  };
  let rows = 0;
  const report = (code, file, ...fields) => {
    counts[code] += 1;
    console.log([code, file, ...fields].join("\t"));
  };
  for (const file of files) {
    const holders = pages.flatMap((page) =>
      pageRows(page.text, file).map(() => page),
    );
    if (holders.length === 0) {
      report("NOSECTION", file);
    } else if (holders.length > 1) {
      const names = holders.map((page) => page.name);
      report("DUPSECTION", file, [...new Set(names)].join(","));
    } else {
      const result = checkFile(schemaOf(BINDINGS[file]), holders[0].text, file);
      rows += result.rows;
      for (const [code, ...fields] of result.problems) {
        report(code, file, ...fields);
      }
    }
  }

  console.log(
    `SUMMARY files=${files.length} rows=${rows} missing=${counts.MISSING} phantom=${counts.PHANTOM} required=${counts.REQUIRED} enum=${counts.ENUM} nosection=${counts.NOSECTION} dupsection=${counts.DUPSECTION}`,
  );
  return Object.values(counts).every((count) => count === 0) ? 0 : 1;
}

function main() {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    console.error(`check:input-schemas: ${error.message}`);
    process.exitCode = 2;
  }
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
