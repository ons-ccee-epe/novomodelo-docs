// Unit tests for scripts/docs-dist.mjs: which directory of dist/ holds the
// latest docs after `npm run build` (dist/) and after `npm run build:versions`
// (dist/<latest.base>). Fixture trees in a temp dir; no build.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { latestDocsDist } from "./docs-dist.mjs";

const tmp = mkdtempSync(join(tmpdir(), "docs-dist-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

const versions = (base) => JSON.stringify({ latest: { base }, versions: [] });

test("an assembled dist/ resolves to dist/<latest.base>/", () => {
  const dist = join(tmp, "assembled") + sep;
  mkdirSync(join(dist, "docs"), { recursive: true });
  writeFileSync(join(dist, "index.html"), "hotsite");
  writeFileSync(join(dist, "docs", "index.html"), "docs");
  assert.equal(latestDocsDist(dist, versions("/docs/")), join(dist, "docs") + sep);
});

test("a plain-build dist/ (no nested base) resolves to dist/ itself", () => {
  const dist = join(tmp, "plain") + sep;
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, "index.html"), "docs");
  assert.equal(latestDocsDist(dist, versions("/docs/")), dist);
});

test("a latest.base of / resolves to dist/ itself", () => {
  const dist = join(tmp, "root") + sep;
  mkdirSync(dist, { recursive: true });
  assert.equal(latestDocsDist(dist, versions("/")), dist);
});
