---
title: Horizon Modes
description: Finite (acyclic) and Cyclic (infinite-periodic) policy graph topologies — the season function, cycle convergence inequality, season-indexed cut pool, fixed-point Bellman operator, and forward-pass termination rules.
---

## Purpose

The **horizon mode** is the global topology of the policy graph for a Novomodelo
run. It determines whether the stage graph is an acyclic chain with a known
terminal condition or a cycle whose value functions must stabilise across
repeated traversals. Because the topology applies uniformly to every stage, a
single mode governs the entire run; the choice is declared in the case
configuration via the policy graph type field.

Novomodelo supports only the finite (acyclic) mode of section 1; a **cyclic**
(infinite-periodic) mode, which closes the stage graph into a cycle whose
value functions stabilise across repeated traversals rather than terminating
at a fixed stage, is a **reserved** design.

Section 2 introduces the reserved cyclic mode at the idea / guarantee / knob
/ trade-off level; section 3 gives its formal mathematical structure (the
season function, the cycle convergence inequality, the season-indexed
cut pool, and the fixed-point Bellman operator); section 4 describes the
forward-pass termination logic the reserved design anticipates; section 5
compares the supported and reserved modes as a reference. The per-transition
discount factor is defined in [Discount Rate Formulation](/math/discount-rate);
its role in cycle convergence is set out in section 3.

## 1. Finite (Acyclic) Mode

**Idea.** The stage graph is a linear chain: stage 1 leads to stage 2, which
leads to stage 3, and so on up to stage T. The chain has a definite end. The
terminal value function is zero unless a fixed terminal function is imported
from an upstream policy (see
[Post-Study Boundary & Chained Studies](/math/post-study-boundary)); with the
zero terminal value, no water left in storage at stage T+1 has any value in
the model.

**Guarantee.** Because the chain is acyclic, every stage is visited exactly
once per forward or backward pass. The algorithm terminates naturally when it
reaches the terminal stage. There is no cycle to traverse and no convergence
criterion tied to cycle stability. Each stage accumulates its own independent
cut pool; a cut generated at stage t is valid only for stage t, so there are T
independent pools for a T-stage study.

**Knob.** The case configuration declares the policy graph type as finite. The
number of stages T is the length of the chain.

**Trade-off.** Finite mode is appropriate when the study has a bounded horizon
and the modeller can accept the terminal condition. For short-to-medium
planning horizons the end-of-chain effect is a manageable modelling
assumption, and the simplicity of acyclic traversal makes the algorithm
straightforward to interpret and debug. The limitation is that reservoir
storage near the terminal stage is systematically undervalued: the zero
terminal condition gives the optimiser an incentive to empty reservoirs before
stage T, producing an artefact known as the end-of-world effect. When that
artefact would distort the policy, an imported terminal function is the
supported remedy for it, and the reserved cyclic design (section 2) the other.

## 2. Cyclic (Infinite-Periodic) Mode

:::caution[Status: Reserved Design]
Novomodelo supports only the finite mode of section 1. A cyclic policy graph is a
reserved design that the case loader rejects. Sections 2 to 4 document that
design; its mathematics is valid on its own terms.
:::

**Idea.** The stage graph contains a back-edge that returns from the last stage
of a cycle to the first stage of the next repetition, forming a closed loop.
There is no terminal stage; instead, the policy is required to be self-consistent
across cycle repetitions. Cut pools are organised by season — the position of a
stage within one cycle — rather than by absolute stage identity. A single
cycle's worth of seasonal cut pools represents the entire infinite horizon.

**Guarantee.** Convergence of the cyclic mode rests on the cumulative discount
factor around one full cycle falling strictly below one. When that condition
holds, contributions from distant future cycles become negligible, and the value
functions at each season stabilise across iterations. The formal statement of
this guarantee — the convergence inequality, the season function, the
cut-sharing equation, and the fixed-point Bellman operator — is given in
section 3.

**Knob.** In the reserved design, the case configuration would declare the
policy graph type as cyclic and supply an annual discount rate; the discount
rate, together with each transition's duration, determines the
per-transition factor, and the product of factors around one cycle must be
strictly below one (see [Discount Rate Formulation](/math/discount-rate) for
the conversion mechanics).

**Trade-off.** Cyclic mode eliminates the end-of-world effect by representing
the planning problem as an ongoing, perpetually recurring operation. It is the
natural choice for long-term planning studies where a finite terminal condition
would produce misleading near-terminal policies. The cost is additional
complexity: the modeller must supply a discount rate, the algorithm must verify
cycle convergence, and the forward pass requires explicit termination logic
rather than a natural chain endpoint. Section 3 formalises the convergence
requirement; section 4 describes the forward-pass termination rules the
reserved design anticipates.

## 3. Cyclic Mode — Mathematical Detail

This section gives the formal structure that section 2 summarised in prose:
the season function, the stationarity assumption, the cycle convergence
inequality, the season-indexed cut pool with its cut-sharing equation, the
fixed-point Bellman interpretation, and the convergence criterion that the
algorithm checks across consecutive iterations.

### Season Function

For a cycle of length $M$ stages (for example, twelve monthly stages making
a calendar year), the **season** of stage $t$ is its position within one
cycle:

$$
\tau(t) \;=\; (t - 1) \bmod M + 1 \;\in\; \{1, 2, \ldots, M\}.
$$

The cycle is the unit that repeats; the season is the position within it.

### Stationarity Assumption

Let $\mathcal{C}_\tau = \{\,t : \tau(t) = \tau\,\}$ denote the set of all
stages occupying season $\tau$. The cyclic design rests on one assumption:
every stage of season $\tau$ has the same data in every cycle — the same
costs, constraints, block structure, stochastic process and one-step discount
factor $d_{t \to t+1}$. The problem that starts at any stage of
$\mathcal{C}_\tau$, its own stage together with the infinite tail after it,
is then the same for every stage of $\mathcal{C}_\tau$. This is what makes a
cut generated at one stage of $\mathcal{C}_\tau$ valid at every stage of
$\mathcal{C}_\tau$, and what lets $M$ pools represent the infinite horizon.

### Cycle Convergence Inequality

For the value function to remain finite across infinite repetitions, the
cumulative discount around one full cycle must be strictly below one:

$$
d_{\text{cycle}} \;=\; \prod_{t \in \text{cycle}} d_{t \to t+1} \;<\; 1.
$$

This guarantees that the geometric series of cycle contributions converges,

$$
\lim_{n \to \infty} d_{\text{cycle}}^{\,n} \cdot V_t(x) \;=\; 0,
$$

so contributions from far-future cycles become negligible. The reserved design
requires this inequality of every cyclic graph. See
[Discount Rate Formulation](/math/discount-rate) for the conversion from the
annual rate to the per-transition factors.

### Season-Indexed Cut Pool

By the stationarity assumption, a cut generated at any stage in
$\mathcal{C}_\tau$ is valid for every stage in $\mathcal{C}_\tau$, so the
cut pool is indexed by season rather than by absolute stage:

$$
\underline{V}_\tau(x) \;=\; \max_{i \in \mathcal{I}_\tau}
\bigl\{\, \beta_{0,i} + \beta_i^{\top} x \,\bigr\}.
$$

A single cycle of $M$ pools therefore represents the entire infinite
horizon. The pool-organisation difference between finite and cyclic mode
reduces to: $T$ pools indexed by absolute stage versus $M$ pools indexed by
season.

### Fixed-Point Bellman Operator

The cyclic value functions satisfy the seasonal Bellman recursion

$$
V_\tau \;=\; \mathbb{T}_\tau\, V_{\tau \bmod M + 1},
\qquad \tau \in \{1, \ldots, M\},
$$

where $\tau \bmod M + 1$ is the season that follows $\tau$ (season $M$ is
followed by season $1$) and $\mathbb{T}_\tau$ is the one-stage Bellman
operator at season $\tau$:

$$
(\mathbb{T}_\tau V)(x) \;=\; \mathbb{E}_{\omega_\tau}\!\left[\,
\min_{(x', u) \in \mathcal{X}_\tau(x, \omega_\tau)}\,
\bigl\{ c_\tau(x', u) + d_{t \to t+1}\, V(x') \bigr\}
\,\right].
$$

Here $x$ is the incoming state, $x'$ the outgoing state and $u$ the control,
$\mathcal{X}_\tau(x, \omega_\tau)$ is their feasible set under the
realization $\omega_\tau$, and $t$ is any stage of season $\tau$: by
stationarity, the stage cost $c_\tau$, the feasible set and the one-step
factor $d_{t \to t+1}$ are the same at every such stage. Chaining the
recursion once around the cycle gives the fixed-point equation of the first
season,

$$
V_1 \;=\; \bigl(\mathbb{T}_1 \circ \mathbb{T}_2 \circ \cdots \circ
\mathbb{T}_M\bigr)\, V_1 .
$$

With bounded stage costs and a nonempty feasible set for every incoming state
in the state space and every realization, each $\mathbb{T}_\tau$ is monotone and, in the supremum
norm, Lipschitz with constant its season's factor $d_{t \to t+1}$. A season's
factor may equal one, so a single $\mathbb{T}_\tau$ need not be a
contraction; the composition is Lipschitz with constant the product of the
$M$ factors, which is $d_{\text{cycle}} < 1$ by the cycle convergence
inequality. The chain is therefore a contraction with modulus
$d_{\text{cycle}}$, and by the Banach fixed-point theorem on the bounded
functions of the state the cyclic value functions exist and are unique: $V_1$
is the unique fixed point of the chain, and the recursion determines the
other seasons' value functions from it. Cyclic SDDP computes this fixed
point; the policy is converged when the value function at every season is
stable across consecutive iterations.

### Cycle Convergence Criterion

The outer approximation has converged in cyclic mode when the lower bounds
at every season stabilise across consecutive iterations:

$$
\max_{\tau \in \{1, \ldots, M\}}
\bigl|\, \underline{z}^{\,k,\tau} - \underline{z}^{\,k-1,\tau} \,\bigr|
\;<\; \delta_{\text{cycle}},
$$

where $\underline{z}^{\,k,\tau}$ is the lower bound at season $\tau$ after
iteration $k$, and the tolerance $\delta_{\text{cycle}}$ is a stopping
parameter of the reserved design.

## 4. Forward-Pass Termination in Cyclic Mode

In finite mode the forward pass ends when it reaches the terminal stage; no
explicit stopping rule is needed. The reserved cyclic design (sections 2–3)
has no terminal stage, so its forward pass would apply two stopping
conditions.

**Condition 1 — Cumulative-discount tolerance.** As the forward pass traverses
successive stages, a running product accumulates the per-transition discount
factors. When this cumulative product falls below a configurable
cumulative-discount tolerance, the remaining stages contribute so little to the
total trajectory cost that continuing would not meaningfully affect the policy.
The pass would terminate at that point.

**Condition 2 — Maximum-stage safety bound.** A configurable maximum-stage
safety bound would prevent unbounded traversal in pathological cases where the
cumulative discount shrinks slowly — for example, when the cycle discount is
valid but close to one. If the cumulative-discount condition has not
triggered by the time the safety bound is reached, the pass would terminate
unconditionally.

The forward pass would terminate when either condition is met, whichever comes
first. The discount mechanics underlying the cumulative-discount condition —
the formula relating the annual rate to the per-transition factor and the
running product — are described in [Discount Rate Formulation](/math/discount-rate).

## 5. Choosing Between Modes

The comparison below is a modelling-decision reference between the supported
finite mode (section 1) and the reserved cyclic design (sections 2–4).

**Choose finite mode when:**

- The study has a well-defined end date and the modeller can accept a zero
  terminal condition (or supplement it with imported boundary cuts — see
  [Post-Study Boundary & Chained Studies](/math/post-study-boundary)).
- The planning horizon is short enough that the end-of-world effect is
  negligible or acceptable.
- Interpretability and simplicity are priorities: acyclic traversal requires
  no discount rate, no cycle convergence check, and no forward-pass termination
  logic beyond reaching the last stage.

**The reserved cyclic design would be preferable when:**

- The study represents an ongoing operation — long-term reservoir planning,
  multi-year dispatch, perpetual system operation — where imposing a terminal
  condition would produce systematically distorted near-terminal policies.
- The modeller has a meaningful annual discount rate that reflects the time
  value of future costs.
- The cut pool compression offered by season-indexed pools is desirable:
  instead of accumulating T independent pools, only M pools (one per season)
  would be maintained regardless of how many cycle repetitions the forward
  pass traverses.

**Summary of trade-offs:**

| Property                    | Finite (supported)              | Cyclic (reserved)                   |
| --------------------------- | ------------------------------- | ----------------------------------- |
| Terminal condition          | V at T+1 = 0 (or imported cuts) | None; self-consistent across cycles |
| End-of-world effect         | Present near terminal stage     | Absent                              |
| Cut pools                   | T pools, one per stage          | M pools, one per season             |
| Discount rate requirement   | None                            | Required; must give cycle < 1       |
| Forward-pass stopping logic | Reaches terminal stage          | Two-condition explicit rule         |
| Mathematical complexity     | Lower                           | Higher                              |

The cut-generation mechanics that produce the cuts filling both pool
organisations are covered in [Cut Management](/math/cut-management). The
algorithm within which finite mode operates, and within which the reserved
cyclic design is specified to operate, is described in
[SDDP Algorithm](/math/sddp-algorithm).

## 6. Reference

- [Costa et al. (2025)](/reference/bibliography/#boundary-conditions-and-horizon-modes)

The cyclic-mode formal structure in section 3 — the season function,
the cycle convergence inequality, the season-indexed cut pool with its
cut-sharing equation, and the fixed-point Bellman operator — follows
this paper; the stationarity assumption and the contraction of the
operator chain are the standard discounted periodic dynamic-programming
argument.

## Cross-References

- [Discount Rate Formulation](/math/discount-rate) — Annual-rate-to-factor
  conversion, per-transition discount mechanics, and cumulative discounting.
- [Cut Management](/math/cut-management) — Cut generation and aggregation
  mechanics that produce the cuts filling the per-stage or per-season pools.
- [SDDP Algorithm](/math/sddp-algorithm) — The algorithm that the horizon mode
  parameterises; finite (supported) and cyclic (reserved) policy graph
  topologies; terminal boundary cut mechanism.
- [Post-Study Boundary & Chained Studies](/math/post-study-boundary) — The
  terminal function a finite study may import from an upstream policy.
- [Stopping Rules](/math/stopping-rules) — The stopping rules that end
  training in the finite mode.
