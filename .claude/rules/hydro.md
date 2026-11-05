---
paths:
  - "src/content/docs/**/math/hydro-production-models.mdx"
  - "src/content/docs/**/math/system-elements.mdx"
  - "src/content/docs/**/math/state-augmentation.md"
  - "src/content/docs/**/math/_impl/_hydro*"
  - "src/content/docs/**/math/inflow-nonnegativity.md"
  - "src/content/docs/**/math/lp-formulation.md"
  - "src/content/docs/**/math/penalty-system.mdx"
  - "src/content/docs/**/math/cut-management.mdx"
  - "src/content/docs/**/math/stopping-rules.mdx"
  - "src/content/docs/**/math/scenario-generation.mdx"
  - "src/content/docs/**/math/_impl/_penalties.*"
  - "src/content/docs/**/running/configuration.mdx"
  - "src/content/docs/**/reference/generic-constraints.mdx"
  - "src/content/docs/**/reference/output/simulation.mdx"
  - "src/content/docs/**/reference/output/hydro-models.mdx"
  - "src/content/docs/**/reference/case-format/hydros.mdx"
  - "src/content/docs/**/reference/case-format/production-models.mdx"
  - "src/content/docs/**/entities/equipment/hydro-plants.mdx"
  - "src/content/docs/**/entities/hydrology/inflows.mdx"
  - "src/content/docs/**/entities/rules/generic-constraints.mdx"
  - "src/content/docs/**/entities/rules/penalties.mdx"
---

# Spec Patterns — Hydro Production, Cascade & Inflow

Code facts to verify against `novomodelo` before editing these pages (code > spec).

When **updating hydro production / FPHA** (`hydro-production-models.mdx`):

→ Computed-FPHA fit is a **3-D convex hull** of the `(volume, turbined)` cloud at
spillage = 0 over `[0, turbined_fit_max_m3s]` (default `max_turbined_m3s`; flow
axis starts at 0; **no** spillage axis; **no** synthetic closing point — the q=0
column anchors), capped at installed capacity, with a least-squares **`α`
correction**. Each plane's `γ_S` is the mean, over the spill = 0 grid points
where that plane binds (within `1e-8` MW of the planes' minimum), of a
zero-anchored least-squares slope over 101 samples of `[0, S_max]`; `S_max` is
`spillage_fit_max_m3s`, else 2 × the mean inflow history when above 0, else
2 × `max_turbined_m3s` (`secant.rs`). Both fit maxima are optional and must be
finite and `> 0` (`validate_fit_maxima`, SchemaError). Planes are fit only on
the stages that select `fpha` (`fit_computed_planes_per_stage`), so a plant may
mix FPHA and other models across stages; on a computed plant every `fpha` entry
is fit from geometry (`determine_source`). Run-of-river supported (`γ_V`
snapped to 0). **`reference_volume`**
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

When **updating inflow non-negativity** (`inflow-nonnegativity.md`,
`lp-formulation.md` §4/§10, `penalty-system.mdx`, the Tier 1 convexity bullet of
`cut-management.mdx`, `stopping-rules.mdx` §5, `scenario-generation.mdx` §3,
`running/configuration.mdx`, `reference/output/simulation.mdx`):

→ The methods are the strategies of Larroyd et al. (2022): the raw PAR
realization `a_h` stays on the z row and in the inflow lags under every method,
never clamped (`transform_inflow_noise`,
`crates/novomodelo-sddp/src/stochastic/noise.rs`), and the correction is the
inflow-slack column `σ^inf`, present when `has_slack_columns`
(`truncates() || slack_is_priced()`, `stochastic/inflow_method.rs`). With the
truncation amount `a^-_h = max(0, −a_h)`: `none` has no column; `penalty` is
`[0, ∞)`, priced; `truncation` is fixed at `[a^-, a^-]` at cost 0;
`truncation_with_penalty`, the default (`novomodelo-io/src/config/modeling.rs`),
is `[0, a^-]`, priced at `inflow_nonnegativity_cost` × stage hours. Template bounds
are `[0, 0]` (`fill_inflow_slack_columns`, `lp/builder/columns.rs`) and every
solve patches them from its own realization, divided by `col_scale`
(`apply_inflow_slack_col_bounds`, `noise.rs`). The slack carries exactly z's
water-row entries, on a PreFilling plant's short-circuit target too
(`push_local_inflow_coupling`, `lp/builder/entries.rs`). Limitation (Larroyd
§2.5): under a PAR model with lag terms (an AR order above zero or an annual
component) `a^-` is piecewise-linear in the lags, so the cost-to-go need not be
convex in them and the lower bound can exceed the upper bound; the gap rule
compares `max(UB − LB, 0)` (`convergence/stopping_rule.rs`), so it can stop with
no optimality certificate. The paper has no noise-adjustment variable;
`inflow-nonnegativity.md` §6.2 maps each method to its strategy.

When **updating the generic-constraint `hydro_inflow` term**
(`reference/generic-constraints.mdx`, section `hydro_inflow`; `lp-formulation.md`
§10, Hydro Inflow):

→ `hydro_inflow` parses as a block-capable variable
(`crates/novomodelo-io/src/constraints/generic.rs`) and `resolve_hydro_inflow`
(`crates/novomodelo-sddp/src/lp/builder/generic_constraints.rs`) resolves it to a
**rate** identity (m³/s), not the `−τ`-weighted storage-balance row: the plant's
local `z_inflow` column, its inflow slack under the truncation methods only
(`push_local_inflow_rate`), inflow diverted into the plant, upstream releases
weighted by the share the downstream balance row credits to the block, and
maturing transit water. Each upstream PreFilling plant whose short-circuit
targets this plant adds its local inflow (with its slack under the truncation
methods), diverted inflow and upstream releases
at `1.0`, and its maturing bucket at the rate `arrival_density[blk]/τ(blk)`
(`push_maturing_bucket_rate`). The plant's own outflows,
evaporation, withdrawal slacks, the `penalty` inflow slack, AR-lag `ψ` and
pumping are excluded.
