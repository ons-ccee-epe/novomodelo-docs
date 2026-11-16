// Unit tests for scripts/landing-assembly.mjs, the step of build-versions.mjs
// that serves the hotsite at "/" and keeps every docs URL from the time the
// docs were served at "/" working. Fixture trees in a temp dir; no build.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  assembleLanding,
  legacyPagePaths,
  redirectStubHtml,
} from "./landing-assembly.mjs";

const tmp = mkdtempSync(join(tmpdir(), "landing-assembly-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

let fixtureCount = 0;
function tree(files) {
  const root = join(tmp, `t${fixtureCount++}`);
  for (const [rel, body] of Object.entries(files)) {
    const path = join(root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
  }
  mkdirSync(root, { recursive: true });
  return root;
}

test("redirectStubHtml sends the page to its target, keeping query and fragment", () => {
  const html = redirectStubHtml("/docs/math/sddp-algorithm/");
  assert.match(
    html,
    /<meta http-equiv="refresh" content="0;url=\/docs\/math\/sddp-algorithm\/">/,
  );
  assert.match(
    html,
    /location\.replace\("\/docs\/math\/sddp-algorithm\/" \+ location\.search \+ location\.hash\)/,
  );
  assert.match(html, /<a href="\/docs\/math\/sddp-algorithm\/">/);
  assert.match(html, /<meta name="robots" content="noindex">/);
});

test("redirectStubHtml percent-encodes the path and escapes markup", () => {
  const html = redirectStubHtml('/docs/a b/"<x>/');
  assert.ok(html.includes('url=/docs/a%20b/%22%3Cx%3E/"'), html);
  assert.ok(!html.includes("<x>"), "no raw markup from the path");
});

test("legacyPagePaths lists every page directory except the docs root", () => {
  const docs = tree({
    "index.html": "",
    "404.html": "",
    "math/sddp-algorithm/index.html": "",
    "v0.19/index.html": "",
    "v0.19/math/sddp-algorithm/index.html": "",
    "_astro/app.css": "",
  });
  assert.deepEqual(legacyPagePaths(docs).sort(), [
    "math/sddp-algorithm",
    "v0.19",
    "v0.19/math/sddp-algorithm",
  ]);
});

test("assembleLanding puts the hotsite, 404, public files and stubs at the root", () => {
  const dist = tree({
    "docs/index.html": "docs home",
    "docs/404.html": "docs 404",
    "docs/math/x/index.html": "x",
    "docs/v0.19/index.html": "v0.19 home",
  });
  const hotsite = tree({
    "index.html": "hotsite",
    "README.txt": "maintainer notes",
    "assets/images/hero.jpg": "jpg",
  });
  const pub = tree({
    "schemas/config.schema.json": "{}",
    "THIRD-PARTY-NOTICES.txt": "notices",
    "d2/cache.svg": "svg",
  });

  const result = assembleLanding({
    dist,
    docsBase: "/docs/",
    hotsiteDir: hotsite,
    publicDir: pub,
  });

  assert.equal(readFileSync(join(dist, "index.html"), "utf8"), "hotsite");
  assert.ok(existsSync(join(dist, "assets/images/hero.jpg")));
  assert.ok(!existsSync(join(dist, "README.txt")), "README.txt is not published");
  assert.equal(readFileSync(join(dist, "404.html"), "utf8"), "docs 404");
  assert.ok(existsSync(join(dist, "schemas/config.schema.json")));
  assert.ok(existsSync(join(dist, "THIRD-PARTY-NOTICES.txt")));
  assert.ok(!existsSync(join(dist, "d2")), "the d2 render cache stays under the docs base");
  assert.match(
    readFileSync(join(dist, "math/x/index.html"), "utf8"),
    /url=\/docs\/math\/x\//,
  );
  assert.match(
    readFileSync(join(dist, "v0.19/index.html"), "utf8"),
    /url=\/docs\/v0\.19\//,
  );
  assert.equal(result.stubs, 2);
});

test("assembleLanding refuses a docs base of /", () => {
  const dist = tree({ "index.html": "docs" });
  assert.throws(
    () =>
      assembleLanding({
        dist,
        docsBase: "/",
        hotsiteDir: tree({ "index.html": "" }),
        publicDir: tree({}),
      }),
    /latest\.base/,
  );
});

test("assembleLanding refuses a redirect stub that would overwrite a root file", () => {
  const dist = tree({
    "docs/index.html": "",
    "docs/404.html": "",
    "docs/assets/index.html": "a docs page at /docs/assets/",
  });
  const hotsite = tree({ "index.html": "", "assets/index.html": "hotsite page" });
  assert.throws(
    () =>
      assembleLanding({
        dist,
        docsBase: "/docs/",
        hotsiteDir: hotsite,
        publicDir: tree({}),
      }),
    /assets\/index\.html/,
  );
});
