---
title: Inflow Non-Negativity Solution Methods
description: Four methods for handling negative PAR(p) inflow realizations — none, penalty, truncation, and truncation_with_penalty — with their LP formulations, the water each adds to the water balance, and their effect on the lower bound.
---

## Purpose

This chapter defines the four methods available for handling negative inflow realizations produced by the PAR(p) model: their LP formulations, their objective function terms, their effect on the validity of the lower bound, and their trade-offs.

## 1. Problem Statement

The PAR(p) model's inflow equation — using the AR coefficient [$\psi_{m,\ell}$](/overview/notation-conventions#35-inflow-model-parameters) — can produce a negative realization:

$$
a_h = \underbrace{b_{h,m}}_{\text{deterministic base}} + \underbrace{\sum_{\ell=1}^{p} \psi_{m,\ell} \cdot \hat{a}_{h,\ell}}_{\text{lag contribution}} + \underbrace{\sigma_m \cdot \varepsilon}_{\text{noise term}}
$$

When the [innovation](/overview/notation-conventions#35-inflow-model-parameters) $\varepsilon$ is negative enough, $\sigma_m \varepsilon < -\big(b_{h,m} + \sum_{\ell} \psi_{m,\ell}\, \hat{a}_{h,\ell}\big)$, the total is negative; at $\sigma_m = 0$ it is negative whenever its deterministic part is. That is not itself a physical impossibility: $a_h$ is _incremental_ inflow — a plant's natural flow minus its upstream plants' — so a genuinely negative value is real hydrology (a reach that loses water over the period), and the same $a_h < 0$ case arises whether the realization comes from PAR(p) noise or from replaying a negative window of historical or observed data directly (see [PAR(p) Inflow Model](/math/par-inflow-model)). What the methods below solve is the LP's water-balance consequence of $a_h < 0$: absorbing it without the other water-balance variables (storage, release, spillage — all bounded $\geq 0$) being driven infeasible.

No method alters the realization itself. Under every method $a_h$ stays on the realized-inflow row ([LP Formulation §5](/math/lp-formulation#5-realized-inflow-definition-rows)) and the inflow lags of later stages are built from it, aggregated over the lag's period when that period spans several stages ([Multi-Resolution Studies §2](/math/multi-resolution-studies#2-lag-accumulation)), so the inflow process is the one the PAR(p) model defines, negative values included. The methods differ in the water they add to the water balance beside $a_h$. The two truncation methods bound that water by the **truncation amount**, the negative part of the realization:

$$
a^-_h = \max(0, -a_h)
$$

the water that lifts the realization to zero, $a_h + a^-_h = \max(a_h, 0)$. It is evaluated at every solve from that solve's noise and the incoming lags $\hat{a}_{h,\ell}$ pinned for it, so it depends on the trial state; at $\sigma_m = 0$ it is the negative part of the deterministic value $b_{h,m} + \sum_{\ell} \psi_{m,\ell}\, \hat{a}_{h,\ell}$.

Below, PAR(p > 0) denotes a PAR model with lag terms (an order above zero or an annual component). The annual component ([PAR(p) Inflow Model §7](/math/par-inflow-model#7-annual-component-extension-parp-a)) regresses on the mean of the twelve previous inflows, so it puts a coefficient on each of those lags whatever the order.

## 2. The Inflow Non-Negativity Slack

Every method except `none` adds one slack column $\sigma^{inf}_h \geq 0$ per hydro, in m³/s. It enters the hydro's water balance beside the realized inflow $z_h = a_h$, with the coefficients of $z_h$, every term on the left-hand side ([LP Formulation §4](/math/lp-formulation#4-hydro-water-balance)):

$$
-\zeta \,\big( z_h + \sigma^{inf}_h \big) \;\; \text{(parallel stage)}, \qquad -\zeta_k \,\big( z_h + \sigma^{inf}_h \big) \;\; \text{(block } k \text{ of a chronological stage)}
$$

so the slack adds $\zeta\,\sigma^{inf}_h$ hm³ of water over the stage, $\zeta_k\,\sigma^{inf}_h$ in block $k$, and the water reaching the balance is $a_h + \sigma^{inf}_h$. The realized-inflow row is unchanged. For a PreFilling hydro the slack follows its local inflow onto the rows of the first non-PreFilling plant downstream ([LP Formulation — PreFilling Pass-Through](/math/lp-formulation#prefilling-pass-through)), so the water it adds reaches that plant's balance; with no such plant it enters no row, and it never enters the hydro's own frozen identity row.

The method sets the slack's bounds and its price:

| Method                    | Bounds of $\sigma^{inf}_h$ | Cost per (m³/s)·h |
| ------------------------- | -------------------------- | ----------------- |
| `none`                    | no slack                   | —                 |
| `penalty`                 | $[0, +\infty)$             | $c^{inf}_h$       |
| `truncation`              | $[a^-_h, a^-_h]$           | $0$               |
| `truncation_with_penalty` | $[0, a^-_h]$               | $c^{inf}_h$       |

Under the two truncation methods the bounds are set at every solve of the stage problem, in training and simulation alike, from that solve's realization, which depends on its pinned incoming lags and its noise, so they differ across trial points, openings and scenarios (§7).

Under `penalty` and `truncation_with_penalty` the slack is a **Category 1 recourse slack** ([Penalty System — Category 1](/math/penalty-system#category-1-recourse-slacks-lp-feasibility)): the water it adds keeps the balance feasible when a negative inflow realization would leave it without a solution. Its cost is ordered with the constraint-violation penalties: converted to an energy-equivalent cost in \$/MWh, it lies above the thermal and contract costs and below deficit ([Penalty System — Penalty Priority Ordering](/math/penalty-system#penalty-priority-ordering)). Since inflow $a_h$ is defined per stage (not per block), the penalty appears **outside** the block summation in the objective, alongside storage violation penalties:

$$
+ \sum_{h \in \mathcal{H}} c^{inf}_h \cdot \sigma^{inf}_h \cdot H_t
$$

where $H_t = \sum_k \tau_k$ is the total stage duration in hours. The product $\sigma^{inf}_h \cdot H_t$ is the volume of water the slack adds, in (m³/s)·h, so $c^{inf}_h$ is a cost per (m³/s)·h of added water. Under `truncation` the slack is a fixed correction rather than a decision: the LP cannot choose its value, and it carries no cost.

## 3. Method: `none`

**LP Formulation**: the realized-inflow row alone, with no slack:

$$
a_h = b_{h,m} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot \hat{a}_{h,\ell} + \sigma_m \cdot \varepsilon
$$

**Implications**:

- LP may become **infeasible** when $a_h < 0$ causes water balance violation
- Useful only for debugging or when the AR model guarantees positive outputs

## 4. Method: `penalty`

**Additional Variables**:

| Variable         | Domain   | Units | Description                 |
| ---------------- | -------- | ----- | --------------------------- |
| $\sigma^{inf}_h$ | $\geq 0$ | m³/s  | Inflow non-negativity slack |

**Water-balance term and objective**: those of §2, with $\sigma^{inf}_h$ unbounded above and priced at $c^{inf}_h H_t$.

**Interpretation**: the water reaching the reservoir is $a_h + \sigma^{inf}_h$. The LP uses the slack whenever the water balance cannot be met otherwise, or whenever the added water is worth more than its cost; nothing ties it to the sign of the realization, so the cost caps the value of water at the plant ([LP Formulation §2](/math/lp-formulation#2-objective-function)).

**Advantages**:

- LP always feasible
- Clear cost signal for negative inflow events
- Slack bounds that do not depend on the incoming state, so the method leaves the lower bound's validity untouched (§7)

**Disadvantages**:

- Adds one slack column per hydro
- A priced source of water at every realization, a non-negative one included, which caps the marginal water value

## 5. Method: `truncation`

**LP Formulation**: the realized-inflow row keeps the raw realization $a_h$, and the slack of §2 is fixed at the truncation amount, at no cost:

$$
\sigma^{inf}_h = a^-_h = \max(0, -a_h)
$$

so the water reaching the reservoir is $a_h + a^-_h = \max(a_h, 0)$: a negative realization enters the water balance as zero, and a non-negative one enters unchanged, its truncation amount being zero. The inflow lags of later stages are built from $a_h$, not from the truncated value.

**Advantages**:

- A negative realization cannot by itself leave the water balance without a solution: the balance receives $\max(a_h, 0)$, as it would a zero inflow
- No penalty to calibrate: the lift costs nothing
- The inflow process stays the PAR(p) process, since the lags carry the raw realization
- Defined for any residual standard deviation, $\sigma_m = 0$ included (§1)

**Disadvantages**:

- **Biases the water balance upward**: the water entering it, $\max(a_h, 0)$, has a higher mean than $a_h$, and the added water appears in no cost
- **Lower bound not guaranteed under PAR(p > 0)**: the truncation amount depends on the incoming lags (§7)

## 6. Method: `truncation_with_penalty`

**LP Formulation**: the realized-inflow row keeps the raw realization $a_h$, and the slack of §2 lies between zero and the truncation amount, priced as under `penalty`:

$$
0 \le \sigma^{inf}_h \le a^-_h
$$

**Objective Function Addition** (outside block summation):

$$
+ \sum_{h \in \mathcal{H}} c^{inf}_h \cdot \sigma^{inf}_h \cdot H_t
$$

The water reaching the reservoir lies between $a_h$ and $\max(a_h, 0)$. A non-negative realization has a truncation amount of zero, which fixes the slack at zero, so the method adds no water to it.

### 6.1 Relation to the other methods

The method combines the two preceding mechanisms on one column:

- **From `truncation`, the cap.** The slack lifts a realization no further than zero, so it never supplies water beyond the shortfall, and none at all when the realization is non-negative. Under `penalty` the same column is an unbounded priced source at every realization.
- **From `penalty`, the price.** The LP lifts the realization only as far as the added water is worth its cost; the storage and outflows of the water balance meet the rest of the shortfall. Under `truncation` the whole shortfall is lifted, at no cost.

It shares the dependence of the cap on the incoming lags with `truncation` (§7).

### 6.2 Relation to Larroyd et al. (2022)

[Larroyd et al. (2022)](/reference/bibliography/#inflow-modelling) state the strategies on a PAR state $x$ whose realization is decomposed into the incremental inflows of the plants it covers, $y_h = c_h x + d_h$. Under every strategy the PAR state keeps the raw realization, and the correction $l$ is added to the water the balance receives, never to $x$: as a slack in the water balance under the penalty strategy, and through the decomposition, $y_h - c_h (x + l) = d_h$, under the truncation strategies. The paper recommends one model per reservoir ($c_h = 1$). For the per-hydro PAR(p) model of this chapter, fit on the incremental inflow itself ($c_h = 1$, $d_h = 0$), $x$ is the realization $a_h$, $l$ is $\sigma^{inf}_h$, and the water reaching the balance is $a_h + \sigma^{inf}_h$:

| Strategy of the paper                                                        | Method of this chapter    |
| ---------------------------------------------------------------------------- | ------------------------- |
| Penalty (§2.2): $l \geq 0$, priced                                           | `penalty`                 |
| Truncation (§2.3): $l = \max(-x^*, 0)$, unpriced                             | `truncation`              |
| Truncation combined with penalty (§2.4): $0 \le l \le \max(-x^*, 0)$, priced | `truncation_with_penalty` |

where $x^*$ is the realization at the solve's incoming lags, so $\max(-x^*, 0)$ is the truncation amount $a^-_h$. The inflow lags of later stages are built from the raw realization under every strategy. The paper's optimal-value strategy (§2.1) solves a separate water-allocation problem for the slack when the stage problem has no solution; its cost function is non-convex, so the paper applies it in the forward pass only, and it has no counterpart among these methods.

## 7. Truncation and the Lower Bound

Under a PAR(p > 0) model the realization $a_h$ is affine in the incoming lags $\hat{a}_{h,\ell}$ (§1), so the truncation amount $a^-_h$, and with it the bounds of $\sigma^{inf}_h$ under both truncation methods, is a piecewise-linear function of the incoming state. A stage solve fixes those bounds at the value of its own trial point. The cut the solve yields ([Cut Management](/math/cut-management)) is tight at the trial point and lies below the stage problem with the bounds held at that point's truncation amount, but it carries no term for the change of $a^-_h$ with the lags: its coefficients are the reduced costs of the pinned incoming-state columns, and the slack bounds are constants of the solved LP. At an incoming state with a different truncation amount the cut can lie above the true successor value:

- **Where the truncation is deeper**, under both methods: the held bounds admit less water than that state's own.
- **Where the truncation is shallower**, under `truncation` only: its fixed slack forces more water than that state's own, which raises the cost when the extra water cannot leave the reservoir at no cost, against a spillage cost or a spillage bound for example. Under `truncation_with_penalty` the bounds held at the trial point contain that state's own $[0, a^-_h]$, a relaxation of its stage problem, so the cut stays below there.

The truncation methods therefore break the hypotheses of [Cut Management — Tier 1](/math/cut-management#tier-1-valid-lower-bound) in the inflow-lag components: the lower bound $\underline{z}^k$ is not guaranteed to stay below the optimal value, and it can exceed an upper bound evaluated on the stage problems ([Larroyd et al., 2022](/reference/bibliography/#inflow-modelling), §2.5, which finds the stage problems' values below the master problems built from the cuts and estimates both bounds on those master problems instead). The gap stopping rule, admissible only under an enumerated forward pass, compares the gap clamped at zero ([Stopping Rules §5](/math/stopping-rules#5-gap-based-stopping-recommended)), so it can stop with no optimality certificate. Each cut stays below the stage problem with the bounds held at its own trial point.

The bounds depend on the incoming state only through its inflow lags, and at a stage only through the lag coefficients $\psi_{m(t),\ell}$ of that stage's season. When all of them are zero, at a season of order zero without an annual component, the truncation amount at that stage depends on the noise alone. The bounds of `penalty` do not depend on the state.

## 8. Comparison Summary

| Method                    | LP Size             | Water added to the balance     | Cost of the added water | Feasibility | Lower bound under PAR(p > 0) |
| ------------------------- | ------------------- | ------------------------------ | ----------------------- | ----------- | ---------------------------- |
| `none`                    | Base                | None                           | —                       | May fail    | Unaffected                   |
| `penalty`                 | +1 column per hydro | Any amount, at any realization | $c^{inf}_h$             | Guaranteed  | Unaffected                   |
| `truncation`              | +1 column per hydro | Exactly $a^-_h$                | None                    | Guaranteed  | Not guaranteed (§7)          |
| `truncation_with_penalty` | +1 column per hydro | Up to $a^-_h$                  | $c^{inf}_h$             | Guaranteed  | Not guaranteed (§7)          |

Every method keeps the raw realization in the lag state (§1).

## 9. Reference

- [Larroyd et al. (2022)](/reference/bibliography/#inflow-modelling)

## Cross-References

- [LP Formulation](/math/lp-formulation) — Objective function structure and penalty taxonomy, where $c^{inf}_h$ prices a Category 1 recourse slack
- [PAR(p) Inflow Model](/math/par-inflow-model) — Defines the PAR(p) model that produces the inflow realizations handled here
- [Penalty System](/math/penalty-system) — Penalty hierarchy and cascade resolution
- [Scenario Generation](/math/scenario-generation) — Where the noise term $\varepsilon$ in the inflow equation comes from: the fixed opening tree (pre-generated noise vectors) the backward pass solves, and the forward sampling schemes
- [Cut Management](/math/cut-management) — The Tier 1 hypotheses the truncation methods break in the inflow-lag components
- [Stopping Rules](/math/stopping-rules) — The gap rule whose clamped comparison a lower bound above the upper bound defeats
- [Configuring inflow non-negativity](/running/configuration#modelinginflow_non_negativity) — the software-layer setting that selects which of these four methods a study uses and where the penalty cost $c^{inf}_h$ is authored
