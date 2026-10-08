// Vendored JSON Schema refresh (ticket-014, strategy §6b).
//
// The 18 JSON Schema files under public/schemas/ describe every JSON input
// file in a Novomodelo case directory. They are GENERATED in the `novomodelo` repo from
// `novomodelo-io` Rust types (code = ground truth) — novomodelo-docs vendors a committed
// copy of that generated output for the reference/json-schemas index page and
// for editor `$schema` validation. This script re-vendors them; it never
// hand-edits schema content.
//
// Released-baseline rule (Epic 03 learnings, "Released-baseline discipline"):
// content is read from an immutable git TAG via
// `git -C <novomodelo> show <ref>:<schemas-path>/<name>`, NEVER the `novomodelo`
// working tree. The local `novomodelo` checkout may sit mid-feature-branch with
// unreleased fields (verified: `buses.schema.json` on `feat/water-travel-time`
// adds an `operational_start_date` property absent at the `v0.9.0` tag) — a
// working-tree read would leak those into the vendored copy.
//
// Usage:
//   node scripts/refresh-schemas.mjs [--novomodelo <path>] [--ref <git-ref>] [--check]
//     --novomodelo   path to a novomodelo checkout (default: $NOVOMODELO_REPO or ~/git/novomodelo).
//               Only used to resolve the git object database — the ref is read
//               via plumbing (ls-tree/show), so novomodelo's CURRENTLY CHECKED OUT
//               branch is irrelevant; only the tag's committed object matters.
//     --ref     git ref/tag to vendor from (default: DEFAULT_NOVOMODELO_REF, see
//               scripts/novomodelo-ref.mjs).
//     --check   verify-only: compare public/schemas/ against <ref>, write
//               nothing; exit 1 listing every drifted/missing file, else exit 0.
//
// Discovery: the schemas tree lives at `schemas/` since the novomodelo mdBook
// retirement (v0.11.0) and at `book/src/schemas/` on earlier tags — the first
// candidate path with entries at <ref> wins, and it must list exactly 18
// entries — a guard against a wrong ref or a partial tree.
// `--check` mode is the advisory staleness check (the authoritative freshness
// gate lives in `novomodelo`, ticket-016); default mode is the write path.
//
// Do NOT hand-edit vendored schema content to fix anything: it is generated in
// `novomodelo`; drift is fixed at the source (novomodelo-io Rust types) and re-vendored.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_NOVOMODELO_REF } from "./novomodelo-ref.mjs";

const EXPECTED_COUNT = 18;
// Ordered candidates for the schemas tree in novomodelo: `schemas/` from the mdBook
// retirement (v0.11.0) onward, `book/src/schemas/` on earlier tags.
const SCHEMAS_SUBPATHS = ["schemas", "book/src/schemas"];

const publicSchemasDir = fileURLToPath(
  new URL("../public/schemas/", import.meta.url),
);

// --- Pure helpers (exported for the node:test fixture) ----------------------
// Both are synchronous, touch no filesystem/subprocess, and are exercised
// directly on inline fixtures by scripts/refresh-schemas.test.mjs.

// Parse `git ls-tree --name-only <ref> <schemas-path>/` stdout into a sorted
// array of basenames (e.g. "buses.schema.json"). Throws a named error if the
// count is not exactly EXPECTED_COUNT — the guard against a wrong ref or a
// partial tree (e.g. a shallow/incomplete fetch of the tag).
export function parseSchemaNames(lsTreeStdout) {
  const names = lsTreeStdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.slice(line.lastIndexOf("/") + 1))
    .sort();
  if (names.length !== EXPECTED_COUNT) {
    throw new Error(
      `refresh:schemas: expected ${EXPECTED_COUNT} schema files in the schemas tree, found ${names.length} — wrong ref, or a partial tree?`,
    );
  }
  return names;
}

// Throws a named error if `text` is not well-formed JSON; returns silently
// otherwise. A malformed vendored schema is a hard, named failure — never a
// silent write of invalid content.
export function assertWellFormed(name, text) {
  try {
    JSON.parse(text);
  } catch (error) {
    throw new Error(
      `refresh:schemas: ${name} is not well-formed JSON (${error.message})`,
    );
  }
}

// --- Git plumbing (execFileSync with an ARGS ARRAY — never a shell string) --

// Resolve which candidate schemas tree exists at <ref>, returning
// { subpath, stdout } for the first candidate with entries. Throws a named
// error if none has any.
function gitLsTree(novomodelo, ref) {
  for (const subpath of SCHEMAS_SUBPATHS) {
    let stdout;
    try {
      stdout = execFileSync(
        "git",
        ["-C", novomodelo, "ls-tree", "--name-only", ref, `${subpath}/`],
        { encoding: "utf8" },
      );
    } catch (error) {
      throw new Error(
        `refresh:schemas: cannot list ${subpath}/ at ${ref} from ${novomodelo} — is the tag fetched? (${error.message})`,
      );
    }
    if (stdout.trim().length > 0) {
      return { subpath, stdout };
    }
  }
  throw new Error(
    `refresh:schemas: no schemas tree at ${ref} (tried ${SCHEMAS_SUBPATHS.join(", ")}) — wrong ref?`,
  );
}

function gitShow(novomodelo, ref, subpath, name) {
  try {
    return execFileSync(
      "git",
      ["-C", novomodelo, "show", `${ref}:${subpath}/${name}`],
      { encoding: "utf8" },
    );
  } catch (error) {
    throw new Error(
      `refresh:schemas: cannot read ${ref} from ${novomodelo} — is the tag fetched? (${error.message})`,
    );
  }
}

// --- Arg parsing --------------------------------------------------------------

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
      throw new Error(`refresh:schemas: unrecognized argument '${arg}'`);
    }
  }
  return { novomodelo, ref, check };
}

// --- Main (run only when invoked directly, not when imported by the test) ---

function main() {
  const { novomodelo, ref, check } = parseArgs(process.argv.slice(2));

  const { subpath, stdout } = gitLsTree(novomodelo, ref);
  const names = parseSchemaNames(stdout);

  const released = new Map();
  for (const name of names) {
    const text = gitShow(novomodelo, ref, subpath, name);
    assertWellFormed(name, text);
    released.set(name, text);
  }

  if (check) {
    const drifted = [];
    for (const name of names) {
      const dest = join(publicSchemasDir, name);
      if (!existsSync(dest)) {
        drifted.push(`${name} (missing from public/schemas/)`);
        continue;
      }
      const committed = readFileSync(dest, "utf8");
      if (committed !== released.get(name)) {
        drifted.push(`${name} (drifted from ${ref})`);
      }
    }
    if (drifted.length > 0) {
      console.error(
        `refresh:schemas --check: ${drifted.length} of ${names.length} vendored schema(s) drifted from ${ref}:\n`,
      );
      for (const d of drifted) console.error(`  ${d}`);
      process.exit(1);
    }
    console.log(
      `refresh:schemas --check: ${names.length} vendored schemas match ${ref}`,
    );
    process.exit(0);
  }

  mkdirSync(publicSchemasDir, { recursive: true });
  for (const name of names) {
    writeFileSync(join(publicSchemasDir, name), released.get(name));
  }
  console.log(`refresh:schemas: vendored ${names.length} schemas from ${ref}`);
  process.exit(0);
}

// Run when executed as `node scripts/refresh-schemas.mjs`; stay inert when
// imported (mirrors check-figures.mjs's direct-run guard). `argv[1]` is absent
// when loaded via `node -e`/an importer with no entry file, so guard before
// pathToFileURL — an import context is never a direct run.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
