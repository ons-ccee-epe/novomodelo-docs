---
title: Post-Study Boundary & Chained Studies
description: A fixed terminal function imported from one pool of an upstream policy, chained studies (the source pool and the compatibility conditions), the two carried-state families held live to price against it, the β·x boundary-pricing mechanism, the dated, hour-weighted fan-out that reconciles a source delivery calendar onto the study's own, and the seeding of a study's first-stage inflow lags from its realized record.
---

## 1. The Right Boundary

In finite (acyclic) horizon mode the terminal condition is $V_{T+1} = 0$: no
state carried past the last stage $T$ has any value in the model (see
[Horizon Modes §1](/math/horizon-modes)). A study may instead import a **right
boundary**, in the sense that it prices the horizon from its far edge. The
cuts of one pool of an upstream policy (§5.1) become the terminal stage's cut
pool, which holds exactly those cuts and to which training never adds or
removes one, so the imported terminal function is fixed and replaces
$V_{T+1} = 0$. It prices every coordinate of the terminal state the source
models: storage, AR lags and the carried state of §2. Chaining two studies
this way is the subject of §5.

The **post-study calendar** — a run of stages that begins exactly where the
study horizon ends — is independent of the boundary: a study may declare
post-study stages with or without a loaded boundary. A post-study stage is
never dispatched, never joins the study's own stage chain, and never
accumulates or carries a Benders cut of its own: it contributes no LP
subproblem and no backward pass. Its role is to let a date past the horizon
resolve to a calendar position — so the reconciliation in section 4 has
somewhere to land — and, for an anticipated thermal, to declare the capability
and cost of a delivery there. Without a boundary the state carried to the
terminal stage has zero terminal value (§2); with one, the imported cuts price
it (§3).

## 2. Held-to-Terminal State

Two families of state would otherwise leave the modelled system at the
horizon edge instead of being carried forward and priced:

- **Commitments delivered past the horizon.** A commitment decided in the
  study for a delivery stage after $T$ exists only when that delivery stage
  lies on the declared post-study calendar and the plant is in service there;
  it is then a genuine decision, bounded and costed by the post-study stage's
  declared capability and cost, and carried in its ring slot to the terminal
  stage (see
  [System Element Modeling Overview §4](/math/system-elements#anticipated-thermal-plants) and
  [State Augmentation — Ring Rows](/math/state-augmentation#ring-rows)). A delivery
  past $T$ outside that calendar has no decision. Without a loaded boundary
  the carried commitment has zero terminal value while its fuel is still
  charged on its decision column, and the study setup warns about it.
- **Terminal deep-lag in-transit buckets.** Water released late in the horizon
  may still be in transit at $T$ (see
  [System Element Modeling Overview — Cascade Travel Time](/math/system-elements#cascade-travel-time)).
  With a boundary loaded, every lag a stage's releases reach is held live to
  the terminal stage; without one, a lag that would mature past the horizon is
  capped away and its water is dropped (see
  [State Augmentation — Horizon limitation](/math/state-augmentation#horizon-limitation)).

The two families are gated differently: the post-study calendar decides
whether a post-horizon commitment is made, and the boundary decides whether a
deep-lag bucket survives to the terminal stage. A coordinate that reaches the
terminal stage is held live in the terminal stage's outgoing state, like
storage or AR lags, and the boundary prices it; a coordinate fixed at zero or
dropped before the terminal stage leaves nothing for a cut to act on.

The figure follows a commitment decided at stage $t$ for a post-study delivery
stage $m$. It is deposited into its ring slot at $t$, carried to the terminal
stage $T$ and valued there by the boundary cut through the slot's coefficient,
while its fuel is charged at $t$; the delivery stage $m$ itself lies on the
post-study calendar past the boundary. A commitment decided before the study
for a post-study stage holds no slot (the dashed path), and its state
contribution enters the boundary cut's intercept.

```d2
direction: down

classes: {
  thermal: {style: {stroke: "#f5a623"}}
}

decide: "stage t\ndecision, fuel charged" {class: thermal}
carry: "stage T\nring slot carried"
prestudy: "pre-study commitment\nno ring slot" {shape: parallelogram}
boundary: "terminal boundary" {shape: oval}
deliver: "post-study stage m\ndelivery" {class: thermal}

decide -> carry: "ring slot"
carry -> boundary: "cut coefficient"
prestudy -> boundary: "intercept" {style.stroke-dash: 4}
boundary -> deliver: "post-study calendar"
```

Both families are carried by the in-study state machinery — ring slots and
bucket columns, their incoming copies pinned by column bounds — and a right
boundary adds no state-carrying mechanism: for these two families it only
changes which bucket lags reach the terminal stage.

## 3. Boundary Pricing (`β·x`)

An imported terminal cut carries an intercept $\beta_0$ and a coefficient
$\beta$ for every coordinate of the terminal stage's outgoing state — one
entry per hydro storage, per AR lag, per in-transit bucket and per
commitment-ring slot. Each cut is the familiar affine floor on the terminal
future-cost variable,

$$
\theta \;\geq\; \beta_0 \;+\; \beta^{\top} x_T,
$$

evaluated through the same cut **row** every other Benders cut uses (see
[SDDP Algorithm §6](/math/sddp-algorithm) for the single-cut form). The
coefficient of a ring slot or a bucket multiplies the terminal stage's
outgoing column for that coordinate, which the commitment's deposit or carry
row, or the bucket's definition row, ties to the decision or release that
produced it
([State Augmentation — Ring-Slot Cut Coefficient](/math/state-augmentation#ring-slot-cut-coefficient);
[State Augmentation — Bucket definition rows](/math/state-augmentation#bucket-definition-rows)).
A right boundary adds no second pricing mechanism; it supplies the
coefficients of the state held live at the terminal stage.

Pricing the carried state through $\beta^{\top} x_T$ is deliberately kept
separate from pricing the fuel an anticipated commitment consumes. The fuel of
a post-horizon commitment is booked on its decision column at its decision
stage, at the post-study stage's declared cost and discounted from the
delivery stage
([State Augmentation — Objective contributions](/math/state-augmentation#objective-contributions);
[Discount Rate Formulation — Post-Study Extension](/math/discount-rate#post-study-extension)),
while $\beta^{\top} x_T$ prices the _state_ the commitment leaves behind in
its ring slot. State valuation and fuel booking are disjoint columns: one is a
term in $\beta^{\top} x_T$ on the outgoing slot column, the other is the
commitment's own objective coefficient on its decision column. Because no
single column carries both roles, the two compose without double-counting the
same delivered energy — the same discipline the in-study fishing and objective
machinery already applies to delivery inside the horizon.

A commitment decided **before the study** for a delivery past the horizon is
fixed: it has no decision column, no ring slot and no coordinate of $\beta$.
Its fuel is sunk and enters no objective. When a boundary is loaded
([Boundary Cuts](/running/policy-management/#boundary-cuts)), its state
contribution — the value the boundary cut assigns to the committed rate over
the source slots its delivery window overlaps, hour-weighted — is added once,
at load, to the intercept $\beta_0$ of every boundary cut; no coefficient
changes. With no boundary loaded it enters no term, and the study setup warns
about it when its committed rate is non-zero. Either way it is reported at its
real delivery date
([Simulation Output](/reference/output/simulation/#anticipatedfixed_deliveriesparquet)).

## 4. Calendar Reconciliation (Fan-Out)

An upstream run's terminal state is expressed on its own calendar, which need
not share the current study's stage boundaries — a monthly source informing
a weekly or monthly study is the typical case. Loading the boundary therefore
reconciles the source's dated state onto the current study's own calendar
before any coefficient is used: every source month is distributed across the
study's own delivery windows in proportion to the hours each shares with it
(each weight is the shared hours divided by the source month's hours), a
**dated, hour-weighted fan-out**. A window that falls entirely inside a
single priced source month takes that month's share alone; a window drawing
on more than one source month takes the hour-weighted share of each; only a
window straddling into a stretch the source never priced is renormalized
over the span the source actually covers: the source's value is taken as
spread uniformly over the window, so the covered part's density is extended
over the uncovered part.

The source and the current study need not even model the **same set of state
coordinates**. A source trained without in-transit buckets, or with monthly
anticipated slots where the current study carries weekly ones, presents a
terminal state of a different shape. Reconciliation therefore matches each
target coordinate to the source **by entity identity and delivery date**, never
by position in the state vector: a storage coordinate binds to the same
reservoir, an anticipated slot to the same plant-and-delivery-date, an
in-transit bucket to the same arc-and-maturity. A source coordinate the current
study does not model has nowhere to land and is **dropped** — counted, per
family, in the reconciliation summary below rather than silently discarded —
and the load still succeeds **by default**. In the other direction, a storage
or AR-lag coordinate of the current study that the source does not price
refuses the load (§5.2), and only a commitment-ring slot or in-transit bucket
with no overlapping source interval takes a zero coefficient. A stricter
admission is available that instead **rejects** a superset source — one
pricing state the current study does not model — rather than dropping and
reporting it; see
[Compatibility requirements](/running/policy-management/#compatibility-requirements)
for how the software layer requires it.

The fan-out is produced once, at load, and its result is summarized rather
than left implicit: a **per-family reconciliation summary** reports, for
storage, for inflow lags, for in-transit buckets, and for anticipated
commitments, how many target coordinates were copied identically from a source
coordinate matched by entity identity, how many were resolved by the dated
fan-out (a window inside a single source month counts here, as a one-term
blend, and those renormalized for reaching into a stretch the source never
priced are also counted separately as straddling), how many had no
corresponding source information and took a zero coefficient rather than a
guessed value, and how many source coordinates the current study does not
model and dropped. For storage and inflow lags the fanned-out and zero counts
are always zero on a load that succeeds, because an unpriced coordinate of
either family refuses the load (§5.2). The
summary is a load-time diagnostic, not a state variable — it exists so an
inconsistency between the source and current state or calendars is visible
rather than silently absorbed.

The source state comes from the one upstream pool that §5.1 selects by date.

A delivery past the horizon that the study decides has exactly one decision
stage $t_i(m)$
([State Augmentation §5](/math/state-augmentation#5-anticipated-thermal-commitments)).
At that stage each scenario decides it like any other stage decision and
carries it in its ring slot to the terminal stage, and the boundary prices the
carried value through the boundary cuts of that scenario's terminal-stage LP.

The figure draws the fan-out past the horizon edge, the end of stage $T$, in
the post-study segment that begins there. A priced source month is distributed
across the study's delivery windows it overlaps, drawn here for a commitment,
each with an hour weight: the hours they share divided by the source month's
hours. The window inside the month takes that month's share alone. The
straddling window reaches into a stretch the source never priced and is
renormalized over the span the source covers, so its uncovered part takes the
covered part's density.

```d2
direction: down

classes: {
  thermal: {style: {stroke: "#f5a623"}}
}

horizon: "horizon edge\nend of stage T" {shape: oval}

post: "post-study segment" {
  source: "source calendar" {
    month: "priced source month" {width: 320}
    gap: "unpriced stretch" {style.stroke-dash: 4}
  }
  inside: "window inside the month\nthat month's share alone" {class: thermal}
  straddle: "straddling window\nrenormalized over the covered span" {class: thermal}

  source.month -> inside: "hours shared ÷\nsource-month hours"
  source.month -> straddle: "hours shared ÷\nsource-month hours"
  source.gap -> straddle: "uncovered part" {style.stroke-dash: 4}
}

horizon -> post: "segment begins"
```

## 5. Chained Studies

A chained study couples two studies through a right boundary. An upstream
study trains a policy over a longer or coarser horizon, and a downstream study
imports one of its pools as its right boundary (§1). The dependency runs one
way: the upstream study never reads the downstream one, and re-running the
downstream study needs only the archived upstream policy. Each study draws its
own scenario tree, and the downstream stages may be finer than the upstream's
— weekly stages under a monthly policy, for example. One study whose own
stages mix resolutions is a different case, covered in
[Multi-Resolution Studies](/math/multi-resolution-studies).

### 5.1 Source Pool

Each pool of the upstream policy prices the state that leaves its stage, at
that stage's end date. The source is the pool priced at the downstream horizon
end, the end date of the downstream study's last stage; it need not be the
pool of the upstream study's terminal stage. The load is refused when no pool,
or more than one, is priced at that date, and also when the selected pool is
shared by more than one node of the upstream policy graph.

The figure draws the upstream and downstream studies as two timelines. Each
upstream pool is priced at its stage's end date, and the source is the pool
priced at the downstream horizon end, drawn here as an interior pool with later
upstream stages after it. Its cuts become the fixed terminal pool of the
downstream study's stage $T$, and the single edge between the studies is
one-way.

```d2
direction: down

upstream: "upstream study" {
  early: "earlier stages\neach pool priced\nat its stage end"
  source: "source pool\npriced at the\ndownstream horizon end"
  later: "later stages\nto the upstream\nterminal stage"
}

downstream: "downstream study" {
  label.near: bottom-center
  before: "stages before T"
  last: "stage T\nfixed terminal pool"
}

upstream.source -> downstream.last: "cuts, one way"
```

### 5.2 Compatibility Conditions

A boundary load imposes these conditions on the source pool and the downstream
study:

- (a) **Source pool.** The source is the pool of §5.1; otherwise the load is
  refused.
- (b) **Seasons.** When the study declares a season map, the source carries
  the same season cycle and the same number of seasons and, for every hydro
  whose inflow the study models, an entry with the same PAR order in every
  season where the study models it; otherwise the load is refused.
- (c) **Storage and lag correspondence.** Every storage coordinate of the
  study's terminal state has a source counterpart for the same reservoir, and
  every AR-lag coordinate one for the same hydro and lag depth that, where
  both sides date it, references the same past period; otherwise the load is
  refused. A pool prices a storage or AR-lag dimension only when the cut
  projection that sets its dimension, its successor stage's selection, carries
  it ([State Augmentation — Cut-state projection](/math/state-augmentation#7-cut-state-projection));
  the terminal pool always does, so an interior source pool chosen under a
  storage-only projection has no AR-lag counterpart.
- (d) **Lag depth.** The study's lag state is extended to the deepest lag that
  the cuts of any pool of the boundary policy reference: its depth is the
  larger of the study's maximum AR order and that lag, so every lag
  coefficient of the imported cuts has a coordinate.
- (e) **Forward-dated state.** Commitment-ring slot and in-transit bucket
  coordinates are reconciled by date (§4) and take a zero coefficient where
  the source has none.
- (f) **Surplus source state.** A source coordinate the study does not model
  is dropped and reported, or, under the stricter admission, refuses the load.

A source that prices only storage and AR-lag coordinates needs
no post-study calendar, because those coordinates are matched by identity;
only the forward-dated coordinates of §4 are dated onto it.

The check order and the refusal messages are in
[Policy Management — Compatibility requirements](/running/policy-management/#compatibility-requirements).

### 5.3 Consistency

The imported function is a valid outer approximation of the upstream model's
cost-to-go, and of no other; the downstream policy and its lower bound are
valid relative to it. A downstream model that differs from the upstream one —
in its inflow-model coefficients, in the reservoirs only the upstream study
models, or in its penalties — receives a terminal value priced for a different
system, and the difference biases the downstream policy near the horizon;
training does not correct it, because the terminal pool never changes (§1).
Running with the zero terminal value instead decouples the two studies, at the
price of the end-of-world effect ([Horizon Modes §1](/math/horizon-modes)).

## 6. Lag Seeding

Every study seeds the AR lags of its first stage from its realized inflow
record: the historical record together with the recent observations of its
initial conditions, the latter replacing the former on every day both cover,
never averaged with it. Each lag is seeded from one of the season periods
that precede the first stage's own — the period immediately before it for the
first lag, the one before that for the second, and so on, walking back
through the season cycle — and its seed is the record's duration-weighted
mean over the covered days of that period.

When the study starts inside a season period, the elapsed part of that period
seeds the period's partial accumulation, and the first stages complete the
period by the lag accumulation of
[Multi-Resolution Studies](/math/multi-resolution-studies). An in-progress
period the record covers only in part is accepted, with a warning.

The autoregressive order — supplied, or chosen by the order selection of
[PAR(p) Inflow Model §3.6](/math/par-inflow-model#36-order-selection) — is the
number of lags each stage's autoregressive coefficients read. When the study
supplies its autoregressive coefficients, the seed of every lag up to the
largest of those orders must be fully covered by the record, or the case is
refused at load, unless the first stage's season cannot be resolved: those
lags then seed to zero, with a warning. A lag is never set to its season's
mean.

The seeds condition the first stages' inflows through the autoregressive
terms without changing the inflow model's parameters, so a study seeded from
recent observations answers for the conditions it starts from. In a chained
study the downstream study seeds its own lags this way, while the boundary
supplies only the terminal function (§1). The fitting-time estimation of the
statistics of lag seasons outside the study window is a different mechanism;
see
[PAR(p) Inflow Model §3.8](/math/par-inflow-model#38-partial-year-studies-and-the-pre-study-lag-window).

## Cross-References

- [State Augmentation](/math/state-augmentation) — §5 the commitment ring
  (hold ring, ring rows, ring-slot cut coefficient, objective contributions);
  §6 in-transit bucket state, pinning, and the horizon-limitation cap that a
  right boundary lifts.
- [System Element Modeling Overview](/math/system-elements) — §4 the anticipated-thermal
  commitment ring and §5 cascade travel time, the element-level source of the
  two carried families.
- [Horizon Modes](/math/horizon-modes) — the zero terminal value a right
  boundary replaces, and the finite-horizon context the post-study segment
  attaches to.
- [Discount Rate Formulation](/math/discount-rate) — the cumulative factor extended over
  the post-study stages.
- [SDDP Algorithm](/math/sddp-algorithm) — §7 the terminal-boundary summary.
- [Multi-Resolution Studies](/math/multi-resolution-studies) — one study with
  mixed resolutions; the lag accumulation, and the partial accumulation of the
  period a study's first stages complete, which §6 of this chapter seeds.
- [PAR(p) Inflow Model](/math/par-inflow-model) — order selection; the
  pre-study lag window of the fit.
- **Running Novomodelo:**
  [Policy Management](/running/policy-management/#boundary-cuts) — boundary
  configuration and compatibility requirements.
