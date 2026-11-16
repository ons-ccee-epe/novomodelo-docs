// Heading ids without diacritics (pt-BR headings): node:test fixture for
// scripts/rehype-ascii-heading-ids.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import rehypeAsciiHeadingIds, { stripDiacritics } from "./rehype-ascii-heading-ids.mjs";

const heading = (text, properties = {}) => ({
  type: "element",
  tagName: "h2",
  properties,
  children: [{ type: "text", value: text }],
});
function idsOf(...headings) {
  const tree = { type: "root", children: headings };
  rehypeAsciiHeadingIds()(tree, { history: ["page.md"], data: {} });
  return headings.map((h) => h.properties.id);
}

test("stripDiacritics removes accents, tilde and cedilla, keeping other letters", () => {
  assert.equal(stripDiacritics("histórica-não-caça"), "historica-nao-caca");
  assert.equal(stripDiacritics("σ-e-β"), "σ-e-β");
});

test("generated ids carry no diacritics", () => {
  assert.deepEqual(idsOf(heading("Recusas da biblioteca histórica")), ["recusas-da-biblioteca-historica"]);
  assert.deepEqual(idsOf(heading("Alguma coisa não")), ["alguma-coisa-nao"]);
  assert.deepEqual(idsOf(heading("Caça")), ["caca"]);
});

test("an English heading gets the same id as before", () => {
  assert.deepEqual(idsOf(heading("Implementation in Novomodelo")), ["implementation-in-novomodelo"]);
});

test("a collision after stripping is suffixed within the page", () => {
  assert.deepEqual(idsOf(heading("Seção"), heading("Secao")), ["secao", "secao-1"]);
});

test("an explicit id is kept as written", () => {
  assert.deepEqual(idsOf(heading("Histórico", { id: "meu-id-é" })), ["meu-id-é"]);
});
