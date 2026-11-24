// Unit fixture for the refresh:schemas pure helpers (ticket-014).
//
// node:test + node:assert/strict, mirroring check-figures.test.mjs. Exercises
// parseSchemaNames (ls-tree stdout -> sorted basenames, with the 19-count
// guard) and assertWellFormed (named throw on invalid JSON) directly, with no
// filesystem or subprocess access.
import test from "node:test";
import assert from "node:assert/strict";
import { parseSchemaNames, assertWellFormed } from "./refresh-schemas.mjs";

// A representative `git ls-tree --name-only <ref> book/src/schemas/` fixture:
// 19 lines, deliberately NOT pre-sorted, with a trailing newline (as real git
// output has).
const LS_TREE_FIXTURE =
  [
    "book/src/schemas/thermals.schema.json",
    "book/src/schemas/boundary_conditions.schema.json",
    "book/src/schemas/buses.schema.json",
    "book/src/schemas/config.schema.json",
    "book/src/schemas/correlation.schema.json",
    "book/src/schemas/energy_contracts.schema.json",
    "book/src/schemas/generic_constraints.schema.json",
    "book/src/schemas/generic_parameters.schema.json",
    "book/src/schemas/hydros.schema.json",
    "book/src/schemas/initial_conditions.schema.json",
    "book/src/schemas/lines.schema.json",
    "book/src/schemas/load_factors.schema.json",
    "book/src/schemas/non_controllable_factors.schema.json",
    "book/src/schemas/non_controllable_sources.schema.json",
    "book/src/schemas/penalties.schema.json",
    "book/src/schemas/post_study_stages.schema.json",
    "book/src/schemas/production_models.schema.json",
    "book/src/schemas/pumping_stations.schema.json",
    "book/src/schemas/stages.schema.json",
  ].join("\n") + "\n";

const EXPECTED_SORTED_NAMES = [
  "boundary_conditions.schema.json",
  "buses.schema.json",
  "config.schema.json",
  "correlation.schema.json",
  "energy_contracts.schema.json",
  "generic_constraints.schema.json",
  "generic_parameters.schema.json",
  "hydros.schema.json",
  "initial_conditions.schema.json",
  "lines.schema.json",
  "load_factors.schema.json",
  "non_controllable_factors.schema.json",
  "non_controllable_sources.schema.json",
  "penalties.schema.json",
  "post_study_stages.schema.json",
  "production_models.schema.json",
  "pumping_stations.schema.json",
  "stages.schema.json",
  "thermals.schema.json",
];

test("parseSchemaNames maps a 19-line ls-tree fixture to 19 sorted basenames", () => {
  assert.deepEqual(parseSchemaNames(LS_TREE_FIXTURE), EXPECTED_SORTED_NAMES);
});

test("parseSchemaNames throws when the count is not exactly 19 (wrong ref / partial tree)", () => {
  const partial = LS_TREE_FIXTURE.split("\n").slice(0, 10).join("\n") + "\n";
  assert.throws(() => parseSchemaNames(partial), /expected 19 schema files/);
});

test("parseSchemaNames throws on an empty tree (19 -> 0)", () => {
  assert.throws(() => parseSchemaNames(""), /expected 19 schema files/);
});

test("assertWellFormed throws a named error on invalid JSON", () => {
  assert.throws(
    () => assertWellFormed("x.schema.json", "{ not json"),
    /x\.schema\.json is not well-formed JSON/,
  );
});

test("assertWellFormed does not throw on valid JSON", () => {
  assert.doesNotThrow(() => assertWellFormed("x.schema.json", '{"a":1}'));
});
