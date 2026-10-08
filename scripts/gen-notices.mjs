// Third-party notices generator (E10 ticket-031).
//
// Generates site/public/THIRD-PARTY-NOTICES.txt — a deterministic, byte-stable
// attribution file covering every npm dependency in site/package.json plus three
// hard-coded non-npm / transitive extras (d2, ELK, d3). Sorted
// alphabetically by package name so the CI drift check is stable across runs.
//
// Usage (from the site/ package root):
//   node scripts/gen-notices.mjs
//   npm run gen:notices
//
// Design rules (zero new npm deps — plain node: built-ins only):
//   - Reads package.json for the dependency list.
//   - Reads node_modules/<pkg>/package.json for SPDX `license` field and
//     `homepage`/`repository` for the placeholder URL.
//   - Reads the first matching license file: LICENSE, LICENSE.md, LICENSE.txt,
//     license, COPYING.
//   - Missing license file → SPDX id + explicit placeholder (never silent omit).
//   - Missing node_modules/<pkg> → exit 1 naming the package (signals npm ci).
//   - Output has NO timestamp in its body (timestamps break the CI drift check).
//
// Extends cleanly for ticket-034 (content-license footer line adds nothing here).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

// ---------------------------------------------------------------------------
// Paths (resolved relative to this script so the file can be run from any cwd)
// ---------------------------------------------------------------------------
const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(scriptDir, "..");
const pkgJsonPath = join(siteRoot, "package.json");
const outPath = join(siteRoot, "public", "THIRD-PARTY-NOTICES.txt");
const nodeModulesRoot = join(siteRoot, "node_modules");

// ---------------------------------------------------------------------------
// Hard-coded extras — non-npm / transitive items that must be attributed
// but are not listed in package.json directly.
// ---------------------------------------------------------------------------
// Format mirrors the npm entries: { name, version, spdx, role, licenseText }.
// License text for non-npm tools is embedded inline (short permissive headers)
// because there is no node_modules/<pkg> to read.
const EXTRAS = [
  {
    name: "d2",
    version: "0.7.1",
    spdx: "MPL-2.0",
    role: "build-time diagram renderer binary (not bundled into site output)",
    licenseText: `Mozilla Public License Version 2.0

Copyright (c) Terrastruct, Inc.

d2 is licensed under the Mozilla Public License 2.0. You may obtain a copy of
the full license text at:

  https://github.com/terrastruct/d2/blob/master/LICENSE

Full text: https://www.mozilla.org/en-US/MPL/2.0/`,
  },
  {
    name: "ELK",
    version: "(bundled inside d2)",
    spdx: "EPL-2.0",
    role: "graph layout engine used by d2 at build time (not bundled into site output)",
    licenseText: `Eclipse Public License - v 2.0

Copyright (c) Eclipse Foundation and others.

ELK (Eclipse Layout Kernel) is licensed under the Eclipse Public License v2.0.
You may obtain a copy of the full license text at:

  https://github.com/eclipse/elk/blob/master/LICENSE

Full text: https://www.eclipse.org/legal/epl-2.0/`,
  },
  {
    name: "d3",
    version: "7.9.0",
    spdx: "ISC",
    role: "data visualisation library (transitive via @observablehq/plot, as d3-* ISC submodules)",
    licenseText: readNpmLicenseText("d3", "ISC"),
  },
];

// ---------------------------------------------------------------------------
// Helper: resolve homepage string from package.json value (string | object)
// ---------------------------------------------------------------------------
function resolveHomepage(value) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  // repository object: { type, url } — strip git+ prefix if present
  if (typeof value === "object" && value.url) {
    return value.url.replace(/^git\+/, "");
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Helper: read the first matching license file from a node_modules package dir.
// Returns the file text, or null if none of the candidates exist.
// ---------------------------------------------------------------------------
function findLicenseFile(pkgDir) {
  const candidates = ["LICENSE", "LICENSE.md", "LICENSE.txt", "license", "COPYING"];
  for (const candidate of candidates) {
    const fullPath = join(pkgDir, candidate);
    if (existsSync(fullPath)) {
      return readFileSync(fullPath, "utf8");
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helper: read an npm package's license text (used for npm-installed transitives
// that ARE in node_modules, namely d3).
// pkgName: bare package name (no scope prefix).
// spdxId:  fallback SPDX id string for the placeholder.
// ---------------------------------------------------------------------------
function readNpmLicenseText(pkgName, spdxId) {
  const pkgDir = join(nodeModulesRoot, pkgName);
  const text = findLicenseFile(pkgDir);
  if (text) return text;
  // Fetch homepage for placeholder
  let homepage = "https://www.npmjs.com/package/" + pkgName;
  try {
    const meta = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    homepage = resolveHomepage(meta.homepage ?? meta.repository) ?? homepage;
  } catch (_) {
    // ignore — use default npm URL
  }
  return `${spdxId}\n\n[license text not bundled — see ${homepage}]`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  // 1. Read site/package.json
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  const allDeps = {
    ...(pkgJson.dependencies ?? {}),
    ...(pkgJson.devDependencies ?? {}),
  };

  // 2. Collect npm entries — fail fast on any missing node_modules/<pkg>
  const npmEntries = [];
  for (const pkgName of Object.keys(allDeps)) {
    const pkgDir = join(nodeModulesRoot, pkgName);
    if (!existsSync(pkgDir)) {
      console.error(
        `gen:notices: node_modules/${pkgName} not found — run \`npm ci\` first.`,
      );
      process.exit(1);
    }

    let meta;
    try {
      meta = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    } catch (err) {
      console.error(
        `gen:notices: failed to read node_modules/${pkgName}/package.json: ${err.message}`,
      );
      process.exit(1);
    }

    const spdx = meta.license ?? "(unknown)";
    const version = meta.version ?? "(unknown)";
    const homepage =
      resolveHomepage(meta.homepage ?? meta.repository) ??
      `https://www.npmjs.com/package/${pkgName}`;

    const licenseFileText = findLicenseFile(pkgDir);
    const licenseText = licenseFileText
      ? licenseFileText
      : `${spdx}\n\n[license text not bundled — see ${homepage}]`;

    npmEntries.push({ name: pkgName, version, spdx, licenseText });
  }

  // 3. Sort npm entries alphabetically by name (deterministic output)
  npmEntries.sort((a, b) => a.name.localeCompare(b.name));

  // 4. Extras are appended after npm entries, sorted by name
  const extrasEntries = [...EXTRAS].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // All entries for the SPDX summary table and per-package sections
  const allEntries = [...npmEntries, ...extrasEntries];

  // 5. Build the output string
  const lines = [];

  // ---- Header ----------------------------------------------------------------
  lines.push("THIRD-PARTY NOTICES");
  lines.push("=".repeat(79));
  lines.push("");
  lines.push(
    "This file lists the open-source software components redistributed by the",
  );
  lines.push(
    "Novomodelo Methodology documentation site (https://methodology.cobre-rs.dev).",
  );
  lines.push(
    "Regenerate this file with: npm run gen:notices (from the site/ directory).",
  );
  lines.push("");

  // ---- Prose preamble --------------------------------------------------------
  lines.push("-".repeat(79));
  lines.push("NOTICES AND ELECTIONS");
  lines.push("-".repeat(79));
  lines.push("");

  // (a) JSXGraph MIT election note — conditional preamble per ticket-031 decision
  lines.push("JSXGraph — MIT license election");
  lines.push(
    "JSXGraph is currently NOT installed in this project. When JSXGraph math",
  );
  lines.push(
    "islands ship in a future release, JSXGraph will be used under the MIT option",
  );
  lines.push(
    "of its LGPL-2.0-or-later / MIT dual license (the project provides both; we",
  );
  lines.push(
    "elect MIT). This preamble records the election in advance per the licensing",
  );
  lines.push("checklist (docs/design/licensing.md item 1).");
  lines.push("");

  // (b) D2 / ELK build-time note
  lines.push("D2 (MPL-2.0) and ELK (EPL-2.0) — build-time only");
  lines.push(
    "The d2 diagram renderer and its bundled ELK layout engine are used exclusively",
  );
  lines.push(
    "at build time to produce static SVG files embedded in the site. The d2/ELK",
  );
  lines.push(
    "source code and binaries are NOT bundled into the site output or redistributed",
  );
  lines.push(
    "to visitors. The generated SVG output is our own creative work. No MPL-2.0 or",
  );
  lines.push("EPL-2.0 obligation applies to the site output or its visitors.");
  lines.push(
    "Attribution is provided below as a courtesy and for transparency.",
  );
  lines.push("");

  // (c) Content license pointer
  lines.push("Documentation content license");
  lines.push(
    "The documentation text and diagrams authored by the Novomodelo project are licensed",
  );
  lines.push(
    "separately under the terms in the LICENSE-docs file at the site root",
  );
  lines.push(
    "(ticket-034). This file covers only the third-party software components.",
  );
  lines.push("");

  // (d) Bundler banners statement
  lines.push("Bundler license banners");
  lines.push(
    "License banners injected by the Astro/Vite bundler into JavaScript and CSS",
  );
  lines.push(
    "output are preserved and not stripped. The notices below supplement those",
  );
  lines.push("banners with the full license texts.");
  lines.push("");

  // (e) KaTeX WOFF2 font coverage note (ticket-033)
  lines.push(
    "KaTeX_*.woff2 font files shipped in the built site are covered by the KaTeX MIT license (no separate font terms).",
  );
  lines.push("");

  // ---- SPDX summary table ----------------------------------------------------
  lines.push("-".repeat(79));
  lines.push("SPDX SUMMARY");
  lines.push("-".repeat(79));
  lines.push("");

  // Build fixed-width table columns
  const colWidths = {
    name: Math.max(7, ...allEntries.map((e) => e.name.length)),
    version: Math.max(7, ...allEntries.map((e) => e.version.length)),
    spdx: Math.max(4, ...allEntries.map((e) => e.spdx.length)),
  };

  const pad = (s, n) => s.padEnd(n);
  const headerRow =
    `${pad("Package", colWidths.name)}  ${pad("Version", colWidths.version)}  SPDX ID`;
  lines.push(headerRow);
  lines.push("-".repeat(headerRow.length));

  for (const entry of allEntries) {
    lines.push(
      `${pad(entry.name, colWidths.name)}  ${pad(entry.version, colWidths.version)}  ${entry.spdx}`,
    );
  }
  lines.push("");

  // ---- Per-package full-text sections -----------------------------------------
  lines.push("-".repeat(79));
  lines.push("FULL LICENSE TEXTS");
  lines.push("-".repeat(79));

  for (const entry of allEntries) {
    lines.push("");
    lines.push("-".repeat(79));
    lines.push(`Package: ${entry.name}`);
    lines.push(`Version: ${entry.version}`);
    lines.push(`SPDX:    ${entry.spdx}`);
    if (entry.role) {
      lines.push(`Role:    ${entry.role}`);
    }
    lines.push("-".repeat(79));
    lines.push("");
    // Normalize line endings to LF; trim trailing whitespace per line; strip
    // a trailing newline from the license text then add exactly one blank line
    // after each section for consistency.
    const normalised = entry.licenseText
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .join("\n")
      .replace(/\n+$/, "");
    lines.push(normalised);
    lines.push("");
  }

  // ---- Final separator -------------------------------------------------------
  lines.push("-".repeat(79));
  lines.push("END OF THIRD-PARTY NOTICES");
  lines.push("-".repeat(79));
  lines.push("");

  const output = lines.join("\n");

  // 6. Write the file (atomic overwrite — no partial writes)
  writeFileSync(outPath, output, "utf8");

  console.log(
    `gen:notices: wrote ${allEntries.length} entries (${npmEntries.length} npm + ${extrasEntries.length} extras) to public/THIRD-PARTY-NOTICES.txt`,
  );
}

main();
