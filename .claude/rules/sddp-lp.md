---
paths:
  - "src/content/docs/**/math/lp-formulation.md"
  - "src/content/docs/**/math/state-augmentation.md"
  - "src/content/docs/**/math/lp-layout-and-scaling.md"
  - "src/content/docs/**/math/cut-management.mdx"
  - "src/content/docs/**/math/sddp-algorithm.mdx"
  - "src/content/docs/**/math/lp-warm-start.mdx"
  - "src/content/docs/**/math/determinism-guarantees.mdx"
  - "src/content/docs/**/math/_impl/_cut-management.*"
  - "src/content/docs/**/math/_impl/_warm-start.*"
  - "src/content/docs/**/math/_impl/_sddp.*"
  - "src/content/docs/**/running/policy-management.mdx"
  - "src/content/docs/**/reference/error-codes.mdx"
  - "src/content/docs/**/reference/flatbuffers-schema.mdx"
  - "src/content/docs/**/reference/output/policy.mdx"
---

# Spec Patterns — LP / SDDP / Cut / Warm-Start Cluster

Code facts to verify against `novomodelo` before editing these pages (code > spec).

When **updating the LP / SDDP / cut / warm-start cluster** (`lp-formulation.md`,
`state-augmentation.md`, `lp-layout-and-scaling.md`, `cut-management.mdx`,
`sddp-algorithm.mdx`, `lp-warm-start.mdx`, `determinism-guarantees.mdx`):

→ Verify column/row layout against `StateSpace` in
`crates/novomodelo-sddp/src/lp/indexer/state_space.rs` (the
`state_to_lp_incoming_column` resolver). LP construction lives in
`crates/novomodelo-sddp/src/lp/builder/` (`build_inputs.rs`, `columns.rs`,
`delivery_ring.rs`, `entries.rs`, `fpha_cursor.rs`, `generic_constraints.rs`,
`hydro_state.rs`, `layout.rs`, `patch.rs`, `rows.rs`, `scaling.rs`,
`state_box.rs`, `template.rs`); `StageGeometry` is in
`lp/builder/layout.rs`. Other owners: `lp/indexer/entity_positions.rs`,
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
(`rows.rs`/`entries.rs`). `push_local_inflow_coupling` (`entries.rs`) puts `z_h` on
each water row of the target hydro: `−ζ` on a parallel stage, `−τ_k` per block
on a chronological stage. `evaporation_slot_count` (`lp/builder/layout.rs`)
gives one stage-level evaporation slot on a parallel stage and one per block on
a chronological stage; `StageGeometry::water_balance_row` returns the block row
on a chronological stage and the single stage row on a parallel stage. Cut
coefficients are block-count/mode-independent, so the cuts are **portable across
block modes and counts**: `validate_policy_load` (`policy_load.rs`) never reads
`block_mode`. A full-FCF load (warm start, resume, simulation-only) also runs
`build_basis_cache_from_checkpoint` over the stored bases (one per node and
forward-pass scenario), which uses an entry only when `admit_stored_basis`
passes (column count equals the template's, row count equals the template rows
plus the entry's own recorded cut rows `piece_row_slots`, basic count equals the
row count) and every recorded cut-row slot maps to a loaded cut; an entry that
fails is left out with one aggregated warning (`UnusedStoredBases`), never a
refusal, so a checkpoint loads across a changed block mode or count and the
affected nodes start without a stored basis. Boundary injection uses no stored
basis.
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
→ **Warm start per phase**: each phase's solver profile
(`solve/solver_phase.rs`) sets `use_warm_start`. The HiGHS profiles warm-start
the forward and backward passes (`true`) and start simulation solves cold
(`false`); HiGHS refactorizes before reporting a solve optimal, and every
solve counts the rows its primal solution misses (`lp_row_violations`, end-of-run
warning); a cold HiGHS solve uses neither the offered basis nor the one the
previous solve left (`backends/highs/interface.rs` drops the basis, which keeps
`basis_offered` at 0; HiGHS `run()` clears the solver), the dynamic method's
inner re-solves included. A phase's `use_warm_start` override changes either
choice and every retry keeps it. CLP has no `use_warm_start`, rejects per-phase
fields, and warm-starts every phase. The dynamic method neither reads nor writes
the basis store (`training/forward/stage_solve.rs`,
`training/backward/by_scenario.rs`); outside it captures happen whatever the
profile. Under the HiGHS defaults a checkpoint's stored bases seed the first
iteration's forward solves on a stage chain (with a cold forward pass they seed
no training solve: the forward capture overwrites the slot before the backward
pass reads it); on a branching graph a warm backward pass also starts
from them at successor nodes the first forward path did not visit
(`resolve_backward_basis`, `training/backward/lp_setup.rs`). Simulation-only
uses them only with `simulation.solver.use_warm_start: true`.
The math layer says "a phase that warm-starts", never a backend name.
→ **Cut pool**: append-only with stable, deterministic slot indices; deactivation
is a **pool boolean flag** (`active: Vec<bool>`, `CutPool::set_active`) that
mutates no LP row, RHS, or bound. A deactivated cut keeps its slot but is
**excluded from each iteration's rebaked stage template**
(`build_cut_row_batch_into` bakes only `active_cuts`); the persistent lower-bound
LP is append-only (rows never removed, bound stays monotone). The only
`f64::INFINITY` in a cut row is the normal upper bound of the one-sided `≥`
Benders cut (`cut/row.rs`), present on every active row — **not** a deactivation
sentinel. The periodic-pruning method (`level1`) deactivates;
the **dynamic** method keeps the pool whole and loads a bounded resident subset per solve
(`crates/novomodelo-sddp/src/cut/dcs.rs`), and is inadmissible under enumerated
forward traversal.
→ **Checkpoint format (self-describing)**: `policy/manifest.bin` (a
`FlatBuffers` `CheckpointManifest` root: study graph, stage count, producer
provenance + `format_version`) is written LAST as the commit signal and read
FIRST behind the `format_version` gate. Each `cuts/<pool>.bin` self-describes its
own `cost_scale_factor` + graph identity. `FORMAT_VERSION` is `4`; every load kind
checks in `validate_policy_load`, before any state check, that the checkpoint
was written by exactly this build (`SoftwareIdentity::THIS_BUILD`: the same
`SOFTWARE_NAME` at the same `SOFTWARE_VERSION`,
`crates/novomodelo-io/src/output/software.rs`) and refuses any other with
`PolicySoftwareMismatch`; Python
`write_policy_checkpoint` stamps `THIS_BUILD`. A full-FCF load never fails over
a stored basis: one that does not fit its LP is left out with one warning
(`build_basis_cache_from_checkpoint`, `admit_stored_basis`, `UnusedStoredBases`),
and the reader takes a checkpoint without `basis/` (which archive tools drop
when empty) as one with no stored bases, as it does for `states/`
(`read_checkpoint_dir`, `crates/novomodelo-io/src/output/policy/checkpoint.rs`). Boundary
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
