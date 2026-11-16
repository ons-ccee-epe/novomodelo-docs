// i18n locale-structure regression test (E5 ticket-021).
//
// The Starlight i18n scaffolding is confirm-and-reserve: root → English is
// served at the docs base, the pt-br locale is reserved (routes under pt-br/, lang
// pt-BR), and Starlight's language switcher (<starlight-lang-select>) renders
// in the header. The config in astro.config.mjs already works; this test pins
// the four built-HTML invariants so the locale wiring cannot silently regress.
//
// Built-dist gate, run AFTER `npm run build` or `npm run build:versions`: it
// reads index.html and pt-br/index.html of the latest docs (docs-dist.mjs). If dist/ is absent it fails fast with a clear
// "run `npm run build` first" message (mirroring check-math-parity.mjs) rather
// than an opaque ENOENT. node:test + node:assert/strict, mirroring
// check-figures.test.mjs.
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

// Guard each landing page individually (mirrors check-math-parity.mjs): a locale
// regression that drops dist/pt-br/ should fail with a named message, not an
// opaque ENOENT thrown at module load before any test() runs.
for (const f of ["index.html", "pt-br/index.html"]) {
  if (!existsSync(`${distRoot}${f}`)) {
    console.error(
      `i18n-locale: dist/${f} not found — locale config may be broken or the build incomplete.`,
    );
    process.exit(1);
  }
}

// Read the root-locale and reserved pt-br fallback landing pages once.
const rootHtml = readFileSync(`${distRoot}index.html`, "utf8");
const ptBrHtml = readFileSync(`${distRoot}pt-br/index.html`, "utf8");

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

test("dist/index.html serves the root locale as lang=en", () => {
  assert.ok(
    rootHtml.includes('<html lang="en"'),
    'expected <html lang="en" in dist/index.html',
  );
});

test("dist/pt-br/index.html reserves the pt-BR locale as lang=pt-BR", () => {
  assert.ok(
    ptBrHtml.includes('<html lang="pt-BR"'),
    'expected <html lang="pt-BR" in dist/pt-br/index.html',
  );
});
