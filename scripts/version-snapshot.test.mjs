// Unit fixture for scripts/version-snapshot.mjs (E15 tickets 245, 246 and
// 246b, GRD-10).
//
// build-versions.mjs cannot be imported (it deletes dist/ and starts a build on
// import), so its helpers live in their own module and are pinned here against
// temp-dir worktrees and snapshots. The seeded stale copy is the exact
// versions.json committed at the docs-novomodelo-v0.16.0 baseline tag: a snapshot
// built from it lists only "latest", which is the defect writeSnapshotVersions
// overwrites. The seeded link defect is the author-written content link
// href="/math/x/", which astro emits verbatim, and the redirect stub's
// <meta http-equiv="refresh" content="0;url=/math/x/">; every look-alike
// D-246-1 must leave alone has its own surviving-input case.
// node:test + node:assert/strict, picked up by the `scripts/*.test.mjs` glob in
// `npm test`.
import test from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  prefixRootRelative,
  prefixSnapshotTree,
  writeSnapshotVersions,
} from "./version-snapshot.mjs";

const STALE_V016 =
  '{\n  "latest": { "label": "latest", "base": "/", "novomodelo": "v0.16.0" },\n  "versions": []\n}\n';

const CURRENT = `${JSON.stringify(
  {
    latest: { label: "latest", base: "/", novomodelo: "v0.17.0" },
    versions: [
      {
        slug: "v0.16",
        label: "v0.16",
        base: "/v0.16/",
        ref: "docs-novomodelo-v0.16.0",
        novomodelo: "v0.16.0",
      },
    ],
  },
  null,
  2,
)}\n`;

function withTmpDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "version-snapshot-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Mirrors VersionPicker.astro: `const all = [versions.latest, ...versions.versions]`.
const pickerEntries = (file) => {
  const cfg = JSON.parse(readFileSync(file, "utf8"));
  return [cfg.latest, ...cfg.versions];
};

const namedError = (dir) => (e) =>
  e instanceof Error &&
  e.message.startsWith("build:versions: snapshot worktree ") &&
  e.message.includes(dir);

test("writes versionsText byte-for-byte into an empty directory", () => {
  withTmpDir((dir) => {
    const text = '{\t"versions":[],\n"latest":{"label":"läst"}}';
    const target = writeSnapshotVersions(dir, text);
    assert.deepEqual(readFileSync(target), Buffer.from(text, "utf8"));
  });
});

test("overwrites the stale docs-novomodelo-v0.16.0 copy so the picker lists both versions", () => {
  withTmpDir((dir) => {
    const target = join(dir, "versions.json");
    writeFileSync(target, STALE_V016);
    const stale = pickerEntries(target);
    assert.equal(stale.length, 1);
    assert.ok(!stale.some((v) => v.base === "/v0.16/"));

    writeSnapshotVersions(dir, CURRENT);

    assert.equal(readFileSync(target, "utf8"), CURRENT);
    const entries = pickerEntries(target);
    assert.equal(entries.length, 2);
    assert.equal(entries[1].base, "/v0.16/");
  });
});

test("throws the named error and creates nothing when the directory is missing", () => {
  withTmpDir((dir) => {
    const missing = join(dir, ".src-v0.16");
    assert.throws(
      () => writeSnapshotVersions(missing, CURRENT),
      namedError(missing),
    );
    assert.equal(existsSync(missing), false);
  });
});

test("throws the named error when the path is a regular file", () => {
  withTmpDir((dir) => {
    const file = join(dir, ".src-v0.16");
    writeFileSync(file, "not a worktree");
    assert.throws(() => writeSnapshotVersions(file, CURRENT), namedError(file));
    assert.equal(readFileSync(file, "utf8"), "not a worktree");
  });
});

test("returns <dir>/versions.json", () => {
  withTmpDir((dir) => {
    const target = writeSnapshotVersions(dir, CURRENT);
    assert.equal(target, join(dir, "versions.json"));
    assert.equal(existsSync(target), true);
  });
});

test("resolves a relative worktree path against the cwd, as git worktree add does", () => {
  withTmpDir((dir) => {
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      mkdirSync(".src-v0.16");
      const target = writeSnapshotVersions(".src-v0.16", CURRENT);
      assert.equal(target, join(".src-v0.16", "versions.json"));
      assert.equal(readFileSync(join(dir, target), "utf8"), CURRENT);
    } finally {
      process.chdir(cwd);
    }
  });
});

const BASE = "/v0.16/";

const PREFIXED = {
  "a content href": ['<a href="/math/x/">', '<a href="/v0.16/math/x/">'],
  "a content src": ['<img src="/img/a.png">', '<img src="/v0.16/img/a.png">'],
  "a content href with an anchor": [
    '<a href="/math/x/#s">',
    '<a href="/v0.16/math/x/#s">',
  ],
  "the site root href": ['<a href="/">', '<a href="/v0.16/">'],
  "an href after a tab and a newline": [
    '<a\n\thref="/x/">',
    '<a\n\thref="/v0.16/x/">',
  ],
  "a single-quoted href": ["<a href='/a/'>", "<a href='/v0.16/a/'>"],
  "a double-quoted value holding an apostrophe": [
    '<a href="/it\'s/">',
    '<a href="/v0.16/it\'s/">',
  ],
  "a path that only starts like the base": [
    '<a href="/v0.16-notes/x/">',
    '<a href="/v0.16/v0.16-notes/x/">',
  ],
  "a double-quoted refresh target": [
    '<meta http-equiv="refresh" content="0;url=/x/">',
    '<meta http-equiv="refresh" content="0;url=/v0.16/x/">',
  ],
  "a single-quoted refresh target": [
    "<meta http-equiv='refresh' content='0;url=/x/'>",
    "<meta http-equiv='refresh' content='0;url=/v0.16/x/'>",
  ],
  "a refresh target with the content attribute first": [
    '<meta content="0;url=/x/" http-equiv="refresh">',
    '<meta content="0;url=/v0.16/x/" http-equiv="refresh">',
  ],
  "a refresh meta in upper case": [
    '<META HTTP-EQUIV="Refresh" CONTENT="0; URL=/x/">',
    '<META HTTP-EQUIV="Refresh" CONTENT="0; URL=/v0.16/x/">',
  ],
  "a refresh target after a delay of 2": [
    '<meta http-equiv="refresh" content="2;url=/x/">',
    '<meta http-equiv="refresh" content="2;url=/v0.16/x/">',
  ],
  "a refresh target without a delay": [
    '<meta http-equiv="refresh" content="url=/x/">',
    '<meta http-equiv="refresh" content="url=/v0.16/x/">',
  ],
  "a refresh target with a query and a fragment": [
    '<meta http-equiv="refresh" content="0;url=/x/?q=1#s">',
    '<meta http-equiv="refresh" content="0;url=/v0.16/x/?q=1#s">',
  ],
  "a double-quoted refresh target holding an apostrophe": [
    '<meta http-equiv="refresh" content="0;url=/it\'s/">',
    '<meta http-equiv="refresh" content="0;url=/v0.16/it\'s/">',
  ],
  "a refresh target among other meta attributes": [
    '<meta data-x="y" http-equiv="refresh" id="r" content="0;url=/x/">',
    '<meta data-x="y" http-equiv="refresh" id="r" content="0;url=/v0.16/x/">',
  ],
  "a refresh target in a tag with a > inside a value": [
    '<meta title="a>b" http-equiv="refresh" content="0;url=/x/">',
    '<meta title="a>b" http-equiv="refresh" content="0;url=/v0.16/x/">',
  ],
  "a refresh target that only starts like the base": [
    '<meta http-equiv="refresh" content="0;url=/v0.16-notes/x/">',
    '<meta http-equiv="refresh" content="0;url=/v0.16/v0.16-notes/x/">',
  ],
};

for (const [name, [input, expected]] of Object.entries(PREFIXED)) {
  test(`prefixes ${name}`, () => {
    assert.equal(prefixRootRelative(input, BASE), expected);
  });
}

const UNTOUCHED = {
  "an already-prefixed src": '<script src="/v0.16/_astro/a.js"></script>',
  "an already-prefixed href": '<a href="/v0.16/math/x/">',
  "the bare base href": '<a href="/v0.16">',
  "the bare base with a fragment": '<a href="/v0.16#s">',
  "the bare base with a query": '<a href="/v0.16?x=1">',
  "a protocol-relative href": '<a href="//cdn.example/x">',
  "a protocol-relative src": '<img src="//cdn.example/a.png">',
  "a fragment href": '<a href="#s">',
  "an absolute https href": '<a href="https://docs.novomodelo.invalid/x">',
  "a mailto href": '<a href="mailto:a@b.example">',
  "a relative href": '<a href="rel/x">',
  "a dot-relative href": '<a href="../x/">',
  "the picker's option value": '<option value="/">latest</option>',
  "a data-href attribute": '<div data-href="/x">',
  "an xlink:href attribute": '<use xlink:href="/sprite.svg#a"></use>',
  "an already-prefixed refresh target":
    '<meta http-equiv="refresh" content="0;url=/v0.16/x/">',
  "the bare base refresh target":
    '<meta http-equiv="refresh" content="0;url=/v0.16">',
  "the bare base refresh target with a fragment":
    '<meta http-equiv="refresh" content="0;url=/v0.16#s">',
  "an absolute refresh target":
    '<meta http-equiv="refresh" content="0;url=https://docs.novomodelo.invalid/x/">',
  "a protocol-relative refresh target":
    '<meta http-equiv="refresh" content="0;url=//cdn.example/x/">',
  "a relative refresh target":
    '<meta http-equiv="refresh" content="0;url=rel/x/">',
  "a refresh without a url": '<meta http-equiv="refresh" content="30">',
  "a non-refresh meta content url": '<meta name="x" content="0;url=/a/">',
  "a meta named refresh": '<meta name="refresh" content="0;url=/a/">',
  "a non-meta element with refresh attributes":
    '<link http-equiv="refresh" content="0;url=/a/">',
  "the bare base refresh target before another attribute":
    '<meta content="0;url=/v0.16" http-equiv="refresh">',
  "an http-equiv value that only starts with refresh":
    '<meta http-equiv="refresh-not" content="0;url=/a/">',
  "a url inside another attribute than content":
    '<meta http-equiv="refresh" content="30" title="url=/a/">',
  "a refresh key that only ends in url":
    '<meta http-equiv="refresh" content="0;curl=/a/">',
  "a data-http-equiv attribute":
    '<meta data-http-equiv="refresh" content="0;url=/a/">',
  "a data-content attribute":
    '<meta http-equiv="refresh" data-content="0;url=/a/">',
  "an element that only starts like meta":
    '<metadata http-equiv="refresh" content="0;url=/a/">',
};

for (const [name, html] of Object.entries(UNTOUCHED)) {
  test(`leaves ${name} untouched`, () => {
    assert.equal(prefixRootRelative(html, BASE), html);
  });
}

test("base / is a no-op", () => {
  const html = '<a href="/math/x/">x</a><img src=\'/a.png\'><a href="/">';
  assert.equal(prefixRootRelative(html, "/"), html);
});

test("a base without a trailing slash behaves as the slashed base", () => {
  const html =
    '<a href="/math/x/">x</a><a href="/v0.16">v</a><a href="/v0.16/y/">y</a><a href="/v0.16-notes/">n</a>';
  const expected =
    '<a href="/v0.16/math/x/">x</a><a href="/v0.16">v</a><a href="/v0.16/y/">y</a><a href="/v0.16/v0.16-notes/">n</a>';
  assert.equal(prefixRootRelative(html, "/v0.16"), expected);
  assert.equal(prefixRootRelative(html, "/v0.16/"), expected);
});

test("rewrites every link of a document and leaves the rest of the markup alone", () => {
  const html =
    '<nav><a class="k" href="/a/" data-testid="t">A</a><a href="/v0.16/b/">B</a></nav>\n<img alt="" src="/i.png" width="2"><a href="https://x.example/">X</a>';
  assert.equal(
    prefixRootRelative(html, BASE),
    '<nav><a class="k" href="/v0.16/a/" data-testid="t">A</a><a href="/v0.16/b/">B</a></nav>\n<img alt="" src="/v0.16/i.png" width="2"><a href="https://x.example/">X</a>',
  );
});

test("a second application is byte-identical to the first", () => {
  const html =
    '<a href="/">h</a><a href="/math/x/#s">m</a><img src="/i.png"><a href=\'/a/\'>a</a>';
  const once = prefixRootRelative(html, BASE);
  assert.notEqual(once, html);
  assert.equal(prefixRootRelative(once, BASE), once);
});

// The redirect stub exactly as astro's redirectTemplate emits it: the
// destination sits unprefixed in the title, the refresh meta, the <a> and the
// <code> text; only the "from" path carries the base.
const astroStub = (refresh, link) => `<!doctype html>
<title>Redirecting to: /math/lp-formulation/</title>
<meta http-equiv="refresh" content="0;url=${refresh}">
<meta name="robots" content="noindex">
<link rel="canonical" href="https://docs.novomodelo.invalid/math/lp-formulation/">
<body>
\t<a href="${link}">Redirecting from <code>/v0.16/specs/math/lp-formulation.html/</code> to <code>/math/lp-formulation/</code></a>
</body>`;
const STUB = astroStub("/math/lp-formulation/", "/math/lp-formulation/");
const STUB_IN_SNAPSHOT = astroStub(
  "/v0.16/math/lp-formulation/",
  "/v0.16/math/lp-formulation/",
);

test("prefixes the refresh target and the link of astro's redirect stub, and nothing else", () => {
  assert.equal(prefixRootRelative(STUB, BASE), STUB_IN_SNAPSHOT);
});

test("a second application to a redirect stub is byte-identical to the first", () => {
  const once = prefixRootRelative(STUB, BASE);
  assert.notEqual(once, STUB);
  assert.equal(prefixRootRelative(once, BASE), once);
});

test("prefixes a refresh target that follows other meta tags and leaves those alone", () => {
  const html =
    '<meta charset="utf-8"><meta name="x" content="0;url=/n/"><meta http-equiv="refresh" content="0;url=/a/"><meta http-equiv="refresh" content="0;url=/b/">';
  assert.equal(
    prefixRootRelative(html, BASE),
    '<meta charset="utf-8"><meta name="x" content="0;url=/n/"><meta http-equiv="refresh" content="0;url=/v0.16/a/"><meta http-equiv="refresh" content="0;url=/v0.16/b/">',
  );
});

test("base / leaves a redirect stub untouched", () => {
  assert.equal(prefixRootRelative(STUB, "/"), STUB);
});

const canChmod = process.platform !== "win32" && process.getuid?.() !== 0;
const needsChmod = {
  skip: !canChmod && "chmod is not enforced for root or on win32",
};

function writeTree(dir, files) {
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
}

const readTree = (dir, rels) =>
  Object.fromEntries(rels.map((r) => [r, readFileSync(join(dir, r), "utf8")]));

test("prefixSnapshotTree rewrites the HTML files, leaves other files byte-identical and counts both", () => {
  withTmpDir((dir) => {
    const tree = {
      "a/index.html":
        '<p>Energía — ρ</p><a href="/x/">x</a><a href="/y/">y</a>',
      "b.html": '<img src="/z.png">',
      "c.css": 'a { content: "x" } /* href="/x" */',
      "d.html.map": '{"href":" href=\'/x\'"}',
      "e.xhtml": '<a href="/x/">x</a>',
    };
    writeTree(dir, tree);

    assert.deepEqual(prefixSnapshotTree(dir, BASE), { files: 2, rewritten: 3 });

    assert.deepEqual(readTree(dir, Object.keys(tree)), {
      ...tree,
      "a/index.html":
        '<p>Energía — ρ</p><a href="/v0.16/x/">x</a><a href="/v0.16/y/">y</a>',
      "b.html": '<img src="/v0.16/z.png">',
    });
  });
});

test("prefixSnapshotTree walks into a directory named *.html, as the redirect stubs are laid out", () => {
  withTmpDir((dir) => {
    const stub = "specs/math/lp-formulation.html/index.html";
    writeTree(dir, {
      [stub]:
        '<meta http-equiv="refresh" content="0;url=/v0.16/math/lp/"><a href="/math/lp/">go</a>',
    });

    assert.deepEqual(prefixSnapshotTree(dir, BASE), { files: 1, rewritten: 1 });
    assert.equal(
      readFileSync(join(dir, stub), "utf8"),
      '<meta http-equiv="refresh" content="0;url=/v0.16/math/lp/"><a href="/v0.16/math/lp/">go</a>',
    );
  });
});

test("prefixSnapshotTree prefixes the refresh target and the link of a redirect stub and counts both", () => {
  withTmpDir((dir) => {
    const stub = "specs/math/x.html/index.html";
    writeTree(dir, { [stub]: STUB });

    assert.deepEqual(prefixSnapshotTree(dir, BASE), { files: 1, rewritten: 2 });
    assert.equal(readFileSync(join(dir, stub), "utf8"), STUB_IN_SNAPSHOT);
    assert.deepEqual(prefixSnapshotTree(dir, BASE), { files: 1, rewritten: 0 });
  });
});

test("prefixSnapshotTree does not rewrite a file that needs no change", () => {
  withTmpDir((dir) => {
    const file = join(dir, "a.html");
    writeFileSync(file, '<a href="/v0.16/x/">x</a><a href="#s">s</a>');
    const past = new Date("2020-01-01T00:00:00Z");
    utimesSync(file, past, past);

    assert.deepEqual(prefixSnapshotTree(dir, BASE), { files: 1, rewritten: 0 });
    assert.equal(statSync(file).mtime.getTime(), past.getTime());
  });
});

test("prefixSnapshotTree never opens a non-HTML file", needsChmod, () => {
  withTmpDir((dir) => {
    writeTree(dir, { "c.css": 'href="/x"', "d.html.map": ' href="/x"' });
    chmodSync(join(dir, "c.css"), 0o000);
    chmodSync(join(dir, "d.html.map"), 0o000);

    assert.deepEqual(prefixSnapshotTree(dir, BASE), { files: 0, rewritten: 0 });
  });
});

const namesPath = (file, code) => (e) =>
  e.code === code && e.message.includes(file);

test(
  "prefixSnapshotTree throws naming an unreadable HTML file",
  needsChmod,
  () => {
    withTmpDir((dir) => {
      const file = join(dir, "a", "b.html");
      writeTree(dir, { "a/b.html": '<a href="/x/">x</a>' });
      chmodSync(file, 0o000);

      assert.throws(
        () => prefixSnapshotTree(dir, BASE),
        namesPath(file, "EACCES"),
      );
    });
  },
);

test(
  "prefixSnapshotTree throws naming an unwritable HTML file",
  needsChmod,
  () => {
    withTmpDir((dir) => {
      const file = join(dir, "a", "b.html");
      writeTree(dir, { "a/b.html": '<a href="/x/">x</a>' });
      chmodSync(file, 0o444);

      assert.throws(
        () => prefixSnapshotTree(dir, BASE),
        namesPath(file, "EACCES"),
      );
      assert.equal(readFileSync(file, "utf8"), '<a href="/x/">x</a>');
    });
  },
);
