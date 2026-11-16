// The link codemod that moves content links to the locale URLs: English pages
// link under /en/, pt-BR pages link at the root (scripts/relocale-links.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import { relocaleLinks } from "./relocale-links.mjs";

const enSlugs = new Set([
  "math/lp-formulation",
  "reference/output",
  "getting-started/installation",
]);
const en = (text) => relocaleLinks(text, { locale: "en", enSlugs });
const pt = (text) => relocaleLinks(text, { locale: "pt-BR", enSlugs });

test("an English Markdown link to a page gains the /en prefix", () => {
  assert.equal(
    en("[LP](/math/lp-formulation/)").text,
    "[LP](/en/math/lp-formulation/)",
  );
  assert.equal(
    en("[s](/math/lp-formulation#rows)").text,
    "[s](/en/math/lp-formulation#rows)",
  );
  assert.equal(
    en('[t](/math/lp-formulation/ "Title")').text,
    '[t](/en/math/lp-formulation/ "Title")',
  );
  assert.equal(en("[home](/)").text, "[home](/en/)");
  assert.equal(
    en("[lp]: /math/lp-formulation/").text,
    "[lp]: /en/math/lp-formulation/",
  );
});

test("an English href and a frontmatter link gain the /en prefix", () => {
  assert.equal(
    en('<a class="home-path" href="/reference/output/">').text,
    '<a class="home-path" href="/en/reference/output/">',
  );
  assert.equal(
    en("      link: /getting-started/installation/").text,
    "      link: /en/getting-started/installation/",
  );
});

test("a pt-BR link loses the /pt-br prefix", () => {
  assert.equal(
    pt("[LP](/pt-br/math/lp-formulation/)").text,
    "[LP](/math/lp-formulation/)",
  );
  assert.equal(pt('<a href="/pt-br/">').text, '<a href="/">');
  assert.equal(pt("[a](/pt-br/math/lp-formulation/#rows)").rewritten, 1);
});

test("assets, other paths, external, relative and fragment links stay", () => {
  const kept = [
    "[s](/schemas/case.schema.json)",
    "[d](/lunaria/)",
    "[x](https://doi.org/x)",
    "[r](../x/)",
    "[f](#x)",
    'link: "#entities"',
  ];
  for (const text of kept) {
    assert.deepEqual(en(text), { text, rewritten: 0 }, text);
    assert.deepEqual(pt(text), { text, rewritten: 0 }, text);
  }
});

test("a link inside a fenced code block stays", () => {
  const text =
    "```md\n[LP](/math/lp-formulation/)\n```\n[LP](/math/lp-formulation/)\n";
  assert.equal(
    en(text).text,
    "```md\n[LP](/math/lp-formulation/)\n```\n[LP](/en/math/lp-formulation/)\n",
  );
});

test("a second run rewrites nothing", () => {
  const enText =
    '[LP](/math/lp-formulation/) <a href="/">h</a>\nlink: /reference/output/';
  const ptText = '[LP](/pt-br/math/lp-formulation/) <a href="/pt-br/">h</a>';
  assert.equal(en(en(enText).text).rewritten, 0);
  assert.equal(pt(pt(ptText).text).rewritten, 0);
  assert.equal(en(enText).rewritten, 3);
  assert.equal(pt(ptText).rewritten, 2);
});
