---
title: What Cobre Solves
description: The multi-stage stochastic hydrothermal dispatch problem — algorithm overview, methodology guarantees, and user-facing capabilities.
---

## Purpose

This chapter answers the foundational question: what problem does Cobre compute, and what does a user get when a run completes? It frames the scope for the chapters that follow and threads the capability statements that appear throughout this site.

## 1. The Problem

Power systems that rely heavily on hydroelectric generation face a planning problem that is both large-scale and deeply uncertain. Water stored in reservoirs today is water available for generation in future months; the right dispatch policy depends on how much rain is likely to fall across a multi-year horizon, the cost of thermal alternatives, and the risk appetite of the system operator.

Cobre solves the **multi-stage stochastic hydrothermal dispatch problem**: given a power system with hydro reservoirs, thermal plants, and a stochastic inflow process, find the operating policy that minimises expected generation cost over a planning horizon while meeting load at every stage under every scenario. The state space is continuous (reservoir levels, autoregressive inflow lags), the uncertainty is structured by a periodic autoregressive model, and the horizon spans many stages.

It is a planning problem of hydro-dominated power systems, and the one the Cobre SDDP solver is built for.

## 2. The Algorithm

Cobre implements **Stochastic Dual Dynamic Programming (SDDP)**. SDDP solves the multi-stage problem by decomposing it into per-stage linear programmes that are linked through state variables (reservoir levels and inflow lags). Iterating forward and backward through the stage tree, the algorithm builds piecewise-linear approximations of the cost-to-go function at each stage. These approximations, called Benders cuts, carry future cost information from the last stage back to the first.

Each iteration updates a lower bound and an upper-bound evaluation of the policy's cost ([Methodology Guarantees](#3-methodology-guarantees)); training stops when its stopping rules are met ([Stopping Rules](/math/stopping-rules)). See [The SDDP Framework in One Page](/overview/sddp-framework-overview) for the one-page framing, and [SDDP Algorithm](/math/sddp-algorithm) for the full algorithmic treatment.

## 3. Methodology Guarantees

At convergence, Cobre provides a lower bound on the optimal policy cost and one of two upper-bound evaluations of the policy's cost, selected by the forward pass:

1. **Lower bound** — the first stage's risk-adjusted value over its openings with the current cuts ([definition](/math/upper-bound-evaluation#lower-bound)). It does not decrease across iterations. Under the hypotheses in [Cut Management — when bounds and certificates hold](/math/cut-management#when-bounds-and-certificates-hold), it is a valid lower bound (Tier 1), and under an expectation measure at every stage it converges to the optimal value of the model as trained with probability 1 (Tier 2).
2. **Statistical upper bound** — the sample-average cost of forward simulations under the current policy, with a confidence interval. This estimate carries genuine sampling error that narrows only as more scenarios are drawn; it can fall below the lower bound and is not a certificate.
3. **Exact (deterministic) upper bound** — the policy's cost evaluated over an enumerated scenario tree, visiting every leaf path exactly once. It carries no sampling error. With the lower bound, it limits from above how far the policy's cost lies above the optimal value when the risk measure is uniform across stages ([Tier 3](/math/cut-management#tier-3-gap-certificate)).

Cobre's determinism guarantee is stated per binary under [Methodology Principles](#5-methodology-principles).

## 4. How Cobre Is Used

Cobre is operated through two equivalent interfaces:

**CLI**: Cobre is driven via the `cobre` CLI; the same case directories and configuration files used from Python are used from the CLI.

**Python**: Cobre is callable from Python via PyO3 bindings; cases can be configured, runs launched, and results loaded from Python without leaving the methodology layer.

A run writes machine-parseable output (JSON and Parquet files, and the binary policy checkpoint) alongside its human-readable progress output. Results are structured and self-describing: a completed training run writes the policy, the convergence record, and the output statistics to known paths in its output directory (`output/` inside the case directory unless another is given).

A training run writes its policy as a checkpoint at the end of training. A later run of the same cobre version on the same study (the same state dimension, the same entity behind each state variable, the same stages and the same study graph) can [resume training from it](/running/policy-management/#resume) instead of starting over.

A study runs as a single process or, with the MPI build, across many MPI ranks ([HPC & Cluster Deployment](/running/hpc-deployment/)). One binary on one platform image gives bit-identical results at any rank count and thread count; the single-process and MPI builds are different binaries, whose results are not promised equal ([Determinism & Provenance](/math/determinism-guarantees)).

Cobre is designed for production-scale studies: a long planning horizon of many stages, with large fleets of hydro plants and thermal units, many inflow scenarios per stage, and multiple load blocks within each stage.

## 5. Methodology Principles

The following principles govern how Cobre is built.

- **Reproducibility** — Every Cobre run can be re-derived by anyone holding its inputs and the metadata it records: the same inputs and seed, run by the same binary on the same platform image, give the same policy, the same bounds at every iteration and the same simulation costs, up to the stopping iteration under a wall-clock stopping criterion. See [Determinism & Provenance §5](/math/determinism-guarantees#5-provenance) for what each run records.

- **Determinism** — Cobre produces bit-identical results at any MPI rank count and thread count of one binary on one platform image, and on every re-run with the same inputs and seed. This is an explicit methodology commitment, achieved through coordinated mechanisms in the algorithm design. See [Determinism & Provenance](/math/determinism-guarantees) for the scope, the mechanisms and what is out of scope.

- **Declaration order invariance** — Optimisation results are bit-for-bit identical regardless of the order in which entities are declared in input files; Cobre orders the entities of each kind by operational start date, then by ID, before it builds any stage problem. Reordering hydro plants, thermal units, or transmission lines in the case configuration produces no change in the computed policy or bounds. This property is critical for programmatic workflows where input files are assembled by tools rather than edited by hand.

- **Agent-readability** — A run writes its results as JSON and Parquet files whose layouts the Reference pages document, alongside human-readable progress output, so programmatic tools can compose, monitor and verify Cobre workflows.

## 6. Coming from other software?

Cobre reads its own case format: a case directory of JSON and Parquet input files. A case prepared for a supported hydrothermal planning tool is converted into a Cobre case by cobre-bridge, a separate Python package; [Converting an existing case](/running/case-conversion/) covers what it converts and how to compare the source tool's results with Cobre's.

**Scope and limitations.** Every stage problem is a linear programme, so Cobre has no integer unit-commitment decisions. The transmission network is a transport model: each line carries flow between two buses, up to a capacity in each direction, and no power-flow equations apply. The stage problems are lossless: transmission losses do not enter them, and Cobre computes them from the solved flows and reports them in the simulation results.

**What differs.** Cobre represents every hydro plant individually, with its own storage, generation model and, where it has one, downstream plant. A converted case solved by Cobre is not expected to reproduce another tool's results exactly, because the two models can differ in formulation, inflow model and stopping rule. For equivalent terms in other planning tools, see the [Glossary](/reference/glossary/).

## Cross-References

- [The SDDP Framework in One Page](/overview/sddp-framework-overview) — one-page algorithmic framing: forward simulation, backward cut generation, and convergence bounds
- [How to Read This Site](/overview/how-to-read) — navigation guide for the site's sidebar groups and reading paths for different readers
- [SDDP Algorithm](/math/sddp-algorithm) — full algorithmic treatment: stage LPs, cut generation, convergence theory
- [Determinism & Provenance](/math/determinism-guarantees) — per-binary bit-identical scope, coordinating mechanisms, and what each run records
