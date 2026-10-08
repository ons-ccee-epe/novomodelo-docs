// Provenance check for the committed terminal recording.
//
// getting-started/quickstart.mdx embeds public/getting-started/quickstart.gif,
// a VHS recording of the *novomodelo CLI*. The running pages show captured terminal
// text instead of GIFs (ADR-033), and the GIF is rendered locally (E14
// ticket-229), not vendored from novomodelo: this script never writes into public/.
//
// What it does instead: scripts/recordings-provenance.json records, for each
// GIF in MANIFEST, the sha256 of the committed file, the tape's git blob at a
// novomodelo tag, and the novomodelo version and hostname method of the rendering run.
// --check verifies the committed GIF against that record — not byte-equality
// with upstream, because a fresh VHS render is not byte-reproducible.
//
// Released-baseline rule (same discipline as refresh-schemas): the tape blob is
// read from an immutable git TAG via `git -C <novomodelo> rev-parse <ref>:<path>`,
// NEVER the `novomodelo` working tree.
//
// MANIFEST is the single source of truth for which GIFs ship and from which
// tape. reconcileRecords() fails loud if the manifest and the record file do
// not name the same recordings.
//
// Usage:
//   node scripts/refresh-recordings.mjs [--novomodelo <path>] [--ref <git-ref>] [--check]
//     --novomodelo   path to a novomodelo checkout (default: $NOVOMODELO_REPO or ~/git/novomodelo).
//               Only used to resolve the git object database — the ref is read
//               via plumbing, so novomodelo's checked-out branch is irrelevant. When
//               no checkout resolves the ref, the tape is reported as not
//               checked; it is never a failure (CI has no novomodelo source).
//     --ref     git ref/tag whose tape blob the report mode computes (default:
//               DEFAULT_NOVOMODELO_REF, see scripts/novomodelo-ref.mjs). --check reads
//               each record's own tape_ref.
//     --check   verify-only: compare each committed GIF's sha256 with its record
//               and, when a checkout resolves it, the tape blob; exit 1 listing
//               every drift, else exit 0.
//     (none)    report: print each record's recorded and computed sha256 and
//               tape blob, exit 0. Nothing is written in either mode.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_NOVOMODELO_REF } from "./novomodelo-ref.mjs";

const RECORDINGS_SUBPATH = "recordings";

// The single source of truth for which GIFs ship and where. `tape` is the
// basename under novomodelo `recordings/` that renders the GIF; `dest` is the path
// under public/ (next to the page that embeds it, so the served URL is /<dest>).
const MANIFEST = [
  { tape: "quickstart.tape", dest: "getting-started/quickstart.gif" },
];

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const provenancePath = fileURLToPath(
  new URL("./recordings-provenance.json", import.meta.url),
);

// --- Pure helpers (exported for the node:test fixture) ----------------------
// Synchronous, no filesystem/subprocess; exercised directly on inline fixtures
// by scripts/refresh-recordings.test.mjs.

export function sha256Hex(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// Cross-check MANIFEST against the records, both directions; an entry is its
// (tape, dest) pair. Throws a named error if the manifest maps a recording that
// has no record (it would ship unverified), or if a record names a recording the
// manifest does not map (a record for a GIF the docs do not ship).
export function reconcileRecords(manifest, records) {
  const mapped = manifest.map(
    (e) => `${RECORDINGS_SUBPATH}/${e.tape} -> ${e.dest}`,
  );
  const recorded = records.map((r) => `${r.tape} -> ${r.dest}`);

  const unrecorded = mapped.filter((m) => !recorded.includes(m));
  if (unrecorded.length > 0) {
    throw new Error(
      `refresh:recordings: the manifest maps ${unrecorded.join(", ")} but recordings-provenance.json has no such record — add the record (sha256, tape_blob) or the recording ships unverified.`,
    );
  }
  const unmapped = recorded.filter((r) => !mapped.includes(r));
  if (unmapped.length > 0) {
    throw new Error(
      `refresh:recordings: recordings-provenance.json records ${unmapped.join(", ")} but the manifest does not map it — drop the record, or wire the recording into the manifest and a page.`,
    );
  }
}

// Throws a named error unless `buf` begins with a GIF signature (GIF87a/GIF89a).
// Guards against a committed error page, LFS pointer, or truncated blob
// instead of an actual GIF — the binary analog of assertWellFormed.
export function assertGifMagic(name, buf) {
  const magic = buf.subarray(0, 6).toString("latin1");
  if (magic !== "GIF87a" && magic !== "GIF89a") {
    throw new Error(
      `refresh:recordings: ${name} is not a GIF (magic bytes were ${JSON.stringify(magic)}) — an error page or LFS pointer, not the recording?`,
    );
  }
}

// Returns the drift lines (empty when none) for one record. `gifBuf` is the
// committed GIF's bytes, or null when public/<dest> is missing; `tapeBlob` is
// the tape's blob at the record's tape_ref, or null when no novomodelo checkout
// resolves it (not a drift: the sha256 check stands alone).
export function checkRecording(record, gifBuf, tapeBlob) {
  const { dest, sha256, tape, tape_ref: tapeRef, tape_blob: blob } = record;
  const drift = [];
  if (gifBuf === null) {
    drift.push(`${dest} (missing from public/)`);
  } else {
    assertGifMagic(dest, gifBuf);
    const actual = sha256Hex(gifBuf);
    if (actual !== sha256) {
      drift.push(`${dest} (sha256 ${actual}, recorded ${sha256})`);
    }
  }
  if (tapeBlob !== null && tapeBlob !== blob) {
    drift.push(
      `${dest} (${tape} at ${tapeRef} is blob ${tapeBlob}, recorded ${blob})`,
    );
  }
  return drift;
}

// --- Git plumbing (execFileSync with an ARGS ARRAY — never a shell string) --

// Returns the tape's git blob id at `ref`, or null when the checkout at `novomodelo`
// cannot resolve the ref (no checkout, or the tag is not fetched). `rev-parse`
// also exits 128 for a missing tape path at a resolvable ref; that case returns
// a marker that never equals a recorded blob, so `--check` reports it as drift.
// Any other failure (git itself missing) is real and propagates.
function gitTapeBlob(novomodelo, ref, tape) {
  try {
    return execFileSync(
      "git",
      ["-C", novomodelo, "rev-parse", "--verify", `${ref}:${tape}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch (error) {
    if (error.status !== 128) throw error;
    try {
      execFileSync(
        "git",
        ["-C", novomodelo, "rev-parse", "--verify", `${ref}^{commit}`],
        {
          stdio: "ignore",
        },
      );
    } catch {
      return null;
    }
    return `(absent: ${tape} not found at ${ref})`;
  }
}

function readGif(dest) {
  const gifPath = join(publicDir, dest);
  return existsSync(gifPath) ? readFileSync(gifPath) : null;
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
      if (novomodelo === undefined) {
        throw new Error("refresh:recordings: --novomodelo needs a path");
      }
    } else if (arg === "--ref") {
      ref = argv[++i];
      if (ref === undefined) {
        throw new Error("refresh:recordings: --ref needs a git ref");
      }
    } else if (arg === "--check") {
      check = true;
    } else {
      throw new Error(`refresh:recordings: unrecognized argument '${arg}'`);
    }
  }
  return { novomodelo, ref, check };
}

// --- Main (run only when invoked directly, not when imported by the test) ---

function main() {
  const { novomodelo, ref, check } = parseArgs(process.argv.slice(2));
  const { recordings } = JSON.parse(readFileSync(provenancePath, "utf8"));

  reconcileRecords(MANIFEST, recordings);

  if (check) {
    const drifted = [];
    for (const record of recordings) {
      const { dest, tape, tape_ref: tapeRef } = record;
      const tapeBlob = gitTapeBlob(novomodelo, tapeRef, tape);
      if (tapeBlob === null) {
        console.log(
          `refresh:recordings --check: ${dest}: tape not checked (no novomodelo checkout at ${novomodelo} resolves ${tapeRef}:${tape})`,
        );
      }
      drifted.push(...checkRecording(record, readGif(dest), tapeBlob));
    }
    if (drifted.length > 0) {
      console.error(
        `refresh:recordings --check: ${drifted.length} drift(s) across ${recordings.length} recorded recording(s):\n`,
      );
      for (const d of drifted) console.error(`  ${d}`);
      process.exit(1);
    }
    console.log(
      `refresh:recordings --check: ${recordings.length} recorded recording(s) match recordings-provenance.json`,
    );
    process.exit(0);
  }

  for (const record of recordings) {
    const gif = readGif(record.dest);
    const blob = gitTapeBlob(novomodelo, ref, record.tape);
    const lines = [
      record.dest,
      `  sha256     recorded ${record.sha256}`,
      `             computed ${gif === null ? "missing from public/" : sha256Hex(gif)}`,
      `  tape_blob  recorded ${record.tape_blob}`,
      `             computed ${blob ?? "not resolved"} (${ref}:${record.tape})`,
    ];
    console.log(lines.join("\n"));
  }
}

// Run when executed directly; stay inert when imported by the test.
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
