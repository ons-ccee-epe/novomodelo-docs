---
title: LP Layout and Scaling
description: The column and row layout of the stage LP and its numerics — cost scaling, geometric-mean column and row prescaling, and the unscaling of row duals and of the reduced costs that give the cut coefficients.
---

## Purpose

This chapter states the column and row layout of the stage LP and its numerical conditioning: the order of its column regions and row families, the cost scaling, the geometric-mean column and row prescaling, and the unscaling of row duals and of the reduced costs that give the cut coefficients.

**Reading order**: [Cut Management](/math/cut-management) → **this chapter** → [LP Warm-Start](/math/lp-warm-start)

## 1. Column and Row Layout

The figure lists the column regions of the stage LP in their order on the left and its row families in their order on the right. The columns open with the outgoing storage, the inflow lags, the outgoing in-transit buckets and the outgoing commitment-ring slots; the realized inflow $z_h$, the pinned incoming storage, in-transit buckets and ring slots, and $\theta$ follow, and the equipment and slack columns close the layout. The inflow lags are the one pinned family in the leading block: their columns are the incoming lags, pinned like the incoming storage, and the outgoing lag state is the realized inflow followed by the incoming lags shifted by one lag ([State Augmentation §3](/math/state-augmentation#3-outgoing-state-and-the-cut-row)). The rows open with the realized-inflow definitions and close with the Benders cuts, appended after the stage's own rows. The edge marks where every cut coefficient comes from: the reduced cost of a pinned incoming column, the lag columns included.

```d2
grid-columns: 2
horizontal-gap: 150

columns: "Columns, in order" {
  grid-columns: 1
  horizontal-gap: 20
  vertical-gap: 73
  st_out: "Outgoing storage"
  lag_in: "Inflow lags, pinned"
  bk_out: "Outgoing buckets"
  rs_out: "Outgoing ring slots"
  z_col: "Realized inflow z"
  pin_in: "Pinned incoming storage,\nbuckets and ring slots"
  th_col: "θ"
  eq_col: "Equipment and slacks"
}

rows: "Row families, in order" {
  grid-columns: 1
  horizontal-gap: 20
  vertical-gap: 7
  zi: "Realized-inflow definition"
  wb: "Water balance"
  bd: "In-transit bucket definition"
  lb: "Load balance"
  fp: "FPHA planes"
  ev: "Evaporation"
  op: "Operational floors and cap"
  fl: "Filling and dead-volume floors"
  cm: "Commitment fish · deposit · carry"
  gc: "Generic constraints"
  bc: "Benders cuts" {style.stroke-dash: 4}
}

columns.pin_in -> rows.bc: "reduced cost →\ncut coefficient"
```

The stage LP uses a fixed column and row layout that places state variables first, followed by auxiliary and equipment columns. State is pinned by **column bounds** on the incoming-state columns ([State Augmentation §2](/math/state-augmentation#2-pinning-by-column-bounds), [§4](/math/state-augmentation#4-inflow-lags), [§5](/math/state-augmentation#5-anticipated-thermal-commitments), [§6](/math/state-augmentation#6-water-travel-time)), and cut coefficients are read as the **reduced costs** of those columns — so the fixed column order, not a fixed row order, is what enables contiguous coefficient extraction. With $N = |\mathcal{H}|$ hydros, $P^{\max}$ = the lag depth of the state ([State Augmentation §4](/math/state-augmentation#4-inflow-lags)), and $B$ = total in-transit bucket count (the sum, over receiving plants, of each plant's maturity-lag depth — [State Augmentation §6](/math/state-augmentation#6-water-travel-time)):

**Column layout**:

| Region                | Count | Description                                                                       |
| --------------------- | ----- | --------------------------------------------------------------------------------- |
| `storage`             | $N$   | Outgoing storage volumes (state) — first                                          |
| `inflow_lags`         | $N P^{\max}$  | AR lag variables (state, pinned incoming; lag-major hydro-minor) — after storage  |
| `transit_buckets_out` | $B$   | Outgoing in-transit bucket volumes (state, plant-major lag-minor) — after lags    |
| `commit_out`          | one per commitment-ring slot ([State Augmentation §1](/math/state-augmentation#1-state-vector)) | Outgoing commitment-ring slots (state, slot-major plant-minor) — after the outgoing buckets |
| `z_inflow`            | $N$   | Realized inflow (auxiliary, not a pinned state column; the cut row multiplies the lag-1 coefficient by it) — after the state block |
| `storage_in`          | $N$   | Incoming storage volumes (pinned, [State Augmentation §2](/math/state-augmentation#2-pinning-by-column-bounds)) — after z-inflow |
| `transit_buckets_in`  | $B$   | Incoming in-transit bucket volumes (pinned, [State Augmentation §6](/math/state-augmentation#6-water-travel-time)) — after storage_in |
| `commit_in`           | one per commitment-ring slot ([State Augmentation §1](/math/state-augmentation#1-state-vector)) | Incoming commitment-ring slots (pinned, [State Augmentation §5](/math/state-augmentation#5-anticipated-thermal-commitments)) — after the incoming buckets |
| `theta`               | $1$   | Future cost variable — last of the state prefix                                   |

Equipment and slack columns follow immediately after $\theta$, in this order: on a chronological stage, the storage at the end of every block but the last; turbined flow, spillage and diversion; thermal generation; the anticipated-thermal decisions; line flows in each direction; deficit and excess; the inflow non-negativity slacks, under the penalty-based methods; FPHA generation; evaporation and its slacks; the withdrawal slacks; the operational-violation slacks; non-controllable generation; pumped flow; import and export contracts; the generic-constraint slacks; and the filling-floor and soft dead-volume-floor slacks. The turbined-flow column family, and the FPHA generation column family, are indexed by **(hydro, bus) cell** rather than by plant — one column per cell ([LP Formulation §3](/math/lp-formulation#3-load-balance-constraint), [§6](/math/lp-formulation#6-hydro-generation-constraints)) — while every other hydro equipment column (spillage, diversion) stays indexed by plant. Like the outgoing storage and ring slots, the outgoing bucket block sits at the columns of its own state indices: it holds the volume still in transit on each cascade arc, defined by in-LP bucket definition rows ([State Augmentation §6](/math/state-augmentation#bucket-definition-rows)) rather than pinned, and the incoming bucket block is the matching pinned incoming copy read for the delayed-arrival water-balance entry and the cut coefficient ([State Augmentation §6](/math/state-augmentation#6-water-travel-time)). One equipment block serves anticipated thermals: one decision column per anticipated thermal, carrying the commitment decided at this stage for its delivery stage ([State Augmentation §5](/math/state-augmentation#5-anticipated-thermal-commitments)).

The realized-inflow region holds one free, zero-cost column $z_h$ per hydro, defined by the z-inflow rows of [LP Formulation §5](/math/lp-formulation#5-realized-inflow-definition-rows).

**Row layout** (equality-constraint prefix):

Because state is pinned by column bounds ([State Augmentation §2](/math/state-augmentation#2-pinning-by-column-bounds), [§4](/math/state-augmentation#4-inflow-lags), [§5](/math/state-augmentation#5-anticipated-thermal-commitments), [§6](/math/state-augmentation#6-water-travel-time)) rather than by equality rows, the LP has no state-fixing rows: the equality-constraint prefix begins directly with the z-inflow definitions:

| Region     | Count | Description                                                         |
| ---------- | ----- | ------------------------------------------------------------------- |
| `z_inflow` | $N$   | Realized-inflow definition constraints ([LP Formulation §5](/math/lp-formulation#5-realized-inflow-definition-rows)) — first equality block |

The other row families follow the z-inflow rows in this order: water balance, in-transit bucket definition ([State Augmentation §6](/math/state-augmentation#bucket-definition-rows)), load balance, FPHA planes, evaporation, the operational rows (minimum outflow, maximum outflow, minimum turbined flow, minimum generation), the filling floor and the soft dead-volume floor, the commitment fish, deposit and carry rows ([State Augmentation §5](/math/state-augmentation#ring-rows)), and the generic constraints; [Stage LP at a Glance](/math/lp-formulation#stage-lp-at-a-glance) counts each family. The Benders cut rows are appended after them ([LP Formulation §11](/math/lp-formulation#11-benders-cuts)).

Each incoming-state coordinate is pinned on its own LP column — the incoming storage column for storage, the lag column for each AR lag, the incoming bucket column for each in-transit bucket, the incoming ring-slot column for each commitment-ring slot — and its cut coefficient is the **reduced cost** of that column ([State Augmentation §2](/math/state-augmentation#2-pinning-by-column-bounds), [Cut Management](/math/cut-management)). The map from a state coordinate to its pinned column is fixed, and each of these incoming-state column regions is contiguous, so all storage, inflow-lag, in-transit bucket, and commitment-ring slot coefficients are gathered by reading a few contiguous slices of the reduced-cost vector.

**Worked example** ($N = 3$, $P^{\max} = 2$, no anticipated thermal and no travel-time arc): the storage region holds 3 columns, the AR lag region holds 6 (3 hydros × 2 lags), the z-inflow region holds 3, and the incoming-storage region holds 3, so $\theta$ is the 16th column. The state count (outgoing storage + AR lags) is $N(1 + P^{\max}) = 9$.

## 2. LP Scaling

The stage LP is numerically conditioned via a three-step scaling procedure applied once at template construction time. Scaling improves solver convergence by reducing the condition number of the constraint matrix without changing the optimization argmin.

### 2.1 Cost Scaling

All objective coefficients (except the future cost variable $\theta$) are divided by a fixed positive constant $K$, chosen once per study. $K$ scales the cost domain uniformly and leaves the constraint matrix and feasible region untouched, so the LP argmin is invariant to it and any two choices of $K$ agree in exact arithmetic:

$$
\tilde{c}_j = \frac{c_j}{K} \quad \text{for all } j \neq \theta
$$

The $\theta$ variable keeps an unscaled coefficient, the one-step discount factor $d_{t \to t+1}$: each stored cut is $\theta \geq \beta_0^{scaled} + \sum_j \beta_j^{scaled} x_j$ over the outgoing-state columns $j$ of the cut row, its intercept and every coefficient being the original-unit value divided by $K$, so $\theta$ is already in scaled cost space. The LP objective is $\sum_j \tilde{c}_j x_j + d_{t \to t+1} \, \theta$, and the total scaled objective equals $(C_{stage} + d_{t \to t+1} \, C_{future}) / K$. Each stage's factor carries every later stage's cost to stage 1 exactly once ([Discount Rate Formulation](/math/discount-rate#consistency-with-the-bellman-recursion)). All cost-domain outputs (objective values, duals, cost breakdowns) are multiplied by $K$ at the reporting boundary to recover original units.

### 2.2 Column Scaling (Geometric Mean)

After cost scaling, each column $j$ is assigned a scale factor by one-pass geometric-mean matrix equilibration (cf. [Curtis & Reid, 1972](/reference/bibliography/#numerical-methods)):

$$
d_j^{col} = \frac{1}{\sqrt{\max_i |A_{ij}| \cdot \min_i |A_{ij}|}}
$$

where the max and min are taken over nonzero entries in column $j$. Columns with no nonzero entries, and the commitment-ring slot columns, receive $d_j^{col} = 1$. The transformation replaces:

- Matrix entries: $\tilde{A}_{ij} = A_{ij} \cdot d_j^{col}$
- Objective coefficients: $\tilde{c}_j = c_j \cdot d_j^{col}$
- Column bounds: $\tilde{l}_j = l_j / d_j^{col}$, $\tilde{u}_j = u_j / d_j^{col}$

### 2.3 Row Scaling (Geometric Mean)

After column scaling, each row $i$ is assigned a scale factor using the same geometric-mean formula applied to the already column-scaled matrix:

$$
d_i^{row} = \frac{1}{\sqrt{\max_j |\tilde{A}_{ij}| \cdot \min_j |\tilde{A}_{ij}|}}
$$

The transformation replaces:

- Matrix entries: $\check{A}_{ij} = \tilde{A}_{ij} \cdot d_i^{row}$
- Row bounds: $\check{l}_i^{row} = l_i^{row} \cdot d_i^{row}$, $\check{u}_i^{row} = u_i^{row} \cdot d_i^{row}$

Column bounds and objective coefficients are not modified by row scaling.

The combined scaling produces the standard $D_r \cdot A \cdot D_c$ form where $D_r$ and $D_c$ are diagonal scaling matrices.

:::note[Dual unscaling]
LP row duals are in the scaled problem's space. To recover original-unit duals: $\pi_i^{original} = \pi_i^{scaled} \cdot d_i^{row} \cdot K$. The per-column and per-row scale factors are stored in the stage LP template for use during dual extraction and cut coefficient computation. This recovery is exact when the solve applies no scaling beyond Novomodelo's own prescaling — the case by default; if the backend applies a further scaling of its own on top of the prescaled matrix, a second scaling factor enters that this identity does not account for.
:::

:::note[Reduced-cost unscaling for cut coefficients]
State cut coefficients are read as the **reduced costs** of the pinned incoming-state columns ([State Augmentation §2](/math/state-augmentation#2-pinning-by-column-bounds)), not as row duals. A reduced cost is reported in the scaled problem's space; the original-unit sensitivity is $\beta_j^{original} = (\bar{c}_j^{scaled} / d_j^{col}) \cdot K$ — divide by the column factor, then multiply by $K$. The **division** by $d_j^{col}$ (not multiplication) follows from the column transform $\tilde{x}_j = x_j / d_j^{col}$ of [§2.2](#22-column-scaling-geometric-mean): the LP solver/backend differentiates the scaled objective with respect to $\tilde{x}_j$, so recovering $\partial Q / \partial x_j$ divides the column factor back out. When the solve applies no scaling beyond Novomodelo's own prescaling — the case by default — this single unscaling is exact; if the backend applies a further scaling of its own on top of the prescaled matrix, a second scaling factor enters that this identity does not account for, and the single unscaling does not exactly recover original units. (Cut coefficients are stored in scaled cost space — the $\bar{c}_j^{scaled}/d_j^{col}$ value — with $K$ applied only at the reporting boundary, as for all cost-domain quantities.)
:::

## Cross-References

- [LP Formulation](/math/lp-formulation) — the stage LP whose columns and rows this chapter orders
- [State Augmentation](/math/state-augmentation) — the state vector, its pinning by column bounds and the cut row over the outgoing state
- [Cut Management](/math/cut-management) — cut coefficients, aggregation and selection
- [Discount Rate Formulation](/math/discount-rate) — the one-step discount factor that is the coefficient of $\theta$
- [LP Warm-Start](/math/lp-warm-start) — basis reuse across the solves of the stage LP
- [Notation Conventions](/overview/notation-conventions) — symbols and the canonical entity order
