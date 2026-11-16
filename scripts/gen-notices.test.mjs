// Unit fixture for the gen:notices generator (E10 ticket-031).
//
// Asserts that the generated site/public/THIRD-PARTY-NOTICES.txt contains:
//   - every npm package name from the inventory table;
//   - every extra (d2, ELK, d3, Inter);
//   - all expected SPDX strings (MPL-2.0, EPL-2.0, OFL-1.1, ISC,
//     Apache-2.0, MIT);
//   - the JSXGraph election preamble note.
//   - OFL font copyright lines and the KaTeX MIT notice (ticket-033).
//
// This test reads the COMMITTED notices file (not re-generated) to prove
// the committed artifact is correct — it does NOT execute gen-notices.mjs
// itself (that would re-run I/O and couple the test to node_modules layout).
// The CI drift-guard step in starlight-ci.yml independently verifies that
// the committed file matches what gen-notices.mjs would produce on a clean tree.
//
// Picked up automatically by the `scripts/*.test.mjs` glob in `npm test`.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const noticesPath = join(scriptDir, "..", "public", "THIRD-PARTY-NOTICES.txt");

// Read the committed file once for all assertions.
let noticesText = "";
test("notices file exists at site/public/THIRD-PARTY-NOTICES.txt", () => {
  assert.ok(
    existsSync(noticesPath),
    `Expected ${noticesPath} to exist — run \`npm run gen:notices\` first.`,
  );
  noticesText = readFileSync(noticesPath, "utf8");
  assert.ok(noticesText.length > 0, "Notices file must not be empty.");
});

// ---- npm inventory packages ------------------------------------------------
const NPM_PACKAGES = [
  "@astrojs/starlight",
  "@observablehq/plot",
  "astro",
  "astro-d2",
  "katex",
  "rehype-katex",
  "remark-math",
  "sharp",
  "@lunariajs/starlight",
  "@astrojs/check",
  "typescript",
  "@fontsource/ibm-plex-sans",
  "@fontsource/jetbrains-mono",
];

for (const pkg of NPM_PACKAGES) {
  test(`contains npm package: ${pkg}`, () => {
    assert.ok(
      noticesText.includes(pkg),
      `Expected THIRD-PARTY-NOTICES.txt to contain '${pkg}'.`,
    );
  });
}

// ---- Non-npm extras --------------------------------------------------------
const EXTRAS = ["d2", "ELK", "d3", "Inter"];

for (const extra of EXTRAS) {
  test(`contains extra: ${extra}`, () => {
    // Use a section-header pattern to avoid matching incidental occurrences.
    const sectionHeader = `Package: ${extra}`;
    assert.ok(
      noticesText.includes(sectionHeader),
      `Expected a 'Package: ${extra}' section in THIRD-PARTY-NOTICES.txt.`,
    );
  });
}

// ---- SPDX strings -----------------------------------------------------------
const SPDX_IDS = ["MPL-2.0", "EPL-2.0", "OFL-1.1", "ISC", "Apache-2.0", "MIT"];

for (const spdx of SPDX_IDS) {
  test(`contains SPDX identifier: ${spdx}`, () => {
    assert.ok(
      noticesText.includes(spdx),
      `Expected THIRD-PARTY-NOTICES.txt to contain SPDX id '${spdx}'.`,
    );
  });
}

// ---- Preamble sections ------------------------------------------------------
test("contains JSXGraph MIT election note", () => {
  assert.ok(
    noticesText.includes("JSXGraph"),
    "Expected the JSXGraph MIT election preamble note.",
  );
});

test("contains D2/ELK build-time-only note", () => {
  assert.ok(
    noticesText.includes("build-time") && noticesText.includes("MPL-2.0"),
    "Expected the D2 MPL-2.0 build-time-only note.",
  );
  assert.ok(
    noticesText.includes("EPL-2.0"),
    "Expected the ELK EPL-2.0 note.",
  );
});

test("contains regeneration hint", () => {
  assert.ok(
    noticesText.includes("npm run gen:notices"),
    "Expected a 'npm run gen:notices' regeneration hint in the file header.",
  );
});

test("contains placeholder for rehype-katex (no bundled license text)", () => {
  assert.ok(
    noticesText.includes("license text not bundled"),
    "Expected a placeholder for packages without bundled license files (rehype-katex / remark-math).",
  );
});

test("output does not contain a timestamp (drift-check stability)", () => {
  // Timestamps would make git diff --exit-code always fail in CI.
  // Check for common timestamp patterns: ISO 8601 datetime and 'Generated on'.
  assert.ok(
    !noticesText.match(/Generated on \d{4}/),
    "Output must not contain a 'Generated on YYYY' timestamp.",
  );
  assert.ok(
    !noticesText.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
    "Output must not contain an ISO 8601 datetime timestamp.",
  );
});

// ---- OFL font notices (ticket-033) -----------------------------------------
test("contains SIL Open Font License text (OFL-1.1 body present)", () => {
  assert.ok(
    noticesText.includes("SIL Open Font License"),
    "Expected 'SIL Open Font License' in THIRD-PARTY-NOTICES.txt — OFL full text must be present.",
  );
});

test("contains IBM Plex Sans foundry copyright (IBM Corp 2019)", () => {
  assert.ok(
    noticesText.includes("IBM Corp"),
    "Expected 'IBM Corp' in THIRD-PARTY-NOTICES.txt — IBM Plex Sans OFL copyright must be present.",
  );
});

test("contains JetBrains Mono foundry copyright", () => {
  assert.ok(
    noticesText.includes("JetBrains Mono Project Authors"),
    "Expected 'JetBrains Mono Project Authors' in THIRD-PARTY-NOTICES.txt — JetBrains Mono OFL copyright must be present.",
  );
});

// ---- KaTeX MIT notice (ticket-033) -----------------------------------------
test("contains KaTeX MIT copyright (Khan Academy)", () => {
  assert.ok(
    noticesText.includes("Khan Academy"),
    "Expected 'Khan Academy' in THIRD-PARTY-NOTICES.txt — KaTeX MIT copyright must be present.",
  );
});

test("contains KaTeX WOFF2 preamble note (ticket-033)", () => {
  assert.ok(
    noticesText.includes("KaTeX_*.woff2") &&
      noticesText.includes("KaTeX MIT license"),
    "Expected the KaTeX WOFF2 coverage preamble note (KaTeX_*.woff2 + KaTeX MIT license) in THIRD-PARTY-NOTICES.txt.",
  );
});
