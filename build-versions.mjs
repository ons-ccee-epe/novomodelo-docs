// Architecture B orchestrator: build each version independently with its own
// `base`, then assemble into one dist/ tree: the hotsite at /, latest at its
// /docs/ base and each frozen version at its /docs/vX.Y/ base.
//
// Each entry from versions.json is built into its own temp dir (`.dist-<slug>`,
// or `.dist-latest` for `latest`) and then copied into dist/ at its `base`
// subpath (dist/<base>/). The subpath
// nesting is this copy step's job: astro emits at the --outDir root regardless
// of DOCS_BASE — `base` only rewrites in-page hrefs/asset URLs — so we copy each
// build's root-level output into dist/<base>/ ourselves.
//
// Two source paths, branched on whether the entry carries a `ref`:
//   • No `ref` (latest, and any synthetic/prototype entry): build the CURRENT
//     working tree — `astro build --outDir .dist-<slug>`, no --root.
//   • `ref` present (a frozen version; `ref` is a commit SHA on `main`):
//     materialise that ref's source into a throwaway git worktree and build
//     FROM it, so each release renders with its OWN astro.config.mjs (no
//     --config override — an old ref must not be re-rendered with the current
//     renderer settings):
//       git worktree add --force .src-<slug> <ref>
//       astro build --root .src-<slug> --outDir <abs .dist-<slug>>
//     --outDir must be ABSOLUTE — astro resolves a relative --outDir against
//     --root, which would otherwise land the output inside the worktree instead
//     of beside this script where the copy step reads it.
//     Each ref worktree also receives the current versions.json (over the ref's
//     own copy) so its version picker lists every version.
//
// Each copied build then has its author-written root-relative href/src links
// (e.g. a markdown [x](/math/x)) prefixed with its `base`, since astro emits
// those verbatim.
//
// After every version is in place, assembleLanding (scripts/landing-assembly.mjs)
// fills the dist/ root: the hotsite from hotsite/, the docs 404 page, the files
// of public/, and a redirect stub at each docs page path without the /docs
// prefix, so the URLs from when the docs were served at / keep working.
//
// Worktree cleanup is guaranteed via try/finally: the worktree is removed even
// if the build throws, so a failed/interrupted build never leaves a tracked
// `.src-<slug>` dir or a dangling worktree registration. A hard-killed run
// (SIGKILL, power loss) can still leave one behind; `git worktree prune` (plus
// `rm -rf .src-*`) is the manual recovery. The `.dist-*`/`.src-*` dirs are
// gitignored so an interrupted run never tracks them.

import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, cpSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  prefixSnapshotTree,
  writeSnapshotVersions,
} from "./scripts/version-snapshot.mjs";
import { assembleLanding } from "./scripts/landing-assembly.mjs";

const versionsText = readFileSync(
  new URL("./versions.json", import.meta.url),
  "utf8",
);
const cfg = JSON.parse(versionsText);
const builds = [cfg.latest, ...cfg.versions];

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

const baseEnv = {
  ...process.env,
  PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}`,
};

for (const v of builds) {
  // A versioned entry MUST carry a unique `slug` (only the `latest` entry may omit
  // it → `.dist-latest`). Without this guard, a versioned entry lacking `slug` would
  // resolve to `.dist-latest` too and silently overwrite the latest build's output.
  if (v !== cfg.latest && !v.slug) {
    throw new Error(
      `versions.json entry missing required "slug" field: ${JSON.stringify(v)}`,
    );
  }
  // Defense in depth: a slug becomes a filesystem path segment (`.src-<slug>`,
  // `.dist-<slug>`); restrict it to a safe alphabet so a bad value fails fast
  // with a clear message instead of producing a weird path. `ref` is NOT
  // validated here — git itself rejects bad refs and execFileSync (below)
  // already neutralises shell metacharacters in it; the committed
  // contract (a 40-hex SHA on HEAD's history per frozen entry) is
  // pinned by scripts/versions-json.test.mjs.
  if (v !== cfg.latest && !/^[A-Za-z0-9][A-Za-z0-9.\-]{0,63}$/.test(v.slug)) {
    throw new Error(
      `versions.json entry has invalid "slug" (allowed: [A-Za-z0-9][A-Za-z0-9.\\-]{0,63}): ${JSON.stringify(v.slug)}`,
    );
  }
  const base = v.base.endsWith("/") ? v.base : v.base + "/";
  const tmp = `.dist-${v.slug ?? "latest"}`;
  console.log(`\n=== building ${v.label}  (base=${base}) ===`);

  if (v.ref) {
    try {
      // execFileSync (args array, no shell) so slug/ref from versions.json
      // can never be interpreted as shell metacharacters.
      execFileSync(
        "git",
        ["worktree", "add", "--force", `.src-${v.slug}`, v.ref],
        { stdio: "inherit", env: baseEnv },
      );
    } catch (e) {
      throw new Error(
        `build:versions: failed to materialise ref "${v.ref}" for entry "${v.label}"\n${e.stderr ?? e.message}`,
      );
    }
  }
  try {
    if (v.ref) writeSnapshotVersions(`.src-${v.slug}`, versionsText);
    // execFileSync (args array, no shell): ref path builds FROM the worktree
    // with an ABSOLUTE outDir; no-ref path builds the current tree with a
    // relative outDir and no --root (behaviour preserved exactly).
    execFileSync(
      "node_modules/.bin/astro",
      [
        "build",
        "--force",
        ...(v.ref ? ["--root", `.src-${v.slug}`] : []),
        "--outDir",
        v.ref ? resolve(tmp) : tmp,
      ],
      { stdio: "inherit", env: { ...baseEnv, DOCS_BASE: base } },
    );

    const dest = base === "/" ? "dist" : `dist${base}`.replace(/\/$/, "");
    mkdirSync(dest, { recursive: true });
    cpSync(tmp, dest, { recursive: true });
    if (!existsSync(`${dest}/index.html`)) {
      throw new Error(
        `build:versions: "${v.label}" produced no index.html at ${dest}`,
      );
    }
    if (base !== "/") {
      // The snapshot bundles this checkout's node_modules, so it ships this
      // checkout's THIRD-PARTY-NOTICES.txt over the ref's own copy.
      cpSync(
        "public/THIRD-PARTY-NOTICES.txt",
        `${dest}/THIRD-PARTY-NOTICES.txt`,
      );
      const { files, rewritten } = prefixSnapshotTree(dest, base);
      console.log(
        `build:versions: prefixed ${rewritten} root-relative link(s) across ${files} HTML file(s) under ${dest}`,
      );
    }
  } finally {
    if (v.ref) {
      try {
        // execFileSync (args array, no shell) — same injection-safety rationale.
        execFileSync(
          "git",
          ["worktree", "remove", "--force", `.src-${v.slug}`],
          { stdio: "inherit", env: baseEnv },
        );
      } catch {
        // worktree already gone; do not mask a build error from the try block.
      }
    }
    rmSync(tmp, { recursive: true, force: true });
  }
}

const { stubs } = assembleLanding({
  dist: "dist",
  docsBase: cfg.latest.base,
  hotsiteDir: "hotsite",
  publicDir: "public",
});
console.log(
  `build:versions: hotsite at /, ${stubs} redirect stub(s) from the pre-/docs/ URLs`,
);

const subpaths = builds
  .map((v) => (v.base.endsWith("/") ? v.base : v.base + "/"))
  .join("  and  ");
console.log(`\n✓ Assembled multi-version site in dist/  ->  /  and  ${subpaths}`);
