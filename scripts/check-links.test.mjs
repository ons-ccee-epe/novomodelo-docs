// Unit fixture for the check:links fragment-extraction helper (drift-remediation
// ticket-002). node:test + node:assert/strict, mirroring
// scripts/refresh-schemas.test.mjs's exported-helper fixture style: exercises
// `extractAnchors` directly against inline HTML fixtures, with no filesystem or
// dist/ access (the module's crawl/exit logic sits behind main()'s direct-run
// guard, so importing it here for the helper alone is side-effect-free).
import test from "node:test";
import assert from "node:assert/strict";
import {
  extractAnchors,
  htmlLang,
  isRedirectStub,
  linkPolicy,
} from "./check-links.mjs";
import { redirectStubHtml } from "./landing-assembly.mjs";

const page = (lang) =>
  `<!doctype html><html lang="${lang}" dir="ltr"><head></head><body></body></html>`;

test("extractAnchors returns every id/name attribute value", () => {
  const html =
    '<h2 id="stage-index">Stage index</h2><a name="foo">jump</a><p>text</p>';
  assert.deepEqual(extractAnchors(html), new Set(["stage-index", "foo"]));
});

test("extractAnchors returns an empty set for anchor-free HTML", () => {
  assert.deepEqual(extractAnchors("<p>no anchors here</p>"), new Set());
});

test("extractAnchors does not mistake a hyphenated attribute (data-id) for id", () => {
  const html = '<div data-id="not-an-anchor"><p>text</p></div>';
  assert.deepEqual(extractAnchors(html), new Set());
});

test("extractAnchors preserves case (fragment matching is case-sensitive)", () => {
  const html = '<h2 id="Stage-Index">Stage index</h2>';
  assert.deepEqual(extractAnchors(html), new Set(["Stage-Index"]));
});

test("htmlLang reads the lang attribute of the html element", () => {
  assert.equal(htmlLang(page("pt-BR")), "pt-BR");
  assert.equal(htmlLang("<p>no html</p>"), null);
});

test("isRedirectStub spots a meta-refresh stub and passes a page", () => {
  assert.equal(isRedirectStub(redirectStubHtml("/docs/x/")), true);
  assert.equal(
    isRedirectStub('<meta http-equiv="refresh" content="0;url=/en/x/">'),
    true,
  );
  assert.equal(isRedirectStub(page("en")), false);
});

test("linkPolicy flags a link that switches language", () => {
  assert.equal(linkPolicy(page("en"), page("pt-BR")), "crosses-language");
  assert.equal(linkPolicy(page("pt-BR"), page("en")), "crosses-language");
});

test("linkPolicy passes a link within one language", () => {
  assert.equal(linkPolicy(page("en"), page("en")), null);
  assert.equal(linkPolicy(page("pt-BR"), page("pt-BR")), null);
});

test("linkPolicy flags a link to a redirect stub", () => {
  assert.equal(
    linkPolicy(page("pt-BR"), redirectStubHtml("/docs/x/")),
    "redirect-stub",
  );
});
