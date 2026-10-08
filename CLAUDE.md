# Novomodelo Docs — Development Guidelines

## Project Overview

Novomodelo-docs is the **single, unified documentation site** for the Novomodelo ecosystem
— an Astro Starlight site that layers the SDDP methodology reference (math, worked
examples) with the user-facing software guide (install, configure, I/O, CLI,
examples) for hydrothermal dispatch. It is the one documentation property; the
legacy `novomodelo/book/` mdBook is retired and the developer/crate-internal layer now
lives as per-crate `README.md` files + `ARCHITECTURE.md` in the `novomodelo` repo.

- **Dev**: `npm run dev` (Astro dev server)
- **Build**: `npm run build`; `npm run build:versions` for multi-version assembly
- **Build hygiene**: `npm run build` exits 1 when a page Lunaria tracks
  (`src/content/docs/**/*.{md,mdx}` outside `pt-br/`, per `lunaria.config.json`)
  has no commit history: Lunaria reads each tracked page's git history for the
  `/lunaria` route. Build and verify on committed state.
- **KaTeX**: manual remark-math + rehype-katex (D4) wired in `astro.config.mjs`
  — NOT a Starlight plugin. Math is rendered to static HTML at build time (zero
  client JS).
- **Source**: all chapters live under `src/content/docs/`; the sidebar/TOC is
  configured in `astro.config.mjs` (Starlight `sidebar`), not a flat text
  table-of-contents file.
- **Audience & domain**: the unified site serves `docs.novomodelo.invalid`;
  `methodology.cobre-rs.dev` 301-redirects in.

The actual Novomodelo code at the main org repo is the **ground truth**. When specs
diverge from the code, the spec must be updated — not the other way around.

---

## Current State

**Synced to: novomodelo v0.18.0 (2026-10-07).**

The corpus is a **unified two-layer reference**: the annotation-free **math
layer** (formulation, algorithm, worked examples) interleaved per topic with a
version-scoped **software layer** (Configure / I·O tabs, the I/O Reference, and
Running Novomodelo), organised into the interleaved sidebar configured in
`astro.config.mjs`. Only crate-internal/developer architecture lives outside this
site, as `novomodelo` per-crate READMEs + `ARCHITECTURE.md` (see "Unified corpus & the
developer surface" below). Versioning is **build-per-version**
(`versions.json`): `latest` is built from the working tree and served at `/`,
and each `versions[]` entry is a frozen snapshot of one earlier novomodelo minor,
built from its `ref` (a 40-hex commit SHA on `main`, never a tag) and served at
`/vX.Y/`. A novomodelo patch release updates `latest` in place; a frozen snapshot is
never edited (a fix branches from its SHA and moves `ref`). Every frozen minor
is kept until novomodelo v1.0.0, then the last two or three. README `## Versioning`
is the freeze runbook.

---

## Hard Rules

- **Ground truth**: code > spec. When they diverge, update the spec.
- **No novomodelo version numbers in the math layer.** `math/*` and the overview/
  notation/glossary carry no novomodelo version annotations (no "as of vX.Y",
  "added in", "earlier releases", migration notes) — the math is always-true and
  instance-agnostic. The **software layer** (`_impl/*` partials, `reference/*`,
  `running/*`) may carry version-scoped config/I·O/CLI detail: each documentation
  version (`latest` at `/` or a frozen `/vX.Y/` snapshot) describes the novomodelo
  release its `versions.json` `novomodelo` field names. This is the two-layer expression
  of the T1 versioning tension.
- **Batched edits**: a change that touches multiple chapters must land as a single
  batch (one commit / one PR) — there is no propagation registry, so the corpus
  only stays consistent if every affected chapter is edited together. (Example:
  the v0.10.0 sync touched block-formulations, lp-formulation, system-elements,
  penalty-system, cut-management, par-inflow, determinism, notation, the `_impl`
  partials, and the reference pages as one batched set of commits.)
- **Serialization (novomodelo code fact)**: `postcard` for MPI broadcast,
  `FlatBuffers` for policy persistence. Never `bincode`.
- **No `Box<dyn Trait>` (novomodelo code fact)**: novomodelo uses enum dispatch for
  closed variant sets (e.g. `CommBackend`, `LocalCommKind`). The solver
  `Profile` is an associated type of `SolverInterface`, resolved at compile
  time (a generic, not an enum). Reflect this if a chapter describes the solver
  interface.
- **Site colours**: the accent is **Copper** (`#B87333`), not blue — read
  `src/styles/` (`brand.css`, `neutrals.css`, `palette.css`) before any theming.
  **Never infer the accent from the diagram palette** (`--dgm-*` in
  `src/styles/palette.css`; its `--dgm-hydro` is Flow Blue for hydro/water marks
  only, not the UI accent).
- **Current-state voice, both layers.** Every page in both layers states what
  novomodelo does now, with no change narration (no "now", "no longer", "previously",
  "used to", "formerly", "fixed in", "was broken", "BREAKING", "new in",
  "as of vX", "this release", migration notes, Before/After examples,
  removed-key lists, or "Earlier documentation…" / "Known discrepancy" boxes).
  The software layer may state current version-scoped facts (keys, pins, flags)
  but never change history; a current-behaviour caveat is a neutral fact, never
  "a bug where…".
- **Generic positioning.** Main areas (`index.mdx` lead, CTAs and persona cards,
  `overview/*`, `getting-started/*`, the sidebar labels, and every section
  heading outside `running/case-conversion.mdx` and `reference/glossary.md`)
  name no other planning tool (no NEWAVE, DECOMP, DESSEM or GEVAZP) and use
  generic phrasing such as "Coming from other software?" or "Converting an
  existing case", linking to `running/case-conversion`. NEWAVE and DECOMP are
  named on the bridge page; named term-mapping tables and named equivalent terms
  live only in the glossary and the bridge page, and other pages carry a generic
  pointer ("for equivalent terms in other planning tools, see the Glossary").
  Literal file or identifier references and bibliography citations are exempt.

---

## Unified corpus & the developer surface

The site is **one corpus with two layers**, interleaved topic-by-topic. This
_inverts_ the previous "relocated domains" rule: user-facing architecture-adjacent
content (configuration, I/O files, output schemas, CLI, examples, results) now
**does** live here, as the software layer — it is not exiled to a separate guide.

- **Math layer** — the page body: formulation, algorithm, notation, worked
  examples. Annotation-free and instance-agnostic (see Math-Layer standards).
- **Software layer** — imported sibling partials rendered as tabs
  (`math/_impl/_<topic>.configure.mdx`, `.io.mdx`, `.notes.mdx`) plus the
  `reference/*` and `running/*` pages. Version-scoped; may carry concrete config
  keys, output-schema columns, CLI flags, and instance detail.
- **Source-vs-render split (hard)**: math stays in the topic's own `math/*`
  file; the software layers live in **separate** `_impl/_*` partial files
  rendered as `<Tabs>`. The partial **filename** must start with `_`
  (`_impl/_hydro.configure.mdx`) — Starlight's `docsLoader` globs `**/[^_]*` by
  **basename**, so the `_` on the directory alone is not enough. This keeps
  per-release config churn out of the annotation-free math file.
- **Developer / crate internals stay OUT of the site.** Crate responsibilities,
  the dependency graph, `SolverError` classification internals, the GIL/MPI
  safety contract, and other implementation architecture live as **`novomodelo`
  per-crate `README.md` + `ARCHITECTURE.md`** on GitHub. Reference them from a
  chapter only via a trailing cross-link, never by reintroducing the content.
- **Two-way backlink contract**: a software-layer partial links up to the math
  it implements; the reference/running pages link back to the topic chapter.
  Keep both directions live (the `check:links` gate enforces resolution).

---

## Math-Layer Authoring Standards

The math layer is a **general, instance-agnostic methodology reference** — not an
implementation guide, not a deployment-specific tutorial. (Codified from the
Part-1 docs review, 2026-06; scoped to `math/*` + overview/notation/glossary.)

- **No instance magic numbers.** Reference and symbol tables carry meaning, units,
  and structure — never "typical size/value" columns or instance counts (plant
  counts, `$/MWh` ranges, horizon lengths). Those hold for some studies and are
  absurd for others; concrete numbers belong only in an explicit **worked example**
  (Worked Examples) or the software layer. If a number encoded a methodological _ordering_
  (e.g. a penalty hierarchy), keep the ordering in prose and drop the absolute
  values.
- **Symbol keys stay conceptual.** Notation keys and overview tables define what a
  symbol _means_; they do not carry solver internals (reduced costs, column
  pinning, prescalers, hot-path details). Keep those in the derivation section that
  owns them — reinforces _code > spec_.
- **Don't justify symbol choices.** State the notation clearly; do not explain why a
  symbol was chosen (no etymology/provenance asides, especially Portuguese). The
  bilingual **glossary** and practitioner term-maps (`reference/glossary.md` and
  the bridge (case-conversion) page, `running/case-conversion.mdx`) are a
  deliberate translation aid for DECOMP/DESSEM/NEWAVE practitioners — those stay.
- **Conceptual / overview chapters earn their visuals.** Introduce an idea with the
  equation(s) + a diagram + the tested-compute plots (use `.mdx` to embed the
  Observable Plot islands), and keep notation consistent with the deep chapters the
  overview previews. (Model: SDDP.jl `first_steps`.)
- **No dev artifacts ship as content.** Spike/scaffold renderer-checks, TODO demos,
  and harness probes never appear on the published site.
- **Voice gates.** `check:voice`, `check:version`, `check:narration` and
  `check:glossary` share the ratchet `scripts/doc-lint-allow.txt`: an entry
  grandfathers one rule at one `path:line`, any other hit fails its gate, and an
  entry that matches no hit fails its gate as STALE. The commands are under
  Quality Gates.

## Software-Layer Authoring Standards

The software layer (`_impl/*` partials, `reference/*`, `running/*`) is the
**version-scoped, user-facing** counterpart. It **may** carry concrete config
keys, JSON field tables, output-schema columns, CLI flags, and example values —
the things the math layer forbids. It still follows _code > spec_ (verify every
field/flag against the current novomodelo code, not stale prose), stays user-facing
(no crate internals — those are novomodelo READMEs), and keeps its `_`-prefixed
partial filenames so the render split holds.

---

## Quality Gates

```bash
# export NOVOMODELO_BIN=~/.local/opt/novomodelo-v0.18.0/novomodelo-cli-x86_64-unknown-linux-gnu/novomodelo
npm run check:figures && npm run check:voice && npm run check:counts \
  && npm run check:version && npm run check:narration && npm run check:error-coverage \
  && npm run check:input-schemas && npm run check:glossary && npm run check:python-api \
  && npm run check:gc-examples && npm run check:type-spelling && npm run check:d2 \
  && npm run check:spdx && npm run refresh:recordings -- --check \
  && npm run build && npm run check && npm run check:math \
  && npm run build:versions && npm run check:links && npm test && npm run check:e10
```

- **d2 v0.7.1** on `PATH`: without it `npm run build` and `npm run dev` abort with
  "Could not find D2".
- **novomodelo v0.18.0** for `check:gc-examples`: `NOVOMODELO_BIN`, else `novomodelo` on `PATH`.
  The gate exits 2 when the binary is missing, lies under a cargo
  `target/release/` or `target/debug/` directory, or reports a version other
  than `DEFAULT_NOVOMODELO_REF` in `scripts/novomodelo-ref.mjs`.
- **KaTeX strict**: `npm run build` fails on any KaTeX strict-mode violation or
  parse error (`scripts/rehype-katex-strict.mjs`); `npm run dev` does not run
  this check.

`.github/workflows/starlight-ci.yml` runs every gate on pull requests to `main`
(the build as `npm run build:versions`); `.github/workflows/starlight-deploy.yml`
runs only the build checks, on push to `main`. `README.md` describes each gate in
one line (`## Quality gates`; `build:versions` under `## Local development`;
the freeze runbook is `## Versioning`).

---

## Spec File Patterns

When **updating the LP / SDDP / cut / warm-start cluster** (`lp-formulation.md`,
`state-augmentation.md`, `lp-layout-and-scaling.md`, `cut-management.mdx`,
`sddp-algorithm.mdx`, `lp-warm-start.mdx`, `determinism-guarantees.mdx`):

→ Verify column/row layout against `StateSpace` in
`crates/novomodelo-sddp/src/lp/indexer/state_space.rs` (the
`state_to_lp_incoming_column` resolver). LP construction lives in
`crates/novomodelo-sddp/src/lp/builder/` (`build_inputs.rs`, `columns.rs`,
`delivery_ring.rs`, `entries.rs`, `fpha_cursor.rs`, `generic_constraints.rs`,
`hydro_state.rs`, `layout.rs`, `patch.rs`, `rows.rs`, `scaling.rs`,
`state_box.rs`, `template.rs`); `StageGeometry` is at
`lp/builder/layout.rs:1707`. Other owners: `lp/indexer/entity_positions.rs`,
`lp/indexer/anticipated_plants.rs`, `lp/indexer/block_row_family.rs`, the
crate-root `block_clock.rs`, `time_value.rs` and `bucket_topology.rs`, and
`setup/lp_build_inputs.rs`. The normative contract is novomodelo's
`docs/design/lp-builder-contract.md`.
→ **State pinning**: incoming state (storage, AR lags, in-transit buckets,
anticipated-thermal slots) is pinned by **column bounds** on the incoming-state
columns, so the LP has **no** state-fixing row range. The z-inflow definition
rows are rows `0..N`, one per hydro (`StateSpace::z_inflow_rows`), and lead each
stage's row space.
→ **Cut subgradient**: cut coefficients are the **reduced costs** of the pinned
columns, unscaled by **dividing** by `col_scale[col]` — not row duals. Which
state dimensions a stage's cut projects onto is governed by its per-stage
`state_variables` selection (`cut_state_projection.rs`, `duals_extraction.rs`):
storage and inflow-lags are toggleable (default storage-only), while transit
buckets and anticipated slots are always projected in. Anticipated slots project
onto the union of live commitment slots over every decision stage
(`for_each_live_commitment_slot` in `lp/indexer/anticipated_gate.rs`); the mask
is structural, so a coefficient on a live slot may be zero.
→ **Chronological block mode**: `stages.json` per-stage `block_mode`
(`parallel` default | `chronological`); a chronological stage chains per-block
storage, computes per-block FPHA + evaporation on each block's **average**
storage, and (PreFilling) freezes each block's storage identity
(`rows.rs`/`entries.rs`). `push_z_inflow_coupling` (`entries.rs`) puts `z_h` on
each water row of the target hydro: `−ζ` on a parallel stage, `−τ_k` per block
on a chronological stage. `evaporation_slot_count` (`lp/builder/layout.rs`)
gives one stage-level evaporation slot on a parallel stage and one per block on
a chronological stage; `StageGeometry::water_balance_row` returns the block row
on a chronological stage and the single stage row on a parallel stage. Cut
coefficients are block-count/mode-independent, so the cuts are **portable across
block modes and counts**: `validate_policy_load` (`policy_load.rs`) never reads
`block_mode`. A full-FCF load (warm start, resume, simulation-only) also runs
`build_basis_cache_from_checkpoint`, which uses a stored basis for its node
only when `admit_stored_basis` passes (column count equals the template's, row
count equals the template rows plus the record's own `num_cut_rows`, basic
count equals the row count); a record that fails is left out with one
aggregated warning (`UnusedStoredBases`), never a refusal, so a checkpoint
loads across a changed block mode or count and the affected nodes start
without a stored basis. Boundary injection uses no stored basis.
→ **LP scaling**: Novomodelo applies its own offline geometric-mean row/col prescaler
plus a configurable cost-scale factor (`modeling.cost_scale_factor`, default
`1_000_000.0` = `DEFAULT_COST_SCALE_FACTOR` in `setup/params.rs`); the LP
backend's internal simplex scaler is **disabled by default** (HiGHS:
`simplex_scale_strategy = 0`, pinned on all three phase profiles in
`solve/solver_phase.rs`). It is **overridable per phase** via the solver
profile's `scale` field (`off` | `solver_scaling`) on
`training.solver.{backward,forward}` and `simulation.solver`; enabling
`solver_scaling` applies a second scaling and **breaks** the single-unscaling
exactness that `lp-layout-and-scaling.md` §2.3 states as holding by default
only.
(Backend is selectable at build time — HiGHS default, CLP opt-in — a
software-layer/devguide concern; keep the math backend-generic.)
→ **Cut pool**: append-only with stable, deterministic slot indices; deactivation
is a **pool boolean flag** (`active: Vec<bool>`, `CutPool::set_active`) that
mutates no LP row, RHS, or bound. A deactivated cut keeps its slot but is
**excluded from each iteration's rebaked stage template**
(`build_cut_row_batch_into` bakes only `active_cuts`); the persistent lower-bound
LP is append-only (rows never removed, bound stays monotone). The only
`f64::INFINITY` in a cut row is the normal upper bound of the one-sided `≥`
Benders cut (`cut/row.rs`), present on every active row — **not** a deactivation
sentinel. Periodic-pruning methods (`level1`/`lml1`/`domination`) deactivate;
**DCS** keeps the pool whole and loads a bounded resident subset per solve
(`crates/novomodelo-sddp/src/cut/dcs.rs`), and is inadmissible under enumerated
forward traversal.
→ **Checkpoint format (self-describing)**: `policy/manifest.bin` (a
`FlatBuffers` `CheckpointManifest` root: study graph, stage count, producer
provenance + `format_version`) is written LAST as the commit signal and read
FIRST behind the `format_version` gate. Each `cuts/<pool>.bin` self-describes its
own `cost_scale_factor` + graph identity. `FORMAT_VERSION` is `3`; every load kind
checks in `validate_policy_load`, before any state check, that the checkpoint
was written by exactly this build (`SoftwareIdentity::THIS_BUILD`: the same
`SOFTWARE_NAME` at the same `SOFTWARE_VERSION`,
`crates/novomodelo-io/src/output/software.rs`) and refuses any other with
`PolicySoftwareMismatch`; Python
`write_policy_checkpoint` stamps `THIS_BUILD`. A full-FCF load never fails over
a stored basis: one that does not fit its LP is left out with one warning
(`build_basis_cache_from_checkpoint`, `admit_stored_basis`, `UnusedStoredBases`). Boundary
injection reconciles a differing-state-shape source per slot by ENTITY IDENTITY:
a target storage or inflow-lag slot with no source counterpart is rejected
(`RebindOp::Reject`), only forward-dated families are relaxed by interval
overlap, a season cycle or per-hydro PAR order that disagrees is rejected, and
the inflow-lag depth the boundary's cuts reference widens the current lag
state; a source slot for an entity the study does not model is dropped and
tallied per family (`policy.boundary.strict` rejects the load instead).
Warm-start/resume still require an exact state-dimension match
(`crates/novomodelo-io/src/output/policy/records.rs`,
`crates/novomodelo-sddp/src/policy/policy_load.rs`,
`crates/novomodelo-sddp/src/policy/reconcile.rs`).

When **updating hydro production / FPHA** (`hydro-production-models.mdx`):

→ Computed-FPHA fit is a **3-D convex hull** of the `(volume, turbined)` cloud at
spillage = 0 (flow axis starts at 0; **no** spillage axis; **no** synthetic
closing point — the q=0 column anchors), capped at installed capacity, with a
least-squares **`α` correction** and a per-plane lateral-flow secant for `γ_S`.
Per-stage fits; run-of-river supported (`γ_V` snapped to 0). **`reference_volume`**
(`volume_hm3` XOR `percentile`) is the single source of truth. A plant without
turbine capacity (`max_turbined_m3s` ≤ `1e-9` m³/s, `Hydro::has_turbine_capacity`)
whose FPHA source is computed, or precomputed with no hyperplane rows, resolves
to constant productivity `0.0` with provenance
`ProductionModelSource::NoTurbineCapacity`, no export rows, and a
`no_turbine_capacity` entry in `training/hydro_models.json`. Verify against
`crates/novomodelo-sddp/src/production/fpha_fitting/` and
`crates/novomodelo-sddp/src/production/hydro_models/production.rs`.

When **updating water travel time / cascade** (`state-augmentation.md §6`,
`system-elements.mdx`, `_impl/_hydro.*`):

→ A hydro's `travel_time_hours` on its **main cascade arc** delays release as
**augmented Benders state** — in-transit buckets, one slot per downstream plant
per maturity lag, pinned by column bounds like all state (`state_space.rs`,
shared `delivery_ring.rs`; declared arcs in
`crates/novomodelo-sddp/src/bucket_topology.rs`, `TransitBucketTopology::arcs`).
`InitialConditions.past_defluences` seeds stage-0 buckets; validation requires
history ≥ the arc travel time. Output: `simulation/in_transit/`. A release
maturing into a plant that is PreFilling at maturity lands on the water-balance
row(s) of that plant's short-circuit target (`−1` on a parallel stage,
`−arrival_density[k]` per block on a chronological one;
`push_maturing_bucket_coupling`, `fill_prefilling_shortcircuit` in
`lp/builder/entries.rs`), and leaves at the system outlet when no downstream
plant is non-PreFilling. Without a
`policy.boundary`, volume maturing **past the last stage is dropped**
(documented limitation): `build_transit_bucket_topology` caps the terminal
deep-lag slots only then, and with a boundary they stay live and reach the
boundary-priced projection.

When **updating anticipated thermals** (`state-augmentation.md §5`,
`system-elements.mdx §4`, `_impl/_equipment.configure.mdx`):

→ Lead is one of `lead_stages` (calendar-free) XOR `lead_time_hours` (physical,
resolved on the stage calendar) — `AnticipatedConfig::{LeadStages,LeadTime}`
(`entities/thermal.rs`). Every commitment is **bounded, costed, and
commissioning-gated at its delivery stage** `t+K` (`columns.rs`,
`lead_time/mod.rs`); a sub-stage lead → ordinary thermal; fan-out
(`max_fanout() > 1`) is rejected at study setup with `SddpError::Validation`
(`setup/mod.rs`; `novomodelo-io` has no fan-out check). A lead past the horizon is
rejected at case load only when it exceeds the whole study horizon
(`lead_stages` > stage count, or `lead_time_hours` > summed study hours) and the
plant reaches no declared `post_study_stages.json` post-study stage
(`validation/semantic/thermal.rs`); a decision stage whose delivery falls beyond
the study horizon and the declared post-study stages is gated off
(`lp/indexer/anticipated_gate.rs`). The decision column's cost is
`cost × delivery hours × relative_delivery_discount(decision, delivery)`
(`columns.rs`; `time_value.rs`, `D(t+K)/D(t)`). An in-study-decided
post-horizon delivery is bounded and costed on its decision column by the
`post_study_stages.json` cell, the sole surface for it, and only the commitment
it carries into the terminal state is boundary-priced. Pre-study-decided
deliveries past the horizon (DECOMP já-comandada) ride `initial_conditions.json`
`past_anticipated_commitments` windows extending past `T`: their fuel is sunk and
booked nowhere, and only their state contribution is folded into the boundary
cut intercepts (`build_boundary_fold` in `policy/reconcile.rs`).
Sub-tolerance drift at a delivery
bound is absorbed by the read-back state canonicalization that clamps the outgoing
state onto its resolved box (`solve/stage_solve.rs` `assemble_outgoing_state`), not
by a per-solve reconcile pass; genuine over-commitment — a
`past_anticipated_commitments` `value_mw` outside the plant's
`[min_generation_mw, max_generation_mw]` — is rejected at case load as a named
`BusinessRuleViolation` (`validation/semantic/thermal.rs`
`check_committed_value_bounds`, naming the thermal, its window, the value, and the
bounds), never mid-solve and never a bare infeasible LP.

When **updating filling / commissioning** (`penalty-system.mdx`,
`system-elements.mdx`, `lp-formulation.md`):

→ **Filling**: `filling = {start_stage_id, filling_min_rate_m3s}`; per-stage
`V_target[t]` ramp with a soft floor + `filling_target_violation_cost`,
which sits below deficit in the energy-equivalent hierarchy
(`penalty-system.mdx`) with no load-time check of it. **Commissioning**: half-open
`[entry_stage_id, exit_stage_id)` via `commissioning_active`
(`crates/novomodelo-core/src/commissioning.rs`);
for thermals/lines/NCS/pumping/contracts, outside-window columns pin to `[0,0]`;
a pumping station in service where its source or destination hydro is not
Operating (Filling counts as not Operating) is rejected at case load by
`semantic.5a.52` (`check_pumping_operating_window`,
`validation/semantic/pumping.rs`).
**Hydros are the exception**: outside its window a non-filling hydro is
**PreFilling** — turbine/spillage/diversion pinned to 0, storage decoupled by a
frozen identity, inflow and maturing transit water passed downstream to its
short-circuit target. **Spillage** is frozen to 0 in
PreFilling only, free during Filling and Operating (`columns.rs`; the phase is
`hydro_phase` in `lp/builder/hydro_state.rs`, over `filling_phase` in
`crates/novomodelo-core/src/commissioning.rs`).
→ **Required `operational_start_date`** (ISO) on every `system/*` entity; canonical
entity order is `(operational_start_date, id)` — rename-invariant, id-renumber
moves LP/cut/output order (`system/builder.rs` `sort_canonical`).

When **updating stochastic sampling** (`scenario-generation.mdx` §2.5 and §3.2,
`par-inflow-model.mdx`, `_impl/_scenario.configure.mdx`,
`_impl/_scenario.notes.mdx`):

→ For the forward `historical` scheme, window discovery
(`discover_historical_windows`, `crates/novomodelo-stochastic/src/sampling/window.rs`)
builds the window pool and refuses an empty one (`no valid historical windows
found`), which pre-empts every later check; `check_historical_structure`,
`standardize_historical_windows` and `validate_historical_library`
(`crates/novomodelo-stochastic/src/sampling/historical.rs`) then run in that order:
`check_historical_structure` runs V2.1 and V2.9 (errors) and returns the
`HistoricalStructureProof` that standardization requires, standardization
standardizes each window, and the library check runs V2.3 (an error) and V2.6
(a warning); its V2.5 is unreachable behind the empty-pool refusal. V2.2, V2.4 and V2.7
are construction invariants with no release-build check (only V2.7 is
re-asserted, by a `debug_assert!`). Lag seasons come from the calendar walk in
`crates/novomodelo-stochastic/src/season_cast/mod.rs` (`season_period_window`,
`previous_occurrence`, `nth_previous_occurrence`,
`StageCalendar::season_occurrences`) over the per-level cycles of `SeasonCycles`
(`crates/novomodelo-core/src/model/temporal.rs`; an `overlapping_pair` is refused in
`crates/novomodelo-io/src/stages.rs`), never from arithmetic on declared season ids.
Pre-study lag seasons for precompute and fitting come from `StitchedSeasonMap`
(`season_cast/stitched.rs`), history keys from `observation_occurrence_year`,
and fitting and correlation relabel to calendar positions on single-level maps
only (`par/fitting/cycle_positions.rs`). The `historical_residuals` noise method
(`crates/novomodelo-io/src/stages.rs`) builds the opening tree from the same library
(`build_opening_tree_library` in
`crates/novomodelo-sddp/src/setup/stochastic_pipeline.rs`). `novomodelo validate` builds the
opening-tree library and constructs `StudySetup` for every deck (`validate_study`,
`crates/novomodelo-sddp/src/validate_phases.rs`), so it also builds the forward
scheme's library and reports the refusals `run` reports for it.

When **updating the generic-constraint `hydro_inflow` term**
(`reference/generic-constraints.mdx`, section `hydro_inflow`; `lp-formulation.md`
§10, Hydro Inflow):

→ `hydro_inflow` parses as a block-capable variable
(`crates/novomodelo-io/src/constraints/generic.rs`) and `resolve_hydro_inflow`
(`crates/novomodelo-sddp/src/lp/builder/generic_constraints.rs`) resolves it to a
**rate** identity (m³/s), not the `−τ`-weighted storage-balance row: the plant's
local `z_inflow` column, inflow diverted into the plant, upstream releases
weighted by the share the downstream balance row credits to the block, and
maturing transit water. Each upstream PreFilling plant whose short-circuit
targets this plant adds its local inflow, diverted inflow and upstream releases
at `1.0`, and its maturing bucket at the rate `arrival_density[blk]/τ(blk)`
(`push_maturing_bucket_rate`). The plant's own outflows,
evaporation, withdrawal slacks, AR-lag `ψ` and pumping are excluded.

When **updating policy reuse and its gates** (`running/policy-management.mdx`,
`reference/error-codes.mdx`):

→ `policy-management.mdx` owns the load contract (`## Policy Load Contract`,
`### Check order`, `### Version gate`, `### Stored-basis gate`) and
`error-codes.mdx` owns the error messages. The code is `validate_policy_load`,
`build_basis_cache_from_checkpoint` and `admit_stored_basis`
(`crates/novomodelo-sddp/src/policy/policy_load.rs`), `check_full_fcf_load` (the
full-FCF load shared by the CLI and Python,
`crates/novomodelo-sddp/src/policy/full_fcf_load.rs`), the software identity that
`validate_policy_load` compares (`SoftwareIdentity`,
`crates/novomodelo-io/src/output/software.rs`),
`crates/novomodelo-sddp/src/policy/reconcile.rs`,
`crates/novomodelo-sddp/src/validate_phases.rs` (`novomodelo validate` runs the
configured load) and `crates/novomodelo-cli/src/commands/run/policy.rs`. The gate facts are in the
**Checkpoint format** bullet of the LP cluster above.

When **updating discounting** (`discount-rate.mdx`,
`_impl/_discount.configure.mdx`, `post-study-boundary.md`):

→ `compute_per_stage_discount_factors` (`crates/novomodelo-sddp/src/time_value.rs`)
gives each stage the one-step factor `d_t = 1/(1+r_t)^(Δt/365.25)`, `Δt` the stage
duration in days. `r_t` is the stage's `annual_discount_rate_override`
(`crates/novomodelo-io/src/stages.rs`; in the chain dialect a stage without one takes
its departing transition's override, a per-edge spelling `nodes[]` rejects), else
the global `policy_graph.annual_discount_rate`. The θ objective coefficient is
`discount_factors()[stage]`, not divided by the cost scale factor that divides
every other objective coefficient (`crates/novomodelo-sddp/src/lp/builder/template.rs`).
`relative_delivery_discount` (same `time_value.rs`) is `D(delivery)/D(decision)`,
the cumulative-factor ratio that discounts an anticipated commitment's cost.

When **authoring or editing a diagram** (inline ` ```d2 ` or a tested Observable
Plot island under `src/figures/` + `src/components/`):

→ Follow [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md).
**Two tools only** on the site: **d2** draws every diagram (build-time SVG, one
themable keystone in `src/styles/diagrams.css`); **Observable Plot** draws every
computed math plot. **Mermaid was retired (2026-07)** on the site — never add a
` ```mermaid ` fence here (it is fine in the `novomodelo` READMEs/ARCHITECTURE.md, which
GitHub renders). Semantic node colours (hydro→Flow Blue, thermal→Spark Amber,
NCS→Patina, deficit→Signal Red, generic→copper) come from the `classes` vocabulary
in diagram-authoring.md §4.2, not ad-hoc hex.

**JSON schemas**: the 18 input schemas are generated in `novomodelo` from `novomodelo-io`
types; this site **vendors** a committed copy (`public/schemas/`) refreshed by
`npm run refresh:schemas -- --ref <tag>` (reads a git ref, never the novomodelo working
tree). Refresh on each novomodelo release; the freshness gate stays in `novomodelo`.

---

## Key References

| Resource                  | Location                                                        | Purpose                                                      |
| ------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Novomodelo code (ground truth) | `https://github.com/ons-ccee-epe/novomodelo/`                           | Actual implementation                                       |
| Unified docs site         | `https://docs.novomodelo.invalid/`                                   | This site (methodology + software layer)                    |
| Crate READMEs + ARCHITECTURE | `https://github.com/ons-ccee-epe/novomodelo/` (`crates/*/README.md`, `ARCHITECTURE.md`) | Developer/crate-internal surface (not on the site) |
| CHANGELOG                 | `https://github.com/ons-ccee-epe/novomodelo/CHANGELOG.md`               | Per-release feature list (sync source)                      |
| Diagram authoring guide   | [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md) | Tool selection + design system for diagrams        |
