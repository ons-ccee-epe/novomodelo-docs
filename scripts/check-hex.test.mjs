import { test } from "node:test";
import assert from "node:assert/strict";
import { findHexes, checkFiles, parseAllow, TOKENS_FILE } from "./check-hex.mjs";

const hexes = (text, path) => findHexes(text, path).map((h) => h.hex);

test("css: finds hex values, skips comments", () => {
  const css = "/* Copper #B87333 */\n:root { --a: #2F6C67; --b: #fff; }\n";
  assert.deepEqual(hexes(css, "src/styles/x.css"), ["#2f6c67", "#fff"]);
});

test("astro: skips // and <!-- --> comments but keeps URLs intact", () => {
  const astro = '<!-- #123456 -->\n// #abcdef\nconst u = "https://x.org/#top";\nconst c = "#c0ffee";\n';
  assert.deepEqual(hexes(astro, "src/components/X.astro"), ["#c0ffee"]);
});

test("pages: heading anchors are not colours", () => {
  const md = "See [sampling](./scenario-generation/#23a-sampling-method) and page#231-piecewise.\n";
  assert.deepEqual(hexes(md, "src/content/docs/a.mdx"), []);
});

test("pages: a hex in a colour position outside fences is found", () => {
  const md = '<span style="color:#ff0000">x</span>\n';
  assert.deepEqual(hexes(md, "src/content/docs/a.mdx"), ["#ff0000"]);
});

test("pages: d2 fences accept only the element hues", () => {
  const md = [
    "```d2",
    'classes: { hydro: {style: {stroke: "#3378a3"}} }',
    'x: {style: {stroke: "#B87333"}}',
    "```",
    "```json",
    '{ "color": "#123456" }',
    "```",
  ].join("\n");
  const problems = checkFiles([{ path: "src/content/docs/a.mdx", text: md }], new Map());
  assert.equal(problems.length, 1);
  assert.match(problems[0], /NOT-AN-ELEMENT-HUE src\/content\/docs\/a\.mdx:3 #b87333/);
});

test("tokens.css is exempt; other files are not", () => {
  const files = [
    { path: TOKENS_FILE, text: ":root { --x: #123456; }" },
    { path: "src/styles/brand.css", text: ":root { --y: #123456; }" },
  ];
  const problems = checkFiles(files, new Map());
  assert.deepEqual(problems, [
    "check:hex: HEX-OUTSIDE-TOKENS src/styles/brand.css:1 #123456 (use a token from src/styles/tokens.css)",
  ]);
});

test("exceptions allow a hit and report a stale entry", () => {
  const allow = parseAllow(
    "# comment\nsrc/styles/brand.css\t#123456\tdark\nsrc/styles/brand.css\t#abcdef\tgone\n",
  );
  const problems = checkFiles([{ path: "src/styles/brand.css", text: "a { color: #123456 }" }], allow);
  assert.deepEqual(problems, [
    "check:hex: STALE-EXCEPTION src/styles/brand.css #abcdef (remove it from scripts/hex-allow.txt)",
  ]);
});

import { rootTokens, checkHotsiteSync } from "./check-hex.mjs";

test("D7: tokens shared with the hotsite must match, case and spaces aside", () => {
  const docs = ":root { --color-accent: #2f6c67; --radius: 12px; --a: rgba(0, 0, 0, 0.5); }";
  const hot = "/* x */ :root { --color-accent: #2F6C67; --radius: 14px; --a: rgba(0,0,0,.5); }";
  assert.equal(rootTokens(hot).get("--color-accent"), "#2f6c67");
  assert.deepEqual(checkHotsiteSync(docs, hot), [
    "check:hex: HOTSITE-DRIFT --radius is 12px in src/styles/tokens.css but 14px in hotsite/style.css",
  ]);
});
