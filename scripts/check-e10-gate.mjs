// E10-completion gate (E8 ticket-029) — the cutover licensing gate.
//
// The cutover (ticket-030) publishes the Starlight site on its public host,
// which means the build REDISTRIBUTES its runtime and
// build-time third-party libraries (KaTeX, the Fontsource faces, the d2/ELK
// toolchain, the Astro/Starlight stack). Permissive licenses
// (MIT/ISC/Apache-2.0/OFL-1.1) require preserving THEIR notices in what ships,
// and the migration plan places an explicit gate on cutover: E8 must not flip
// the deploy until every E10 artifact is confirmed to ship with the public
// build. Epic E10 produced those artifacts; THIS script is the mechanical,
// re-runnable gate that asserts they are all present and actually ship.
//
// It composes — it does NOT reimplement — the existing E10 guards: the D2-on-ELK
// check (check:d2) and the SPDX FOSS audit (check:spdx) are SHELLED OUT to (so
// they remain the single source of truth), and the notices drift guard mirrors
// CI exactly (`gen:notices` then `git diff --exit-code`). The artifact-presence
// and ship-in-build assertions (notices source non-empty, notices byte-identical
// in dist/, the rendered footer block, LICENSE-docs present) are checked directly
// here. This keeps the project's plain-Node ESM, zero-new-dependency convention
// (check-d2-layout.mjs, check-spdx.mjs, check-links.mjs).
//
// Assertions, IN ORDER (the gate exits non-zero naming the FIRST that fails):
//   notices-source   public/THIRD-PARTY-NOTICES.txt exists and is non-empty.
//   notices-in-dist  dist/THIRD-PARTY-NOTICES.txt exists and is BYTE-IDENTICAL to
//                    the public/ source (proves it is URL-served at
//                    /THIRD-PARTY-NOTICES.txt). Requires a build — if dist/ is
//                    absent the gate exits with a "run `npm run build:versions`
//                    first" message (mirroring check-links.mjs), not a throw.
//   footer-link      dist/index.html contains an href ending in
//                    THIRD-PARTY-NOTICES.txt AND the content-license text
//                    (CC-BY-4.0 + the LICENSE link) — i.e. Footer.astro's notices
//                    block rendered into the output. STABLE SUBSTRINGS are
//                    asserted, not an exact HTML string, so Starlight markup
//                    changes do not false-fail the gate.
//   content-license  LICENSE-docs exists at the repo root and is non-empty.
//   check:d2         `npm run check:d2` exits 0 (D2 uses ELK, never TALA).
//   check:spdx       `npm run check:spdx` exits 0 (100% FOSS).
//   notices-drift    `npm run gen:notices` then
//                    `git diff --exit-code -- public/THIRD-PARTY-NOTICES.txt` is
//                    clean (the committed notices match a fresh regeneration).
//
// Sub-checks are invoked with execFileSync using an ARGS ARRAY (never a shell
// string) per the project's subprocess-security convention (mirrors
// build-versions.mjs). Run from anywhere — paths resolve relative to this script.
//
// Run AFTER `npm run build:versions`:  node scripts/check-e10-gate.mjs  |
// npm run check:e10. Exits 0 with a PASS line per satisfied assertion; exits 1
// naming the first failing assertion otherwise.

import { readFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Paths. Post-promotion the Astro package IS the repo root (one level up from
// scripts/), so the package root and the repo root coincide. Resolved relative
// to this module so the gate runs from any cwd (like gen-notices.mjs /
// check-spdx.mjs).
// ---------------------------------------------------------------------------
const siteDir = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const publicNotices = fileURLToPath(
  new URL("../public/THIRD-PARTY-NOTICES.txt", import.meta.url),
);
const distRoot = fileURLToPath(new URL("../dist/", import.meta.url));
const distNotices = fileURLToPath(
  new URL("../dist/THIRD-PARTY-NOTICES.txt", import.meta.url),
);
const distIndex = fileURLToPath(new URL("../dist/index.html", import.meta.url));
// LICENSE-docs lives at the repo root (one level above site/), resolved off
// repoRoot per the ticket's path-resolution convention.
const licenseDocs = join(repoRoot, "LICENSE-docs");

// ---------------------------------------------------------------------------
// Pure helpers (exported for the node:test fixture; both are synchronous and
// touch no filesystem so they can be exercised on inline fixtures pre-build,
// like check-d2-layout.mjs's detectors).
// ---------------------------------------------------------------------------

// True iff two Buffers are byte-for-byte identical (same length, same bytes).
// Used to prove dist/THIRD-PARTY-NOTICES.txt is the verbatim public/ source
// Astro copied to the site root — not a re-encoded or truncated copy.
export function buffersIdentical(a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) return false;
  return Buffer.compare(a, b) === 0;
}

// True iff the given built-page HTML carries the rendered Footer notices block:
// (1) an href ending in THIRD-PARTY-NOTICES.txt (base-aware: matches both a root
// build "/THIRD-PARTY-NOTICES.txt" and a versioned build
// "/v0.8/THIRD-PARTY-NOTICES.txt"), AND (2) the content-license text — the
// CC-BY-4.0 token AND the Apache-2.0 LICENSE link (an href ending in /LICENSE).
// STABLE SUBSTRINGS only (not an exact HTML string) so Starlight markup changes
// do not false-fail the gate. Returns { ok, missing } where `missing` lists the
// absent substrings for a precise error message.
export function footerHasNotices(html) {
  const text = typeof html === "string" ? html : "";
  const missing = [];
  // (1) the third-party-notices link: an href value ending in the filename.
  if (!/href="[^"]*THIRD-PARTY-NOTICES\.txt"/i.test(text)) {
    missing.push("an href ending in THIRD-PARTY-NOTICES.txt");
  }
  // (2a) the CC-BY-4.0 content-license token.
  if (!text.includes("CC-BY-4.0")) {
    missing.push("the CC-BY-4.0 content-license text");
  }
  // (2b) the Apache-2.0 code-license LICENSE link (href ending in /LICENSE).
  if (!/href="[^"]*\/LICENSE"/i.test(text)) {
    missing.push("the code-license LICENSE link (href ending in /LICENSE)");
  }
  return { ok: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// Gate-failure helper: print a named cause (check-links.mjs message style) and
// exit non-zero. The FIRST failing assertion stops the gate.
// ---------------------------------------------------------------------------
function fail(message) {
  console.error(`check:e10: ${message}`);
  process.exit(1);
}

// True iff `p` is an existing, non-empty regular file.
function isNonEmptyFile(p) {
  return existsSync(p) && statSync(p).isFile() && statSync(p).size > 0;
}

// Shell out to a sub-check with an args array (NO shell string — security
// convention; avoids shell injection). Inherit stdio so the sub-check's own
// output (e.g. the SPDX table, a TALA violation list, the drift diff) is visible
// "above" the gate's named failure. Returns true on exit 0; on non-zero, fails
// the gate with `failLabel`.
function runSubCheck(file, args, failLabel) {
  try {
    execFileSync(file, args, { cwd: siteDir, stdio: "inherit" });
    return true;
  } catch {
    // execFileSync throws on non-zero exit (or spawn error); the sub-check has
    // already printed its diagnostics to the inherited stderr above.
    fail(`${failLabel} failed (see output above)`);
    return false; // unreachable (fail() exits) — keeps the type obvious.
  }
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly, not when imported by the test). Behind a
// direct-run guard so importing the module for its pure helpers does NOT trigger
// the filesystem reads, the sub-checks, or process.exit (mirrors check-spdx.mjs).
// ---------------------------------------------------------------------------
function main() {
  const passed = [];

  // --- notices-source: public/THIRD-PARTY-NOTICES.txt non-empty -------------
  if (!isNonEmptyFile(publicNotices)) {
    fail(
      "notices-source: site/public/THIRD-PARTY-NOTICES.txt not found or empty — " +
        "run `npm run gen:notices` to regenerate it.",
    );
  }
  passed.push("notices-source: site/public/THIRD-PARTY-NOTICES.txt present and non-empty");

  // --- notices-in-dist: byte-identical copy shipped in dist/ ----------------
  // Build-dependent: a missing dist/ is a "build first" condition, not an error.
  if (!existsSync(distRoot)) {
    fail("dist/ not found — run `npm run build:versions` first.");
  }
  if (!isNonEmptyFile(distNotices)) {
    fail(
      "notices-in-dist: site/dist/THIRD-PARTY-NOTICES.txt not found or empty — " +
        "the notices are not shipping in the build; run `npm run build:versions` first.",
    );
  }
  // Byte-identical compare via the pure helper (the proof it is URL-served verbatim).
  const publicBytes = readFileSync(publicNotices);
  const distBytes = readFileSync(distNotices);
  if (!buffersIdentical(publicBytes, distBytes)) {
    fail(
      "notices-in-dist: site/dist/THIRD-PARTY-NOTICES.txt is NOT byte-identical to " +
        "site/public/THIRD-PARTY-NOTICES.txt — the served copy differs from the source; " +
        "re-run `npm run build:versions`.",
    );
  }
  passed.push(
    "notices-in-dist: site/dist/THIRD-PARTY-NOTICES.txt present and byte-identical " +
      `to the public/ source (${distBytes.length} bytes)`,
  );

  // --- footer-link: rendered notices block in a built page ------------------
  if (!isNonEmptyFile(distIndex)) {
    fail(
      "footer-link: site/dist/index.html not found or empty — " +
        "run `npm run build:versions` first.",
    );
  }
  const indexHtml = readFileSync(distIndex, "utf8");
  const footer = footerHasNotices(indexHtml);
  if (!footer.ok) {
    fail(
      "footer-link: site/dist/index.html is missing the rendered footer notices block — " +
        `not found: ${footer.missing.join("; ")}.`,
    );
  }
  passed.push(
    "footer-link: dist/index.html renders the notices link + CC-BY-4.0/LICENSE content-license",
  );

  // --- content-license: LICENSE-docs at repo root ---------------------------
  if (!isNonEmptyFile(licenseDocs)) {
    fail("content-license: LICENSE-docs not found or empty at repo root.");
  }
  passed.push("content-license: LICENSE-docs present and non-empty at repo root");

  // --- check:d2 green (shell out — do NOT reimplement the TALA check) --------
  runSubCheck("npm", ["run", "check:d2"], "check:d2");
  passed.push("check:d2: D2-on-ELK guard passed (no TALA)");

  // --- check:spdx green (shell out — do NOT reimplement the SPDX audit) ------
  runSubCheck("npm", ["run", "check:spdx"], "check:spdx");
  passed.push("check:spdx: SPDX FOSS audit passed (100% FOSS)");

  // --- notices-drift: gen:notices then git diff --exit-code (mirrors CI) -----
  // First regenerate the notices, then assert the committed copy is unchanged.
  runSubCheck("npm", ["run", "gen:notices"], "gen:notices");
  runSubCheck(
    "git",
    ["diff", "--exit-code", "--", "public/THIRD-PARTY-NOTICES.txt"],
    "notices-drift: committed THIRD-PARTY-NOTICES.txt differs from a fresh regeneration (run `npm run gen:notices` and commit)",
  );
  passed.push(
    "notices-drift: committed THIRD-PARTY-NOTICES.txt matches a fresh `gen:notices`",
  );

  // --- PASS summary ---------------------------------------------------------
  console.log(`check:e10: PASS — all ${passed.length} E10 cutover assertions hold:`);
  for (const line of passed) {
    console.log(`  PASS  ${line}`);
  }
  process.exit(0);
}

// Run when executed as `node scripts/check-e10-gate.mjs`; stay inert when
// imported (the comparison holds because Node sets argv[1] to the entry script).
// argv[1] is absent under `node -e`/an importer with no entry file, so guard
// before pathToFileURL — an import context is never a direct run.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
