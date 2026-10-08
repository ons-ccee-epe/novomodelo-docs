// Single source of the default cobre git ref.
//
// scripts/refresh-schemas.mjs, scripts/refresh-pystubs.mjs and
// scripts/refresh-error-kinds.mjs each vendor committed content from an
// immutable git TAG in a `cobre` checkout; all three import DEFAULT_COBRE_REF as
// their `--ref` default so they can never disagree on which tag they vendor
// from. scripts/refresh-recordings.mjs writes nothing: its `--ref` default
// feeds only the report mode (the tape blob it computes), while `--check` reads
// each record's own tape_ref. check-error-coverage.mjs reports a vendored
// error-kinds `ref` that differs from this constant, and check-gc-examples.mjs
// requires `cobre version` of the pinned binary to carry it.
// versions.json `latest.cobre` mirrors this constant and is test-guarded (JSON
// has no comments of its own).
// This literal and versions.json `latest.cobre` are bumped together at each
// sync and must always name an EXISTING tag, never a not-yet-cut one (the
// cobre-ref test enforces equality).

export const DEFAULT_COBRE_REF = "v0.18.0";
