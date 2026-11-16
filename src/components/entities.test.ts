// Mirrors src/figures/*.test.ts (node:test + node:assert/strict).
import test from "node:test";
import assert from "node:assert/strict";
import { entityHref } from "./entity/entities.ts";

test("entityHref links an English entity page under /en/", () => {
  assert.equal(
    entityHref("entities/generation/hydro-plants", "en"),
    "/en/entities/generation/hydro-plants",
  );
});

test("entityHref links a pt-BR entity page at the docs root", () => {
  assert.equal(
    entityHref("entities/generation/hydro-plants", "pt-BR"),
    "/entities/generation/hydro-plants",
  );
});
