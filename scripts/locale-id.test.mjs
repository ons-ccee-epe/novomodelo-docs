// The content-id mapping that serves pt-BR at the docs root and English under
// en/ (scripts/locale-id.mjs, wired into src/content.config.ts).
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defaultSlug, localeId } from "./locale-id.mjs";

test("localeId serves each home page at its locale root", () => {
  assert.equal(localeId("index.mdx"), "en");
  assert.equal(localeId("pt-br/index.mdx"), "index");
});

test("localeId prefixes an English page with en/ and strips pt-br/", () => {
  assert.equal(localeId("math/lp-formulation.md"), "en/math/lp-formulation");
  assert.equal(localeId("pt-br/math/lp-formulation.md"), "math/lp-formulation");
});

test("localeId drops a nested index the way Astro's default id does", () => {
  assert.equal(localeId("reference/output/index.mdx"), "en/reference/output");
  assert.equal(
    localeId("pt-br/reference/output/index.mdx"),
    "reference/output",
  );
});

test("defaultSlug slugs each path segment like Astro's default id", () => {
  assert.equal(defaultSlug("math/Foo Bar.md"), "math/foo-bar");
  assert.equal(localeId("math/Foo Bar.md"), "en/math/foo-bar");
});

test("both locales of the real content tree have the same pages", () => {
  const root = fileURLToPath(new URL("../src/content/docs/", import.meta.url));
  const routed = readdirSync(root, { recursive: true })
    .map((p) => p.split("\\").join("/"))
    .filter(
      (p) => /\.(md|mdx)$/.test(p) && !p.split("/").at(-1).startsWith("_"),
    );
  const ids = routed.map(localeId);
  assert.equal(new Set(ids).size, ids.length, "every content id is unique");
  const isEn = (id) => id === "en" || id.startsWith("en/");
  const en = ids
    .filter(isEn)
    .map((id) => (id === "en" ? "index" : id.slice(3)));
  const pt = ids.filter((id) => !isEn(id));
  assert.ok(en.length > 0, "the tree has English pages");
  assert.deepEqual(new Set(pt), new Set(en));
});
