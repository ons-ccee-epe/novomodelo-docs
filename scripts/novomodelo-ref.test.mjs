// Unit fixture for the shared DEFAULT_NOVOMODELO_REF constant (ticket-003).
//
// node:test + node:assert/strict, mirroring refresh-schemas.test.mjs. Asserts
// the tag shape only — the value itself is bumped at each release (Epic 12
// ticket-028), so the test must not pin a specific version.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_NOVOMODELO_REF } from "./novomodelo-ref.mjs";

test("DEFAULT_NOVOMODELO_REF matches the vX.Y.Z tag shape", () => {
  assert.match(DEFAULT_NOVOMODELO_REF, /^v\d+\.\d+\.\d+$/);
});

test("versions.json latest.novomodelo equals DEFAULT_NOVOMODELO_REF", () => {
  const versions = JSON.parse(
    readFileSync(new URL("../versions.json", import.meta.url)),
  );
  assert.equal(versions.latest.novomodelo, DEFAULT_NOVOMODELO_REF);
  for (const entry of versions.versions) {
    if (entry.novomodelo !== undefined) {
      assert.match(entry.novomodelo, /^v\d+\.\d+\.\d+$/);
    }
  }
});
