// Unit fixture for the check:version detector (Epic 04 ticket-015).
//
// Pins parseAnchor() (valid/malformed/absent) and
// detectVersionViolations(text, zone)'s behaviour: a strict-zone novomodelo-version
// token or narration phrase is a violation; a third-party version is clean; a
// lenient-zone well-formed novomodelo-version string is clean; a lenient-zone
// MALFORMED one is a violation.

import test from "node:test";
import assert from "node:assert/strict";
import { parseAnchor, detectVersionViolations } from "./check-doc-version.mjs";
import { ZONE_STRICT, ZONE_LENIENT } from "./doc-zones.mjs";

// ---- parseAnchor -----------------------------------------------------------

test("parses a valid Synced-to anchor", () => {
  const { version } = parseAnchor("**Synced to: novomodelo v0.8.2 (2026-06-17).**\n");
  assert.equal(version, "0.8.2");
});

test("parses the anchor regardless of surrounding prose", () => {
  const text = "# Heading\n\n## Current State\n\n**Synced to: novomodelo v1.2.3 (today).**\n\nMore text.";
  assert.equal(parseAnchor(text).version, "1.2.3");
});

test("throws a named error when the anchor is absent", () => {
  assert.throws(() => parseAnchor("# No anchor here.\n"), /Synced to/);
});

test("throws a named error when the anchor is malformed (missing patch component)", () => {
  assert.throws(() => parseAnchor("**Synced to: novomodelo v0.8 (today).**\n"), /Synced to/);
});

// ---- detectVersionViolations: strict zone ----------------------------------

test("flags a 'NOVOMODELO vX.Y.Z' banner token in the strict zone", () => {
  const v = detectVersionViolations("Output shows NOVOMODELO v0.9.1 on startup.", ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "novomodelo-version-banner"));
});

test("flags the title-case 'Novomodelo vX.Y.Z' banner token in the strict zone (case-insensitive)", () => {
  const v = detectVersionViolations("This matches Novomodelo v0.9.0 semantics.", ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "novomodelo-version-banner"));
});

test("flags a \"novomodelo_version\" JSON key in the strict zone", () => {
  const v = detectVersionViolations('{"novomodelo_version": "0.9.0"}', ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "novomodelo-version-json"));
});

test("flags 'added in vX.Y' narration in the strict zone", () => {
  const v = detectVersionViolations("This cap was added in v0.8.1; previously unbounded.", ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "version-narration-added"));
});

test("flags 'as of vX.Y' narration in the strict zone", () => {
  const v = detectVersionViolations("As of v0.8.0 the state is pinned by column bounds.", ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "version-narration-as-of"));
});

test("flags 'earlier releases' narration in the strict zone", () => {
  const v = detectVersionViolations("Earlier releases predicted the basis differently.", ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "version-narration-earlier-releases"));
});

test("flags 'removed ... in vX.Y' narration even when the version wraps to the next line", () => {
  const text = "the knob was ignored and is removed entirely in the\nv0.8.2 restructure.";
  const v = detectVersionViolations(text, ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "version-narration-removed"));
});

test("flags 'removed ... in vX.Y' narration even when the verb is bold-wrapped ('**removed entirely**')", () => {
  const text = "the knob is **removed entirely** in the v0.8.2 restructure.";
  const v = detectVersionViolations(text, ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "version-narration-removed"));
});

test("flags 'renamed from vX.Y' narration in the strict zone", () => {
  const v = detectVersionViolations("Keys renamed from v0.8.1: active_window -> seed_window.", ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "version-narration-renamed"));
});

test("does NOT flag a third-party version (no novomodelo token, no narration verb)", () => {
  const v = detectVersionViolations(
    "A more sophisticated approach used in commercial tools like PSR's SDDP (v17.3+) decomposes each stage.",
    ZONE_STRICT,
  );
  assert.deepEqual(v, []);
});

// ---- detectVersionViolations: lenient zone ---------------------------------

test("a well-formed 'NOVOMODELO vX.Y.Z' banner in the LENIENT zone is clean (not required to equal the anchor)", () => {
  const v = detectVersionViolations("Output shows NOVOMODELO v0.9.1 on startup.", ZONE_LENIENT);
  assert.deepEqual(v, []);
});

test("a well-formed \"novomodelo_version\" JSON sample in the LENIENT zone is clean", () => {
  const v = detectVersionViolations('{"novomodelo_version": "0.9.0"}', ZONE_LENIENT);
  assert.deepEqual(v, []);
});

test("a MALFORMED version string in the LENIENT zone is a violation (missing patch component)", () => {
  const v = detectVersionViolations("Output shows NOVOMODELO v0.9 on startup.", ZONE_LENIENT);
  assert.ok(v.some((x) => x.rule === "malformed-version-string"));
});

test("narration phrases are NOT checked in the lenient zone", () => {
  const v = detectVersionViolations(
    "This flag was added in v0.8.1 and documented here for operators.",
    ZONE_LENIENT,
  );
  assert.deepEqual(v, []);
});

test("a third-party version in the lenient zone is also clean", () => {
  const v = detectVersionViolations("Compatible with PSR's SDDP (v17.3+).", ZONE_LENIENT);
  assert.deepEqual(v, []);
});

test("the gate reads raw text: a version token after a fence that never closes is still reported", () => {
  const text =
    "# T\n\n```js\nconst x = 1;\n\nOutput shows NOVOMODELO v0.9.1 on startup.\n";
  const v = detectVersionViolations(text, ZONE_STRICT);
  assert.deepEqual(
    v.map((x) => [x.lineno, x.rule]),
    [[6, "novomodelo-version-banner"]],
  );
});
