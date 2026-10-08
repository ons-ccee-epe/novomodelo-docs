---
title: Upper Bound Evaluation
description: The statistical Monte-Carlo and exact deterministic upper-bound mechanisms, gap computation normalized on the lower bound, the sampled and census simulation estimators, and the reserved SIDP vertex-based inner approximation.
---

## Purpose

This chapter defines Novomodelo's upper-bound mechanisms: an overview of the bounds of a training iteration (section 1), the exact deterministic upper bound of an enumerated forward pass and its nested form under a uniform CVaR (section 2), the gap computation that compares the iteration's upper bound against the lower bound from cuts (section 3), and the estimators of the sampled forward schemes and of the post-training sampled and census simulation, with what each estimates (section 4). The appendix describes the reserved vertex-based inner approximation (SIDP) design. It complements the outer approximation (cuts) described in [SDDP Algorithm](/math/sddp-algorithm) by providing the convergence-certificate half of the bound pair.

For notation conventions (index sets, parameters, decision variables, dual variables), see [Notation Conventions](/overview/notation-conventions).

:::note[Symbol convention]
This chapter uses $d$ for the discount factor. See [Discount Rate Formulation](/math/discount-rate).
:::

## 1 Overview

Standard SDDP produces only a **lower bound** $\underline{z}$ on the optimal cost, through the outer (cut) approximation. A convergence certificate additionally requires an **upper bound** $\bar{z}$ that closes the [optimality gap](/math/stopping-rules#optimality-gap) between the two bounds.

Novomodelo computes this per-iteration upper bound via one of two forward-pass mechanisms, selected by the forward pass's sampling mode:

- **Statistical Monte-Carlo upper bound.** Under a sampled forward pass, the sample mean of the scenario costs gathered that iteration, together with a 95% confidence-interval half-width, estimates the expected cost under the policy. This is a **statistical** estimate: it carries genuine sampling error that narrows only as more scenarios are drawn. Section 4 states what it estimates under each forward scheme.
- **Exact deterministic upper bound.** Under an enumerated forward pass, the probability-weighted expectation over every enumerated leaf path is the _exact_ expected cost under the policy, with no sampling error at all. See section 2.

Section 3 computes the gap between that upper bound and the lower bound from the cuts at every iteration.

:::note[Risk-averse objectives]
The **statistical** Monte-Carlo estimator is defined for the **expectation** objective only: its confidence interval assumes an unbiased sample mean of the risk-neutral expected cost, and it is not a valid upper bound on a risk-averse measure. The **exact** enumerated bound extends to a risk-averse measure when that measure is a CVaR applied **uniformly at every stage**: because the enumeration visits every node, the bound is then evaluated as a nested, time-consistent risk recursion over the scenario tree (section 2.1) rather than a probability-weighted leaf sum, and it stays exact. For a **stage-varying** measure, see section 2 and [Risk Measures](/math/risk-measures). The reserved inner approximation of the appendix is designed for the expectation objective under any forward sampling mode: its vertex values are expectations over the scenarios.
:::

After training, the post-training **simulation** reruns the trained policy on scenarios drawn under each class's simulation scheme, in a **sampled** and a **census** variant (section 4.5). That estimator is a diagnostic on the finished policy — it is not part of the per-iteration training loop the mechanisms above feed, and it is not consumed by any stopping rule.

The appendix describes a reserved design that Novomodelo does not compute, a vertex-based inner approximation of the cost-to-go function (SIDP).

## 2 Exact Deterministic Upper Bound

Under an **enumerated** forward pass — one that [visits every node of the policy graph deterministically](/math/policy-graphs) rather than sampling it — the forward pass evaluates every leaf path $\ell$ of the scenario tree exactly once. Let $P(\ell)$ be that leaf path's probability and

$$
C(\ell) = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t(\ell)
$$

its realized total discounted cost (see [Discount Rate Formulation](/math/discount-rate)). The exact upper bound is the probability-weighted expectation over the full enumeration:

$$
\bar{z}_{\text{exact}} = \sum_{\ell} P(\ell)\, C(\ell)
$$

Because the enumeration is exhaustive rather than sampled, $\bar{z}_{\text{exact}}$ is the exact expectation of total cost under the current policy — not an estimate of it. Its standard deviation and 95% confidence-interval half-width are consequently **identically zero**: a deduplicated enumeration carries no sampling distribution to estimate a spread over.

With an imported terminal boundary ([Post-Study Boundary & Chained Studies](/math/post-study-boundary)), the last stage's cost $c_T(\ell)$ keeps the discounted boundary value of that stage's outgoing state, so the upper bound contains the same terminal function as the lower bound.

The bound $\bar{z}_{\text{exact}} = \sum_{\ell} P(\ell)\, C(\ell)$ above is the exact upper bound under an **expectation** objective. Under a CVaR measure held uniform across every stage, the same exhaustive enumeration yields an exact bound of a different shape — a nested risk recursion — developed in section 2.1; see [Risk Measures](/math/risk-measures) for the risk-measure background.

Under a **stage-varying** measure — one whose risk-aversion weight or tail fraction differs across stages, a stage with zero risk-aversion weight counting as the expectation — Novomodelo computes no bound on the risk-averse objective: the enumerated pass reports the probability-weighted path sum $\sum_{\ell} P(\ell)\, C(\ell)$ above, the policy's expected cost, and a gap rule is not supported (it is rejected at setup).

Contrast with the statistical mechanism (section 1): a sampled forward pass computes the same weighted-sum _form_ — sample weight $1/M$ per scenario — but that sum is a Monte Carlo estimator of the expectation, carrying genuine sampling error. Only the enumerated forward pass's weights (the true leaf-path probabilities) make the sum exact rather than an estimate.

This is the **training-phase**, per-iteration mechanism: it is evaluated once per training iteration and feeds the gap computation (section 3). It is distinct from the post-training simulation's census variant (section 4.5.4), which computes the same probability-weighted-sum form under the final policy, evaluated once after training completes.

### 2.1 Nested Risk-Adjusted Exact Bound (uniform CVaR)

When every stage applies the **same** CVaR measure $\rho = (1-\lambda)\,\mathbb{E} + \lambda\,\mathrm{CVaR}_\alpha$, the probability-weighted path sum of section 2 is no longer the quantity the policy optimizes. SDDP minimizes a **nested**, time-consistent risk functional,

$$
\rho\big[\,c_1 + \rho[\,c_2 + \cdots + \rho[\,c_T\,]\,]\,\big],
$$

in which the measure is applied stage by stage, not once to whole-path totals. The exact upper bound must be evaluated in that same nested form. Over the enumerated scenario tree, let node $n$ carry immediate cost $c(n)$ at stage $\mathrm{stage}(n)$, with children $\mathrm{ch}(n)$ reached under conditional probabilities $q_{n \to n'}$. Define, from the leaves up,

$$
\tilde{V}(n) = d_{1 \to \mathrm{stage}(n)}\, c(n) \;+\; \rho_{\,n' \in \mathrm{ch}(n)}\!\big[\,\tilde{V}(n')\,\big],
\qquad
\tilde{V}(\ell) = d_{1 \to T}\, c(\ell)\ \ \text{at a leaf},
$$

where $\rho_{\,n' \in \mathrm{ch}(n)}[\cdot]$ applies the stage measure to the children's values weighted by $q_{n \to n'}$ — the same risk aggregation the [cut construction](/math/cut-management) applies in the backward pass. The exact upper bound is the value at the root:

$$
\bar{z}_{\text{exact}} = \tilde{V}(\text{root}).
$$

It is exact for the same reason the expectation form is — the recursion visits every node of the deduplicated enumeration exactly once, so it carries no sampling distribution, and its standard deviation and confidence-interval half-width are identically zero.

**Why the nested form, not the path-total form.** Applying $\rho$ once to the distribution of whole-path totals $C(\ell)$ gives the end-of-horizon value $\rho_{\text{end-of-horizon}}$ of the path totals, a different functional from the nested objective $\rho_{\text{nested}}$: it is not an upper bound on the nested objective, and it can fall below the lower bound $\underline{z}$ of the [risk-averse objective](/math/risk-measures). Fed to the [gap rule](/math/stopping-rules), it would then produce a negative gap that the rule would read as a lower/upper crossover, halting training before the policy has converged. The nested $\tilde{V}(\text{root})$ instead satisfies $\tilde{V}(\text{root}) \ge V^\star \ge \underline{z}$ at every iteration, so the gap stays non-negative and closes only at true convergence.

Under expectation — or a CVaR with $\lambda = 0$, which is expectation-equivalent — the measure is linear, the nesting telescopes, and $\tilde{V}(\text{root})$ collapses exactly to the probability-weighted path sum $\sum_{\ell} P(\ell)\, C(\ell)$ of section 2; the two forms coincide.

## 3 Gap

At each training iteration $k$, the gap compares the lower bound from the cuts with the upper bound of the active forward-pass mechanism; both refer to the study started from its initial state $x_0$, with the stages numbered by the [1-based math convention](/overview/notation-conventions#stage-indexing).

### Lower bound

The lower bound at iteration $k$ applies the first stage's risk measure to the optimal values of the first stage over its openings:

$$
\underline{z}^k = \rho_1\Big[\, Q_1^k(x_0, \omega) \;\Big|\; \omega \in \Omega_1 \Big]
$$

where $Q_1^k(x_0, \omega)$ is the optimal value of the first-stage problem at the initial state $x_0$ under opening $\omega$, its immediate cost plus the discounted future cost that the iteration-$k$ cuts bound from below, with the opening's full realization applied: inflow, load and non-controllable availability. $\Omega_1$ is the first stage's opening set, its generated openings or a single supplied realization, and its openings are weighted uniformly. $\rho_1$ is the first stage's risk measure, the expectation when risk-neutral; it aggregates the first stage's own openings as well as those of the next stage ([Risk Measures §6](/math/risk-measures#6-risk-averse-bellman-equation)). The bound is stated in original cost units, with the [cost scaling](/math/lp-layout-and-scaling#21-cost-scaling) of the stage problems undone. It does not decrease in $k$, because the problem it is evaluated on keeps every cut once added ([Cut Management §5](/math/cut-management#5-cut-growth-and-selection-motivation)), and it is a valid lower bound under the hypotheses of [Tier 1](/math/cut-management#tier-1-valid-lower-bound).

### Upper bound

The upper bound is that of whichever forward-pass mechanism is active (section 1): under a sampled forward pass, $\bar{z}^k$ is the statistical estimator's sample mean; under an enumerated forward pass, $\bar{z}^k = \bar{z}_{\text{exact}}$ (section 2).

:::note[Reserved mechanism]
Under the reserved vertex-based inner approximation ([Appendix: Inner Approximation (Reserved)](#appendix-inner-approximation-reserved)), stage 1's upper bound would instead be the first stage's risk-adjusted value over its openings at the initial state $x_0$, with the inner approximation $\bar{V}_2$ in place of the cuts. The gap is agnostic to which mechanism supplies $\bar{z}^k$.
:::

### Gap

The [optimality gap](/math/stopping-rules#optimality-gap) $\text{gap}^k$ is the distance between these two bounds, also stated in percent of the lower bound.

Under the exact mechanism the compared bound is $\bar{z}^k = \bar{z}_{\text{exact}}$. The inequality $\bar{z}^k \ge \underline{z}^k$ holds for the exact upper bound on the same tree under the same measure when [Tier 1](/math/cut-management#tier-1-valid-lower-bound) holds ([Tier 3](/math/cut-management#tier-3-gap-certificate)), while an in-sample, out-of-sample, historical or external estimate can fall below $\underline{z}^k$.

For stopping rules that use the gap, see [Stopping Rules](/math/stopping-rules), section 5.

### Convergence

As $k \to \infty$, $\text{gap}^k \to 0$ for convex problems with finitely many scenarios, provided the upper bound is exact. Under a sampled forward pass, $\bar{z}^k$ carries sampling error, so a small reported gap reflects that noise as well as genuine convergence.

## 4 Estimators by Scheme

A sampled forward pass draws each stochastic class (inflow, load and non-controllable sources) under that class's forward scheme, and the post-training simulation of section 4.5 draws under a scheme of its own for each class; [Scenario Generation §3.2](/math/scenario-generation#32-forward-sampling-schemes) defines how each scheme samples. The sample mean of the discounted path costs estimates the policy's expected cost under the law the scheme samples from, stated below per scheme. Under a risk-averse measure it estimates the expected cost, not the risk-adjusted value (section 1).

### 4.1 In-Sample

The in-sample scheme draws, at each stage, one opening of the fixed opening tree that the backward pass also uses. Its sample mean estimates the policy's expected cost under the opening-tree law, the law of the model the cuts are built on. It is a statistical estimate that certifies nothing ([Tier 3](/math/cut-management#tier-3-gap-certificate)): its sampling error lets it fall below $\underline{z}^k$. An enumerated pass over the same tree is the exact bound of section 2, not an estimate.

### 4.2 Out-of-Sample

The out-of-sample scheme draws fresh noise from the class's applied stochastic model, from a seed independent of the opening tree's. Its sample mean estimates the policy's expected cost under the noise model's law, with draws independent of the tree, rather than under the tree that discretizes that law for the backward pass. It is a statistical estimate that certifies nothing ([Tier 3](/math/cut-management#tier-3-gap-certificate)): it evaluates a law other than the opening tree's, and it can fall below $\underline{z}^k$.

### 4.3 External

The external scheme replays one scenario of a supplied scenario set over all the stages of a trajectory. Its sample mean estimates the policy's expected cost under the supplied scenarios' law, the empirical law of that set. It is a statistical estimate that certifies nothing ([Tier 3](/math/cut-management#tier-3-gap-certificate)): it evaluates a law other than the opening tree's, and it can fall below $\underline{z}^k$.

### 4.4 Historical

The historical scheme replays one window of the historical window pool over all the stages of a trajectory. Its sample mean estimates the policy's expected cost under the replayed history, the empirical law of the windows in the pool. It is a statistical estimate that certifies nothing ([Tier 3](/math/cut-management#tier-3-gap-certificate)): it evaluates a law other than the opening tree's, and it can fall below $\underline{z}^k$.

### 4.5 Simulation After Training

Novomodelo can also estimate an upper bound on expected total cost by running the trained policy on scenarios drawn independently of the training forward passes — a separate, post-training procedure distinct from the per-iteration training-phase mechanisms in sections 1–2. It supports two variants: a **sampled** estimator (Monte Carlo; sections 4.5.2–4.5.3) over an independently drawn scenario sample, and a **census** estimator (section 4.5.4) over an exhaustively enumerated population of scenarios.

#### 4.5.1 Independence from Training

The core methodological guarantee is that the noise used for the simulation forward pass is drawn independently of the noise used during training. Training forward passes sample under each class's forward scheme (see [Scenario Generation](/math/scenario-generation)) to generate the trial states at which cuts are built; any cost computed by re-running the policy on those same training scenarios would produce a **biased** estimator — the cuts were shaped to be tight at those states. The simulation avoids this by drawing its $N$ scenarios under each class's simulation scheme (§4.1–§4.4; the training scheme unless the simulation declares its own) with a seed derivation that no training iteration uses. Because cuts have no dependence on these independent draws, the resulting cost sample is an unbiased estimator of the policy's expected cost under its scheme's law.

:::note[Risk-averse caveat]
The unbiasedness guarantee applies to the expected-cost estimator under risk-neutral evaluation. For risk-averse objectives, this simulated cost distribution does not itself certify a bound on the risk measure; the exact nested bound of section 2.1 does, under a uniform CVaR. See [Risk Measures](/math/risk-measures).
:::

#### 4.5.2 Sampled Estimator (Monte Carlo)

The sampled variant executes a complete forward pass for each of the $N$ independently drawn scenarios, recording the total discounted cost $C_m$ for scenario $m$:

$$
C_m = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t^{(m)}
$$

where $c_t^{(m)}$ is the immediate cost at stage $t$ of scenario $m$, and $d_{1 \to t}$ is the cumulative discount factor from stage 1 to stage $t$ (see [Discount Rate Formulation](/math/discount-rate)).

The **sample mean** is the Monte Carlo estimator of expected total cost:

$$
\bar{C} = \frac{1}{N} \sum_{m=1}^{N} C_m
$$

This estimator is **unbiased** under independent draws: $\mathbb{E}[\bar{C}] = \mathbb{E}[C]$. The **sample standard deviation** is:

$$
\sigma_C = \sqrt{\frac{1}{N-1} \sum_{m=1}^{N} (C_m - \bar{C})^2}
$$

the Bessel-corrected estimator appropriate to a drawn sample. For the census variant's population-level counterpart, see section 4.5.4.

#### 4.5.3 Confidence Interval

Under the normal approximation, the 95% confidence interval for $\mathbb{E}[C]$ has half-width:

$$
\Delta_{95} = 1.96 \cdot \frac{\sigma_C}{\sqrt{N}}
$$

The approximation is reliable once $N$ is large enough for the central-limit-theorem regime to apply. The reported interval is $[\bar{C} - \Delta_{95},\; \bar{C} + \Delta_{95}]$.

**Trade-off**: every doubling of $N$ narrows the confidence interval by a factor of $\sqrt{2}$, but costs proportionally more LP solves — the per-check cost scales with $N$ times the horizon length. Because the half-width shrinks as $\sigma_C / \sqrt{N}$, a sufficiently large scenario count resolves the interval finely enough to distinguish a converged policy from one still improving.

This confidence interval applies to the **sampled** variant only. The census variant (section 4.5.4) reports the exact mean and population variance of an exhaustively enumerated population — there is no sampling error left to bound, so it carries no confidence interval.

#### 4.5.4 Census Estimator

When the simulation scenarios come from an exhaustive enumeration of the policy graph's leaf paths rather than a sample — a **declared census** — the per-scenario weight $w_m$ is that scenario's leaf-path probability rather than a uniform sample weight, and the weights sum to one: $\sum_m w_m = 1$.

The census **weighted mean** replaces the sample mean:

$$
\bar{C} = \sum_m w_m\, C_m
$$

and the census **weighted standard deviation** is the **true weighted population variance** — no Bessel correction:

$$
\sigma_C = \sqrt{\sum_m w_m\,(C_m - \bar{C})^2}
$$

The population form omits the sampled variant's $N/(N-1)$ correction because a census is exhaustive, not sampled: $C_m$ ranges over the entire population of scenarios rather than a draw from it, so there is no downward bias in the naive variance to correct for.

Because the population is fully enumerated rather than estimated from a draw, the census estimator carries **no confidence interval** — $\bar{C}$ and $\sigma_C$ are exact statistics of the enumerated population, not estimates of an unknown expectation.

:::note[Boundary with the training-phase exact bound]
This census weighted mean shares its $\sum_m w_m C_m$ form with the training-phase exact upper bound (section 2, $\sum_\ell P(\ell)\, C(\ell)$) — both are probability-weighted sums over an exhaustive enumeration. They are nonetheless distinct: section 2's exact bound is evaluated once per training iteration, over the training tree, to feed the gap (section 3); this census estimator is evaluated once, after training, over the enumerated leaf paths under the final policy, to report the policy's simulated cost distribution. Neither feeds the other.
:::

#### 4.5.5 Number of Simulation Scenarios

The sole knob governing the simulation procedure — sampled or census — is the number of simulation scenarios $N$. It controls the statistical resolution of the sampled estimator and the compute cost of the procedure simultaneously.

Raising $N$ narrows the sampled confidence interval as $1/\sqrt{N}$, while the compute cost — proportional to $N$ times the horizon length in LP solves — grows linearly in $N$, so the scenario count trades statistical resolution directly against compute. Under the census variant, $N$ is instead fixed by the size of the declared enumeration rather than chosen for statistical resolution, since there is no confidence interval to narrow.

#### 4.5.6 Relation to Training-Phase Bounds

This simulation estimator is independent of the training loop: it is not consumed by any stopping rule and does not gate training termination. Training termination is governed by the gap-based stopping rule (see [Stopping Rules](/math/stopping-rules), section 5), which compares the training-phase upper bound — the statistical or exact forward-pass estimator, sections 1–2 — against the lower bound at every iteration, using the training forward pass rather than the post-training simulation.

This section's estimator instead reports the trained policy's simulated cost distribution once training has finished: the sampled mean/standard-deviation/confidence-interval (sections 4.5.2–4.5.3), or the census weighted mean/population variance (section 4.5.4). See [Convergence & Diagnostics](/running/interpreting-results/) for how this output is consumed operationally.

:::note[Boundary]
This chapter owns the methodology of both the training-phase forward-pass bound (sections 1–2) and the post-training simulation estimator (this section); the scenario seed derivation and the distribution of scenarios across compute resources are implementation detail outside this chapter's scope.
:::

## Appendix: Inner Approximation (Reserved)

This appendix describes a reserved design that Novomodelo does not compute: a vertex-based inner approximation of the cost-to-go function (SIDP), which would evaluate the upper bound independently of the forward pass's sampling mode.

### Vertex-Based Inner Approximation

The inner approximation $\bar{V}_t(x)$ would be constructed from **vertices** (visited state-value pairs):

$$
\mathcal{V}_t = \{(x^{(1)}, \bar{v}^{(1)}), (x^{(2)}, \bar{v}^{(2)}), \ldots, (x^{(I_t)}, \bar{v}^{(I_t)})\}
$$

where each vertex would store:

- $x^{(i)}$: State vector entering stage $t$, visited during forward passes
- $\bar{v}^{(i)}$: Upper bound on expected cost-to-go from that state (computed recursively)

### Lipschitz Interpolation

At a state $x$, the upper bound would be the cheapest convex combination of the vertex values, plus a Lipschitz penalty on the deviation of $x$ from the same convex combination of the vertex states:

$$
\begin{aligned}
\bar{V}_t(x) = \min_{\varphi,\, u^+,\, u^-} \quad & \sum_{i \in \mathcal{V}_t} \varphi_i\, \bar{v}^{(i)} + L_t^\top (u^+ + u^-) \\
\text{s.t.} \quad & \sum_{i \in \mathcal{V}_t} \varphi_i\, x^{(i)} + u^+ - u^- = x \\
& \sum_{i \in \mathcal{V}_t} \varphi_i = 1, \qquad \varphi,\, u^+,\, u^- \geq 0
\end{aligned}
$$

where $\varphi_i$ is the convex-combination weight of vertex $i$, $u^+$ and $u^-$ are the componentwise positive and negative deviations of $x$ from the combined vertex state $\sum_i \varphi_i\, x^{(i)}$, and $L_t$ is the vector of per-state-component Lipschitz constants $L_{t,j}$ (see below), so that the deviation of each state component $j$ is weighted by its own $L_{t,j}$.

**Interpretation**: $\bar{V}_t$ is convex and piecewise linear in $x$, and $\bar{V}_t(x^{(i)}) \leq \bar{v}^{(i)}$ at every vertex. It is an upper bound on the convex cost-to-go $V_t$ when every vertex value bounds the cost-to-go at its state from above, $\bar{v}^{(i)} \geq V_t(x^{(i)})$, and $V_t$ changes by at most $L_{t,j}$ per unit change of each state component $j$: the inner (upper) counterpart to the outer (lower) cut approximation, both convex.

### Lipschitz Constant Computation

The Lipschitz constants would bound the rate of change of the value function with respect to each state component. The state components carry different units, hm³ for a storage component and the units of its own lag for an inflow-lag component, so $L_t$ is the vector of per-state-component constants $L_{t,j}$, each in \$ per unit of its component $j$. For SDDP with penalty-based feasibility (relatively complete recourse):

- **Storage component.** A hm³ of stored water is priced in the stage by the energy it displaces (the penalty bound in \$/MWh times the energy that hm³ yields through the productivities of the plants it reaches, in MWh/hm³), by the penalties charged per hm³ of storage (the storage-floor and filling-target shortfall costs of [Penalty System](/math/penalty-system)), and by the cost of spilling water that cannot be stored (converted from \$/(m³/s·h) to \$/hm³). Its constant $L_{t,j}$, in \$/hm³, bounds that price from above.
- **Inflow-lag component.** Its constant carries the units of its own lag: it bounds, in \$ per unit of that lag, the change in cost through the inflows that the lag enters.

**Backward accumulation**, per storage component $j$: at the terminal stage, $L_{T,j}$ is the stage's own bound, whose energy term is built from the largest penalty coefficient $c_{max}^{penalty}$ of that stage; at each earlier stage $t$, $L_{t,j}$ adds the stage's own bound, whose energy term is built from the largest stage-$t$ penalty coefficient $c_{max}^{penalty,t}$ (in \$/MWh), to the discounted next-stage constant $d_{t \to t+1} \cdot L_{t+1,j}$, where $d_{t \to t+1}$ is the discount factor for transition $t \to t+1$ (see [Discount Rate Formulation](/math/discount-rate)).

:::note[Note]
The discount factor $d$ appears in the Lipschitz accumulation because the future cost would be discounted. Without discounting ($d = 1$), $L_t$ would grow with the remaining horizon.
:::

### Vertex Value Computation

During the upper bound evaluation pass (a backward pass variant), vertex values would be computed as follows.

**At terminal stage $T$**:

$$
\bar{v}^{(i)} = \mathbb{E}_{\omega_T}\left[c_T(x^{(i)}, \omega_T)\right] \quad \text{(expected immediate cost only)}
$$

**At stage $t < T$**:

For each vertex $(x^{(i)}, \cdot) \in \mathcal{V}_t$:

1. For each scenario $\omega_t$, the stage subproblem would be solved with incoming state $x^{(i)}$ and realization $\omega_t$
2. The optimal outgoing state $x_t^*(\omega_t)$ would be obtained
3. The next stage's inner approximation would be evaluated at that outgoing state: $\bar{\theta}(\omega_t) = \bar{V}_{t+1}(x_t^*(\omega_t))$
4. The vertex value would be set as the expected discounted cost-to-go:

$$
\bar{v}^{(i)} = \mathbb{E}_{\omega_t}\left[c_t(x^{(i)}, \omega_t) + d_{t \to t+1} \cdot \bar{\theta}(\omega_t)\right]
$$

:::note[Expectation]
The vertex value would be an expectation over scenarios, not a single-scenario value — paralleling the backward pass for cuts, which also computes expected cost-to-go.
:::

### Upper Bound Evaluation LP

For policy evaluation with the inner approximation, the stage LP would replace the outer approximation (cut constraints on $\theta$) with the inner approximation (convex-combination constraints on $\bar{\theta}$).

**Standard LP (outer approximation, lower bound)**:

$$
\min \; c_t(x_t, u_t) + d_{t \to t+1} \cdot \theta
$$

$$
\text{s.t. } \theta \geq \beta_0 + \beta^\top x_t \quad \text{for every cut } (\beta_0, \beta)
$$

**Inner approximation LP (upper bound)**:

$$
\min \; c_t(x_t, u_t) + d_{t \to t+1} \cdot \bar{\theta}
$$

$$
\begin{aligned}
\text{s.t. } \; & \bar{\theta} \geq \sum_{i \in \mathcal{V}_{t+1}} \varphi_i\, \bar{v}^{(i)} + L_{t+1}^\top (u^+ + u^-) \\
& \sum_{i \in \mathcal{V}_{t+1}} \varphi_i\, x^{(i)} + u^+ - u^- = x_t \\
& \sum_{i \in \mathcal{V}_{t+1}} \varphi_i = 1, \qquad \varphi,\, u^+,\, u^- \geq 0
\end{aligned}
$$

The future-cost variable $\bar{\theta}$ of stage $t$ stands for the next stage's inner approximation, so the weights range over the vertices of $\mathcal{V}_{t+1}$, the deviations are priced by $L_{t+1}$, and the two constraints on the outgoing state $x_t$ are those of the definition of $\bar{V}_{t+1}$: at the optimum, $\bar{\theta} = \bar{V}_{t+1}(x_t)$, with $\bar{V}_{T+1} = 0$ at the last stage.

:::note[Direction]
Both approximations bound their future-cost variable from below in the LP: the cuts give $\theta \geq \ldots$, the convex combination gives $\bar{\theta} \geq \ldots$, and the minimization drives each variable down to its approximation. The approximations lie on opposite sides of the cost-to-go: $\bar{V}_t$ lies above it, while the cuts lie below it, and both are convex and piecewise linear.
:::

**Additional variables** (one weight per vertex, one deviation pair per state component):

| Variable       | Domain   | Description                                                               |
| -------------- | -------- | ------------------------------------------------------------------------- |
| $\varphi_i$    | $\geq 0$ | Convex-combination weight of vertex $i$                                   |
| $u^+$          | $\geq 0$ | Componentwise positive deviation of $x_t$ from the combined vertex state  |
| $u^-$          | $\geq 0$ | Componentwise negative deviation of $x_t$ from the combined vertex state  |
| $\bar{\theta}$ | free     | Upper bound on future cost, bounded below by the convex-combination value |

### Computational Considerations

| Aspect                   | Impact                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| **Vertices per stage**   | Typically $\mathcal{O}(\text{iterations} \times N_{\text{forward\_passes}})$ |
| **LP size increase**     | $n_{vertices} + 2 \times n_{state}$ additional variables                 |
| **Evaluation frequency** | Trade-off between gap accuracy and runtime                               |
| **Memory**               | Vertices stored separately from cuts                                     |

### Cyclic Mode

:::caution[Reserved policy-graph shape]
The cyclic policy-graph shape this subsection describes is **reserved**
independently of the inner approximation: Novomodelo's
policy graph is finite-horizon only, and supplying `cyclic` as the policy
graph type is rejected at load with a named error. See
[Horizon Modes](/math/horizon-modes) for the reserved cyclic target design.
:::

For the reserved cyclic policy graphs design (see [Horizon Modes](/math/horizon-modes)), the inner approximation would operate on the same seasonal cut-pool structure: vertices organized by season $\tau$, not by absolute stage ID. The Lipschitz constant would need to account for the cumulative discount around the cycle, which bounds the geometric series of future contributions.

The convergence guarantee would still hold: with $d_{\text{cycle}} < 1$, both the outer (cut) and inner (vertex) approximations would converge to the true value function at the fixed point.

## References

- [Costa & Leclère (2023)](/reference/bibliography/#upper-bound-evaluation)
- [Philpott, de Matos & Finardi (2013)](/reference/bibliography/#risk-measures)

## Cross-References

- [SDDP Algorithm](/math/sddp-algorithm) — Core algorithm providing the outer approximation (lower bound) that this chapter complements
- [Notation Conventions](/overview/notation-conventions) — Standard symbols for state variables, value functions, and cost-to-go
- [Discount Rate Formulation](/math/discount-rate) — Discount factor $d$ used in the exact bound's discounted cost (section 2) and in the reserved vertex value computation and Lipschitz accumulation (appendix)
- [Policy Graphs](/math/policy-graphs) — The enumerated-versus-sampled forward-pass distinction that selects between the statistical and exact upper-bound mechanisms (sections 1–2)
- [Horizon Modes](/math/horizon-modes) — The reserved cyclic policy-graph target design and the season-indexed pool structure the appendix's reserved inner approximation would mirror
- [Cut Management](/math/cut-management) — Outer approximation cuts that provide the lower bound counterpart
- [Stopping Rules](/math/stopping-rules) — The gap-based stopping rule, which compares this chapter's training-phase upper bound (sections 1–2) against the lower bound (section 3)
- [Risk Measures](/math/risk-measures) — The nested risk-adjusted lower bound and why only the exact nested bound certifies a risk-averse policy
- [Scenario Generation](/math/scenario-generation) — The opening tree and the forward sampling schemes whose estimates section 4 interprets, in training and in the post-training simulation (section 4.5)
- **Running Novomodelo:** [Convergence & Diagnostics](/running/interpreting-results/) — the software guide for reading and assessing this estimator's output.
