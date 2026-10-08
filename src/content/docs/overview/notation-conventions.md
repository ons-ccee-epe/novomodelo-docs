---
title: Notation Conventions
description: Complete mathematical notation reference — index sets, parameters, decision variables, and dual variables used across the Novomodelo methodology chapters.
---

## Purpose

This chapter defines the complete mathematical notation used across the Novomodelo methodology chapters: index sets, parameters, decision variables, and dual variables. It serves as the canonical reference for symbol meanings, ensuring consistency across the methodology chapters.

## 1. General Notation Conventions

This document follows the SDDP.jl notation conventions of [Dowson & Kapelevich (2021)](/reference/bibliography/#software-references) for consistency with the broader SDDP literature:

| Convention               | Meaning                                   |
| ------------------------ | ----------------------------------------- |
| $t \in \{1, \ldots, T\}$ | Stage index; $T$ is the number of study stages |
| $\omega \in \Omega_t$ | Opening (a realization of the stage noise) at stage $t$ |
| $j \in \{1, \ldots, N_t\}$ | Opening index within the opening tree of stage $t$ |
| $N_t$ | Branching factor: the number of openings of stage $t$ |
| $p(\omega)$ | Probability of opening $\omega$, uniform: $p(\omega) = 1/N_t$; on a policy graph, $p_{n'}(\omega)$, uniform within node $n'$ |
| $n$ | Node of a policy graph |
| $P(n \to n')$ | Transition probability of the edge from node $n$ to its child $n'$ (the policy-graph diagrams label the edges p₁, p₂, …); the probabilities of a node's edges sum to $1$ |
| $x_t$ | State vector at the end of stage $t$; $x_0$ is the initial state |
| $\hat{x}_{t-1}$ | Incoming state of stage $t$ (the trial point) |
| $u_t$ | Control vector of stage $t$ |
| $\mathcal{X}_t(x_{t-1}, \omega_t)$ | Feasible set of the stage-$t$ state and control, given the incoming state $x_{t-1}$ and the opening $\omega_t$; written $\mathcal{X}_t(\omega_t)$ when the incoming state is fixed |
| $c_t(x_t, u_t)$ | Immediate (stage) cost of stage $t$, undiscounted |
| $x_j$ | Variable of column $j$ in a generic statement about a stage LP |
| $Q_t$ | Optimal value of the stage-$t$ LP as a function of its incoming state and opening, $Q_t(\hat{x}_{t-1}, \omega)$ |
| $V_t(x)$                 | Value function (cost-to-go) at stage $t$  |
| $\mathbb{E}_{\omega_t}$ | Expectation over the opening of stage $t$ |
| $\theta_t$ | Epigraph variable approximating $V_{t+1}(x_t)$ |
| $\pi$                    | Dual variables (row Lagrange multipliers) |
| $(\beta_0, \beta)$ | Cut intercept and coefficients: the cut $\theta_t \geq \beta_0 + \beta^\top x_t$ |
| $\hat{x}_j$, $\beta_j$ | Component $j$ of the incoming state and of the cut slope; $j$ indexes the state coordinates |
| $i$ | Cut index ($\beta_{0,i}$, $\beta_i$) |
| $\underline{V}_\tau(x)$ | Outer (cut) approximation of the value function, $\max_i \{\beta_{0,i} + \beta_i^\top x\}$, per stage, or per season $\tau$ of a cyclic policy graph |
| $k$                      | Iteration counter                         |
| $\underline{z}^k$ | Lower bound at iteration $k$: the first stage's risk-adjusted value over its openings with the current cuts |
| $\bar{z}^k$ | Upper-bound estimate at iteration $k$: the mean discounted cost of the iteration's $M$ forward-pass trajectories, a statistical estimate; exact, $\bar{z}_{\text{exact}}$, under an enumerated forward pass |
| $M$, $m$ | Number of trajectories averaged in the upper-bound estimate, and the trajectory index $m \in \{1, \ldots, M\}$ |
| $N_{\text{forward\_passes}}$ | Number of forward-pass trajectories per iteration |
| $n_{\text{sample}}$ | Number of openings a sampled backward pass would draw per stage in place of all $N_t$ |
| $\text{gap}^k$ | Optimality gap at iteration $k$: the upper bound minus the lower bound, $\bar{z}^k - \underline{z}^k$; its percent form normalises it by the lower bound; see [Stopping Rules](/math/stopping-rules#optimality-gap) |
| $P(\ell)$, $C(\ell)$ | Probability and total discounted cost of leaf path $\ell$ of an enumerated scenario tree |
| $\bar{z}_{\text{exact}}$ | Exact upper bound of an enumerated forward pass: $\sum_\ell P(\ell)\, C(\ell)$ under the expectation, the nested root value under a uniform CVaR |
| $w_m$ | Census weight of simulation scenario $m$: its leaf-path probability, $\sum_m w_m = 1$ |
| $\Delta_{95}$ | Half-width of the 95 % normal-approximation confidence interval of a sampled cost estimate |
| $V^\star$ | Optimal value of the multistage objective |
| $V'(v)$ | Slope of the one-reservoir value function at a trial storage $v$: the slope of the tangent cut in the value-function figures |
| $\text{iterations}$ | Number of training iterations, in growth orders such as $\mathcal{O}(\text{iterations} \times N_{\text{forward\_passes}})$ |
| $\mathcal{O}(\cdot)$ | Asymptotic order of a count or cost |
| $\rho^{\lambda, \alpha}$ | Convex-combination risk measure, $\rho^{\lambda, \alpha}[Z] = (1 - \lambda)\, \mathbb{E}[Z] + \lambda\, \text{CVaR}_\alpha[Z]$; per stage, $\rho_t$, the measure of the stage that owns a cut, which aggregates the next stage's openings into it |
| $\lambda$ | Risk-aversion weight, $\lambda \in [0, 1]$: $0$ is risk-neutral, $1$ is pure CVaR |
| $\mu^*$ | Risk-adjusted probability weights of a cut: $\mu^* = (1-\lambda)\, p + \lambda\, q^*$, between the floor $(1-\lambda)\, p_\omega$ and the cap $(1-\lambda)\, p_\omega + \lambda\, p_\omega / \alpha$ |
| $\alpha$ | CVaR tail fraction, $\alpha \in (0, 1]$; $\alpha = 1$ gives the expectation |
| $\text{CVaR}_\alpha$ | Conditional value-at-risk: the expected cost over the worst $\alpha$-fraction of outcomes |
| $\mathrm{VaR}_\alpha$ | Value-at-risk: the $(1 - \alpha)$-quantile of the cost, the optimal $\eta$ |
| $\eta$ | Threshold variable of $\text{CVaR}_\alpha(Z) = \min_{\eta \in \mathbb{R}} \{\eta + \tfrac{1}{\alpha} \mathbb{E}[(Z - \eta)^+]\}$ |
| $Z$, $f(Z)$ | Random cost a risk measure applies to, and its probability density |
| $\rho_{\text{nested}}$ | Nested (time-consistent) risk functional: the stage measure applied stage by stage, $\rho_1[\rho_2[\cdots \rho_{T-1}[\cdot]]]$ |
| $\rho_{\text{end-of-horizon}}$ | End-of-horizon risk functional: one measure applied to the whole-path total cost |

### Declared Scoped Reuse

A glyph takes a second meaning only on pages that never carry its first; each such reuse is declared here:

- $k$ indexes the blocks of a stage, $k \in \mathcal{K}$, in the System Modelling chapters and [Scenario Generation](/math/scenario-generation); it counts training iterations in [SDDP Algorithm](/math/sddp-algorithm), [Cut Management](/math/cut-management), [LP Warm-Start](/math/lp-warm-start), [Stopping Rules](/math/stopping-rules), [Upper Bound Evaluation](/math/upper-bound-evaluation), [Horizon Modes](/math/horizon-modes), [Discount Rate Formulation](/math/discount-rate), [Risk Measures](/math/risk-measures) and the worked examples; in [PAR(p) Inflow Model](/math/par-inflow-model) it is the candidate order of the partial-autocorrelation test.
- $k_{max}$ is the number of slots in every anticipated thermal's commitment ring in [State Augmentation](/math/state-augmentation) and [Policy Checkpoint](/reference/output/policy); in [Stopping Rules](/math/stopping-rules) it is the iteration limit.
- $\ell$ is the lag index of the autoregressive inflow model; in [Stopping Rules](/math/stopping-rules) and [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes the leaf paths of an enumerated scenario tree.
- $\lambda$ is the risk-aversion weight of the convex-combination risk measure; in [PAR(p) Inflow Model](/math/par-inflow-model) $\lambda_i$ are the eigenvalues of the correlation matrix, and in [LP Formulation](/math/lp-formulation), [Block Formulation Variants](/math/block-formulations) and [Hydro Production Function Models](/math/hydro-production-models) $\lambda_{h,b}$ is the share of cell $(h, b)$ in the turbine capacity of plant $h$.
- $L$ is the last filling stage of a filling hydro in [LP Formulation](/math/lp-formulation) and [Penalty System](/math/penalty-system); in [PAR(p) Inflow Model](/math/par-inflow-model) it is the lower-triangular Cholesky factor of the correlation matrix, in [State Augmentation](/math/state-augmentation) $L_h$ is the bucket depth of receiving plant $h$, and in [Upper Bound Evaluation](/math/upper-bound-evaluation) $L_t$ is the vector of per-state-component Lipschitz constants $L_{t,j}$ of the stage-$t$ value function.
- $\psi_{m,\ell}$ is the autoregressive coefficient of the inflow model ($\psi^*_{m,\ell}$ standardized; $\psi^{A*}_m$ and $\psi^A_m$ the annual coefficient of PAR(p)-A); in [Risk Measures](/math/risk-measures) $\psi(p, \mu)$ is the penalty function of the dual representation of a convex risk measure.
- A hat on a state quantity marks its incoming (trial) value ($\hat{x}_{t-1}$, $\hat{v}_h$, $\hat{a}_{h,\ell}$); a hat on a model parameter marks its sample estimate from the historical record ($\hat{\mu}_m$, $\hat{s}_m$, $\hat{\rho}_m(\ell)$); the two never decorate the same base symbol.
- $\tau_k$ is the duration of block $k$; in [Stopping Rules](/math/stopping-rules) $\tau$ is the bound-stalling window, and in [Horizon Modes](/math/horizon-modes) and [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes the seasons of a cyclic policy graph.
- $\phi(v, q, s)$ is the exact hydro production function in [Hydro Production Function Models](/math/hydro-production-models); in [LP Formulation](/math/lp-formulation) and [State Augmentation](/math/state-augmentation) $\phi_{h,k}$ is the arrival density that spreads a maturing in-transit volume over the blocks of its arrival stage; in [PAR(p) Inflow Model](/math/par-inflow-model) $\phi$ names the AR-coefficient notation of other implementations, which that chapter writes $\psi$.
- $A_{ij}$ is an entry of the constraint matrix $A$ of the stage LP in [LP Layout and Scaling](/math/lp-layout-and-scaling); in [System Element Modeling Overview](/math/system-elements) and [Equipment-Specific Formulations](/math/equipment-formulations) $A_{r,k}$ is the available generation of non-controllable source $r$ in block $k$, in [PAR(p) Inflow Model](/math/par-inflow-model) $A_{h,t-1}$ is the annual regressor of PAR(p)-A, and in [State Augmentation](/math/state-augmentation) the bare $A$ is the number of anticipated thermals.
- $D_{b,k}$ is the load at bus $b$, block $k$, in [LP Formulation](/math/lp-formulation) and [System Element Modeling Overview](/math/system-elements), written $D$ and $D_b$ in the worked examples; in [LP Layout and Scaling](/math/lp-layout-and-scaling) $D_r$ and $D_c$ are the diagonal row and column scaling matrices.
- $i$ is the Benders cut index; in [PAR(p) Inflow Model](/math/par-inflow-model) $(i, j)$ index the rows and columns of the periodic Yule-Walker system, in [Scenario Generation](/math/scenario-generation) $i$ indexes the entities of a correlation group, in [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes the vertices of the inner approximation, in [State Augmentation](/math/state-augmentation), [System Element Modeling Overview](/math/system-elements), [SDDP Algorithm](/math/sddp-algorithm), [Post-Study Boundary & Chained Studies](/math/post-study-boundary) and the [Glossary](/reference/glossary) it indexes the anticipated thermal plants, in [LP Layout and Scaling](/math/lp-layout-and-scaling) it is the LP row index, and in [Hydro Production Function Models](/math/hydro-production-models) it indexes the storage points of the volume-height curve, $v^{(i)}$ and $h^{(i)}$, and of the FPHA fitting grid, $V_i$.
- $j$ is the thermal-plant index; in [Scenario Generation](/math/scenario-generation), [SDDP Algorithm](/math/sddp-algorithm) and the worked examples it indexes the openings of a stage, in [Cut Management](/math/cut-management) and [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes the components of the state vector, in [LP Layout and Scaling](/math/lp-layout-and-scaling) it is the LP column index, and in [Hydro Production Function Models](/math/hydro-production-models) it indexes the turbined-flow points $Q_j$ of the FPHA fitting grid.
- $K_i$ is the ring depth of anticipated thermal $i$ in [State Augmentation](/math/state-augmentation), [System Element Modeling Overview](/math/system-elements) and the [Glossary](/reference/glossary); in [LP Layout and Scaling](/math/lp-layout-and-scaling) and [Cut Management](/math/cut-management) the bare $K$ is the cost-scale factor.
- $M$ is the number of seasons in the cycle of the inflow model and of a cyclic policy graph; in [Hydro Production Function Models](/math/hydro-production-models) it is the number of FPHA hyperplanes of a plant, and in [SDDP Algorithm](/math/sddp-algorithm), [Discount Rate Formulation](/math/discount-rate) and [Upper Bound Evaluation](/math/upper-bound-evaluation) the number of forward-pass trajectories of an iteration.
- $m$ indexes the seasons of the inflow model, with $m(t)$ the season of stage $t$, and, in $\gamma^m$ and $\pi^{fpha}_m$, the planes $m \in \mathcal{M}_h$ of an FPHA model; in [SDDP Algorithm](/math/sddp-algorithm), [Discount Rate Formulation](/math/discount-rate) and [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes trajectories, forward-pass or simulated, and in [State Augmentation](/math/state-augmentation), [System Element Modeling Overview](/math/system-elements) and [Post-Study Boundary & Chained Studies](/math/post-study-boundary) it is the delivery stage of an anticipated commitment.
- $N$ is the number of hydro plants; in [Scenario Generation](/math/scenario-generation) it is the uniform branching factor of the scenario tree ($N_t = N$), and in [Upper Bound Evaluation](/math/upper-bound-evaluation) the number of out-of-sample simulation scenarios.
- $n$ is a node of a policy graph or of an enumerated scenario tree; in [Horizon Modes](/math/horizon-modes) it counts cycle repetitions, in [LP Formulation](/math/lp-formulation), [System Element Modeling Overview](/math/system-elements), [Equipment-Specific Formulations](/math/equipment-formulations) and [Penalty System](/math/penalty-system) it is the transmission-line index, in [PAR(p) Inflow Model](/math/par-inflow-model) it is the dimension of the correlation matrix with eigenvalues $\lambda_1, \ldots, \lambda_n$, and in [Hydro Production Function Models](/math/hydro-production-models) the superscript of $h_{tail}^{(n)}$ indexes the segments of a piecewise-quartic tailrace curve.
- $p(\omega)$ is the probability of opening $\omega$; in [Hydro Production Function Models](/math/hydro-production-models) $p$ is the security-curve fraction of the maximum stored energy, and in [LP Formulation](/math/lp-formulation), [System Element Modeling Overview](/math/system-elements) and [Equipment-Specific Formulations](/math/equipment-formulations) $p_{y,k}$ is the pumped flow of station $y$.
- $Q_t$ is the optimal value of the stage-$t$ LP as a function of its incoming state; in [Hydro Production Function Models](/math/hydro-production-models) $Q$ is the turbined-flow coordinate of the FPHA fitting grid.
- $q_{h,k}$ is the turbined flow of hydro $h$; in [Upper Bound Evaluation](/math/upper-bound-evaluation) $q_{n \to n'}$ is the conditional probability of reaching child node $n'$ from node $n$ of an enumerated scenario tree; in [Risk Measures](/math/risk-measures) $q^*$ is the vector of CVaR tail weights.
- $r_h$ is the water-withdrawal target of hydro $h$ in [LP Formulation](/math/lp-formulation), [System Element Modeling Overview](/math/system-elements), [Block Formulation Variants](/math/block-formulations) and [Penalty System](/math/penalty-system); in [PAR(p) Inflow Model](/math/par-inflow-model) $r_m$ is the standardized innovation scale of season $m$, in [Discount Rate Formulation](/math/discount-rate) $r_t$ is the annual discount rate that applies to stage $t$, and in [State Augmentation](/math/state-augmentation) $r_i(m)$ is the ring position of anticipated thermal $i$'s delivery at stage $m$.
- $s$ indexes the deficit segments of a bus in [LP Formulation](/math/lp-formulation), [System Element Modeling Overview](/math/system-elements) and [Penalty System](/math/penalty-system); in [State Augmentation](/math/state-augmentation), [SDDP Algorithm](/math/sddp-algorithm) and [Policy Checkpoint](/reference/output/policy) it indexes the slots of an anticipated thermal's commitment ring. The spillage $s_{h,k}$ and the standard deviations $s_m$, $s^{\text{load}}_{b,t}$ and $s^{nc}_r$ are distinct forms.
- $u_{h,k}$ is the diversion flow of hydro $h$, and $u$ indexes the unit groups of a (hydro, bus) cell, in the System Modelling chapters; in [SDDP Algorithm](/math/sddp-algorithm), [Risk Measures](/math/risk-measures), [Upper Bound Evaluation](/math/upper-bound-evaluation), [Horizon Modes](/math/horizon-modes), [Policy Graphs](/math/policy-graphs), [Discount Rate Formulation](/math/discount-rate), [The SDDP Framework in One Page](/overview/sddp-framework-overview) and the [Glossary](/reference/glossary) $u_t$ is the control vector of the stage problem.
- $w_k$ is the weight of block $k$ in the System Modelling chapters; in [Upper Bound Evaluation](/math/upper-bound-evaluation) and the [Glossary](/reference/glossary) $w_m$ is the census weight of simulation scenario $m$, in [PAR(p) Inflow Model](/math/par-inflow-model) $w$ indexes the rolling windows of a season bucket, and in [Multi-Resolution Studies](/math/multi-resolution-studies) $w_{t,\mathcal{W}}$ is the share of lag period $\mathcal{W}$ covered by stage $t$.
- $y$ indexes the pumping stations in the System Modelling chapters; in [Scenario Generation](/math/scenario-generation) $y \in W$ is a window year of historical replay.
- $Z$ is the random cost a risk measure applies to; in [PAR(p) Inflow Model](/math/par-inflow-model) it is the standardised series on which the PAR(p)-A conditional partial autocorrelation conditions.
- $z$ is the vector of independent standard normal draws that the correlation factor maps to correlated noise; in [LP Formulation](/math/lp-formulation), [State Augmentation](/math/state-augmentation) and [LP Layout and Scaling](/math/lp-layout-and-scaling) $z_h$ is the realized-inflow column of hydro $h$.
- $\delta_{b,k,s}$ is the load deficit at bus $b$, block $k$, segment $s$; in [Hydro Production Function Models](/math/hydro-production-models) $\delta$ is the normalised mean-squared generation difference of two FPHA planes, and in [Scenario Generation](/math/scenario-generation) $\delta_t$ is the offset from the window year to the year of stage $t$'s season occurrence.
- $\varepsilon$ with an entity, stage or source index is a noise innovation ($\varepsilon_t$, $\varepsilon^{\text{load}}_{b,t}$, $\varepsilon^{nc}_r$) and with a text subscript a tolerance ($\varepsilon_{\text{viol}}$, $\varepsilon_{\text{stall}}$, $\varepsilon_{\text{abs}}$, $\varepsilon_{\text{rel}}$); in [Hydro Production Function Models](/math/hydro-production-models) the bare $\varepsilon$ is the merge tolerance of FPHA plane reduction.
- $\eta$ with an entity index is an efficiency ($\eta_h$ of a turbine, $\eta_n$ of a transmission line); in [Risk Measures](/math/risk-measures) and [The SDDP Framework in One Page](/overview/sddp-framework-overview) $\eta$ is the threshold variable of the CVaR minimization formula.
- $\theta_t$ is the future-cost epigraph variable, approximating $V_{t+1}(x_t)$; in [Hydro Production Function Models](/math/hydro-production-models) $\theta$ is the angle between the normals of two FPHA planes.
- $\kappa_{r,k}$ is the curtailment of non-controllable source $r$ in [System Element Modeling Overview](/math/system-elements) and [Equipment-Specific Formulations](/math/equipment-formulations); in [Hydro Production Function Models](/math/hydro-production-models) $\kappa$ is the intercept-only correction factor of precomputed FPHA planes, and in [Penalty System](/math/penalty-system) $\kappa = 10^6/3600$ is the number of (m³/s)·h in one hm³.
- $\mu$ with a season, bus or source index is a mean ($\mu_m$, $\mu^A_m$, $\mu^{\text{load}}_{b,t}$, $\mu^{nc}_r$); in [Risk Measures](/math/risk-measures) $\mu$ is a risk-adjusted probability vector.
- $\epsilon_{b,k}$ is the excess generation at bus $b$, block $k$, in [LP Formulation](/math/lp-formulation), [System Element Modeling Overview](/math/system-elements) and [Penalty System](/math/penalty-system); in [Cut Management](/math/cut-management) $\epsilon$ is the cut-activity tolerance of periodic pruning.
- $\mathcal{C}$ is the contract set, with $\mathcal{C}^{imp}$, $\mathcal{C}^{exp}$ and their per-bus subsets, in the System Modelling chapters; in [Horizon Modes](/math/horizon-modes) $\mathcal{C}_\tau$ is the set of stages that occupy season $\tau$ of a cyclic policy graph.
- $\mathcal{P}$ is the pumping-station set, with per-bus subsets $\mathcal{P}_b$, in the System Modelling chapters; in [Risk Measures](/math/risk-measures) it is the probability simplex of the scenario probabilities.
- $\mathcal{M}_h$ is the FPHA hyperplane set of hydro $h$; in [Risk Measures](/math/risk-measures) $\mathcal{M}(p)$, $\mathcal{M}_\alpha(p)$ and $\mathcal{M}^{EAVaR}(p)$ are risk sets of the dual representation of a convex risk measure.
- $\mathcal{X}_t(x_{t-1}, \omega_t)$ is the feasible set of the stage-$t$ state and control; in [Cut Management](/math/cut-management) $\mathcal{X}_t$ is the feasible state set on which a cut is valid.
- $I_t$ is the number of vertices stored at stage $t$ in [Upper Bound Evaluation](/math/upper-bound-evaluation); in [LP Formulation](/math/lp-formulation) $I_{h,k}$ is the inflow of hydro $h$ in block $k$ that a hydro-inflow term reads.
- $\xi_r$ is the availability ratio of non-controllable source $r$ in [System Element Modeling Overview](/math/system-elements), [Equipment-Specific Formulations](/math/equipment-formulations) and [Scenario Generation](/math/scenario-generation); in [Inflow Non-Negativity Solution Methods](/math/inflow-nonnegativity) $\xi_h$ is the noise-adjustment slack of the reference design.

### Stage Indexing

Math formulas throughout this corpus index stages starting at $1$: $t \in \{1, \ldots, T\}$ (the convention already fixed above). Novomodelo's configuration files and Parquet outputs instead identify a stage by its **declared** `stage_id` — the integer `id` the stage carries in `stages.json`. Declared ids need not start at $0$ or be contiguous (a pre-study stage may carry a negative id); stages are ordered by id ascending, and $t$ is a study stage's position in that order.

| Context                                         | Convention                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| Math (this corpus)                              | $t \in \{1, \ldots, T\}$ — position in ascending-id order          |
| Config `stage_id` and fields built on it        | The declared stage `id` from `stages.json`                          |
| Output `stage_id` column (simulation, training) | The same declared stage `id`, unchanged                             |
| Mapping, when ids are declared densely from $0$ | $\text{stage\_id} = t - 1$                                          |

Every math-layer chapter uses the 1-based $t$. Every JSON config field, Parquet output column, and CLI reference named `stage_id`, and every stage-window field built on it, carries the declared id, not a position, and a stage window is compared against declared ids. The offset $\text{stage\_id} = t - 1$ holds only for a case whose study stages are declared $0, 1, \ldots, T-1$. No other chapter restates this mapping; it defers here.

### Terminology

Two term choices are pinned corpus-wide:

- **Opening** is the canonical term for a single realization drawn from a stage's set of pre-generated noise vectors (e.g. "every opening $\omega \in \Omega_t$"). "Branch"/"branching" is reserved for the abstract scenario-tree _structure_ itself — the branching factor $N_t$ (how many children a node has) — used only where a chapter discusses the tree's topology, such as [Scenario Generation](/math/scenario-generation), never for a specific drawn realization.
- **Cost-to-go** is the canonical term for the value function $V_t(x)$ (§1 above) in math-layer prose. "FCF" (_Função de Custo Futuro_) is reserved for the bilingual [Glossary](/reference/glossary), which maps terms from other planning tools.

## 2. Index Sets

| Symbol                                      | Description                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| $t \in \{1, \ldots, T\}$                    | Stages                                                                                            |
| $k \in \mathcal{K}$                         | Blocks within stage                                                                               |
| $\mathcal{B}$ | Buses, indexed by $b$ |
| $\mathcal{H}$ | Hydro plants, indexed by $h$ |
| $\mathcal{H}^{op} \subseteq \mathcal{H}$    | Operating hydros (can generate)                                                                   |
| $\mathcal{H}^{fill} \subseteq \mathcal{H}$  | Filling hydros (no generation)                                                                    |
| $\mathcal{H}^{fpha} \subseteq \mathcal{H}$  | Hydros using FPHA production model                                                                |
| $\mathcal{H}^{const} \subseteq \mathcal{H}$ | Hydros using constant productivity (complement of $\mathcal{H}^{fpha}$ within $\mathcal{H}^{op}$) |
| $\mathcal{T}$ | Thermal plants, indexed by $j$ |
| $\mathcal{R}$ | Non-controllable generation sources, indexed by $r$ |
| $\mathcal{L}$ | Transmission lines, indexed by $n$ |
| $\mathcal{C}$ | All contracts ($\mathcal{C}^{imp} \cup \mathcal{C}^{exp}$), indexed by $c$ |
| $\mathcal{C}^{imp}$, $\mathcal{C}^{exp}$    | Import/export contracts                                                                           |
| $\mathcal{P}$ | Pumping stations, indexed by $y$ |
| $\mathcal{G}$ | Generic constraints, indexed by $g$ |
| $\mathcal{S}_b$ | Deficit segments for bus $b$, indexed by $s$ |
| $\mathcal{B}_h \subseteq \mathcal{B}$       | Buses hosting one of hydro $h$'s (hydro, bus) cells                                               |
| $(h, b)$ | (hydro, bus) cell: the unit groups of plant $h$ that share bus $b \in \mathcal{B}_h$, indexed by $u$; turbined flow and generation are tracked per cell |
| $\mathcal{H}_b$, $\mathcal{T}_b$, $\mathcal{R}_b$, $\mathcal{P}_b$ | Hydros with a cell at bus $b$; thermals, non-controllable sources and pumping stations connected to bus $b$ |
| $\mathcal{C}^{imp}_b$, $\mathcal{C}^{exp}_b$ | Import and export contracts connected to bus $b$ |
| $\mathcal{M}_h$ | FPHA planes for hydro $h$, indexed by $m$ |
| $\mathcal{U}_h$ | Upstream hydros of $h$, indexed by $h'$ |
| $\Omega_t$ | Openings of stage $t$ |

:::note[Entity Indexing]
Every operational entity index set above ($\mathcal{B}$, $\mathcal{H}$, $\mathcal{T}$, $\mathcal{R}$, $\mathcal{L}$, $\mathcal{C}$, $\mathcal{P}$) is enumerated in the canonical $(\text{operational\_start\_date}, \text{id})$ order: primarily by each entity's operational start date, then — among entities sharing a date — by its unique id. This is the order every state block, the dense LP column layout, and the output column order follow. See [Determinism & Provenance](/math/determinism-guarantees) and [LP Layout and Scaling](/math/lp-layout-and-scaling).
:::

## 3. Parameters

### 3.1 Time and Conversion

| Symbol                         | Units      | Description                            |
| ------------------------------ | ---------- | -------------------------------------- |
| $\tau_k$                       | hours      | Duration of block $k$                  |
| $H_t = \sum_{k \in \mathcal{K}} \tau_k$ | hours | Total duration of stage $t$ |
| $w_k = \tau_k / H_t$ | - | Block weight (fraction of stage) |
| $\zeta$                        | hm³/(m³/s) | Time conversion: m³/s over stage → hm³ |
| $\zeta_k = 0.0036 \times \tau_k$ | hm³/(m³/s) | Block conversion: m³/s over block $k$ → hm³; $\zeta_k = w_k\,\zeta$ and $\sum_{k \in \mathcal{K}} \zeta_k = \zeta$ |
| $d_{t \to t+1}$ | - | Discount factor of the transition from stage $t$ to $t+1$, applied to $\theta_t$ in the stage-$t$ objective |
| $d_{1 \to t}$ | - | Cumulative discount factor of stage $t$: the product of the one-step factors of stages $1$ to $t - 1$, with $d_{1 \to 1} = 1$ |
| $d_{t_1 \to t_2}$ | - | Discount from stage $t_2$ back to stage $t_1 \le t_2$, $d_{1 \to t_2} / d_{1 \to t_1}$ |
| $d_{\text{cycle}}$ | - | Cumulative discount around one cycle of a cyclic policy graph, $d_{\text{cycle}} = \prod_{t \in \text{cycle}} d_{t \to t+1} < 1$ |

#### Time Conversion Factor Derivation

The factor $\zeta$ converts a flow rate in m³/s to a volume in hm³ accumulated over the stage duration.

$$
\zeta = 0.0036 \times \sum_{k \in \mathcal{K}} \tau_k \quad [\mathrm{hm}^3/(\mathrm{m}^3/\mathrm{s})]
$$

**Dimensional Analysis**:

$$
[\zeta] = \frac{\text{s}}{\text{h}} \times \frac{\mathrm{hm}^3}{\mathrm{m}^3} \times \text{h} = \frac{\mathrm{hm}^3}{\mathrm{m}^3/\mathrm{s}}
$$

### 3.2 Load and Costs

Cost coefficients use $c$ with a superscript naming the cost type.

| Symbol          | Units       | Description                                              |
| --------------- | ----------- | -------------------------------------------------------- |
| $D_{b,k}$       | MW          | Load at bus $b$, block $k$                               |
| $c^{def}_{b,s}$ | \$/MWh      | Deficit cost at bus $b$, segment $s$                     |
| $\bar{d}_{b,s}$ | MW          | Deficit segment depth                                    |
| $c^{exc}_b$     | \$/MWh      | Excess generation cost                                   |
| $c^{th}_j$ | \$/MWh | Marginal cost of thermal plant $j$ |
| $c^{spill}_h$   | \$/(m³/s·h) | Spillage cost                                            |
| $c^{div}_h$     | \$/(m³/s·h) | Diversion cost                                           |
| $c^{tc}_h$ | \$/(m³/s·h) | Turbined-flow regularization cost of hydro $h$, charged on the turbined flow of every cell |
| $c^{sv-}_h$ | \$/hm³ | Storage-below-minimum penalty, pricing the soft dead-volume floor of a filling hydro once it operates |
| $c^{fill}_h$ | \$/hm³ | Filling-target shortfall penalty |
| $c^{tv-}_h$ | \$/(m³/s·h) | Turbined-flow-minimum violation penalty, charged on every cell of hydro $h$ |
| $c^{ov-}_h$, $c^{ov+}_h$ | \$/(m³/s·h) | Outflow below-minimum and above-maximum violation penalties |
| $c^{gv-}_h$ | \$/MWh | Generation-minimum violation penalty, charged on every cell of hydro $h$ |
| $c^{ev+}_h$, $c^{ev-}_h$ | \$/(m³/s·h) | Evaporation above-target and below-target violation penalties |
| $c^{wv+}_h$, $c^{wv-}_h$ | \$/(m³/s·h) | Water-withdrawal over-delivery and under-delivery penalties |
| $c^{inf}_h$ | \$/(m³/s·h) | Inflow non-negativity penalty (penalty-based inflow methods) |
| $c^{exch}_n$ | \$/MWh | Exchange (transmission) cost |
| $c^{curt}_r$ | \$/MWh | Curtailment regularization cost of non-controllable source $r$ |
| $c^{ctr}_c$     | \$/MWh      | Contract price (signed: + import cost, − export revenue) |
| $c_i(t)$ | \$/MWh | Unit cost of anticipated thermal $i$ at stage $t$; a commitment for delivery stage $m$ is priced at $c_i(m)$ on its decision column |
| $K$ | - | Cost-scale factor: every objective coefficient except that of $\theta$ is divided by $K$, so cuts are held in scaled cost units ([LP Layout and Scaling §2.1](/math/lp-layout-and-scaling#21-cost-scaling)) |

### 3.3 Hydro Parameters

| Symbol                                           | Units     | Description                                                                                                                                                                                                             |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| $\hat{v}_h$                                      | hm³       | Incoming storage (state from previous stage)                                                                                                                                                                            |
| $\bar{V}_h$, $\underline{V}_h$                   | hm³       | Storage bounds                                                                                                                                                                                                          |
| $\bar{Q}_h$, $\underline{Q}_h$ | m³/s | Plant turbined-flow bounds; the plant maximum caps every cell |
| $\bar{Q}_{h,b}$, $\underline{Q}_{h,b}$ | m³/s | Cell turbined-flow bounds: the maximum sums the cell's unit-group maxima (under constant productivity each also limited by its generation maximum) and is capped by the plant maximum; the minimum sums their minima and is a soft floor |
| $\bar{Q}_u$ | m³/s | Turbined-flow maximum of unit group $u$ |
| $\bar{G}_h$, $\underline{G}_h$ | MW | Plant generation bounds; the plant maximum caps every cell |
| $\bar{G}_{h,b}$, $\underline{G}_{h,b}$ | MW | Cell generation bounds: the maximum sums the cell's unit-group maxima and is capped by the plant maximum; the minimum sums their minima and is a soft floor |
| $\lambda_{h,b}$ | - | Share of cell $(h, b)$ in plant $h$'s declared turbine capacity; it apportions the flow-independent part of each FPHA plane among the cells |
| $\bar{O}_h$, $\underline{O}_h$                   | m³/s      | Outflow bounds                                                                                                                                                                                                          |
| $\bar{U}_h$ | m³/s | Maximum diversion flow |
| $r_h$                                            | m³/s      | Water withdrawal target — stage-level, signed fixed RHS parameter (not a per-block LP decision variable); negative = inter-basin return/addition. See [LP Formulation](/math/lp-formulation).                           |
| $\rho_h$                                         | MW/(m³/s) | Productivity (constant model)                                                                                                                                                                                           |
| $V^{min}_h$, $V^{max}_h$ | hm³ | Physical storage range — stage-invariant plant property (dead-volume floor, full-reservoir ceiling); distinct from the operative storage-variable bounds $\underline{V}_h$, $\bar{V}_h$. See [Hydro Production Function Models](/math/hydro-production-models). |
| $\rho_{eq,h,t}$ | MW/(m³/s) | Equivalent productivity at the reference operating point. See [Hydro Production Function Models](/math/hydro-production-models). |
| $\rho_{acum,h,t}$ | MW/(m³/s) | Accumulated cascade productivity (plant plus downstream), reference-point evaluator. See [Hydro Production Function Models](/math/hydro-production-models). |
| $\bar\rho_{eq,h,t}$ | MW/(m³/s) | Useful-range mean equivalent productivity — forebay level averaged over $[V^{min}_h, V^{max}_h]$. See [Hydro Production Function Models](/math/hydro-production-models). |
| $\bar\rho_{acum,h,t}$ | MW/(m³/s) | Useful-range mean accumulated cascade productivity. See [Hydro Production Function Models](/math/hydro-production-models). |
| $E^{max}_{h,t}$ | MW/(m³/s)·hm³ | Maximum stored energy $\bar\rho_{acum,h,t}\,(V^{max}_h - V^{min}_h)$ (raw unit, not MWh). See [Hydro Production Function Models](/math/hydro-production-models). |
| $\gamma_0^m, \gamma_v^m, \gamma_q^m, \gamma_s^m$ | -         | FPHA plane $m$ coefficients — intercept ($\gamma_0^m$), storage/volume ($\gamma_v^m$), turbined flow ($\gamma_q^m$), spillage ($\gamma_s^m$); already $k_{FPHA}$-scaled. Lowercase by convention — never $\Gamma$. |
| $k_{FPHA}$                                  | -         | FPHA least-squares fit-correction factor; scales the fitted plane set. See [Hydro Production Function Models](/math/hydro-production-models).                         |
| $\phi(v, q, s)$ | MW | Exact hydro production function: generation at storage $v$, turbined flow $q$ and spillage $s$, proportional to $q$ and to the net head $h_{net}$. See [Hydro Production Function Models](/math/hydro-production-models). |
| $h_{net}(v, q, s) = h_{fore}(v) - h_{tail}(q + s) - h_{loss}$ | m | Net head, clamped at zero: the forebay level $h_{fore}$, a function of storage, minus the tailrace level $h_{tail}$, a function of total outflow, minus the hydraulic head losses $h_{loss}$ |
| $V_i$, $Q_j$ | hm³, m³/s | Storage point $i$ and turbined-flow point $j$ of the FPHA fitting grid, on the storage and turbined-flow coordinates $V$ and $Q$ |
| $L$ | - | Last filling stage of a filling hydro, the stage before its entry stage |
| $\text{rate}_t$ | m³/s | Minimum accumulation rate of a filling hydro at stage $t$ |
| $V^{\text{target}}_t$ | hm³ | Minimum end-of-stage storage of a filling hydro at stage $t$ (the filling floor), reaching $\underline{V}_h$ at stage $L$ |
| $L_h$ | stages | Bucket depth of receiving plant $h$: the deepest maturity lag any travel-time arc into $h$ reaches on the stage calendar |
| $\phi_{h,k}$ | - | Arrival density of plant $h$'s maturing in-transit volume over the blocks $k$ of a chronological stage, $\phi_{h,k} \geq 0$, $\sum_k \phi_{h,k} = 1$; on a parallel stage $\phi_{h,k} = w_k = \tau_k / H_t$ in a hydro-inflow term ([LP Formulation §10](/math/lp-formulation#hydro-inflow)) |
| $\Delta^{tt}_{h'}$ | hours | Travel time of the main cascade arc of upstream hydro $h'$, $0$ when none is declared |
| $\nu_{h',t,0}$ | - | Same-stage share of $h'$'s release on the downstream water balance at stage $t$, $(H_t - \Delta^{tt}_{h'})^+ / H_t$ |
| $\nu^{k' \to k}_{h',t}$ | - | Within-stage routing share on a chronological stage, from $h'$'s block $k'$ to the downstream block $k \ge k'$ |
| $\gamma^{ev}_{0,h}$, $\gamma^{ev}_{v,h}$ | m³/s, (m³/s)/hm³ | Linearized net-evaporation intercept and storage slope of hydro $h$ at the current stage |

### 3.4 Thermal, Network and Equipment Parameters

| Symbol                              | Units | Description                                                              |
| ----------------------------------- | ----- | ------------------------------------------------------------------------ |
| $\bar{G}_j$, $\underline{G}_j$ | MW | Thermal generation bounds: capacity and minimum stable load |
| $K_i$ | - | Ring depth of anticipated thermal $i$; the lead for a stage-count lead |
| $k_{max} = \max_i K_i$ | - | Number of slots in every anticipated thermal's commitment ring |
| $t_i(m)$ | - | Decision stage of anticipated thermal $i$'s delivery at stage $m$: $m - K_i$ under a stage-count lead, and under a physical lead the stage containing the instant one lead time before the end of stage $m$ (an instant on a stage boundary belongs to the earlier stage); a delivery decided before the study has none |
| $r_i(m)$ | - | Ring position of anticipated thermal $i$'s delivery at stage $m$; the delivery holds slot $r_i(m) \bmod k_{max}$ |
| $\bar{F}^+_n$, $\bar{F}^-_n$  | MW    | Line capacity (direct/reverse)                                           |
| $\eta_n = 1 - \text{losses}/100$ | -     | Reported line efficiency: scales the post-solve reported transmission losses, $(1-\eta_n)(f^+ + f^-)$; it does not enter the dispatch LP, whose line flows carry coefficient ±1. Distinct from the PAR innovation $\varepsilon_t$ (§3.5). |
| $\text{loss}_{n,k}$ | MW | Reported transmission loss of line $n$ in block $k$, $(1-\eta_n)(f^+_{n,k} + f^-_{n,k})$ |
| $\bar{C}_c$, $\underline{C}_c$      | MW    | Contract capacity bounds                                                 |
| $\rho^{pump}_y$ | MW/(m³/s) | Power consumption rate of pumping station $y$ |
| $\bar{P}_y$, $\underline{P}_y$ | m³/s | Pumped-flow bounds of station $y$ |
| $\bar{G}_r$ | MW | Installed capacity of non-controllable source $r$ |
| $A_{r,k}$ | MW | Available generation of non-controllable source $r$ in block $k$ for the current stage and scenario, $\bar{G}_r \, \xi_r \, f_{r,k}$ |
| $\xi_r$ | - | Availability ratio of non-controllable source $r$ for the current stage and scenario, in $[0, 1]$ |
| $\mu^{nc}_r$, $s^{nc}_r$ | - | Mean and standard deviation of the unclamped availability factor of non-controllable source $r$ at the current stage |
| $\varepsilon^{nc}_r$ | - | Standard-normal noise of non-controllable source $r$: $\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r \, \varepsilon^{nc}_r, 0, 1)$ |
| $f_{r,k}$ | - | Block factor of non-controllable source $r$ in block $k$ |

### 3.5 Inflow Model Parameters

:::note[Note on Periodicity]
The PAR(p) model uses periodic parameters that repeat with a cycle length $M$. Common configurations:

- **Monthly stages**: $M=12$ (seasons = months)
- **Weekly stages**: $M=52$ (seasons = weeks)
- **Custom resolution**: $M$ = number of distinct periods in the cycle

We use **"season $m$"** as a generic term for the position within the cycle, avoiding the term "month" which is resolution-specific. Seasons are numbered $m \in \{1, \ldots, M\}$. The season $m(t)$ of stage $t$ is the stage's resolved season: the season the stage declares or, when it declares none, the season its start date falls in on the calendar. The season $\ell$ lags before season $m$ is its $\ell$-th calendar predecessor, so season arithmetic such as $m - \ell$ is taken modulo $M$ on $\{1, \ldots, M\}$.
:::

| Symbol             | Units | Description                                                                                                                                                                                                                                      |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| $\mu_m$            | m³/s  | Seasonal mean inflow for season $m$                                                                                                                                                                                                              |
| $s_m$ | m³/s | Seasonal sample standard deviation of season $m$ (population divisor) |
| $\psi_{m,\ell}$ | - | AR coefficient for season $m$, lag $\ell$ (original units) |
| $\psi^*_{m,\ell}$ | - | Standardized AR coefficient, $\psi^*_{m,\ell} = \psi_{m,\ell}\, s_{m-\ell} / s_m$ |
| $P_h$ | - | AR order of hydro $h$; its lags are $\ell \in \{1, \ldots, P_h\}$ |
| $P^{\max}$ | - | Lag depth of the inflow-lag state, the same for every hydro: the largest AR order, $\max_h P_h$, raised to at least twelve when any hydro carries the annual component, and to the deepest lag a terminal boundary references ([State Augmentation §4](/math/state-augmentation#4-inflow-lags)) |
| $r_m$ | - | Standardized innovation scale, $r_m = \sigma_m / s_m \in (0, 1]$ |
| $\sigma_m$ | m³/s | Innovation (residual) standard deviation for season $m$, $\sigma_m = s_m\, r_m$ |
| $b_{h,m(t)}$ | m³/s | Deterministic base of the PAR(p) inflow equation at season $m = m(t)$: $\mu_m - \sum_{\ell=1}^{P_h} \psi_{m,\ell}\, \mu_{m-\ell}$ |
| $\mu^A_m$, $\sigma^A_m$ | m³/s | Seasonal mean and standard deviation (population divisor) of season $m$'s annual regressor in PAR(p)-A |
| $\rho_m(\ell)$ | - | Periodic autocorrelation at lag $\ell$ for season $m$ |
| $N_m$ | - | Number of historical observations of season $m$ |
| $z_{0.975}$ | - | Standard-normal 0.975 quantile: the critical value of the PACF significance test at the 95 % level |
| $\varepsilon_t$    | -     | PAR innovation: standardized noise term, $\varepsilon_t \sim \mathcal{N}(0,1)$ (distinct from the line efficiency $\eta_n$, §3.4, and the excess-generation variable $\epsilon_{b,k}$, §4.1). See [PAR(p) Inflow Model](/math/par-inflow-model). |
| $z$ | - | Vector of independent standard normal draws, $z \sim \mathcal{N}(0, I)$, mapped to correlated noise |
| $C$ | - | Spatial correlation matrix of a correlation group |
| $U$, $\Lambda$ | - | Eigendecomposition $C = U \Lambda U^\top$: orthogonal eigenvectors $U$ and the diagonal $\Lambda = \mathrm{diag}(\lambda_1, \ldots, \lambda_n)$ of the eigenvalues $\lambda_i$ |
| $\tilde{\Lambda}^{1/2}$ | - | Square roots of the eigenvalues clipped at zero, $\mathrm{diag}(\sqrt{\max(\lambda_1, 0)}, \ldots, \sqrt{\max(\lambda_n, 0)})$ |
| $C^{1/2}$ | - | Spectral correlation factor $U \Lambda^{1/2} U^\top$, negative eigenvalues clipped to zero; the correlated noise is $C^{1/2} z$ |
| $a_h$ | m³/s | Incremental inflow of hydro $h$ at the current stage |
| $\hat{a}_{h,\ell}$ | m³/s  | Incoming AR lag $\ell$ (state)                                                                                                                                                                                                                   |

## 4. Decision Variables

:::note[Notation Convention]

- **Generation variables** use $g$ with entity subscript: $g_{h,b,k}$ (hydro, per (hydro, bus) cell), $g_{j,k}$ (thermal plant $j$), $g^{nc}_{r,k}$ (non-controllable source $r$)
- **Flow variables** use intuitive single letters: $q$ (turbined), $s$ (spillage), $u$ (diversion/bypass)
- **Total outflow** is explicitly defined: $o_h = q_h + s_h$ (downstream channel flow)
- **Contract variables** use a single $\chi_c$ (chi) per contract; direction is carried by set membership ($c \in \mathcal{C}^{imp}$ or $c \in \mathcal{C}^{exp}$), not a superscript — each contract is unidirectional
- **Slack variables** use $\sigma$ with constraint-type superscript
  :::

### 4.1 Per-Block Variables

Per-block variables are indexed by $k \in \mathcal{K}$:

| Variable         | Domain                         | Units | Description                                                                                                                                   |
| ---------------- | ------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| $\delta_{b,k,s}$ | $[0, \bar{d}_{b,s}]$           | MW    | Deficit at bus $b$, segment $s$                                                                                                               |
| $\epsilon_{b,k}$ | $\geq 0$                       | MW    | Excess generation at bus $b$                                                                                                                  |
| $f^+_{n,k}$   | $[0, \bar{F}^+_n]$          | MW    | Direct flow on line $n$                                                                                                                    |
| $f^-_{n,k}$   | $[0, \bar{F}^-_n]$          | MW    | Reverse flow on line $n$                                                                                                                   |
| $g_{j,k}$ | $[\underline{G}_j, \bar{G}_j]$ | MW | Generation of thermal plant $j$ |
| $q_{h,b,k}$ | $[0, \bar{Q}_{h,b}]$ | m³/s | Turbined flow of cell $(h, b)$; its minimum $\underline{Q}_{h,b}$ is a soft floor (slack $\sigma^{q-}_{h,b,k}$) |
| $q_{h,k}$ | - | m³/s | Plant turbined flow, $q_{h,k} = \sum_{b \in \mathcal{B}_h} q_{h,b,k}$ |
| $s_{h,k}$        | $\geq 0$                       | m³/s  | Spillage at hydro $h$                                                                                                                         |
| $g_{h,b,k}$ | $[0, \bar{G}_{h,b}]$ | MW | Hydro generation of cell $(h, b)$, injected at bus $b$; its minimum $\underline{G}_{h,b}$ is a soft floor (slack $\sigma^{g-}_{h,b,k}$) |
| $g_{h,k}$ | - | MW | Plant hydro generation, $g_{h,k} = \sum_{b \in \mathcal{B}_h} g_{h,b,k}$ |
| $v_{h,k}$ | $[\underline{V}_h, \bar{V}_h]$ | hm³ | Storage at the end of block $k$ on a chronological stage, $v_{h,0} = \hat{v}_h$; only $v_{h,\lvert\mathcal{K}\rvert}$ is state; the column lower bound is $0$, not $\underline{V}_h$, for a filling hydro and for a hydro not in service (see [LP Formulation §8](/math/lp-formulation#8-variable-bounds-and-minimum-constraints)) |
| $u_{h,k}$        | $[0, \bar{U}_h]$               | m³/s  | Diversion/bypass flow (to separate channel)                                                                                                   |
| $o_{h,k}$        | -                              | m³/s  | Total downstream outflow: $o_{h,k} = q_{h,k} + s_{h,k}$                                                                                       |
| $e_{h,k}$ | bounded | m³/s | Net evaporation flow (negative for net rainfall input): one stage-level value $e_h$ on a parallel stage, one per block $k$ on a chronological stage; its magnitude has a per-stage bound |
| $\text{net\_flows}_{h,k}$ | - | m³/s | Net per-block flow terms of hydro $h$'s water balance in block $k$: the turbined and spilled release credited from upstream and the flows diverted and pumped in, minus the plant's own turbined, spilled and diverted flow and its pumped-out flow |
| $p_{y,k}$        | $[\underline{P}_y, \bar{P}_y]$ | m³/s  | Pumped flow at station $y$                                                                                                                    |
| $\chi_{c,k}$     | $[\underline{C}_c, \bar{C}_c]$ | MW    | Contract dispatch (import if $c \in \mathcal{C}^{imp}$, export if $c \in \mathcal{C}^{exp}$); $\underline{C}_c > 0$ is a take-or-pay floor    |
| $g^{nc}_{r,k}$ | $[0, A_{r,k}]$ | MW | Generation of non-controllable source $r$ |
| $\kappa_{r,k}$ | - | MW | Curtailment of non-controllable source $r$, $\kappa_{r,k} = A_{r,k} - g^{nc}_{r,k}$ (derived) |

### 4.2 Stage-Level State Variables

| Variable                 | Domain                         | Units | Description                                                                                                                        |
| ------------------------ | ------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| $v_h$                    | $[\underline{V}_h, \bar{V}_h]$ | hm³   | End-of-stage storage; the column lower bound is $0$, not $\underline{V}_h$, for a filling hydro and for a hydro not in service (see [LP Formulation §8](/math/lp-formulation#8-variable-bounds-and-minimum-constraints)) |
| $v^{in}_h$ | fixed | hm³ | Incoming-storage variable of the stage LP, fixed at the incoming storage $\hat{v}_h$ |
| $v^{avg}_h$              | -                              | hm³   | Average storage during stage: $(\hat{v}_h + v_h)/2$                                                                                |
| $a_{h,\ell}$             | fixed                          | m³/s  | AR lag $\ell$ (fixed by state transition)                                                                                          |
| $x^{\mathrm{a}}_{s,i}$ | free; $0$ when no row holds it | MW | Outgoing slot $s$ of anticipated thermal $i$'s commitment ring, $s \in \{0, \ldots, k_{max} - 1\}$ |
| $x^{\mathrm{a,in}}_{s,i}$ | fixed | MW | Incoming slot $s$, fixed at its trial value $\hat{x}^{\mathrm{a}}_{s,i}$ |
| $b^{\mathrm{out}}_{h,d}$ | $\geq 0$ | hm³ | In-transit water destined for downstream plant $h$ at maturity lag $d$, carried to the next stage; it enters $h$'s water balance $d$ stages after the current stage |
| $g^{\mathrm{a}}_{i,t}$ | $[\underline{G}_i(m), \bar{G}_i(m)]$ | MW | Anticipated-thermal commitment decided at stage $t$ for its delivery stage $m$, $t_i(m) = t$ ($m = t + K_i$ under a stage-count lead) |
| $x^{in}$ | fixed | - | Incoming-state variable of the stage LP, fixed at the trial point: $x^{in} = \hat{x}_{t-1}$ |
| $\theta$ | $\geq 0$ | \$ | Future-cost epigraph variable $\theta_t$ of the stage-$t$ LP, approximating $V_{t+1}(x_t)$ |

The state dimension is $n_{\text{state}} = N(1 + P^{\max}) + B + A \, k_{max}$, with $N = \lvert\mathcal{H}\rvert$ hydros, $B = \sum_h L_h$ in-transit buckets and $A$ anticipated thermals.

### 4.3 Slack Variables

Slack variables for soft constraints:

| Variable                                 | Domain   | Units | Constraint                                                                                                                                        |
| ---------------------------------------- | -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| $\sigma^{v-}_h$                          | $\geq 0$ | hm³   | Storage below the dead volume of a filling hydro, from its entry stage on (every other operating hydro's dead volume is a hard bound)             |
| $\sigma^{fill}_h$                        | $\geq 0$ | hm³   | Per-stage filling-floor shortfall                                                                                                                 |
| $\sigma^{q-}_{h,b,k}$                    | $\geq 0$ | m³/s  | Turbined flow below minimum — one per (hydro, bus) cell $b \in \mathcal{B}_h$ of a split plant                                                    |
| $\sigma^{o-}_{h,k}$                      | $\geq 0$ | m³/s  | Outflow below minimum (per plant — no per-cell outflow column to attribute a floor to)                                                            |
| $\sigma^{o+}_{h,k}$                      | $\geq 0$ | m³/s  | Outflow above maximum (per plant)                                                                                                                 |
| $\sigma^{g-}_{h,b,k}$                    | $\geq 0$ | MW    | Generation below minimum — one per (hydro, bus) cell $b \in \mathcal{B}_h$ of a split plant                                                       |
| $\sigma^{e+}_{h,k}$, $\sigma^{e-}_{h,k}$ | $\geq 0$ | m³/s | Evaporation above-target and below-target violation (per plant): one stage-level pair $\sigma^{e\pm}_h$ on a parallel stage, priced over the stage hours $H_t$; one pair per block on a chronological stage, priced over $\tau_k$ |
| $\sigma^{w-}_h$, $\sigma^{w+}_h$         | $\geq 0$ | m³/s  | Water withdrawal under-/over-delivery relative to the target $r_h$ (stage-level, not per-block); priced by $c^{wv-}_h$ / $c^{wv+}_h$ respectively |
| $\sigma^{inf}_h$                         | $\geq 0$ | m³/s  | Inflow non-negativity (if enabled)                                                                                                                |

## 5. Duals and Cut Slopes

A row dual $\pi$ is the Lagrange multiplier of one LP row: the rate at which the optimal stage cost changes per unit increase of the row's right-hand side.
The cut slope $\beta$ is a subgradient of the value function $V_t$ with respect to the incoming state at the trial point $\hat{x}_{t-1}$; each component equals the dual of the bound that pins its state coordinate at the trial value.
Its components include the storage slope $\beta^v_h$, the AR-lag slope $\beta^{lag}_{h,\ell}$ and the slopes on the in-transit buckets and the anticipated ring slots; with the stored intercept $\beta_0$ they form the cut $(\beta_0, \beta)$ of §1.
Sign convention: more incoming storage lowers the cost-to-go wherever the extra water displaces thermal generation or deficit, so the storage slope $\beta^v_h$ is non-positive there, and it can turn positive where the extra water can only leave the reservoir at a cost; see [Cut Management](/math/cut-management) for the cut coefficients, [LP Formulation](/math/lp-formulation) for the rows and [State Augmentation](/math/state-augmentation) for the state pinning.

| Symbol           | Row                              | Meaning                                                 |
| ---------------- | -------------------------------- | ------------------------------------------------------- |
| $\pi^{lb}_{b,k}$ | Load balance, bus $b$, block $k$ | Marginal cost of energy                                 |
| $\pi^{wb}_h$     | Water balance, hydro $h$ (block $k$ on a chronological stage, $\pi^{wb}_{h,k}$) | Water value                                             |
| $\pi_m^{fpha}$   | FPHA hyperplane $m$              | Marginal value of the generation limit set by plane $m$ |

## Cross-References

- [LP Formulation](/math/lp-formulation) — Complete LP subproblem using this notation
- [State Augmentation](/math/state-augmentation) — the state vector, its pinning, the outgoing state and the state families' mechanics
- [LP Layout and Scaling](/math/lp-layout-and-scaling) — column and row layout, prescaling and cost scale
- [SDDP Algorithm](/math/sddp-algorithm) — Algorithm overview and cut generation process
- [Cut Management](/math/cut-management) — Cut coefficient computation and aggregation details
- [PAR(p) Inflow Model](/math/par-inflow-model) — Detailed PAR(p) model using inflow parameters defined here
- [Hydro Production Function Models](/math/hydro-production-models) — FPHA plane coefficients ($\gamma$) and productivity ($\rho$)
- [Equipment-Specific Formulations](/math/equipment-formulations) — Thermal, contract, pumping variable notation
- [What Novomodelo Solves](/overview/what-novomodelo-solves) — the methodology principles: reproducibility, determinism, declaration order invariance and agent-readability
