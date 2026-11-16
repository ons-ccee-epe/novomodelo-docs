// Unit fixture for check:ptbr-sync (.claude/rules/translation-ptbr.md): pins the
// pure detectors so a refactor cannot silently let an English-only commit through.
// node:test + node:assert/strict, mirroring check-d2-layout.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import {
  findSyncViolations,
  hasSkipTrailer,
  isEmpty,
  parseNameStatus,
  untranslatedLabels,
} from "./check-ptbr-sync.mjs";

const EN = "src/content/docs/overview/how-to-read.md";
const PT = "src/content/docs/pt-br/overview/how-to-read.md";
const changes = (entries) => new Map(entries);
const all = () => true;
const none = () => false;

test("English and pt-br changed together pass", () => {
  const v = findSyncViolations(changes([[EN, "M"], [PT, "M"]]), "", all);
  assert.ok(isEmpty(v));
});

test("English edit without its pt-br counterpart is outdated", () => {
  const v = findSyncViolations(changes([[EN, "M"]]), "", all);
  assert.deepEqual(v.outdated, [[EN, PT]]);
});

test("new English page with no pt-br file is missing", () => {
  const v = findSyncViolations(changes([[EN, "A"]]), "", none);
  assert.deepEqual(v.missing, [[EN, PT]]);
});

test("deleted English page with its pt-br left behind is orphaned", () => {
  const v = findSyncViolations(changes([[EN, "D"]]), "", all);
  assert.deepEqual(v.orphaned, [[EN, PT]]);
  assert.ok(isEmpty(findSyncViolations(changes([[EN, "D"], [PT, "D"]]), "", none)));
});

test("rename splits into delete + add and needs the pt-br rename too", () => {
  const c = parseNameStatus(
    "R100\tsrc/content/docs/a/old.md\tsrc/content/docs/a/new.md\n",
  );
  assert.equal(c.get("src/content/docs/a/old.md"), "D");
  assert.equal(c.get("src/content/docs/a/new.md"), "A");
  const v = findSyncViolations(c, "", (p) => p.endsWith("old.md"));
  assert.equal(v.orphaned.length, 1);
  assert.equal(v.missing.length, 1);
});

test("pt-br-only, non-page and non-docs changes are ignored", () => {
  const v = findSyncViolations(
    changes([[PT, "M"], ["src/content/docs/_impl/image.png", "M"], ["README.md", "M"]]),
    "",
    none,
  );
  assert.ok(isEmpty(v));
});

test("sidebar label without pt-BR is flagged; translated or lang: lines pass", () => {
  const diff = [
    "+++ b/astro.config.mjs",
    '+  { label: "New section", items: [] },',
    '+  { label: "Ok", translations: { "pt-BR": "Ok" } },',
    '+  root: { label: "English", lang: "en" },',
    '-  { label: "Removed" },',
  ].join("\n");
  assert.deepEqual(untranslatedLabels(diff), ['{ label: "New section", items: [] },']);
  const v = findSyncViolations(changes([["astro.config.mjs", "M"]]), diff, all);
  assert.equal(v.labels.length, 1);
});

test("skip trailer is recognised only in the last paragraph, comments ignored", () => {
  assert.ok(hasSkipTrailer("docs: x\n\nbody\n\nPT-BR-Sync: skip\n"));
  assert.ok(hasSkipTrailer("docs: x\n\nPT-BR-Sync: skip\nCo-Authored-By: A <a@b>\n# comment\n"));
  assert.ok(!hasSkipTrailer("docs: x\n\nPT-BR-Sync: skip\n\nmore body\n"));
  assert.ok(!hasSkipTrailer("docs: x\n\n# PT-BR-Sync: skip\n"));
  assert.ok(!hasSkipTrailer("docs: mention PT-BR-Sync: skip in the subject"));
});
