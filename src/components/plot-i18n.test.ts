// Mirrors src/figures/*.test.ts (node:test + node:assert/strict).
import test from "node:test";
import assert from "node:assert/strict";
import { isPtPage, tr } from "./plot-i18n.ts";

test("tr translates a label found in the table", () => {
  assert.equal(tr("iteration"), "iteração");
});

test("tr keeps the leading and trailing arrow around the translated core", () => {
  assert.equal(tr("↑ total expected cost"), "↑ custo total esperado");
  assert.equal(tr("iteration k →"), "iteração k →");
});

test("tr translates the lag season template", () => {
  assert.equal(tr("lag ℓ (season 3)"), "defasagem ℓ (período sazonal 3)");
});

test("tr translates the band template and turns the first dot into a decimal comma", () => {
  assert.equal(tr("±1.96/√Nₘ band, Nₘ = 30"), "faixa ±1,96/√Nₘ, Nₘ = 30");
});

test("tr returns null for a label it does not know", () => {
  assert.equal(tr("not a known label"), null);
});

test("isPtPage is true for a pt-BR page and false for an English one", () => {
  assert.equal(isPtPage("pt-BR"), true);
  assert.equal(isPtPage("pt-br"), true);
  assert.equal(isPtPage("en"), false);
  assert.equal(isPtPage(""), false);
});
