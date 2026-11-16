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
  legacyRedirects,
  localeRedirects,
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

// A latest docs tree: pt-BR at the root, English under en/, one frozen
// snapshot and the Lunaria dashboard.
const DOCS_PAGES = {
  "index.html": "pt-BR home",
  "404.html": "docs 404",
  "math/x/index.html": "pt-BR x",
  "en/index.html": "English home",
  "en/math/x/index.html": "English x",
  "v0.19/index.html": "v0.19 home",
  "v0.19/math/x/index.html": "v0.19 x",
  "lunaria/index.html": "dashboard",
  "_astro/app.css": "",
};
const byPath = (a, b) => a.path.localeCompare(b.path);

test("localeRedirects sends each pt-br URL to its pt-BR page at the docs root", () => {
  assert.deepEqual(localeRedirects(tree(DOCS_PAGES), "docs").sort(byPath), [
    { path: "pt-br", target: "/docs/" },
    { path: "pt-br/math/x", target: "/docs/math/x/" },
  ]);
});

test("legacyRedirects keeps the pre-/docs/ English URLs in English", () => {
  assert.deepEqual(legacyRedirects(tree(DOCS_PAGES), "docs").sort(byPath), [
    { path: "lunaria", target: "/docs/lunaria/" },
    { path: "math/x", target: "/docs/en/math/x/" },
    { path: "v0.19", target: "/docs/v0.19/" },
    { path: "v0.19/math/x", target: "/docs/v0.19/math/x/" },
  ]);
});

test("assembleLanding puts the hotsite, 404, public files and stubs in place", () => {
  const dist = tree(
    Object.fromEntries(
      Object.entries(DOCS_PAGES).map(([rel, body]) => [`docs/${rel}`, body]),
    ),
  );
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
  assert.ok(
    !existsSync(join(dist, "README.txt")),
    "README.txt is not published",
  );
  assert.equal(readFileSync(join(dist, "404.html"), "utf8"), "docs 404");
  assert.ok(existsSync(join(dist, "schemas/config.schema.json")));
  assert.ok(existsSync(join(dist, "THIRD-PARTY-NOTICES.txt")));
  assert.ok(
    !existsSync(join(dist, "d2")),
    "the d2 render cache stays under the docs base",
  );
  assert.equal(
    readFileSync(join(dist, "docs/pt-br/index.html"), "utf8"),
    redirectStubHtml("/docs/"),
  );
  assert.equal(
    readFileSync(join(dist, "docs/pt-br/math/x/index.html"), "utf8"),
    redirectStubHtml("/docs/math/x/"),
  );
  assert.equal(
    readFileSync(join(dist, "math/x/index.html"), "utf8"),
    redirectStubHtml("/docs/en/math/x/"),
  );
  assert.match(
    readFileSync(join(dist, "v0.19/index.html"), "utf8"),
    /url=\/docs\/v0\.19\//,
  );
  assert.ok(!existsSync(join(dist, "en")), "no root stub for the /en/ URLs");
  assert.ok(
    !existsSync(join(dist, "pt-br")),
    "no root stub for the /pt-br/ URLs",
  );
  assert.deepEqual(result, { stubs: 4, localeStubs: 2 });
});

test("assembleLanding refuses a pt-br stub that would overwrite a docs page", () => {
  const dist = tree({
    "docs/index.html": "",
    "docs/404.html": "",
    "docs/math/x/index.html": "",
    "docs/en/index.html": "",
    "docs/en/math/x/index.html": "",
    "docs/pt-br/math/x/index.html": "a page at /docs/pt-br/math/x/",
  });
  assert.throws(
    () =>
      assembleLanding({
        dist,
        docsBase: "/docs/",
        hotsiteDir: tree({ "index.html": "" }),
        publicDir: tree({}),
      }),
    /dist\/docs\/pt-br\/math\/x\/index\.html/,
  );
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
  const hotsite = tree({
    "index.html": "",
    "assets/index.html": "hotsite page",
  });
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
