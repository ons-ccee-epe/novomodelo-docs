// Shared two-voice zone predicate (Epic 04 ticket-015).
//
// novomodelo-docs is two-voiced: methodology math (`math/*.mdx`, excluding the
// `_impl/` software-layer partials) plus the conceptual `overview/*` chapters
// describe CURRENT novomodelo as instance-agnostic fact — no novomodelo-version
// annotations, no hedged "typical"/"about N" magnitudes (per the Methodology
// Authoring Standards + the "No version numbers in the corpus" hard rule in
// CLAUDE.md). `reference/glossary.md` is the one strict page under
// `reference/` (math zone, R97). Everything else that documents the SOFTWARE
// layer — the `math/_impl/_*.mdx` interleave partials, `reference/*`,
// `running/*`, `getting-started/*`, and `examples/*` (worked examples
// legitimately carry concrete instance numbers) — may carry concrete
// config/CLI/version detail.
//
// `zoneOf(relPath)` is the single source of truth for this split, keyed
// directly off path (Epic 03 learnings: the profile "can key directly off the
// `_impl/` directory + `_`-basename convention"). It is imported by
// check-doc-voice.mjs and check-doc-version.mjs so the two gates never drift
// apart on what counts as strict vs lenient.
//
// `relPath` is expected relative to `src/content/docs/` (e.g.
// "math/lp-formulation.mdx", "math/_impl/_hydro.io.mdx",
// "reference/error-codes.mdx"). Backslashes are normalised to forward
// slashes so the predicate is platform-independent.

import { readdirSync } from "node:fs";
import { join } from "node:path";

export const ZONE_STRICT = "strict";
export const ZONE_LENIENT = "lenient";
export const ZONE_EXCLUDED = "excluded";

// Lenient top-level directories (the software layer). `math/_impl/` is handled
// separately below since it is nested UNDER the otherwise-strict `math/` tree.
const LENIENT_TOP_LEVEL_DIRS = [
  "reference/",
  "running/",
  "getting-started/",
  "examples/",
];

// Strict top-level directories (the methodology layer).
const STRICT_TOP_LEVEL_DIRS = ["overview/"];

// Strict single pages inside an otherwise-lenient directory (R97): the
// glossary is math-zone text although it sits under reference/.
const STRICT_FILES = ["reference/glossary.md"];

/**
 * Classify a content-relative path into one of the three voice zones.
 *
 * @param {string} relPath path relative to `src/content/docs/`
 * @returns {"strict" | "lenient" | "excluded"}
 */
export function zoneOf(relPath) {
  const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");

  // Excluded: the pt-br/ subtree (a future locale, not yet gated).
  if (normalized.startsWith("pt-br/")) return ZONE_EXCLUDED;

  // The root landing page is software-layer content (CTAs, cards, links).
  if (normalized === "index.mdx") return ZONE_LENIENT;

  // math/_impl/** is UNDER math/ but IS the software layer — must be checked
  // before the general math/ strict rule below, or it would wrongly inherit
  // strict.
  if (normalized.startsWith("math/_impl/")) return ZONE_LENIENT;
  if (normalized.startsWith("math/")) return ZONE_STRICT;

  for (const dir of STRICT_TOP_LEVEL_DIRS) {
    if (normalized.startsWith(dir)) return ZONE_STRICT;
  }
  // Must precede the lenient loop, or the glossary matches reference/.
  if (STRICT_FILES.includes(normalized)) return ZONE_STRICT;
  for (const dir of LENIENT_TOP_LEVEL_DIRS) {
    if (normalized.startsWith(dir)) return ZONE_LENIENT;
  }

  // Anything outside the known tree (should not occur in the current corpus)
  // defaults to excluded rather than silently strict or lenient.
  return ZONE_EXCLUDED;
}

/**
 * Recursively collect every `.md`/`.mdx` file under `contentRoot`, returning
 * paths RELATIVE to `contentRoot` (forward-slash separated), skipping any
 * file whose `zoneOf()` result is "excluded" (pt-br/ ...).
 *
 * Shared by check-doc-voice.mjs and check-doc-version.mjs so the two gates
 * can never walk different file sets. UNLIKE check-figures.mjs /
 * check-math-parity.mjs, this does NOT skip underscore-prefixed entries: the
 * `math/_impl/_*.mdx` partials are real prose/version content that ends up
 * interleaved into rendered pages (the voice gate's hype check and the
 * version gate's lenient well-formedness check both need to see them), so
 * exclusion here is driven purely by zoneOf(), not by the routed-page
 * (`docsLoader` `**​/[^_]*`) convention those two gates key off.
 *
 * @param {string} contentRoot absolute path to `src/content/docs/`
 * @returns {string[]} relative paths, unsorted
 */
export function collectZonedSourceFiles(contentRoot) {
  function walk(dir, prefix) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix + entry.name;
      if (entry.isDirectory()) {
        files.push(...walk(join(dir, entry.name), `${rel}/`));
      } else if (
        /\.(md|mdx)$/.test(entry.name) &&
        zoneOf(rel) !== ZONE_EXCLUDED
      ) {
        files.push(rel);
      }
    }
    return files;
  }
  return walk(contentRoot, "");
}
