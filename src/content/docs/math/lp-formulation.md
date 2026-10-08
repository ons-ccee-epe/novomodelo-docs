---
title: LP Formulation
description: Complete stage subproblem LP — objective taxonomy, all constraint families, slack/penalty variables, and the Benders cut interface to the future cost function.
---

## Purpose

This chapter presents the complete stage subproblem LP for the Novomodelo SDDP solver: the objective function with its cost taxonomy, all constraint families, slack/penalty variables, and the Benders cut interface to the future cost function. It uses the **parallel blocks** formulation by default.

**Reading order**: [System Element Modeling Overview](/math/system-elements) → [Equipment-Specific Formulations](/math/equipment-formulations) → **this chapter** → [State Augmentation](/math/state-augmentation)

For what each physical element represents and its decision variables, see [System Element Modeling Overview](/math/system-elements). For variable naming conventions and index sets, see [Notation Conventions](/overview/notation-conventions).

## Stage LP at a Glance

Given its incoming state, the stage LP minimizes the objective below subject to the rows of every family it carries, each written in its parallel-stage form with the symbols of its owning section, $\cdots$ standing for terms that section writes in full; the in-transit bucket and commitment-ring families are named in one line.

$$
\begin{aligned}
& \min\; C^{resource} + C^{recourse} + C^{violation} + C^{regularization} + d_{t \to t+1}\,\theta \\
& z_h = b_{h,m(t)} + \sum_{\ell=1}^{P_h} \psi_{m(t),\ell} \, a_{h,\ell} + \sigma_{m(t)} \, \varepsilon_t \quad (1) \\
& v_h - v^{in}_h - \zeta \, z_h + \sum_{k \in \mathcal{K}} \zeta_k \big( q_{h,k} + s_{h,k} + u_{h,k} \big) + \cdots = -\zeta \, r_h \quad (2) \\
& \sum_{h \in \mathcal{H}_b} g_{h,b,k} + \sum_{j \in \mathcal{T}_b} g_{j,k} + \cdots + \sum_{s \in \mathcal{S}_b} \delta_{b,k,s} - \epsilon_{b,k} = D_{b,k} \quad (4) \\
& g_{h,b,k} \leq \lambda_{h,b} \big( \gamma^m_0 + \gamma^m_v \, v^{avg}_h + \gamma^m_s \, s_{h,k} \big) + \gamma^m_q \, q_{h,b,k} \quad (5) \\
& e_h - \tfrac{\gamma^{ev}_{v,h}}{2} \, \big( v^{in}_h + v_h \big) - \sigma^{e+}_h + \sigma^{e-}_h = \gamma^{ev}_{0,h} \quad (6) \\
& q_{h,k} + s_{h,k} + \sigma^{o-}_{h,k} \geq \underline{O}_h \quad (7) \\
& q_{h,k} + s_{h,k} - \sigma^{o+}_{h,k} \leq \bar{O}_h \quad (8) \\
& q_{h,b,k} + \sigma^{q-}_{h,b,k} \geq \underline{Q}_{h,b} \quad (9) \\
& g_{h,b,k} + \sigma^{g-}_{h,b,k} \geq \underline{G}_{h,b} \quad (10) \\
& v_h + \sigma^{fill}_h \geq V^{\text{target}}_t \quad (11) \\
& v_h + \sigma^{v-}_h \geq \underline{V}_h \quad (12) \\
& \text{in-transit bucket definition; commitment fish, deposit and carry} \quad (3),\ (13),\ (14),\ (15) \\
& \underline{b}_g \leq \sum_{e} \gamma_{g,e} \, x_e \leq \bar{b}_g \quad (16) \\
& \theta \geq \beta_{0,i} + \sum_{h \in \mathcal{H}} \beta^v_{i,h} \, v_h + \cdots \quad (17)
\end{aligned}
$$

The table lists the families in the order of the stage LP's rows, with $N = \lvert\mathcal{H}\rvert$ hydros and $\lvert\mathcal{K}\rvert$ blocks at the stage.

| No. | Row family | Rows per stage | Section |
| --- | --- | --- | --- |
| 1 | Realized-inflow definition | $N$, one per hydro | [§5](#5-realized-inflow-definition-rows) |
| 2 | Water balance | $N$ on a parallel stage, $N \lvert\mathcal{K}\rvert$ on a chronological stage | [§4](#4-hydro-water-balance) |
| 3 | In-transit bucket definition | one per receiving plant and maturity lag reached at the stage | [State Augmentation — Bucket definition rows](/math/state-augmentation#bucket-definition-rows) |
| 4 | Load balance | $\lvert\mathcal{B}\rvert \, \lvert\mathcal{K}\rvert$, one per bus and block | [§3](#3-load-balance-constraint) |
| 5 | FPHA planes | one per plane, (hydro, bus) cell and block of each FPHA hydro; none while the hydro is PreFilling or in its filling window | [§6](#6-hydro-generation-constraints) |
| 6 | Evaporation | one per evaporating hydro on a parallel stage, one per evaporating hydro and block on a chronological stage; none while the hydro is PreFilling | [§4 Evaporation Row](#evaporation-row) |
| 7 | Minimum outflow | $N \lvert\mathcal{K}\rvert$, one per hydro and block | [§7](#7-outflow-constraints) |
| 8 | Maximum outflow | $N \lvert\mathcal{K}\rvert$, one per hydro and block | [§7](#7-outflow-constraints) |
| 9 | Minimum turbined flow | one per (hydro, bus) cell and block | [§8](#8-variable-bounds-and-minimum-constraints) |
| 10 | Minimum generation | one per (hydro, bus) cell and block | [§6](#6-hydro-generation-constraints) |
| 11 | Filling floor | one per filling hydro at each stage of its filling window | [§8](#8-variable-bounds-and-minimum-constraints) |
| 12 | Soft dead-volume floor | one per filling hydro at each stage from its entry stage on | [§8](#8-variable-bounds-and-minimum-constraints) |
| 13 | Commitment fish | one per anticipated thermal whose delivery at the stage was decided at an earlier stage or before the study | [State Augmentation — Ring Rows](/math/state-augmentation#ring-rows) |
| 14 | Commitment deposit | one per anticipated thermal that decides at the stage a commitment for a delivery inside the study or the declared post-study calendar at which the plant is commissioned | [State Augmentation — Ring Rows](/math/state-augmentation#ring-rows) |
| 15 | Commitment carry | one per ring slot holding a later delivery, decided at an earlier stage or before the study, inside the study or the declared post-study calendar | [State Augmentation — Ring Rows](/math/state-augmentation#ring-rows) |
| 16 | Generic constraints | one per active bound and block it covers, or one stage-level row for a block-independent bound | [§10](#10-generic-constraints) |
| 17 | Benders cuts | one per active cut; one per resident cut under Dynamic Cut Selection | [§11](#11-benders-cuts) |

Incoming-state pinning and the lifecycle pins are column bounds, not rows: each incoming-state column is fixed at its trial value by equal bounds ([State Augmentation §2](/math/state-augmentation#2-pinning-by-column-bounds)), and each column a lifecycle phase freezes is fixed by its bounds ([§8](#8-variable-bounds-and-minimum-constraints)).

## 1. Cost and Penalty Taxonomy

[Penalty System](/math/penalty-system) owns the cost categories, their units, their [priority ordering](/math/penalty-system#penalty-priority-ordering), the ordering checks and the resolution cascade; the table lists the cost symbols of each category as this page writes them.

| Category | Cost symbols |
| --- | --- |
| Thermal and contract costs | $c^{th}_j$, $c^{ctr}_c$ |
| [Recourse slacks](/math/penalty-system#category-1-recourse-slacks-lp-feasibility) | $c^{def}_{b,s}$, $c^{exc}_b$, $c^{inf}_h$ |
| [Constraint violation penalties](/math/penalty-system#category-2-constraint-violation-penalties-policy-shaping) | $c^{sv-}_h$, $c^{fill}_h$, $c^{tv-}_h$, $c^{ov-}_h$, $c^{ov+}_h$, $c^{gv-}_h$, $c^{ev+}_h$, $c^{ev-}_h$, $c^{wv+}_h$, $c^{wv-}_h$ |
| [Regularization costs](/math/penalty-system#category-3-regularization-costs-solution-guidance) | $c^{spill}_h$, $c^{tc}_h$, $c^{div}_h$, $c^{curt}_r$, $c^{exch}_n$ |

Pumping carries no cost term; the power a pumping station draws enters the load balance of its bus (§3, [Equipment-Specific Formulations §4](/math/equipment-formulations#4-pumping-stations)).

### 1.1 Objective Function Structure

The complete stage objective is:

$$
\min \; \underbrace{C^{resource}}_{\text{thermal, contracts}} + \underbrace{C^{recourse}}_{\text{deficit, excess, inflow non-negativity}} + \underbrace{C^{violation}}_{\text{constraint slacks}} + \underbrace{C^{regularization}}_{\text{spillage, exchange, ...}} + d_{t \to t+1} \, \theta
$$

where the per-block terms are weighted by the block duration $\tau_k$ and the stage-level terms, namely the storage-violation slacks on end-of-stage storage, the inflow non-negativity and withdrawal slacks, the evaporation slacks of a parallel stage, the slacks of a stage-level generic constraint (§10) and the commitment cost of an anticipated thermal, apply once per stage (§2); the per-block part of each component is:

$$
C^{component} = \sum_{k \in \mathcal{K}} \tau_k \cdot (\text{cost terms for component})
$$

The coefficient of $\theta$ is the one-step discount factor $d_{t \to t+1}$ of [Discount Rate Formulation](/math/discount-rate), equal to 1 at a zero rate.

## 2. Objective Function

$$
\min \sum_{k \in \mathcal{K}} \tau_k \Bigg[
  \underbrace{\sum_{j \in \mathcal{T}} c^{th}_j g_{j,k}}_{\text{Thermal cost}}
  + \underbrace{\sum_{c \in \mathcal{C}} c^{ctr}_c \chi_{c,k}}_{\text{Contract cost}}
$$

$$
  + \underbrace{\sum_{b \in \mathcal{B}} \sum_{s \in \mathcal{S}_b} c^{def}_{b,s} \delta_{b,k,s}}_{\text{Deficit (piecewise)}}
  + \underbrace{\sum_{b \in \mathcal{B}} c^{exc}_b \epsilon_{b,k}}_{\text{Excess}}
$$

$$
  + \underbrace{\sum_{h \in \mathcal{H}} c^{spill}_h s_{h,k}
  + \sum_{h \in \mathcal{H}} c^{tc}_h q_{h,k}
  + \sum_{h \in \mathcal{H}} c^{div}_h u_{h,k}}_{\text{Hydro regularization}}
$$

$$
  - \underbrace{\sum_{r \in \mathcal{R}} c^{curt}_r \, g^{nc}_{r,k}}_{\text{Curtailment (regularization)}}
  + \underbrace{\sum_{n \in \mathcal{L}} c^{exch}_n (f^+_{n,k} + f^-_{n,k})}_{\text{Exchange (regularization)}}
$$

$$
  + \underbrace{\text{Constraint violation penalties}}_{\text{See }\S 9}
\Bigg]
$$

$$
+ \underbrace{\sum_{h \in \mathcal{H}} \Big[ c^{sv-}_h \sigma^{v-}_h + c^{fill}_h \sigma^{fill}_h \Big]}_{\text{Storage violations (not per-block)}}
+ \underbrace{\sum_{h \in \mathcal{H}} c^{inf}_h H_t \, \sigma^{inf}_h}_{\text{Inflow non-negativity (not per-block)}}
+ \; d_{t \to t+1} \, \theta
$$

:::note[Note on storage violation penalties]
Storage violation penalties ($\sigma^{v-}_h$, $\sigma^{fill}_h$) are **not** multiplied by $\tau_k$ because they apply to end-of-stage storage (hm³), not to per-block flow rates. All other penalty terms are per-block and carry the $\tau_k$ weighting, except the stage-level withdrawal and inflow non-negativity slacks and, on a parallel stage, the evaporation slacks, which are priced over $H_t$ (§9 and the display above). Contract prices carry the sign convention of [Equipment-Specific Formulations §3](/math/equipment-formulations#3-importexport-contracts). $\sigma^{v-}_h$ exists only for a filling hydro from its entry stage on and $\sigma^{fill}_h$ only during its filling window; for every other hydro both are absent. The inflow non-negativity slack $\sigma^{inf}_h$ is present only under the penalty-based inflow methods ([Inflow Non-Negativity Solution Methods](/math/inflow-nonnegativity)).
:::

Wherever the inflow non-negativity slack enters the water balance of $h$ (§4), it supplies water to that balance at $c^{inf}_h H_t$ per $\zeta$ hm³, so on a parallel stage the value of one more hm³ of water at $h$ is at most $c^{inf}_h H_t / \zeta$. On a chronological stage the slack enters every block row with its $\zeta_k$, and the bound holds for the duration-weighted average, with weights $w_k$, of the block values, not for each block. The bound is one-sided: it caps the value of water, not a negative value of surplus water. [Penalty System — Penalty Priority Ordering](/math/penalty-system#penalty-priority-ordering) converts the inflow cost to \$/MWh and orders it below deficit, so that the LP takes slack water before it sheds load. On a parallel stage the storage cut coefficient $\beta^v_h$ read at the stage inherits the bound, $-\beta^v_h \le c^{inf}_h H_t / \zeta$, where $v^{in}_h$ enters only the water balance; an FPHA plane, the evaporation row or a generic constraint that reads $v^{in}_h$ adds its own terms.

Anticipated thermals ([State Augmentation §5](/math/state-augmentation#5-anticipated-thermal-commitments)) add one stage-level commitment-cost term per plant deciding a commitment at the stage — not a per-block term: the commitment column priced at the plant's unit cost and hours of the delivery stage and discounted from it ([State Augmentation — Objective contributions](/math/state-augmentation#objective-contributions)). Their per-block generation carries no thermal cost at a stage where the plant has a fish row ([State Augmentation — Ring Rows](/math/state-augmentation#ring-rows)), which ties it to the committed rate; at any other stage it is priced like any thermal.

:::note[Note on curtailment]
Curtailment is priced as a reward on dispatched non-controllable generation ([Equipment-Specific Formulations §6](/math/equipment-formulations#6-non-controllable-generation-sources)), so the stage objective can be negative.
:::

## 3. Load Balance Constraint

Each hydro plant $h$ is partitioned into one or more **(hydro, bus) cells** — one cell per distinct bus among the plant's declared unit groups (see [System Element Modeling Overview §5](/math/system-elements)). $\mathcal{B}_h$ denotes the set of buses hosting one of $h$'s cells; $\mathcal{H}_b$ denotes the hydros with a cell at bus $b$ (i.e. $b \in \mathcal{B}_h$). $g_{h,b,k}$ is the generation of hydro $h$'s cell at bus $b$, block $k$ — the quantity that actually injects at $b$. A plant whose groups share a single bus has $|\mathcal{B}_h| = 1$, and $g_{h,b,k}$ collapses to the single-cell $g_{h,k}$ used everywhere else in this chapter.

For each bus $b \in \mathcal{B}$ and block $k \in \mathcal{K}$:

$$
\sum_{h \in \mathcal{H}_b} g_{h,b,k} + \sum_{j \in \mathcal{T}_b} g_{j,k}
+ \sum_{r \in \mathcal{R}_b} g^{nc}_{r,k}
+ \sum_{c \in \mathcal{C}^{imp}_b} \chi_{c,k}
$$

$$
+ \sum_{n: \text{target}=b} f^+_{n,k} + \sum_{n: \text{source}=b} f^-_{n,k}
$$

$$
- \sum_{n: \text{source}=b} f^+_{n,k} - \sum_{n: \text{target}=b} f^-_{n,k}
- \sum_{c \in \mathcal{C}^{exp}_b} \chi_{c,k}
- \sum_{y \in \mathcal{P}_b} \rho^{pump}_y p_{y,k}
+ \sum_{s \in \mathcal{S}_b} \delta_{b,k,s} - \epsilon_{b,k} = D_{b,k}
$$

**Dual variable**: $\pi^{lb}_{b,k}$ (marginal cost of energy at bus $b$, block $k$, in \$/MW; divide by $\tau_k$ for \$/MWh — see [Variable Units Convention](/math/system-elements#variable-units-convention))

For the physical meaning of each element in the balance, see [System Element Modeling Overview](/math/system-elements).

## 4. Hydro Water Balance

Every hydro $h \in \mathcal{H}$ has one water-balance row on a parallel stage and one per block on a chronological stage ([Block Formulation Variants](/math/block-formulations)); every LP variable is on the left-hand side.

### Parallel-Stage Row

$$
\begin{aligned}
& v_h - v^{in}_h - b^{\mathrm{in}}_{h,1}
  - \zeta \big( z_h + \sigma^{inf}_h + \sigma^{w-}_h - \sigma^{w+}_h - e_h \big) \\
& \quad + \sum_{k \in \mathcal{K}} \zeta_k \Big( q_{h,k} + s_{h,k} + u_{h,k}
  - \sum_{h' \in \mathcal{U}_h} \nu_{h',t,0} \, (q_{h',k} + s_{h',k})
  - \sum_{h':\,\text{div}=h} u_{h',k} \\
& \qquad + \sum_{y:\,\text{src}=h} p_{y,k} - \sum_{y:\,\text{dest}=h} p_{y,k} \Big) = -\zeta \, r_h
\end{aligned}
$$

### Chronological-Stage Rows

For each block $k \in \mathcal{K}$, with $v_{h,0} = v^{in}_h$ and $v_{h,\lvert\mathcal{K}\rvert} = v_h$:

$$
\begin{aligned}
& v_{h,k} - v_{h,k-1} - \phi_{h,k} \, b^{\mathrm{in}}_{h,1}
  - \zeta_k \big( z_h + \sigma^{inf}_h + \sigma^{w-}_h - \sigma^{w+}_h - e_{h,k} \big)
  + \zeta_k \big( q_{h,k} + s_{h,k} + u_{h,k} \big) \\
& \quad - \sum_{h' \in \mathcal{U}_h} \sum_{k' \le k} \nu^{k' \to k}_{h',t} \, \zeta_{k'} \, (q_{h',k'} + s_{h',k'})
  - \zeta_k \sum_{h':\,\text{div}=h} u_{h',k}
  + \zeta_k \Big( \sum_{y:\,\text{src}=h} p_{y,k} - \sum_{y:\,\text{dest}=h} p_{y,k} \Big) = -\zeta_k \, r_h
\end{aligned}
$$

### Row Terms

- $v_h$ and $v^{in}_h$ = outgoing and incoming storage; $v^{in}_h$ is pinned to the trial value by its column bounds ([State Augmentation §2](/math/state-augmentation#2-pinning-by-column-bounds)). On a chronological stage $v_{h,k}$ is the storage at the end of block $k$
- $b^{\mathrm{in}}_{h,1}$ = in-transit volume maturing at this stage on the travel-time arcs into $h$, in hm³ and therefore outside the conversion ([State Augmentation §6](/math/state-augmentation#6-water-travel-time)); a chronological stage spreads it over its blocks by the arrival density $\phi_{h,k}$, $\sum_k \phi_{h,k} = 1$. Absent when no travel-time arc enters $h$
- $z_h = a_h$ = realized incremental inflow (§5), so block $k$ of a chronological stage receives the share $w_k\,\zeta\,\sigma_{m(t)}\,\varepsilon_t$ of the innovation
- $\sigma^{inf}_h$ = inflow non-negativity slack, present under the penalty-based methods, which adds water (see [Inflow Non-Negativity Solution Methods](/math/inflow-nonnegativity))
- $r_h$, $\sigma^{w-}_h$, $\sigma^{w+}_h$ = signed stage-level withdrawal target ($r_h < 0$ adds water) and its stage-level under- and over-delivery slacks; the realized withdrawal is $R_h = r_h - \sigma^{w-}_h + \sigma^{w+}_h$, with the slack caps in §9
- $e_h$ / $e_{h,k}$ = signed net evaporation of a hydro with an evaporation model (a negative value is net rainfall on the lake and adds water): one stage-level column on a parallel stage of any block count, one per block on a chronological stage, each a bounded column tied to storage by its evaporation row (see [Evaporation Row](#evaporation-row))
- $q_{h,k} = \sum_{b \in \mathcal{B}_h} q_{h,b,k}$, $s_{h,k}$, $u_{h,k}$ = the plant's own turbined, spilled and diverted flow in block $k$; every (hydro, bus) cell's turbined column carries the same coefficient, and spillage and diversion are single per-plant columns
- Upstream release: only the turbined and spilled flow of each $h' \in \mathcal{U}_h$ reaches $h$; a plant's diverted flow reaches only its diversion target (the $\text{div}$ sum)
- $\nu_{h',t,0} = (H_t - \Delta^{tt}_{h'})^+ / H_t$ = same-stage share of the release of $h'$ on a parallel stage, with $H_t$ the duration of stage $t$ and $\Delta^{tt}_{h'}$ the travel time of $h'$'s main cascade arc ($0$ when none is declared, so the share is $1$); the remaining $1 - \nu_{h',t,0}$ is deposited into the in-transit buckets ([State Augmentation §6](/math/state-augmentation#6-water-travel-time))
- $\nu^{k' \to k}_{h',t}$ = within-stage routing share on a chronological stage: the fraction of $h'$'s block-$k'$ release that reaches $h$'s block-$k$ row in the same stage, $k \ge k'$. Without a travel time $\nu^{k \to k}_{h',t} = 1$ and $\nu^{k' \to k}_{h',t} = 0$ for $k' < k$; the rest of the release is deposited into the buckets ([State Augmentation §6](/math/state-augmentation#6-water-travel-time))
- $p_{y,k}$ = pumped flow of station $y$, out of its source plant's row and into its destination plant's row (see [Equipment-Specific Formulations](/math/equipment-formulations)); on a parallel stage every block's pumped flow enters the single stage row
- $\zeta = 0.0036 \sum_{k \in \mathcal{K}} \tau_k$ and $\zeta_k = 0.0036\,\tau_k = w_k\,\zeta$ = stage and block flow-to-volume conversions, with $\tau_k$ the duration of block $k$ in hours and $w_k = \tau_k / \sum_{k' \in \mathcal{K}} \tau_{k'}$ its weight, so $\sum_k \zeta_k = \zeta$

### PreFilling Pass-Through

A PreFilling hydro (see [Lifecycle Phases](#lifecycle-phases) for the phase) has the frozen identity row $v_h - v^{in}_h = 0$, and on a chronological stage $v_{h,k} - v_{h,k-1} = 0$ per block, with right-hand side $0$. Its local inflow $z_h$, the releases of its upstream plants and the flows diverted into it enter the row of the first non-PreFilling plant downstream with the coefficients they would carry on the PreFilling plant's own row ($-\zeta$ on $z_h$ on a parallel stage and $-\zeta_k$ on each block row of a chronological stage, $-\zeta_k$ on every block-$k$ flow) and no travel-time share, and its withdrawal target moves to that plant's right-hand side. Its maturing in-transit volume $b^{\mathrm{in}}_{h,1}$ enters the same row, with coefficient $-1$ on a parallel stage and $-\phi_{h,k}$ on block $k$'s row of a chronological stage, $\phi_{h,k}$ being the PreFilling plant's own arrival density. With no such plant downstream the water leaves the system.

### Summing the Block Rows

Summing a chronological stage's block rows over $k \in \mathcal{K}$ telescopes the storage terms to $v_h - v^{in}_h$, returns $b^{\mathrm{in}}_{h,1}$ ($\sum_k \phi_{h,k} = 1$), and returns the parallel coefficients of $z_h$, $\sigma^{inf}_h$, $\sigma^{w-}_h$, $\sigma^{w+}_h$ and the right-hand side ($\sum_k \zeta_k = \zeta$); the per-block flows keep their $\zeta_k$. The sum has the parallel row's form with two mode differences: $\sum_k \zeta_k\,e_{h,k}$ in place of $\zeta\,e_h$, and each upstream block-$k'$ release carrying its own same-stage share $\sum_{k \ge k'} \nu^{k' \to k}_{h',t}$ in place of $\nu_{h',t,0}$, whose duration-weighted average over $k'$ is $\nu_{h',t,0}$: $\sum_{k' \in \mathcal{K}} w_{k'} \sum_{k \ge k'} \nu^{k' \to k}_{h',t} = \nu_{h',t,0}$. With one block, or no travel time on the arc, the shares coincide.

:::note[Dimensional Consistency]
(see [Variable Units Convention](/math/system-elements#variable-units-convention)):

- Storage ($v_h$, $v^{in}_h$, $v_{h,k}$) and $b^{\mathrm{in}}_{h,1}$ are in hm³
- $\zeta$ and $\zeta_k$ are in hm³/(m³/s)
- Every flow, every slack and $r_h$ are in m³/s
- The conversion to volume happens only through $\zeta$ and $\zeta_k$
:::

**Dual variable**: $\pi^{wb}_h$ for the parallel row; on a chronological stage each block row has its own dual $\pi^{wb}_{h,k}$ (water value — captures the marginal value of incoming storage as seen through the hydro balance, but is **not** used directly as a cut coefficient; the cut coefficient comes from the reduced cost of the pinned incoming-storage column, see [State Augmentation §2](/math/state-augmentation#2-pinning-by-column-bounds) and [Cut Management](/math/cut-management))

### Evaporation Row

Every hydro with an evaporation model has an evaporation row that ties its net evaporation to storage. A parallel stage, of any block count, has one row per such hydro, on the stage's incoming and outgoing storage:

$$
e_h - \tfrac{\gamma^{ev}_{v,h}}{2} \, \big( v^{in}_h + v_h \big) - \sigma^{e+}_h + \sigma^{e-}_h = \gamma^{ev}_{0,h}
$$

A chronological stage has one row per block $k \in \mathcal{K}$, on the block's own storages, with $v_{h,0} = v^{in}_h$ and $v_{h,\lvert\mathcal{K}\rvert} = v_h$:

$$
e_{h,k} - \tfrac{\gamma^{ev}_{v,h}}{2} \, \big( v_{h,k-1} + v_{h,k} \big) - \sigma^{e+}_{h,k} + \sigma^{e-}_{h,k} = \gamma^{ev}_{0,h}
$$

- $\gamma^{ev}_{v,h}$ and $\gamma^{ev}_{0,h}$ = slope and intercept, at a reference volume, of the tangent of the evaporation flux of $h$: the evaporation coefficient of the stage's calendar month times the reservoir surface area from its area–volume curve, converted to a monthly-average rate in m³/s. Both are recomputed at every stage; the row's target is the tangent evaluated at the average of the two storages the row reads. The flux, and so $e_h$ or $e_{h,k}$, can be negative (net rainfall on the lake)
- $e_h$ / $e_{h,k}$ = net evaporation (Row Terms above), bounded symmetrically about zero by a fixed safety margin times $\lvert \gamma^{ev}_{0,h} + \gamma^{ev}_{v,h} \bar{V}_h \rvert$, the magnitude of the target at the maximum storage $\bar{V}_h$, recomputed at every stage; it is not a free column. It enters the parallel water-balance row as $\zeta \, e_h$ and the block-$k$ row of a chronological stage as $\zeta_k \, e_{h,k}$
- $\sigma^{e+}_h$ / $\sigma^{e+}_{h,k}$ and $\sigma^{e-}_h$ / $\sigma^{e-}_{h,k}$ = evaporation above and below the target, priced at $c^{ev+}_h$ and $c^{ev-}_h$: the row sets the evaporation to the target plus $\sigma^{e+}$ minus $\sigma^{e-}$. On a parallel stage the one pair is priced over the stage hours $H_t$, on a chronological stage each block's pair over its duration $\tau_k$ (§9)

With one block the parallel and chronological forms coincide, rows and pricing alike. A PreFilling hydro has no evaporation row.

## 5. Realized-Inflow Definition Rows

For each hydro $h \in \mathcal{H}$, the LP includes an auxiliary variable $z_h$ representing the total realized inflow (m³/s) at the current stage. These variables are defined by equality constraints that combine the deterministic base, lag contributions, and stochastic noise:

$$
z_h = b_{h,m(t)} + \sum_{\ell=1}^{P_h} \psi_{m(t),\ell} \cdot a_{h,\ell} + \sigma_{m(t)} \cdot \varepsilon_t
$$

where:

- $z_h$ = LP variable representing the realized inflow for hydro $h$ (free column, zero cost)
- $b_{h,m(t)}$ = deterministic base (precomputed from seasonal means and AR coefficients — see [PAR(p) Inflow Model §2.4](/math/par-inflow-model#24-deterministic-base))
- $\psi_{m(t),\ell}$ = original-unit AR coefficients (constraint matrix entries, set once at LP construction); for a hydro with the annual component the sum runs over every lag slot ($\ell \le P^{\max}$) and each of these coefficients also carries the annual term ([PAR(p) Inflow Model §7.4](/math/par-inflow-model#74-runtime-unit-conversion))
- $a_{h,\ell}$ = LP variables for lagged inflows (state variables, fixed by [State Augmentation §4](/math/state-augmentation#4-inflow-lags))
- $\sigma_{m(t)} \cdot \varepsilon_t$ = noise innovation (patched into the constraint RHS per scenario)

The z-inflow variable $z_h$ then enters the water balance constraint (§4) in place of the raw inflow term $a_h$, and its primal value after solving gives the realized inflow for reporting and simulation extraction.

The z-inflow columns sit between the leading state columns and the incoming storage columns, and their constraint rows form the **first** equality block ([LP Layout and Scaling §1](/math/lp-layout-and-scaling#1-column-and-row-layout)). The RHS is patched per scenario with $b_{h,m(t)} + \sigma_{m(t)} \cdot \varepsilon_t$, where $\varepsilon_t$ is the effective noise (possibly clamped for inflow non-negativity — see [Inflow Non-Negativity Solution Methods](/math/inflow-nonnegativity)). They are not pinned state columns and carry no cut coefficient of their own; the cut row multiplies the lag-1 coefficient by $z_h$.

**Constraint count**: $N$ total constraints, where $N = |\mathcal{H}|$ is the number of hydros, whatever their lifecycle phase.

## 6. Hydro Generation Constraints

Novomodelo supports two production models, in increasing order of complexity. A third model name, linearized head, is a reserved alias that resolves to constant productivity in every phase — see [Hydro Production Function Models §3](/math/hydro-production-models). The model can vary by stage or season per hydro.

Both models are evaluated **per cell** $(h, b)$ (§3) rather than per plant; for a single-cell plant the per-cell constraint is the plant-level constraint.

**Constant Productivity Model** (for each cell $(h, b)$ of hydro $h \in \mathcal{H}^{const}$, block $k$):

$$
g_{h,b,k} = \rho_h \cdot q_{h,b,k}
$$

Constant-productivity hydros carry no separate generation column: $g_{h,b,k}$ is this direct multiple of the cell's own turbined-flow column, so a cell's generation bound is enforced by folding it into that column's bound (§8) rather than by a bound on $g_{h,b,k}$ itself.

**FPHA Model** (for each plane $m \in \mathcal{M}_h$, cell $(h, b)$ of hydro $h \in \mathcal{H}^{fpha}$, block $k$):

$$
g_{h,b,k} \leq \lambda_{h,b} \big( \gamma^m_0 + \gamma^m_v \cdot v^{avg}_h + \gamma^m_s \cdot s_{h,k} \big) + \gamma^m_q \cdot q_{h,b,k}
$$

where $v^{avg}_h = (v^{in}_h + v_h)/2$ is the average storage during the stage, with $v^{in}_h$ being the incoming storage LP variable ([State Augmentation §2](/math/state-augmentation#2-pinning-by-column-bounds)) and $v_h$ the end-of-stage storage on a parallel stage; on a chronological stage the row of block $k$ reads that block's own average $(v_{h,k-1} + v_{h,k})/2$ ([Block Formulation Variants §2.4](/math/block-formulations#24-per-block-production-and-evaporation)) — a single plant-level quantity shared by every cell, since storage is not partitioned. $\lambda_{h,b}$ is cell $(h,b)$'s **apportionment share** of plant $h$'s declared turbine capacity,

$$
\lambda_{h,b} = \frac{\sum_{u \,\in\, (h,b)} \bar{Q}_u}{\sum_{u \,\in\, h} \bar{Q}_u}
$$

(the ratio of the cell's own unit groups' declared maximum turbined flow to the plant's total, $0$ when the plant's total is $0$), so that $\sum_{b \in \mathcal{B}_h} \lambda_{h,b} = 1$ for every plant with positive declared turbine capacity. Only the plane's flow-independent part — the intercept $\gamma^m_0$, the storage term, and the spillage term — is apportioned by $\lambda_{h,b}$; the flow coefficient $\gamma^m_q$ stays on the cell's own $q_{h,b,k}$ unscaled, because it alone is homogeneous in the cell partition (summing the per-cell rows at fixed $v^{avg}_h$, $s_{h,k}$, and $\sum_b q_{h,b,k}$ recovers the plant-level bound this replaces). A single-cell plant with positive declared turbine capacity has $\lambda_{h,b} = 1$ exactly, so its row is the plant-level row.

For a plant with positive declared turbine capacity the shares sum to $1$, so the per-cell rows of each plane sum to that plane's plant-level row (above). A sum of minima is at most the minimum of the sums, so at the same $v^{avg}_h$, $s_{h,k}$ and total turbined flow the cap the per-cell rows put on the plant's generation $\sum_{b \in \mathcal{B}_h} g_{h,b,k}$, on the left, is at most the plant-level envelope, the minimum over the planes of the plant-level rows, on the right:

$$
\sum_{b \in \mathcal{B}_h} \min_{m} \Big( \lambda_{h,b}\big(\gamma^m_0 + \gamma^m_v v^{avg}_h + \gamma^m_s s_{h,k}\big) + \gamma^m_q q_{h,b,k} \Big)
\;\le\; \min_{m} \Big( \gamma^m_0 + \gamma^m_v v^{avg}_h + \gamma^m_s s_{h,k} + \gamma^m_q \sum_{b} q_{h,b,k} \Big)
$$

Equality holds when the same plane attains the minimum in every cell, in particular when the cells turbine in proportion to their shares $\lambda_{h,b}$. For $\lambda_{h,b} > 0$ the minimum of cell $(h,b)$ is $\lambda_{h,b}$ times the plant-level envelope at the flow $q_{h,b,k}/\lambda_{h,b}$, so when every share is positive the display is Jensen's inequality for the concave envelope with the weights $\lambda_{h,b}$. A cell with $\lambda_{h,b} = 0$ keeps only its $\gamma^m_q \, q_{h,b,k}$ term, and the display still holds by the sum-of-minima argument.

**Generation Bounds** (per cell $(h, b)$, block $k$ — the FPHA generation column's own bound; a constant-productivity cell has no such column, so its generation cap is folded into the turbined-flow bound below instead):

$$
\underline{G}_{h,b} - \sigma^{g-}_{h,b,k} \leq g_{h,b,k} \leq \bar{G}_{h,b}
$$

$$
\underline{G}_{h,b} = \sum_{u \,\in\, (h,b)} \underline{G}_u, \qquad \bar{G}_{h,b} = \min\!\Big( \sum_{u \,\in\, (h,b)} \bar{G}_u,\ \ \bar{G}_h \Big)
$$

Generation bounds are user-defined (declared per unit group, not derived from turbined flow). The lower bound is soft, with one slack $\sigma^{g-}_{h,b,k}$ **per cell** — priced at the plant's own penalty $c^{gv-}_h$ at full magnitude on every cell of a split plant, never divided by cell count; a constant-productivity cell's floor couples this same slack to $\rho_h \cdot q_{h,b,k}$ rather than to a generation column. The upper bound's plain sum over the cell's own unit groups closes against the plant's own resolved maximum $\bar{G}_h$ — a bounds override may never raise a cell above it. See [System Element Modeling Overview §5](/math/system-elements). Matches the per-cell $\sigma^{g-}_{h,b,k}$ defined in [Notation Conventions §4.3](/overview/notation-conventions#43-slack-variables).

For details on the FPHA construction and production function model variants, see [Hydro Production Function Models](/math/hydro-production-models).

## 7. Outflow Constraints

**Outflow Definition** (per hydro $h$, block $k$):

$$
o_{h,k} = q_{h,k} + s_{h,k}
$$

:::note[Clarification]
Outflow $o$ represents water released to the downstream channel (affecting tailrace level). It does NOT include:

- **Withdrawal** $r_h$: A signed consumptive-use parameter (positive = removal from system for irrigation/water supply; negative = inter-basin return/addition). This is a fixed parameter (not a decision variable) — see §4 for the signed-target semantics and §9 for the slack bounds
- **Diversion** $u_{h,k}$: Water bypassed to a separate channel (not affecting main tailrace)

The water balance (§4) accounts for all flows: inflow $-$ $(q + s + u)$ $-$ evaporation $-$ withdrawal = storage change. Withdrawal $r_h$ enters as a signed fixed RHS parameter; bidirectional violation slacks ($\sigma^{w-}_h$, $\sigma^{w+}_h$) allow the LP to relax the withdrawal commitment when necessary (see §9).
:::

**Outflow Bounds** (with slacks for soft enforcement):

$$
\underline{O}_h - \sigma^{o-}_{h,k} \leq o_{h,k} \leq \bar{O}_h + \sigma^{o+}_{h,k}
$$

## 8. Variable Bounds and Minimum Constraints

### Storage Bounds (per hydro $h$)

$$
\underline{V}_h \leq v_h \leq \bar{V}_h
$$

The dead volume $\underline{V}_h$ is a hard lower bound for every hydro except two cases: a hydro with a filling configuration has a floor of $0$ in every phase, the per-stage filling floor below taking its place while it fills, and from its entry stage on the dead volume returns as the soft floor $v_h + \sigma^{v-}_h \geq \underline{V}_h$, the only storage-below-minimum slack of the LP, priced above deficit; a hydro without a filling configuration has a floor of $0$ while PreFilling, where its frozen identity (§4) holds the storage at its incoming value. On a chronological stage the block-end storages $v_{h,k}$ carry the same column bounds, and the soft floor applies to the end-of-stage storage $v_h$ only. The upper bound is hard; excess water leaves through spillage.

**Filling floors** (for filling hydros, at every filling stage $t$, from the filling start stage up to, not including, the entry stage):

$$
v_h + \sigma^{fill}_h \geq V^{\text{target}}_t,
\qquad
V^{\text{target}}_t = \min\!\Big( \underline{V}_{h,L} - \sum_{t'=t+1}^{L} \zeta_{t'} \, \text{rate}_{t'},\ \underline{V}_{h,t} \Big)
$$

$\underline{V}_{h,t}$ is the dead volume in force at stage $t$ (a stage may override it), $L$ is the last filling stage, the stage before the entry stage, and $\text{rate}_{t'}$ the minimum accumulation rate of stage $t'$, which $\zeta_{t'}$ converts into hm³. The floor at stage $t$ is the dead volume of stage $L$ minus the accumulation the schedule still owes after $t$, never above the dead volume of stage $t$ itself; it reaches $\underline{V}_{h,L}$ at $L$. Every filling stage carries its floor. The slack $\sigma^{fill}_h$ is priced at $c^{fill}_h$, which Novomodelo expects **below deficit** ([Penalty System — Penalty Ordering Validation](/math/penalty-system#penalty-ordering-validation) checks it as given). See [Penalty System §6](/math/penalty-system#dead-volume-filling-specifics).

### Turbined Flow Bounds (per cell $(h, b)$, block $k$)

$$
\underline{Q}_{h,b} - \sigma^{q-}_{h,b,k} \leq q_{h,b,k} \leq \bar{Q}_{h,b}
$$

The lower bound is soft, with one slack $\sigma^{q-}_{h,b,k}$ per cell, priced at the plant's own penalty $c^{tv-}_h$ at full magnitude on every cell — never divided by cell count; it is the plain sum of the cell's own unit groups' resolved minimum turbined flow, $\underline{Q}_{h,b} = \sum_{u \,\in\, (h,b)} \underline{Q}_u$. The upper bound is hard and closes against the plant's own resolved maximum, never raised above it:

$$
\bar{Q}_{h,b} = \min\!\left( \sum_{u \,\in\, (h,b)} \mathrm{fold}(u),\ \ \bar{Q}_h \right)
$$

where $\mathrm{fold}(u) = \bar{Q}_u$ for an FPHA hydro (turbined flow and generation are independent columns there) and $\mathrm{fold}(u) = \min(\bar{Q}_u,\ \bar{G}_u / \rho_h)$ for a constant-productivity hydro — each group's own flow cap and MW-implied flow cap must be folded **before** summing across the cell, since $\min$ does not distribute over a sum of groups that bind on different sides. This is the mechanism that enforces a constant-productivity cell's generation cap (§6): there is no separate generation column to bound directly. Matches the per-cell $\sigma^{q-}_{h,b,k}$ defined in [Notation Conventions §4.3](/overview/notation-conventions#43-slack-variables).

### Diversion Flow Bounds (per hydro $h$, block $k$)

$$
0 \leq u_{h,k} \leq \bar{U}_h
$$

The lower bound is $0$ unless a minimum diversion flow is set for the stage or for the block, which replaces it. Both bounds are hard. Diversion cost is a regularization term (see §1), not a violation penalty.

### Spillage Bounds (per hydro $h$, block $k$)

Spillage $s_{h,k}$ is bounded below by $0$ and above by $+\infty$ unless a minimum or maximum spillage is set for the stage or for the block, which replaces the bound. Both bounds are hard. While the hydro is PreFilling, spillage is fixed at $[0, 0]$ ([Lifecycle Phases](#lifecycle-phases)).

### Pumping Flow Bounds (per station $y$, block $k$)

$$
\underline{P}_y \leq p_{y,k} \leq \bar{P}_y
$$

Both bounds are hard.

### Lifecycle Phases

At each stage a hydro is in exactly one lifecycle phase, set by its [commissioning window](/math/system-elements#entity-commissioning-windows) and, for a filling hydro (a hydro with a filling configuration), by its filling start; every other entity is either in service (inside its commissioning window) or out of service.

| Phase | Applies at | Storage row and floor | Turbined flow and generation | Spillage | Diversion | Inflow, upstream releases and withdrawal | Operational floors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PreFilling | A hydro without a filling configuration: every stage outside its commissioning window, before its entry stage or from its exit stage on. A filling hydro: every stage before its filling start | Frozen identity $v_h - v^{in}_h = 0$, per block on a chronological stage, with right-hand side $0$ (§4); floor $0$; no evaporation row | $q_{h,b,k}$ fixed at $[0, 0]$ on every cell; no FPHA rows and no generation column | $s_{h,k}$ fixed at $[0, 0]$, whatever its bounds | $u_{h,k}$ fixed at $[0, 0]$ | The local inflow, the releases of the upstream plants, the flows diverted in and the in-transit volume maturing into the plant enter the row of the first non-PreFilling plant downstream, and the withdrawal target moves to that plant's right-hand side; with no such plant the water leaves the system | The minimum-outflow, minimum-turbined-flow and minimum-generation rows are present; with turbined flow, spillage and generation at $0$, a positive minimum falls wholly on its slack, at its penalty (§9) |
| Filling | A filling hydro: every stage from its filling start up to, but not including, its entry stage | Water balance of §4, with the evaporation row of an evaporating hydro; floor $0$ and the per-stage filling floor $v_h + \sigma^{fill}_h \geq V^{\text{target}}_t$ of [§8 Storage Bounds](#8-variable-bounds-and-minimum-constraints) | $q_{h,b,k}$ fixed at $[0, 0]$ on every cell; no FPHA rows and no generation column | Within its bounds | $u_{h,k}$ fixed at $[0, 0]$ | On the plant's own row (§4) | The same rows are present; a positive minimum turbined flow or minimum generation falls wholly on its slack, and spillage can meet a positive minimum outflow |
| Operating | A hydro without a filling configuration: every stage inside its commissioning window, so every stage when it declares none. A filling hydro: every stage from its entry stage on; it has no exit stage | Water balance of §4, with the evaporation row of an evaporating hydro; the hard dead-volume floor $\underline{V}_h$ for a hydro without a filling configuration, and for a filling hydro floor $0$ with the soft dead-volume floor $v_h + \sigma^{v-}_h \geq \underline{V}_h$ | Turbined flow within the Turbined Flow Bounds above; generation by the production model of §6 | Within its bounds | Within the Diversion Flow Bounds above for a hydro without a filling configuration; fixed at $[0, 0]$ for a filling hydro | On the plant's own row (§4) | The same rows are present; the minimum turbined flow is met by the cell's turbined flow, the minimum generation by its generation, and the minimum outflow by turbined flow plus spillage, with the slack covering any shortfall at its penalty (§9) |

Outside its commissioning window a thermal's generation, a line's flow in each direction, a non-controllable source's generation, a pumping station's pumped flow and a contract's power are fixed at $[0, 0]$ in every block; an anticipated thermal's commitment is gated by its delivery stage in addition, and is opened only when the plant is in service at that delivery stage, whatever its status at the decision stage ([State Augmentation §5](/math/state-augmentation#5-anticipated-thermal-commitments)).

## 9. Constraint Violation Penalty Terms

The per-block constraint violation penalties in the objective (referenced from §2) are:

$$
\sum_{k \in \mathcal{K}} \tau_k \sum_{h \in \mathcal{H}} \Big[
  c^{tv-}_h \sum_{b \in \mathcal{B}_h} \sigma^{q-}_{h,b,k} + c^{ov-}_h \sigma^{o-}_{h,k} + c^{ov+}_h \sigma^{o+}_{h,k} + c^{gv-}_h \sum_{b \in \mathcal{B}_h} \sigma^{g-}_{h,b,k}
\Big]
$$

The turbined- and generation-minimum slacks are **per cell** — each of a split plant's cells carries its own slack column and its own row, priced at the plant's penalty at full magnitude, never divided across cells. The outflow slacks stay per plant: outflow has no per-cell column to attribute a floor to. The evaporation slacks are per plant too, stage-level on a parallel stage and per block on a chronological stage ([Evaporation Row](#evaporation-row)).

$$
+ \sum_{h \in \mathcal{H}} H_t \cdot \bigl(c^{wv-}_h \sigma^{w-}_h + c^{wv+}_h \sigma^{w+}_h\bigr)
$$

$$
+ \sum_{h \in \mathcal{H}} H_t \cdot \bigl(c^{ev+}_h \sigma^{e+}_h + c^{ev-}_h \sigma^{e-}_h\bigr) \;\; \text{(parallel stage)}, \qquad + \sum_{k \in \mathcal{K}} \tau_k \sum_{h \in \mathcal{H}} \bigl(c^{ev+}_h \sigma^{e+}_{h,k} + c^{ev-}_h \sigma^{e-}_{h,k}\bigr) \;\; \text{(chronological stage)}
$$

where $H_t = \sum_k \tau_k$ is the total stage duration in hours, and the evaporation sums run over the hydros that model evaporation. Withdrawal violation slacks ($\sigma^{w-}_h$, $\sigma^{w+}_h$) are stage-level (not per-block) and bidirectional: $\sigma^{w-}_h$ penalizes under-delivery (the realized withdrawal $R_h = r_h - \sigma^{w-}_h + \sigma^{w+}_h$ falls short of the target), and $\sigma^{w+}_h$ penalizes over-delivery. The **withdrawal target $r_h$ is signed** (§4), and the slack bounds ensure the realized withdrawal cannot flip sign relative to the target:

- $r_h > 0$ (scheduled removal): $\sigma^{w-}_h \leq r_h$ (under-delivery slack capped at the target magnitude; floors $R_h \geq 0$), $\sigma^{w+}_h$ unbounded.
- $r_h < 0$ (scheduled inter-basin return/addition): $\sigma^{w+}_h \leq |r_h|$ (over-delivery slack capped at $|r_h|$; caps $R_h \leq 0$), $\sigma^{w-}_h$ unbounded.
- $r_h = 0$: both slacks are pinned to zero.

This cap guards a degenerate case: an unbounded under-delivery slack would let a run-of-river plant "un-withdraw" past its target and inject phantom water into the reservoir.

## 10. Generic Constraints

User-defined linear constraints (per constraint $g \in \mathcal{G}$) take a two-sided interval form:

$$
\underline{b}_g \;\leq\; \sum_{e} \gamma_{g,e} \cdot x_e \;\leq\; \bar{b}_g
$$

where $x_e$ is a quantity of the stage LP that the generic-constraint variable catalog exposes — a column such as storage, a flow, a generation or a deficit, or a fixed combination of columns such as the inflow of a hydro (below).

A term on the turbined flow or the generation of a plant split across buses may address one (hydro, bus) cell or all of the plant's cells at once (§3).

A term may also address a plant's **useful volume** $v_h - V^{min}_h$ — its storage above the physical minimum $V^{min}_h$. It is realised on the storage variable itself by shifting both endpoints by the same amount,

$$
\underline{b}_g \le \gamma_{g,e}\,(v_h - V^{min}_h) + \dots \le \bar{b}_g
\iff
\underline{b}_g + \gamma_{g,e}V^{min}_h \le \gamma_{g,e}\,v_h + \dots \le \bar{b}_g + \gamma_{g,e}V^{min}_h,
$$

so it adds no LP variable; an absent endpoint stays absent, and a negative $\gamma_{g,e}$ lowers both endpoints.

Either endpoint, $\underline{b}_g$ or $\bar{b}_g$, may be absent — never both — with an absent side read as the corresponding infinity. This single interval subsumes every shape a constraint can take: a present $\underline{b}_g$ alone is a floor, a present $\bar{b}_g$ alone is a cap, $\underline{b}_g = \bar{b}_g$ is an equality, and both present together bound a two-sided band. A constraint's shape — floor, cap, equality or band — follows from which endpoints are present and, when both are, whether they coincide.

### Coefficients and Endpoints

The coefficients $\gamma_{g,e}$ may be either literal numeric values or **named scalar parameters**, exactly as for any other coefficient in the LP.

Each endpoint composes independently from up to two pieces, summed together: a numeric base that may itself vary by stage (and, for the finest-grained parameter kind below, by block within the stage), plus an optional affine remainder layered on top of it — a constant plus a weighted sum of named scalar parameters. An endpoint carrying neither piece is simply absent; a base alone, a remainder alone, or their sum are all valid, so a single endpoint can combine a scheduled floor or cap that already varies by stage with a further parameter-driven adjustment on top.

A named scalar parameter takes one of five kinds: one value for every stage; one per stage; one per season; a quantity computed from a plant's geometry and energy conversion, §5 of [Hydro Production Function Models](/math/hydro-production-models#5-energy-conversion-quantities); or one per stage and block.

Resolution happens once at LP-build time, so the LP coefficients and endpoints are still numeric at solve time — the parameter mechanism does not introduce LP-variable coupling between constraints. Methodology relevance: it lets the corpus express ramping limits, capacity caps, and operator-imposed quotas that vary by stage, season, or block without authoring a separate constraint per stage. Coefficient and endpoint values can therefore be **stage- and block-varying constants**, not just literal numbers.

### Two-Sided Slack

A constraint may optionally carry a slack, penalized per unit of violation, so the row relaxes at a cost instead of forcing infeasibility. A one-sided row — only $\underline{b}_g$ or only $\bar{b}_g$ present — carries a single slack column relaxing that one endpoint. A two-sided row — both $\underline{b}_g$ and $\bar{b}_g$ present — carries **two** independent slack columns, $\sigma^{gc+}_g$ relaxing the floor upward and $\sigma^{gc-}_g$ relaxing the cap downward: a single column cannot represent both "how far below the floor" and "how far above the cap" without conflating the two directions.

The reported violation is the **signed net** $\sigma^{gc+}_g - \sigma^{gc-}_g$: positive when the row sits below its floor, negative when it sits above its cap, matching the sign of the underlying deviation rather than reading as an unsigned magnitude. The objective charges both columns, $\sigma^{gc+}_g + \sigma^{gc-}_g$, which coincides with the net's magnitude whenever only one direction is active — the case at any optimum, since paying for both directions on the same row at once is strictly dominated by paying for neither of the excess.

**Row materialization**: a constraint bound declared for every block of the stage over a **block-independent** expression — one whose every term references a stock variable (incoming storage $v^{in}_h$, outgoing storage $v_h$, evaporation (the stage-level $e_h$ on a parallel stage, a named block's $e_{h,k}$ on a chronological stage), or an anticipated-thermal commitment) — is materialized as a **single stage-level row** priced by the total stage hours $H_t$, since per-block rows would be identical, **provided its coefficients and endpoints are block-independent too**: a coefficient or an endpoint drawn from the per-(stage, block) parameter kind above varies within the stage, which forces the per-block row set even when the expression alone would otherwise qualify for the collapse. A bound declared for every block on a block-level expression, or a bound declared for one block, still produces one row per relevant block. This is an LP row-count optimization that is cost- and parity-neutral.

See [Generic Constraints](/reference/generic-constraints) for the authoring grammar, the activation grid, and the per-file field tables this formulation implements.

### Hydro Inflow

A hydro-inflow term reads the inflow $I_{h,k}$ of hydro $h$ in block $k$, a rate in m³/s built from LP columns:

$$
I_{h,k} = z_h + \sum_{h':\,\text{div}=h} u_{h',k} + \sum_{h' \in \mathcal{U}_h} o^{arr}_{h' \to h,k} + \frac{\phi_{h,k}}{\zeta_k} \, b^{\mathrm{in}}_{h,1} + \sum_{h' \in \mathcal{U}^{pre}_h(t)} \Big( z_{h'} + \sum_{h'':\,\text{div}=h'} u_{h'',k} + \sum_{h'' \in \mathcal{U}_{h'}} o_{h'',k} + \frac{\phi_{h',k}}{\zeta_k} \, b^{\mathrm{in}}_{h',1} \Big)
$$

Each upstream release is credited to block $k$ by the travel time of its arc:

$$
o^{arr}_{h' \to h,k} = \begin{cases} o_{h',k} & \text{arc without a travel time} \\ \nu_{h',t,0} \, o_{h',k} & \text{travel-time arc, parallel stage} \\ \sum_{k' \le k} \nu^{k' \to k}_{h',t} \, \dfrac{\zeta_{k'}}{\zeta_k} \, o_{h',k'} & \text{travel-time arc, chronological stage} \end{cases}
$$

- $o_{h',k} = q_{h',k} + s_{h',k}$ = turbined plus spilled outflow of $h'$ (§7), credited with the same-stage share $\nu_{h',t,0}$ or the within-stage shares $\nu^{k' \to k}_{h',t}$ of §4
- $\phi_{h,k}$ = arrival density of [State Augmentation §6](/math/state-augmentation#6-water-travel-time) on a chronological stage and $\tau_k / H_t$ on a parallel stage: the share of the maturing in-transit volume $b^{\mathrm{in}}_{h,1}$ that arrives in block $k$, which the division by $\zeta_k$ turns into a rate; the maturing term is absent when no travel-time arc enters $h$
- $\mathcal{U}^{pre}_h(t)$ = PreFilling plants at stage $t$ whose first non-PreFilling downstream plant is $h$ (see [PreFilling Pass-Through](#prefilling-pass-through)); the local inflow of each, the flows diverted into it and the releases of its upstream plants enter whole, with no travel-time share, and its maturing in-transit volume enters as the rate $\frac{\phi_{h',k}}{\zeta_k} b^{\mathrm{in}}_{h',1}$, by its own arrival density

The term excludes pumping, the inflow non-negativity slack, the plant's own outflows, evaporation and withdrawal.

For a hydro that is not PreFilling at stage $t$, the term mirrors the inflow terms of its water balance (§4) listed below. On a chronological stage $\zeta_k I_{h,k}$ equals the inflow terms of block $k$'s water-balance row: the local inflow, the flows diverted in, the credited releases, the maturing transit volume and the PreFilling pass-through. On a parallel stage $\sum_{k} \zeta_k I_{h,k}$ equals the same terms of the stage row, and only the duration-weighted stage total matches the balance; the split across blocks is a convention.

For a PreFilling hydro the term reads the same columns, with $\mathcal{U}^{pre}_h(t)$ empty, and they match no row of $h$, whose row is the frozen identity ([PreFilling Pass-Through](#prefilling-pass-through)): its local inflow, the flows diverted into it, the releases of its upstream plants and its maturing transit volume enter the row of the first non-PreFilling plant downstream, or leave the system when there is none ([Delayed-arrival water-balance entry](/math/state-augmentation#delayed-arrival-water-balance-entry)).

$I_{h,k}$ reads per-block columns, so a bound without a block expands to one row per block (see row materialization in [§10](#10-generic-constraints)).

## 11. Benders Cuts

For each cut $i$ in the stage LP, that is each active cut or, under Dynamic Cut Selection, each cut resident in the solve ([Cut Management §8](/math/cut-management#8-dynamic-cut-selection)):

$$
\theta \geq \beta_{0,i} + \sum_{h \in \mathcal{H}} \beta^v_{i,h} \cdot v_h + \sum_{h \in \mathcal{H}} \Big( \beta^{lag}_{i,h,1} \cdot z_h + \sum_{\ell=2}^{P^{\max}} \beta^{lag}_{i,h,\ell} \cdot a_{h,\ell-1} \Big)
$$

where:

- $\beta_{0,i}$ = cut intercept (RHS)
- $\beta^v_{i,h}$ = coefficient for storage state variable, present when the cut keeps the storage dimensions
- $\beta^{lag}_{i,h,\ell}$ = coefficient for the inflow lag $\ell$ of the next stage's incoming state, multiplied by the realized inflow $z_h$ for $\ell = 1$ and by the incoming lag $a_{h,\ell-1}$ for $\ell \ge 2$; present when the cut keeps the inflow-lag dimensions

When anticipated thermals are present, the cut carries one coefficient per commitment-ring slot ([State Augmentation §5](/math/state-augmentation#5-anticipated-thermal-commitments)), read from the same reduced-cost mechanism; when travel-time arcs are present, it likewise carries one coefficient per in-transit bucket dimension ([State Augmentation §6](/math/state-augmentation#6-water-travel-time)). Unlike the storage and lag coefficients, the ring-slot and bucket coefficients are always part of the cut projection ([State Augmentation §7](/math/state-augmentation#7-cut-state-projection)).

The future-cost variable $\theta$ has lower bound $0$ at every stage, which presumes $V_{t+1} \ge 0$. Stage objectives can be negative: export contracts earn revenue (§2), and the curtailment term of §2 is a reward: it is never positive, and it is constant for a must-run source. Where $V_{t+1}$ is negative the bound lies above it, so the cut approximation need not lie below $V_{t+1}$ and the lower bound is not guaranteed. At the last stage of the finite horizon, with no terminal boundary loaded, $\theta$ is $0$ ($V_{T+1} = 0$); with a [terminal boundary](/math/post-study-boundary#1-the-right-boundary) loaded, $\theta$ keeps the floor and the imported cuts bound it from below, so the terminal function is the larger of $0$ and the imported cuts.

Cuts live in an **append-only pool** at stable slot indices: every cut ever generated is retained for the lifetime of the run, and only the active subset is baked into each iteration's stage template. Deactivation **excludes** a cut from each iteration's stage-template rebake rather than mutating any row; the persistent lower-bound LP is append-only (its rows are never removed, so the lower bound stays monotone). Slot indices stay stable, so reactivation — re-baking the cut into the template at the same slot — is exact. Dynamic Cut Selection deactivates no cut itself: each solve loads a resident subset of the active cuts and grows it with the omitted candidate cuts its solution violates. A per-stage cap on the number of active cuts, when set, deactivates cuts once it is exceeded, under every selection method.

For cut coefficient derivation, aggregation, and selection strategies, see [Cut Management](/math/cut-management).

## Cross-References

- [Notation Conventions](/overview/notation-conventions) — index sets, parameters, decision variable naming
- [System Element Modeling Overview](/math/system-elements) — physical meaning of each element, decision variables, Variable Units Convention
- [Penalty System](/math/penalty-system) — three-category taxonomy, penalty names, priority ordering, cascade resolution
- [SDDP Algorithm](/math/sddp-algorithm) — iterative structure that solves this LP at each stage
- [State Augmentation](/math/state-augmentation) — the state vector, its pinning by column bounds, the outgoing state and the cut row, and the inflow-lag, commitment-ring and in-transit state families
- [LP Layout and Scaling](/math/lp-layout-and-scaling) — the column and row layout of this LP, its cost scaling and prescaling, and the unscaling of its duals and reduced costs
- [PAR(p) Inflow Model](/math/par-inflow-model) — complete AR inflow model specification
- [Hydro Production Function Models](/math/hydro-production-models) — constant, linearized head, and FPHA model details
- [Cut Management](/math/cut-management) — dual extraction, cut coefficients, aggregation, and selection
- [Equipment-Specific Formulations](/math/equipment-formulations) — per-equipment constraint derivations, pumping details
