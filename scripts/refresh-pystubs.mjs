// Vendored Python stub refresh (E14 ticket-233a, GRD-04; R98, ADR-020).
//
// The `.pyi` stubs under scripts/pystubs/ are the typed public surface of the
// novomodelo-python package. They are written in the `novomodelo` repo
// (crates/novomodelo-python/python/novomodelo/*.pyi) and vendored here byte for byte so
// scripts/check-python-api.mjs can compare reference/python-api.mdx against
// them in CI, which never checks out novomodelo source (ADR-020). Outside public/:
// the stubs are gate input, not site content.
//
// Content is read from an immutable git TAG through plumbing
// (`git -C <novomodelo> ls-tree` / `show <ref>:<path>`), never the novomodelo working
// tree, exactly like scripts/refresh-schemas.mjs.
//
// Usage:
//   node scripts/refresh-pystubs.mjs [--novomodelo <path>] [--ref <git-ref>] [--check]
//     --novomodelo   path to a novomodelo checkout (default: $NOVOMODELO_REPO or ~/git/novomodelo)
//     --ref     git ref/tag to vendor from (default: DEFAULT_NOVOMODELO_REF)
//     --check   compare scripts/pystubs/ with <ref>, write nothing; exit 1
//               listing every drifted, missing or extra stub, else exit 0.
// Without --check the script writes every stub of <ref> and deletes any
// vendored stub that <ref> no longer ships.

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DEFAULT_NOVOMODELO_REF } from "./novomodelo-ref.mjs";

const STUBS_SUBPATH = "crates/novomodelo-python/python/novomodelo";
const vendorDir = fileURLToPath(new URL("./pystubs/", import.meta.url));

// --- Pure helpers (exported for scripts/refresh-pystubs.test.mjs) -----------

// `git ls-tree --name-only <ref> <dir>/` stdout -> sorted `.pyi` basenames.
// Throws when the tree holds no stub or lacks `__init__.pyi` (wrong ref or a
// partial tree).
export function parseStubNames(lsTreeStdout) {
  const names = lsTreeStdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.slice(line.lastIndexOf("/") + 1))
    .filter((name) => name.endsWith(".pyi"))
    .sort();
  if (!names.includes("__init__.pyi")) {
    throw new Error(
      `refresh:pystubs: no __init__.pyi in the stub tree (found ${names.length} stub(s)) — wrong ref, or a partial tree?`,
    );
  }
  return names;
}

// Compare the stubs at the ref (`released`) with the vendored ones
// (`vendored`); both are Map<name, Buffer>. Returns one line per difference.
export function diffStubs(released, vendored) {
  const lines = [];
  for (const [name, bytes] of released) {
    if (!vendored.has(name)) lines.push(`MISSING ${name}`);
    else if (!vendored.get(name).equals(bytes)) lines.push(`DRIFTED ${name}`);
  }
  for (const name of vendored.keys()) {
    if (!released.has(name)) lines.push(`EXTRA ${name}`);
  }
  return lines;
}

// --- Git plumbing (argument arrays, never a shell string) -------------------

function git(novomodelo, args, what) {
  try {
    return execFileSync("git", ["-C", novomodelo, ...args], {
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(
      `refresh:pystubs: cannot ${what} from ${novomodelo} — is the tag fetched? (${error.message})`,
    );
  }
}

function readVendored() {
  const stubs = new Map();
  if (!existsSync(vendorDir)) return stubs;
  for (const name of readdirSync(vendorDir).filter((n) => n.endsWith(".pyi")).sort()) {
    stubs.set(name, readFileSync(join(vendorDir, name)));
  }
  return stubs;
}

function parseArgs(argv) {
  let novomodelo = process.env.NOVOMODELO_REPO ?? join(homedir(), "git", "novomodelo");
  let ref = DEFAULT_NOVOMODELO_REF;
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--novomodelo") novomodelo = argv[++i];
    else if (arg === "--ref") ref = argv[++i];
    else if (arg === "--check") check = true;
    else throw new Error(`refresh:pystubs: unrecognized argument '${arg}'`);
  }
  return { novomodelo, ref, check };
}

function main() {
  const { novomodelo, ref, check } = parseArgs(process.argv.slice(2));
  const listing = git(novomodelo, ["ls-tree", "--name-only", ref, `${STUBS_SUBPATH}/`], `list ${STUBS_SUBPATH}/ at ${ref}`);
  const names = parseStubNames(listing.toString("utf8"));
  const released = new Map();
  for (const name of names) {
    released.set(name, git(novomodelo, ["show", `${ref}:${STUBS_SUBPATH}/${name}`], `read ${name} at ${ref}`));
  }
  const vendored = readVendored();
  if (check) {
    const lines = diffStubs(released, vendored);
    if (lines.length > 0) {
      console.error(`refresh:pystubs --check: ${lines.length} difference(s) between scripts/pystubs/ and ${ref}:`);
      for (const line of lines) console.error(`  ${line}`);
      process.exit(1);
    }
    console.log(`refresh:pystubs --check: ${names.length} vendored stubs match ${ref}`);
    process.exit(0);
  }
  mkdirSync(vendorDir, { recursive: true });
  for (const [name, bytes] of released) writeFileSync(join(vendorDir, name), bytes);
  for (const name of vendored.keys()) {
    if (!released.has(name)) unlinkSync(join(vendorDir, name));
  }
  console.log(`refresh:pystubs: vendored ${names.length} stubs from ${ref}`);
  process.exit(0);
}

const entryHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;
if (import.meta.url === entryHref) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
