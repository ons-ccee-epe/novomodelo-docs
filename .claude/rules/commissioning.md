---
paths:
  - "src/content/docs/**/math/penalty-system.mdx"
  - "src/content/docs/**/math/system-elements.mdx"
  - "src/content/docs/**/math/lp-formulation.md"
  - "src/content/docs/**/math/_impl/_equipment.*"
  - "src/content/docs/**/math/_impl/_hydro*"
  - "src/content/docs/**/entities/equipment/*"
  - "src/content/docs/**/entities/network/*"
  - "src/content/docs/**/reference/case-format/system.mdx"
  - "src/content/docs/**/reference/case-format/initial-conditions.mdx"
---

# Spec Patterns — Filling, Commissioning & Initial Storage

Code facts to verify against `novomodelo` before editing these pages (code > spec).

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
frozen identity, inflow (with the inflow slack, which follows `z`) and maturing
transit water passed downstream to its short-circuit target. **Spillage** is frozen to 0 in
PreFilling only, free during Filling and Operating (`columns.rs`; the phase is
`hydro_phase` in `lp/builder/hydro_state.rs`, over `filling_phase` in
`crates/novomodelo-core/src/commissioning.rs`). A dormant (PreFilling) plant keeps its
initial storage at every dormant stage: its storage floor is not applied and its
ceiling is never below its own `max_storage_hm3` (`storage_floor_relaxed`,
`storage_ceiling`, `hydro_state.rs`).
→ **Initial storage**: an `initial_conditions.json` seed outside the hydro's own
`[min_storage_hm3, max_storage_hm3]` is refused at load (`semantic.5a.53`,
InvalidValue), as is a filling hydro under `storage` or a non-filling one under
`filling_storage` (`semantic.5a.54`); the seed is used as declared, never moved
into stage 0's `hydro_bounds` storage bounds, which bound the end of that stage,
and `novomodelo validate` warns when it lies outside them (`semantic.5a.55`,
ModelQuality; `check_initial_storage_*`, `validation/semantic/hydro.rs`).
→ **Required `operational_start_date`** (ISO) on every `system/*` entity; canonical
entity order is `(operational_start_date, id)` — rename-invariant, id-renumber
moves LP/cut/output order (`system/builder.rs` `sort_canonical`).
