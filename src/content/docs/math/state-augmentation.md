---
title: State Augmentation
description: The state the stage LP carries between stages — the state vector and its pinning by column bounds, the outgoing state and the cut row, the inflow-lag, commitment-ring and in-transit state families, and the projection of the cuts onto the state.
---

## Purpose

This chapter defines the state the stage LP carries from one stage to the next: the state vector and its four families, the pinning of the incoming state by column bounds, the outgoing state and the cut row written over it, the mechanics of the families beyond storage — the inflow lags, the commitments of anticipated thermals and the water in transit on travel-time arcs — and the projection of each stage's cuts onto the state components it selects.

**Reading order**: [LP Formulation](/math/lp-formulation) → **this chapter** → [Block Formulation Variants](/math/block-formulations)

## 1. State Vector

The state of stage $t$ is the vector that stage $t$ passes to stage $t + 1$ and over which the cuts of stage $t$ are written. It has four families:

- storage: the end-of-stage storage of each hydro (§2);
- inflow lags: $P^{\max}$ lagged inflows per hydro (§4);
- in-transit buckets: the water still travelling on the travel-time arcs into each receiving plant, one bucket per maturity lag (§6);
- commitment-ring slots: the decided, undelivered commitments of each anticipated thermal, $k_{max}$ slots per plant (§5).

With $N = \lvert\mathcal{H}\rvert$ hydros, $B$ in-transit buckets and $A$ anticipated thermals, the state dimension is

$$
n_{\text{state}} = N(1 + P^{\max}) + B + A \, k_{max}
$$

The state is ordered canonically: storage, inflow lags, in-transit buckets, commitment-ring slots, and within each family the hydros, receiving plants or anticipated thermals in the canonical entity order of [Notation Conventions](/overview/notation-conventions) (lag-major for the lags, slot-major for the ring slots). Each stage pins its incoming copy of the state by column bounds (§2), and each cut of a stage is a row over the stage's outgoing state (§3).

## 2. Pinning by Column Bounds

The water balance ([LP Formulation §4](/math/lp-formulation#4-hydro-water-balance)), FPHA hyperplanes ([LP Formulation §6](/math/lp-formulation#6-hydro-generation-constraints)), the evaporation row ([LP Formulation — Evaporation Row](/math/lp-formulation#evaporation-row)) and generic constraints ([LP Formulation §10](/math/lp-formulation#10-generic-constraints)) all involve the incoming storage value $\hat{v}_h$. Rather than embedding $\hat{v}_h$ as a constant in the RHS of each of these constraints (which would require collecting duals from all of them to compute cut coefficients), Novomodelo introduces an explicit **incoming storage LP variable** $v^{in}_h$ that every such constraint references, and **pins** it to the trial value.

For each hydro $h \in \mathcal{H}$, the incoming-storage column ([LP Layout and Scaling §1](/math/lp-layout-and-scaling#1-column-and-row-layout)) is pinned by setting equal lower and upper **column bounds**:

$$
\underline{v}^{in}_h = \bar{v}^{in}_h = \hat{v}_h
$$

where:

- $v^{in}_h$ = LP variable representing the incoming storage for hydro $h$
- $\hat{v}_h$ = incoming state value (end-of-stage storage from the previous stage)

:::note[Pinning by bounds not by a row]
The incoming state is pinned by **column bounds**, not by an explicit equality _constraint row_ $v^{in}_h = \hat{v}_h$ whose dual would be read: the LP has no such row ([LP Layout and Scaling §1](/math/lp-layout-and-scaling#1-column-and-row-layout)). Pinning by bounds keeps $N(1+P^{\max})$ redundant equality rows per stage out of the model (plus one per in-transit bucket and commitment-ring slot, §6, §5); the two formulations are KKT-equivalent — see below.
:::

**Cut coefficient**: the storage cut coefficient $\beta^v_h$ is the **reduced cost** of the pinned incoming-storage column (unscaled by its prescaler column factor — see [LP Layout and Scaling §2](/math/lp-layout-and-scaling#2-lp-scaling) and [Cut Management](/math/cut-management)). No fixing-constraint dual is involved.

**Why this design**: By LP duality, when a column is pinned at $\underline{x} = \bar{x}$ its reduced cost equals the sensitivity $\partial Q_t / \partial \hat{v}_h$ of the optimal value to the pinned bound — exactly the multiplier the equivalent equality row $v^{in}_h = \hat{v}_h$ would have carried (KKT parity). This sensitivity automatically accounts for all downstream effects through water balance, FPHA, evaporation and generic constraints, so a single reduced-cost value suffices — no combination of duals from multiple constraint types is needed. The AR lags (§4), in-transit buckets (§6) and commitment-ring slots (§5) are pinned the same way.

**Column count**: $N$ pinned incoming-storage columns, where $N = |\mathcal{H}|$ is the number of hydros, whatever their lifecycle phase. There are no state-fixing rows: every incoming-state column is pinned by its bounds.

## 3. Outgoing State and the Cut Row

On a stage that completes a lag period of its own, as every stage of a uniform single-resolution study with a [season map](/math/multi-resolution-studies#1-season-map) does apart from the 52nd and 53rd weeks of a 53-week year under a weekly cycle, the outgoing state of stage $t$ is the vector stage $t+1$ pins as its incoming state. A stage that shares a lag period passes its lags on unchanged until the period completes ([Multi-Resolution Studies §2](/math/multi-resolution-studies#2-lag-accumulation)), and at a resolution change the lag state is rebuilt from the completed coarse periods ([Multi-Resolution Studies §3](/math/multi-resolution-studies#3-resolution-change)).

The outgoing state is the outgoing storage $v_h$; the outgoing inflow lags $(z_h, a_{h,1}, \ldots, a_{h,P^{\max}-1})$, in which the realized inflow becomes lag 1, each incoming lag $a_{h,\ell}$ with $\ell < P^{\max}$ becomes lag $\ell + 1$, and $a_{h,P^{\max}}$ leaves the state; the outgoing buckets $b^{\mathrm{out}}_{h,d}$; and the outgoing ring slots $x^{\mathrm{a}}_{s,i}$. Stage $t+1$ pins each incoming column at the value of the matching outgoing column in the solution of stage $t$, canonicalized onto its bounds ([SDDP Algorithm §3.1](/math/sddp-algorithm#31-forward-pass)).

| State family       | Outgoing column                                      | Pinned incoming column at the next stage |
| ------------------ | ---------------------------------------------------- | ---------------------------------------- |
| Storage            | $v_h$                                                | $v^{in}_h$                               |
| Inflow lags        | $z_h$ (lag 1) and $a_{h,\ell-1}$ (lag $\ell \ge 2$) | $a_{h,\ell}$                             |
| In-transit buckets | $b^{\mathrm{out}}_{h,d}$                             | $b^{\mathrm{in}}_{h,d}$                  |
| Ring slots         | $x^{\mathrm{a}}_{s,i}$                               | $x^{\mathrm{a,in}}_{s,i}$                |

Each cut of stage $t$ is a row over these outgoing columns:

$$
\theta \geq \beta_0 + \sum_{h \in \mathcal{H}} \beta^v_h \, v_h + \sum_{h \in \mathcal{H}} \Big( \beta^{lag}_{h,1} \, z_h + \sum_{\ell=2}^{P^{\max}} \beta^{lag}_{h,\ell} \, a_{h,\ell-1} \Big) + \cdots
$$

where $\cdots$ stands for the bucket and ring-slot terms, each coefficient on its outgoing column by identity. Each coefficient is the reduced cost of the matching pinned incoming column of stage $t+1$, unscaled ([LP Layout and Scaling §2](/math/lp-layout-and-scaling#2-lp-scaling)): the lag coefficient $\beta^{lag}_{h,\ell}$ prices lag $\ell$ of the next stage's incoming state, so against the lag columns of stage $t$ the lag terms are re-indexed by one stage. A storage or lag component that the cut's state projection drops has no term ([§7](#7-cut-state-projection)).

## 4. Inflow Lags

The AR dynamics equation ([LP Formulation §5](/math/lp-formulation#5-realized-inflow-definition-rows)) uses lagged inflows $a_{h,\ell}$ as LP variables. To maintain the Markov property in the SDDP decomposition, each lag variable is pinned to its incoming state value via equal lower and upper **column bounds** on its lag column. This binds the lag variables to the known incoming state, and the **reduced cost** of each pinned column provides the cut coefficient $\beta^{lag}_{h,\ell}$ for the corresponding inflow-lag dimension of the Benders cuts ([LP Formulation §11](/math/lp-formulation#11-benders-cuts)). Whether these lag dimensions enter the cut is set by the cut-state projection, which the successor stage configures: when it projects out the inflow lags, the lag columns are still pinned for the AR dynamics, but their reduced costs carry no cut coefficient, giving a storage-only cut even under a PAR($p$) fit — see [§7](#7-cut-state-projection).

For each hydro $h \in \mathcal{H}$ and each lag $\ell \in \{1, \ldots, P^{\max}\}$:

$$
\underline{a}_{h,\ell} = \bar{a}_{h,\ell} = \hat{a}_{h,\ell}
$$

where:

- $a_{h,\ell}$ = LP variable representing the inflow at lag $\ell$ for hydro $h$
- $\hat{a}_{h,\ell}$ = incoming state value: the inflow of the $\ell$-th most recently completed lag period ([Multi-Resolution Studies §2](/math/multi-resolution-studies#2-lag-accumulation)); a lag period completes only under a [season map](/math/multi-resolution-studies#1-season-map), so without one no period completes and the lags keep their initial values
- $P^{\max}$ = the lag depth of the state, the same for every hydro: the largest AR order, at least twelve when any hydro carries the annual component, and widened as below when a terminal boundary is loaded

**Column count**: $N \times P^{\max}$ pinned lag columns, where $N = |\mathcal{H}|$ is the number of hydros, whatever their lifecycle phase, and $P^{\max}$ is the lag depth of the state defined above. All hydros store $P^{\max}$ lags regardless of their individual AR order $P_h$; a hydro whose inflow model has no annual component reads only its first $P_h$ lags, so its slots $\ell > P_h$ carry zero coefficients in the dynamics row, while a hydro with the annual component ([PAR(p) Inflow Model §7](/math/par-inflow-model#7-annual-component-extension-parp-a)) reads every slot; every lag column is still present and pinned. This uniform layout keeps the lag columns contiguous, so all lag cut coefficients are read in a single slice of the reduced-cost vector ([LP Layout and Scaling §1](/math/lp-layout-and-scaling#1-column-and-row-layout)).

The lag slots a hydro does not read are structurally zero and are left out of the cut row, like a ring slot no stage holds; with a terminal boundary loaded, the cut row keeps every hydro's slots up to the boundary depth, the deepest lag any boundary cut references, to which the lag state is widened ([Post-Study Boundary & Chained Studies — Compatibility Conditions](/math/post-study-boundary#52-compatibility-conditions)).

**Cut coefficient**: $\beta^{lag}_{h,\ell}$ (marginal value of inflow history at lag $\ell$ for hydro $h$) is the reduced cost of the pinned lag column, unscaled by its prescaler column factor ([LP Layout and Scaling §2](/math/lp-layout-and-scaling#2-lp-scaling)) — see [Cut Management](/math/cut-management).

## 5. Anticipated Thermal Commitments

An anticipated thermal plant decides the commitment of each delivery before its delivery stage and holds every decided, undelivered commitment as state in a per-plant commitment ring (see [System Element Modeling Overview §4](/math/system-elements#anticipated-thermal-plants)). Its lead is a stage count or a physical lead time. The decision stage of the delivery at stage $m$ is $t_i(m) = m - K_i$ for a stage-count lead; for a physical lead it is the stage containing the instant one lead time before the end of stage $m$, where an instant on a stage boundary belongs to the earlier stage. A delivery whose decision falls before the study ($m \leq K_i$ under a stage-count lead, an instant at or before the study start under a physical lead) is decided before the study and has no decision stage. A delivery with $t_i(m) = m$ is not anticipated: at that stage the plant dispatches as an ordinary thermal. Every commitment is bounded, costed, and commissioning-gated at its delivery stage, not at its decision stage.

### Hold Ring

The ring depth $K_i$ of plant $i$ is the lead for a stage-count lead; for a physical lead it is the largest number of commitments the plant's ring holds at the start of any stage, the first stage after the study included, counting the deliveries at or after that stage whose commitment was decided at an earlier stage, with the deliveries decided before the study held from the first stage. Every ring has $k_{max} = \max_i K_i$ slots, labelled by the residues $s \in \{0, \ldots, k_{max} - 1\}$.

The ring position $r_i(m)$ of the delivery at stage $m$ is $m$ on the study stages. Past the horizon, the plant's deliveries decided before the study come first and hold no ring position (they are fixed commitments, see [Post-Study Boundary & Chained Studies](/math/post-study-boundary)), and $r_i$ continues from $T + 1$ over the later deliveries. The delivery at stage $m$ holds slot $s_i(m) = r_i(m) \bmod k_{max}$, so the slot maturing at study stage $t$ is $t \bmod k_{max}$.

Each slot is two LP columns: the outgoing slot $x^{\mathrm{a}}_{s,i}$, the state carried to the next stage, and the incoming slot $x^{\mathrm{a,in}}_{s,i}$, pinned by equal column bounds to its trial value like all incoming state (§2):

$$
\underline{x}^{\mathrm{a,in}}_{s,i} = \bar{x}^{\mathrm{a,in}}_{s,i} = \hat{x}^{\mathrm{a}}_{s,i}
$$

The trial value is the previous stage's outgoing slot. At the first stage it is the committed rate of the delivery, decided before the study, that the slot holds (see [System Element Modeling Overview §4](/math/system-elements#anticipated-thermal-plants)), and $0$ in a slot that holds none.

### Ring Rows

At stage $t$, three families of equality rows couple plant $i$'s ring to its decision and to its generation. The **deposit** row writes the commitment decided at stage $t$ into the slot of its delivery:

$$
x^{\mathrm{a}}_{s_i(m),i} - g^{\mathrm{a}}_{i,t} = 0
$$

for the delivery $m > t$ with $t_i(m) = t$, when $m$ lies inside the study or the declared post-study calendar and the plant is commissioned at stage $m$. The **carry** row holds a decided commitment in its slot:

$$
x^{\mathrm{a}}_{s_i(m),i} - x^{\mathrm{a,in}}_{s_i(m),i} = 0
$$

for every delivery $m > t$ in the ring, decided at an earlier stage or before the study, that lies inside that calendar. The **fish** (delivery) row binds the stage's generation to the commitment maturing there:

$$
\sum_{k \in \mathcal{K}} \tau_k \, g_{i,k} - H_t \, x^{\mathrm{a,in}}_{s_i(t),i} = 0
$$

at every study stage $t$ whose delivery was decided at an earlier stage or before the study, whether or not the plant is commissioned there; $\tau_k$ is the duration of block $k$ and $H_t = \sum_{k \in \mathcal{K}} \tau_k$.

A commitment keeps one slot from its deposit row to its delivery. An outgoing slot that no deposit or carry row holds at the stage is frozen at $0$ by its bounds, and every held slot is free in sign. The decision column $g^{\mathrm{a}}_{i,t}$ of the delivery $m$ with $t_i(m) = t$ lies in $[\underline{G}_i(m), \bar{G}_i(m)]$, the plant's generation bounds at the delivery stage inside the study or its declared post-study capability past it ($0$ where none is declared), and is fixed at $0$ when the deposit row is absent; a delivery to a stage where the plant is not commissioned therefore matures as $0$, and inside the study its fish row pins that stage's generation to $0$. A delivery past the horizon that the study decides is carried, never fished, into the terminal stage's outgoing state, where the terminal boundary prices it (see [Post-Study Boundary & Chained Studies](/math/post-study-boundary)). A plant has at most one deposit row per stage, and the decision column enters the ring only through it.

### Objective contributions

The decision column of an anticipated plant enters the objective of stage $t$ with the term

$$
c_i(m) \, H_m \, d_{t \to m} \, g^{\mathrm{a}}_{i,t}, \qquad d_{t \to m} = d_{1 \to m} / d_{1 \to t}
$$

for the commitment the plant decides at stage $t$ for its delivery stage $m$, $t_i(m) = t$. Here $c_i(m)$ is the plant's unit cost at the delivery stage (the delivery stage's cost inside the study, the declared post-study cost past it), $H_m$ is the delivery stage's hours (a post-study stage's declared duration past the horizon), and $d_{t \to m}$ is the discount from the delivery stage back to the decision stage ([Discount Rate Formulation §5](/math/discount-rate#5-cumulative-discounting)). Like every objective coefficient other than that of $\theta$, the term is scaled as [LP Layout and Scaling §2.1](/math/lp-layout-and-scaling#21-cost-scaling) states. The one-step factor on $\theta$ at every stage carries a cost entered at stage $t$ to stage 1 multiplied by $d_{1 \to t}$, so the commitment cost reaches stage 1 as $c_i(m) H_m d_{1 \to m}$, discounted exactly once ([Discount Rate Formulation](/math/discount-rate#consistency-with-the-bellman-recursion)).

The plant's per-block generation carries no cost at a stage where its delivery is fished, so the energy of a commitment is priced once, on its decision column; at a stage where the plant dispatches as an ordinary thermal, its generation is priced per block like that of any thermal. The ring columns carry no cost.

### Ring-Slot Cut Coefficient

The coefficient of slot $(s, i)$ in a cut of stage $t$ is the reduced cost of the pinned incoming slot $x^{\mathrm{a,in}}_{s,i}$ of stage $t + 1$, unscaled like every state coefficient ([LP Layout and Scaling §2.3](/math/lp-layout-and-scaling#23-row-scaling-geometric-mean)). The cut row multiplies it by the outgoing slot $x^{\mathrm{a}}_{s,i}$ of stage $t$, the same residue and plant: the column the deposit row ties to the decision $g^{\mathrm{a}}_{i,t}$, or the carry row to the incoming slot $x^{\mathrm{a,in}}_{s,i}$. A commitment keeps one slot from its deposit row to its delivery, so the cut prices that slot by identity at every stage of the hold, and the marginal value of a commitment the study decides reaches its decision column through the deposit row of its decision stage. The ring slots are always part of the cut's state projection; which of them carry structurally zero coefficients is stated in [§7](#7-cut-state-projection).

## 6. Water Travel Time

When an upstream release takes appreciable time to travel down the cascade, only the share $\nu_{h',t,0}$ of a release ([LP Formulation §4](/math/lp-formulation#4-hydro-water-balance)) reaches the downstream neighbour in the release stage, and the rest arrives in later stages. Novomodelo models this as an **augmented in-transit state**: the volume still in transit on a cascade arc is carried through the Bellman recursion as extra state coordinates, exactly like storage (§2) and AR lags (§4).

**Scope.** A hydro $h$ declares a travel-time arc when it has a downstream plant and the arc to it has a strictly positive travel time; the diversion and pumping arcs carry no travel time (main cascade arc only). An absent or zero travel time is an instantaneous transfer — the upstream release enters the downstream water balance in the same stage ([LP Formulation §4](/math/lp-formulation#4-hydro-water-balance)) and no state is added.

### In-transit bucket state

For each receiving (downstream) plant $h$ that has at least one incoming travel-time arc, the in-transit water destined for $h$ is discretized into **maturity lags** $d \in \{1, \ldots, L_h\}$. Each lag carries the aggregate volume, summed over every upstream arc feeding $h$, in two buckets (hm³): the incoming bucket $b^{\mathrm{in}}_{h,d}$ holds the volume that matures into plant $h$'s reservoir $d - 1$ stages after the current one, so lag $1$ matures at the current stage, and the outgoing bucket $b^{\mathrm{out}}_{h,d}$ holds the volume that matures $d$ stages after it. The per-plant depth $L_h$ is the deepest maturity lag any arc into $h$ can reach on the stage calendar. The confluence of several arcs into one plant collapses into this single aggregated bucket block.

The buckets extend the state vector (§1), with $B = \sum_h L_h$ the total bucket count. The bucket block sits **after** the AR inflow lags and **before** the commitment-ring slots in the canonical state order ([LP Layout and Scaling §1](/math/lp-layout-and-scaling#1-column-and-row-layout)). Buckets are ordered canonically by $(\text{plant}, \text{lag})$ — the receiving plant in the canonical entity order every state block uses, then ascending maturity lag. When no arc is declared, $B = 0$ and the state has no bucket block.

### State pinning (column bounds)

Like every other incoming state coordinate, each incoming bucket is carried on its own LP column ([LP Layout and Scaling §1](/math/lp-layout-and-scaling#1-column-and-row-layout)) and pinned to its trial value by equal lower and upper **column bounds**:

$$
\underline{b}^{\,\mathrm{in}}_{h,d} = \bar{b}^{\,\mathrm{in}}_{h,d} = \hat{b}_{h,d}
$$

where $\hat{b}_{h,d}$ is the incoming in-transit volume, the previous stage's outgoing bucket (or, at the first stage, the seed derived from the in-transit releases declared before the study — see [System Element Modeling Overview — Cascade Travel Time](/math/system-elements#cascade-travel-time) and [Hydro Production Function Models — Implementation in Novomodelo](/math/hydro-production-models#implementation-in-novomodelo)). The **reduced cost** of the pinned bucket column is the cut coefficient for that in-transit dimension (see below) — the same regime used for storage (§2) and AR lags (§4).

### Delayed-arrival water-balance entry

The bucket maturing at the current stage, $b^{\mathrm{in}}_{h,1}$, delivers its volume into receiving plant $h$'s water balance ([LP Formulation §4](/math/lp-formulation#4-hydro-water-balance)). Because the bucket is already an accumulated volume (hm³), it enters the balance directly — outside the $\zeta$ flow-to-volume conversion — with a $-1.0$ coefficient in the all-variables-on-the-LHS form:

$$
v_h - v^{\mathrm{in}}_h - b^{\mathrm{in}}_{h,1} - \zeta\big[\,\cdots\,\big] = 0
$$

Equivalently, $b^{\mathrm{in}}_{h,1}$ is a stage-level inflow added to the reservoir. Because the confluence of several upstream arcs is already summed inside the single state coordinate, exactly one delayed-arrival entry appears per receiving plant.

Under the parallel-blocks formulation the maturing bucket is a single stage-level entry. Under the [chronological-blocks formulation](/math/block-formulations), the same volume is delivered across the arrival stage's own blocks, weighted by a fixed **arrival density** $\phi_{h,k} \ge 0$ with $\sum_k \phi_{h,k} = 1$, resolved against the arrival stage's block partition. The arrival density is a single fixed split per maturing bucket — it does not depend on which source block released the water, an accepted modeling bound when the release and arrival stages partition their hours differently. A chronological stage that no in-study release reaches — the first stage among them — spreads the maturing volume by the block weights, $\phi_{h,k} = w_k$.

On a declared travel-time arc the share $\nu_{h',t,0}$ of each release ($\nu^{k' \to k}_{h',t}$ on a chronological stage) reaches the downstream row in the release stage ([LP Formulation §4](/math/lp-formulation#4-hydro-water-balance)); the remaining share is deposited into the buckets at release and reaches the downstream plant as this delayed-arrival term at maturity.

The entry belongs to the receiving plant's water balance at every stage where that balance is formed. At a stage where the plant is PreFilling, its row is the frozen identity ([PreFilling Pass-Through](/math/lp-formulation#prefilling-pass-through)), and the maturing bucket enters the row of the first non-PreFilling plant downstream: with coefficient $-1$ on a parallel stage, and $-\phi_{h,k}$ on each block row of a chronological stage, $\phi_{h,k}$ being the PreFilling plant's own arrival density. It leaves the modeled system only when no such plant exists.

### Bucket definition rows

Within a stage, each active outgoing lag $d$ of a receiving plant $h$ has one definition row:

$$
b^{\mathrm{out}}_{h,d} = b^{\mathrm{in}}_{h,d+1} + \text{(deposits into lag } d\text{)}
$$

with $b^{\mathrm{in}}_{h,L_h+1} = 0$: the deepest lag holds only deposits. The water advances one lag per stage: the row moves the incoming bucket of lag $d + 1$ into the outgoing bucket of lag $d$, and the cross-stage identity carries the outgoing bucket into the next stage's incoming bucket of the same lag. An outgoing lag deeper than the deepest one reached at the stage, by the stage's own releases or by the water released before the study, has no row, and its outgoing bucket is fixed at $0$. The outgoing buckets are LP columns, part of $n_{\text{state}}$.

Each upstream release is written into the outgoing lags it reaches, scaled by the fraction of it maturing at each lag: on a parallel stage these fractions sum to $1 - \nu_{h',t,0}$ ([LP Formulation §4](/math/lp-formulation#4-hydro-water-balance)); on a chronological stage the sum holds after the per-block shares are weighted by block duration; a lag that would mature past the horizon has no row when no boundary is loaded, and its share is discarded (Horizon limitation, below).

### Cut coefficient

Because the incoming bucket column is pinned at equal bounds, its reduced cost is the sensitivity $\partial Q_t / \partial \hat{b}_{h,d}$ of the optimal stage cost to the in-transit volume, unscaled by the column prescaler ([LP Layout and Scaling §2](/math/lp-layout-and-scaling#2-lp-scaling)):

$$
\beta^{b}_{h,d} = \bar{c}^{\,b}_{h,d} / d^{col}_{h,d}
$$

Transit buckets are always in the cut projection, whatever the stage's selection for the storage and inflow-lag dimensions ([§7](#7-cut-state-projection)). Each cut therefore carries one coefficient per bucket dimension, contiguous with the storage, lag, and anticipated coefficients and read from the same reduced-cost mechanism ([LP Formulation §11](/math/lp-formulation#11-benders-cuts)).

### Horizon limitation

In-transit volume that would mature **after the study's last stage** is dropped and not credited to terminal storage — but only **when no terminal boundary future-cost function is loaded**. Absent a boundary, a release late in the horizon whose travel time carries it past the final stage $T$ leaves the modeled system without arriving: the deepest maturity lag active at stage $t$ is capped at $T - t$, so no bucket ever points beyond the horizon and the share is discarded rather than misdirected onto an earlier lag. When a [terminal boundary](/math/post-study-boundary) is loaded instead, this cap is lifted: the terminal deep-lag in-transit slots are held live rather than capped away, carried in the terminal stage's outgoing state, and reach the boundary-priced cut-state projection. The still-in-transit water is valued at the boundary rather than discarded, priced through the same reduced-cost cut mechanism the buckets already use (see Cut coefficient, above).

## 7. Cut-State Projection

A stage need not project the cuts it generates onto the full state of §1. Each stage selects whether the cuts it generates carry the storage components and whether they carry the inflow-lag components; the selection sets the dimension of those cuts, not the state the stage pins and passes on (§2, §3). A component left out is **projected out** of the subgradient: its reduced cost is not read into the cut, and the cut carries no coefficient for it. The intercept $\beta_0$ is the optimal value at the trial point less the products of the kept coefficients with their trial values, so the linear term of a projected-out component at its trial value is absorbed into $\beta_0$: the cut is a lower-dimensional supporting hyperplane of the cost-to-go's slice through the trial point, not a full cut with the omitted coordinates zero-padded.

- With the inflow lags projected out, the $N \times P^{\max}$ lag coefficients are omitted, not zeroed, even under a PAR(p) inflow model; the lag columns stay pinned for the AR dynamics (§4). With the inflow lags kept, their reduced costs enter the cut as §4 states.
- With the storage projected out, the $N$ storage coefficients are omitted in the same way, and the cut spans the components it keeps: the inflow lags when they are kept, and the buckets and ring slots when the study has them.
- The in-transit buckets (§6) and the commitment-ring slots (§5) are **always** projected, whatever the selection, which toggles only the storage and inflow-lag components. Every slot of every anticipated plant's ring carries a coefficient; a slot that no stage holds has a structurally zero coefficient, so the cut row holds entries only for the slots some stage holds.

The dimension of a stage's cut pool is set by the selection of its **successor** stage, since the pool holds the cuts the successor generates; the terminal pool, which has no successor, carries the full state whatever the selection.

Because a boundary loads into the terminal pool, a study's selection does not change what its boundary must carry: a counterpart for every storage and inflow-lag component of the study's terminal state ([Post-Study Boundary & Chained Studies §5.2](/math/post-study-boundary#52-compatibility-conditions), condition (c)), where the study's lag state extends to the deepest lag that any pool of the boundary policy references (condition (d)). A pool whose cuts project out the inflow lags, as under a storage-only projection, prices no inflow-lag component, so it is admitted as a boundary source only by a study whose terminal state holds no inflow lag. The terminal pool of a policy produced by training carries every inflow lag of the policy's state, which extends the loading study's lag state by condition (d); the pools of such a policy that project out the inflow lags are therefore refused as boundary sources whenever its state holds inflow lags.

A cut that projects out a component the cost-to-go depends on is guaranteed to lie below the cost-to-go only on the slice through its trial point; the consequence for the lower bound is [Cut Management — condition 4](/math/cut-management#4-cut-validity), and the case of the inflow lags under a PAR(p) model is in the [storage-only cut projection](/math/cut-management#storage-only-cut-projection) note. Each stage's selection is set in [the cut-management Configure tab](/math/cut-management#stagesstate_variables--cut-projection).

## Cross-References

- [LP Formulation](/math/lp-formulation) — the stage LP that pins the incoming state and whose cut row reads the outgoing state
- [Block Formulation Variants](/math/block-formulations) — chronological stages and the spread of a maturing bucket over their blocks
- [PAR(p) Inflow Model](/math/par-inflow-model) — the inflow model whose lags the state carries
- [Multi-Resolution Studies](/math/multi-resolution-studies) — lag periods and the lag state at a resolution change
- [System Element Modeling Overview](/math/system-elements) — anticipated thermal plants and travel-time arcs as physical elements
- [Post-Study Boundary & Chained Studies](/math/post-study-boundary) — the terminal boundary that prices the outgoing state of the last stage
- [Discount Rate Formulation](/math/discount-rate) — the delivery discount of the commitment cost
- [LP Layout and Scaling](/math/lp-layout-and-scaling) — the column layout of the state and the unscaling of its reduced costs
- [Cut Management](/math/cut-management) — cut coefficients, aggregation and selection
- [Notation Conventions](/overview/notation-conventions) — symbols and the canonical entity order
