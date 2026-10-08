---
title: Multi-Resolution Studies
description: Mixed-resolution SDDP studies with monthly and quarterly (or weekly and monthly) stages — a season map whose coarse seasons are seasons of their own, lag accumulation with spillover and period finalization, the lag rebuild at a resolution change, noise groups, and duration-weighted aggregation for PAR fitting.
---

## Purpose

A multi-resolution study is a single study whose stages span more than one
temporal resolution — most commonly a monthly head followed by a quarterly
tail, or a weekly head followed by a monthly tail. All stages belong to one
SDDP horizon and share one set of value-function cuts; no coupling boundary
exists. The modelling challenge is that the PAR(p) inflow model is indexed by
season, yet stages of different length follow one another: each stage must take
the parameters of a season at its own resolution, and its lags must be values
of whole season periods at that resolution. This chapter describes how Novomodelo
handles that challenge.

**Boundary with chained studies.** A multi-resolution study is one study with
one cut set. A chained study is instead two studies: the second imports a fixed
terminal function, the cuts of one pool of the first study's policy, chosen by
date and not necessarily the pool of the first study's last stage (see
[Post-Study Boundary & Chained Studies](/math/post-study-boundary)). This
chapter owns the sub-period lag accumulation (§2).

## 1. Season Map

The PAR(p) model associates each stage $t$ with a season $m(t)$, and the stages
of one season share its parameters $\mu_m$, $s_m$ and $\psi_{m,\ell}$. A
multi-resolution study declares its coarse seasons — for example quarters — as
seasons of their own, with identifiers distinct from those of the fine seasons
whose calendar span they overlap. When the season map layers two resolutions
over the same calendar days, a stage's dates alone do not determine its season,
so every stage names its season; a coarse stage therefore takes its coarse
season and that season's PAR parameters. When no two seasons overlap, a stage's
season follows from its start date, and a stage shorter than its season period
may name the season it subdivides.

Fine stages that subdivide one season — for example weekly stages that name
their month's season — share that season's parameters. The season map thus
fixes the parameters of every stage; §2 and §3 describe how the lags those
parameters act on are formed when stages differ in length.

## 2. Lag Accumulation

The lags of the PAR model are values of completed season periods, not of single
stages. A **lag period** $\mathcal{W}$ is one occurrence of a stage's season
period: the calendar window that the season covers in one cycle, such as one
particular month or one particular quarter. Writing $t$ also for the calendar
window of stage $t$, the share of the period that stage $t$ covers is

$$
w_{t,\mathcal{W}} = \frac{\lvert t \cap \mathcal{W} \rvert}{\lvert \mathcal{W} \rvert}
$$

with $\lvert t \cap \mathcal{W} \rvert$ the hours of stage $t$ inside
$\mathcal{W}$ and $\lvert \mathcal{W} \rvert$ the hours of the period. The value
a completed period contributes to the lag state of hydro $h \in \mathcal{H}$ is
the duration-weighted mean of the realized inflows $a_{h,t}$ of the stages $t$
that overlap it:

$$
\frac{\sum_{t} w_{t,\mathcal{W}}\, a_{h,t}}{\sum_{t} w_{t,\mathcal{W}}}
$$

A stage that straddles a period boundary contributes to both periods, each with
its own share (spillover). The period completes at the last stage of its season
occurrence: there the completed value becomes lag 1 and every older lag moves
back by one, so the lag $\ell$ that a stage reads is the value of the $\ell$-th
most recent period completed before it. At every earlier stage of the period
the lag state is unchanged, so the stages inside one period see the same lags.
The partial accumulation, the two running sums of the mean, travels with each
trajectory and is not a coordinate of the cut state.

In a uniform single-resolution study, where every stage spans exactly one
season period, every stage is one period with share 1 and the lag is the
stage's inflow. The one exception is a weekly cycle in a year of 53 ISO
weeks: the 53rd week takes the season of the 52nd, so those two stages form
one period and the lag they complete is the mean of their two inflows.

The figure below draws this accumulation for weekly stages inside one month
and for a monthly head before a quarterly tail. In the upper panel each week
feeds the month's lag period with its share of the month's hours; the last
week straddles the month's end, feeds the next month's period with its
spillover and, as the month's last stage, completes the period, whose
duration-weighted mean becomes lag 1. The bracket around the weeks is their
noise group (§4): in the opening tree they share one innovation per opening.
In the lower panel, drawn for a coarse order of at least 2, the months of the
window that the coarse order reaches feed
both their monthly lag periods and the quarterly periods (§3), and at the first
quarterly stage the lag state is rebuilt from the completed quarterly periods,
newest first.

```d2
direction: down

classes: {
  hydro: {style: {stroke: "#4a90b8"}}
}

weekly: "Weekly stages in a month" {
  direction: down

  group: "noise group\nsame season and start year:\none innovation per opening\nof the opening tree" {
    direction: right
    wk_a: "week"
    wk_b: "week"
    wk_c: "week"
    wk_last: "last week\nstraddles the\nmonth's end"
  }

  month_period: "month's lag period\neach week's share\nof the month's hours" {class: hydro}
  next_period: "next month's\nlag period" {class: hydro}
  lag_one: "lag state\nlag 1 = duration-weighted mean" {shape: oval; class: hydro}

  group.wk_a -> month_period: "share"
  group.wk_b -> month_period: "share"
  group.wk_c -> month_period: "share"
  group.wk_last -> month_period: "share"
  group.wk_last -> next_period: "spillover"
  month_period -> lag_one: "completed at\nthe last week"
}

coarse: "Monthly to quarterly" {
  direction: down

  window: "window the coarse order reaches" {
    direction: right
    months_old: "months of an\nearlier quarter"
    months_new: "months of the\nlatest quarter"
  }

  month_lags: "monthly lag periods" {class: hydro}
  quarter_old: "earlier quarterly\nperiod, completed\nbecomes lag 2" {class: hydro}
  quarter_new: "latest quarterly\nperiod, completed\nbecomes lag 1" {class: hydro}
  first_quarter: "first quarterly stage\nlag state rebuilt,\nnewest first"

  window.months_old -> month_lags
  window.months_new -> month_lags
  window.months_old -> quarter_old: "share of the\nquarter's hours"
  window.months_new -> quarter_new: "share of the\nquarter's hours"
  quarter_new -> first_quarter
  quarter_old -> first_quarter
}

weekly -> coarse: "same share and\nspillover rule"
```

## 3. Resolution Change

A coarse season's AR coefficients act on lags of coarse periods, so the lag
state changes resolution with the stages. When fine stages precede coarse
stages that carry coarse seasons of their own (§1) — a monthly head before a
quarterly tail — the fine stages of the window before the first coarse stage
also accumulate into the coarse periods, as many of them as the coarse model's
order reaches back, with the shares and spillover of §2. At the first coarse
stage the lag state is rebuilt from those completed coarse periods, newest
first: the most recent becomes lag 1, the one before it lag 2, and so on. From
there the accumulation runs at the coarse resolution.

## 4. Noise Groups

In the opening tree, consecutive stages that share a season and the calendar
year of their start form one **noise group** and share one innovation per
opening, as when several weekly stages fall inside one monthly season. Within
the opening tree, a season's innovation $\varepsilon_t$ is therefore not
resampled for every stage the season is subdivided into. A stage without a
season forms its own group, and in a uniform single-resolution study every
group is a single stage, so every stage draws independently, except that on
a weekly cycle the 53rd week of a 53-week year takes the season of the 52nd
and joins its group. The sampling rule is stated in
[Scenario Generation](/math/scenario-generation); the group assignment
depends on the stage calendar alone, so every MPI rank computes the same
groups (see [Determinism & Provenance](/math/determinism-guarantees)).

Along a trajectory, the stages inside one lag period see the same lags (§2).

## 5. Duration-Weighted Aggregation for Fitting

The seasonal statistics of a season must refer to the resolution at which its
PAR model is evaluated. When a season is coarser than the observation record —
a quarterly season over a monthly record — the observations of each fully
observed occurrence of that season are collapsed into their duration-weighted
mean before estimation, so the statistics of the season refer to its own
resolution. The aggregate is a mean, not a sum: it keeps the units of a flow
rate, and observations of unequal duration, such as months of unequal length,
weigh in proportion to their duration. The PAR estimation procedure of
[PAR(p) Inflow Model §3](/math/par-inflow-model#3-estimation) then applies per
season without modification, and each stage takes its season's parameters when
the runtime PAR quantities are built
([PAR(p) Inflow Model §4.2](/math/par-inflow-model#42-runtime-quantities)). A
coarse season's fit sees only coarse-resolution variation: the variation among
the fine observations inside one occurrence does not reach its parameters.

## Cross-References

- [PAR(p) Inflow Model](/math/par-inflow-model) — The fitting procedure (§3) that applies to aggregated statistics; the parameter set that the aggregated statistics populate; the LP-ready form that quarterly stages use at runtime.
- [Scenario Generation](/math/scenario-generation) — Opening-tree generation that produces per-stage noise vectors; the noise-group sampling rule.
- [Post-Study Boundary & Chained Studies](/math/post-study-boundary) — Two studies coupled by a terminal function imported from the upstream policy, rather than one study with mixed stages; the lag seeding at a study's start.
