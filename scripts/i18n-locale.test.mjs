// i18n locale-structure regression test (E5 ticket-021).
//
// pt-BR is the root locale, served at the docs base, and English is served
// under en/ (content ids from scripts/locale-id.mjs). This test pins the
// built-HTML invariants of that layout on the two home pages: each page's
// <html lang>, Starlight's language switcher (<starlight-lang-select>) with
// both locale labels, the hreflang alternate from pt-BR to English, the
// locale-specific methodology link of the home scene and the English version
// picker's "latest" entry.
//
// Built-dist gate, run AFTER `npm run build` or `npm run build:versions`: it
// reads index.html and en/index.html of the latest docs (docs-dist.mjs). If
// dist/ is absent it fails fast with a clear "run `npm run build` first"
// message (mirroring check-math-parity.mjs) rather than an opaque ENOENT.
// node:test + node:assert/strict, mirroring check-figures.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { latestDocsDist } from "./docs-dist.mjs";

const distDir = fileURLToPath(new URL("../dist/", import.meta.url));

if (!existsSync(distDir)) {
  console.error("i18n-locale: dist/ not found — run `npm run build` first.");
  process.exit(1);
}

// The latest docs: dist/docs/ after build:versions, dist/ after a plain build.
const distRoot = latestDocsDist(distDir);

// Guard each home page individually (mirrors check-math-parity.mjs): a locale
// regression that drops dist/en/ should fail with a named message, not an
// opaque ENOENT thrown at module load before any test() runs.
for (const f of ["index.html", "en/index.html"]) {
  if (!existsSync(`${distRoot}${f}`)) {
    console.error(
      `i18n-locale: dist/${f} not found — locale config may be broken or the build incomplete.`,
    );
    process.exit(1);
  }
}

const rootHtml = readFileSync(`${distRoot}index.html`, "utf8");
const enHtml = readFileSync(`${distRoot}en/index.html`, "utf8");

test("dist/index.html mounts Starlight's language switcher", () => {
  assert.ok(
    rootHtml.includes("starlight-lang-select"),
    "expected <starlight-lang-select> in dist/index.html",
  );
});

test("dist/index.html lists both locale labels", () => {
  assert.ok(
    rootHtml.includes("English"),
    "expected the English locale label in dist/index.html",
  );
  assert.ok(
    rootHtml.includes("Português do Brasil"),
    "expected the Português do Brasil locale label in dist/index.html",
  );
});

test("dist/index.html serves the root locale as lang=pt-BR", () => {
  assert.ok(
    rootHtml.includes('<html lang="pt-BR"'),
    'expected <html lang="pt-BR" in dist/index.html',
  );
});

test("dist/en/index.html serves the English locale as lang=en", () => {
  assert.ok(
    enHtml.includes('<html lang="en"'),
    'expected <html lang="en" in dist/en/index.html',
  );
});

test("dist/index.html points its English alternate at en/", () => {
  assert.match(
    rootHtml,
    /<link rel="alternate" hreflang="en" href="[^"]*\/en\/"/,
  );
});

test("each home scene links the methodology page of its own locale", () => {
  assert.match(
    enHtml,
    /href="(\/docs)?\/en\/overview\/sddp-framework-overview\/"/,
  );
  assert.match(
    rootHtml,
    /href="(\/docs)?\/overview\/sddp-framework-overview\/"/,
  );
});

test("the English version picker sends latest to en/", () => {
  assert.ok(
    enHtml.includes('<option value="/docs/en/"'),
    'expected <option value="/docs/en/" in dist/en/index.html',
  );
});
