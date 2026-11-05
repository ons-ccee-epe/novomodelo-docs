---
paths:
  - "src/content/docs/**/math/scenario-generation.mdx"
  - "src/content/docs/**/math/par-inflow-model.mdx"
  - "src/content/docs/**/math/multi-resolution-studies.md"
  - "src/content/docs/**/math/_impl/_scenario.*"
  - "src/content/docs/**/math/_impl/_par.*"
  - "src/content/docs/**/running/configuration.mdx"
  - "src/content/docs/**/reference/python-api.mdx"
  - "src/content/docs/**/reference/case-format/scenarios.mdx"
  - "src/content/docs/**/reference/output/stochastic.mdx"
  - "src/content/docs/**/entities/hydrology/*"
---

# Spec Patterns — Stochastic Sampling, Correlation & Opening Trees

Code facts to verify against `novomodelo` before editing these pages (code > spec).

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

When **updating spatial correlation estimation or opening-tree moment matching**
(`par-inflow-model.mdx` §6.1, `scenario-generation.mdx` §2.3,
`multi-resolution-studies.md` §4, `_impl/_par.configure.mdx`,
`_impl/_scenario.*`, `running/configuration.mdx`):

→ `estimation.correlation_target` (`inflows` default | `residuals`,
`crates/novomodelo-io/src/config/estimation.rs`) picks the series
`compute_correlation_series` correlates
(`crates/novomodelo-stochastic/src/par/fitting/correlation.rs`): the standardized
inflow `(a − μ_m)/s_m` (population statistics, 0 when `s_m = 0`), or that minus
the PAR lag terms (`ψ*` lag coefficients only, never the annual term). Both feed
the same pairwise-complete Pearson estimates: a pooled `default` profile and a
per-season `season_XX` profile where every pair has ≥ 30 periods
(`MIN_CORRELATION_PAIRS`). Estimation runs only on `full_estimation`,
`partial_estimation` and `user_ar_history_stats` without `correlation.json`;
`correlation_source` is `user_file` whenever the file is present.
→ `training.scenario_source.openings.moment_matching` (`per_coordinate` default |
`none`; `generated` only, refused under `file`;
`crates/novomodelo-io/src/config/scenario_source.rs`) runs `match_stage_moments`
(`crates/novomodelo-stochastic/src/tree/moment_matching.rs`) after the
correlation, per generated stage, on inflow coordinates only: population mean 0
and variance `Σ_j D_cj²` (`implied_class_variances`, `correlation/resolve.rs`;
1 unless an eigenvalue was clipped). It skips `historical_residuals` stages,
`file` trees, one-opening stages and constant coordinates; load and NCS noise and
out-of-sample draws are never matched; the exported tree is the matched one.
→ **Noise groups** are adjacent study stages sharing `(season_id, start year)`.
`reject_group_stage_larger_than_first` (`tree/generate.rs`) refuses a later stage
with more openings, counted after the historical-window and external clamps,
than the group's first stage (`StochasticError::InsufficientData`, exit 1;
`validate` labels it `scenarios/inflow_history.parquet`); one with fewer copies
the first openings, with a warning under moment matching.
→ **MPI**: `novomodelo run` compares `OpeningTree::fingerprint` (FNV-1a) as
min/max across ranks (`crates/novomodelo-cli/src/commands/run/setup.rs`) and
exits 4 on a mismatch; non-root ranks drop every log event below ERROR
(`keeps_event`, `crates/novomodelo-cli/src/main.rs`).
→ Python `StochasticSummary` and `ProvenanceReport` carry `correlation_target`
and `opening_tree_moment_matching` (`reference/python-api.mdx`).
