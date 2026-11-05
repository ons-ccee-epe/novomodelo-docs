---
paths:
  - "src/content/docs/**/math/state-augmentation.md"
  - "src/content/docs/**/math/system-elements.mdx"
  - "src/content/docs/**/math/_impl/_equipment.*"
  - "src/content/docs/**/math/discount-rate.mdx"
  - "src/content/docs/**/math/_impl/_discount.*"
  - "src/content/docs/**/math/post-study-boundary.md"
  - "src/content/docs/**/entities/equipment/thermal-plants.mdx"
  - "src/content/docs/**/entities/rules/water-value.mdx"
---

# Spec Patterns — Anticipated Thermals & Discounting

Code facts to verify against `novomodelo` before editing these pages (code > spec).

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
