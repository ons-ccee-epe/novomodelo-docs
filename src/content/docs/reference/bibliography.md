---
title: Bibliography
description: External sources cited across the methodology chapters.
---

This bibliography collects every external source cited across this site's
methodology chapters, plus background references that the methodology rests
on without quoting. Chapters cite an entry in short form, author and year,
linked to the section below that holds it.

For domain terms, see [Glossary](/en/reference/glossary).

---

## SDDP Foundations

- **Benders, J.F.** (1962). Partitioning procedures for solving mixed-variables programming problems. _Numerische Mathematik_, 4(1), 238–252. [doi:10.1007/BF01386316](https://doi.org/10.1007/BF01386316)
  The original Benders decomposition paper. Foundation for the L-shaped method and SDDP.
  _Background reference for [SDDP Algorithm](/en/math/sddp-algorithm), [Cut Management](/en/math/cut-management), [What Novomodelo Solves](/en/overview/what-novomodelo-solves)._

- **Pereira, M.V.F. & Pinto, L.M.V.G.** (1991). Multi-stage stochastic optimization applied to energy planning. _Mathematical Programming_, 52(1–3), 359–375. [doi:10.1007/BF01582895](https://doi.org/10.1007/BF01582895)
  The original SDDP paper. Foundational for the entire algorithm and for the hydrothermal-dispatch application that motivates Novomodelo.
  _Background reference for [SDDP Algorithm](/en/math/sddp-algorithm), [What Novomodelo Solves](/en/overview/what-novomodelo-solves)._

- **Birge, J.R.** (1985). Decomposition and partitioning methods for multistage stochastic linear programs. _Operations Research_, 33(5), 989–1007. [doi:10.1287/opre.33.5.989](https://doi.org/10.1287/opre.33.5.989)
  Nested decomposition for multistage stochastic linear programs: each stage passes its decisions forward and receives cuts from its successors, the scheme SDDP applies over sampled scenarios.
  _Background reference for [SDDP Algorithm](/en/math/sddp-algorithm)._

- **Birge, J.R. & Louveaux, F.V.** (1988). A multicut algorithm for two-stage stochastic linear programs. _European Journal of Operational Research_, 34(3), 384–392. [doi:10.1016/0377-2217(88)90159-2](https://doi.org/10.1016/0377-2217(88)90159-2)
  The multicut L-shaped method, which keeps one cut per outcome where the single-cut method aggregates the outcomes into one cut. The single-cut formulation of [Cut Management](/en/math/cut-management) is contrasted with it.
  _Cited in [Cut Management](/en/math/cut-management) §3, [SDDP Algorithm](/en/math/sddp-algorithm) §6._

- **Birge, J.R. & Louveaux, F.V.** (2011). _Introduction to Stochastic Programming_, 2nd edition. Springer. [doi:10.1007/978-1-4614-0237-4](https://doi.org/10.1007/978-1-4614-0237-4)
  Standard textbook reference for stochastic programming theory and decomposition methods.
  _Background reference for [SDDP Algorithm](/en/math/sddp-algorithm)._

- **Philpott, A.B. & Guan, Z.** (2008). On the convergence of stochastic dual dynamic programming and related methods. _Operations Research Letters_, 36(4), 450–455. [doi:10.1016/j.orl.2008.01.013](https://doi.org/10.1016/j.orl.2008.01.013)
  Convergence theory for SDDP under finitely many scenarios.
  _Background reference for [Cut Management](/en/math/cut-management)._

- **Shapiro, A.** (2011). Analysis of stochastic dual dynamic programming method. _European Journal of Operational Research_, 209(1), 63–72. [doi:10.1016/j.ejor.2010.08.007](https://doi.org/10.1016/j.ejor.2010.08.007)
  Convergence analysis, complexity bounds, and risk-averse extensions for SDDP.
  _Cited in [Risk Measures](/en/math/risk-measures) §10._

- **Dowson, O.** (2020). The policy graph decomposition of multistage stochastic programming problems. _Networks_, 76(1), 3–23. [doi:10.1002/net.21932](https://doi.org/10.1002/net.21932)
  Defines the policy graph: nodes with local subproblems and cut pools, linked by probability-weighted arcs, a cycle among them representing an infinite horizon.
  _Cited in [Policy Graphs](/en/math/policy-graphs) §4, [Horizon Modes](/en/math/horizon-modes) §6._

---

## Cut Management and Convergence

- **de Matos, V.L., Philpott, A.B. & Finardi, E.C.** (2015). Improving the performance of Stochastic Dual Dynamic Programming. _Journal of Computational and Applied Mathematics_, 290, 196–208. [doi:10.1016/j.cam.2015.04.048](https://doi.org/10.1016/j.cam.2015.04.048)
  Cut selection strategies for SDDP, including the Level-1 active-cut criterion.
  _Cited in [Cut Management](/en/math/cut-management) §7, §8._

- **Guigues, V. & Römisch, W.** (2012). Sampling-based decomposition methods for multistage stochastic programs based on extended polyhedral risk measures. _SIAM Journal on Optimization_, 22(2), 286–312. [doi:10.1137/100811696](https://doi.org/10.1137/100811696)
  Risk-averse sampling-based decomposition methods, SDDP among them, under extended polyhedral risk measures, a class that contains CVaR, with a convergence proof.
  _Cited in [Cut Management](/en/math/cut-management) §4 (Tier 2), [The SDDP Framework in One Page](/en/overview/sddp-framework-overview) §2._

- **Guigues, V.** (2016). Convergence analysis of sampling-based decomposition methods for risk-averse multistage stochastic convex programs. _SIAM Journal on Optimization_, 26(4), 2468–2494. [doi:10.1137/140983136](https://doi.org/10.1137/140983136)
  Convergence of risk-averse sampling-based decomposition methods, SDDP among them, for multistage stochastic convex programs.
  _Cited in [Cut Management](/en/math/cut-management) §4 (Tier 2), [The SDDP Framework in One Page](/en/overview/sddp-framework-overview) §2._

- **Guigues, V.** (2017). Dual dynamic programing with cut selection: Convergence proof and numerical experiments. _European Journal of Operational Research_, 258(1), 47–57. [doi:10.1016/j.ejor.2016.10.047](https://doi.org/10.1016/j.ejor.2016.10.047)
  Defines Limited-Memory Level 1 (LML1) cut selection, which keeps at each trial point only the oldest of the cuts with the highest value there, and proves the convergence of dual dynamic programming with it.
  _Cited in [Cut Management](/en/math/cut-management) §6, §7, §9._

- **Bandarra, M. & Guigues, V.** (2021). Single cut and multicut stochastic dual dynamic programming with cut selection for multistage stochastic linear programs: convergence proof and numerical experiments. _Computational Management Science_, 18(2), 125–148. [doi:10.1007/s10287-021-00387-8](https://doi.org/10.1007/s10287-021-00387-8). Preprint: [arXiv:1902.06757](https://arxiv.org/abs/1902.06757)
  Convergence proof for single-cut and multicut SDDP with Level 1 and LML1 cut selection: with finitely many scenarios, an optimal first-stage solution after finitely many iterations with probability 1.
  _Cited in [Cut Management](/en/math/cut-management) §9._

---

## Risk Measures

- **Rockafellar, R.T. & Uryasev, S.** (2000). Optimization of conditional value-at-risk. _Journal of Risk_, 2(3), 21–41. [doi:10.21314/JOR.2000.038](https://doi.org/10.21314/JOR.2000.038)
  Definition of CVaR and the linearisation that allows it to be embedded in linear programmes — the basis for risk-averse cut aggregation in SDDP.
  _Background reference for [Risk Measures](/en/math/risk-measures)._

- **Philpott, A.B. & de Matos, V.L.** (2012). Dynamic sampling algorithms for multi-stage stochastic programs with risk aversion. _European Journal of Operational Research_, 218(2), 470–483. [doi:10.1016/j.ejor.2011.10.056](https://doi.org/10.1016/j.ejor.2011.10.056)
  Dynamic sampling under risk aversion with Markovian scenario transitions.
  _Background reference for [Risk Measures](/en/math/risk-measures)._

- **Philpott, A.B., de Matos, V.L. & Finardi, E.C.** (2013). On solving multistage stochastic programs with coherent risk measures. _Operations Research_, 61(4), 957–970. [doi:10.1287/opre.2013.1175](https://doi.org/10.1287/opre.2013.1175)
  Time-consistent risk-averse SDDP with CVaR. Dual representation and aggregation weights for risk-averse cut generation, a convergence proof for the risk-averse method, and an inner approximation of the cost-to-go from which a deterministic upper bound is evaluated.
  _Cited in [Risk Measures](/en/math/risk-measures) §9, §10, [Cut Management](/en/math/cut-management) §4 (Tier 2), [The SDDP Framework in One Page](/en/overview/sddp-framework-overview) §2, [Upper Bound Evaluation](/en/math/upper-bound-evaluation) (Appendix, References)._

---

## Upper Bound Evaluation

- **Costa, B.F.P. & Leclère, V.** (2023). Duality of upper bounds in stochastic dynamic programming. _Optimization Online_. Preprint: [optimization-online.org/?p=23738](https://optimization-online.org/?p=23738)
  Duality framework for inner-approximation upper bounds, which builds on the inner approximation of Philpott, de Matos & Finardi (2013). Basis for the SIDP inner-approximation estimator described in [Upper Bound Evaluation](/en/math/upper-bound-evaluation).
  _Cited in [Upper Bound Evaluation](/en/math/upper-bound-evaluation) (Appendix, References)._

---

## Hydro Production

- **Diniz, A.L. & Maceira, M.E.P.** (2008). A four-dimensional model of hydro generation for the short-term hydrothermal dispatch problem considering head and spillage effects. _IEEE Transactions on Power Systems_, 23(3), 1298–1308. [doi:10.1109/TPWRS.2008.922253](https://doi.org/10.1109/TPWRS.2008.922253)
  The piecewise-linear hydro production function (FPHA): generation as a function of storage, turbined flow and spillage, with the head computed from the forebay and tailrace levels, and the nonconcave regions of the exact function approximated by convexification and regression. Origin of the approach fitted in [Hydro Production Function Models](/en/math/hydro-production-models) §2. Novomodelo fits its planes over storage and turbined flow at spillage = 0 and carries the spillage effect by a per-plane lateral-flow secant rather than a spillage axis in the fit.
  _Cited in [Hydro Production Function Models](/en/math/hydro-production-models) §2._

---

## Inflow Modelling

- **Box, G.E.P. & Jenkins, G.M.** (1976). _Time Series Analysis: Forecasting and Control_, revised edition. Holden-Day, San Francisco.
  Foundational textbook for ARMA / autoregressive time-series modelling and the Yule-Walker estimation method that underlies the PAR(p) fitting procedure. Its sample autocovariance estimator uses the population divisor $1/N$.
  _Cited in [PAR(p) Inflow Model](/en/math/par-inflow-model) §3.2. Background reference for [Scenario Generation](/en/math/scenario-generation)._

- **Hipel, K.W. & McLeod, A.I.** (1994). _Time Series Modelling of Water Resources and Environmental Systems_. Elsevier, Amsterdam.
  Chapter 14 is the canonical presentation of periodic models: the PAR model definition, the periodic autocovariance/ACF conventions (the more recent observation names the season), the periodic Yule-Walker equations, the lag-0 variance identity, the periodic PACF with its $\pm 1.96/\sqrt{N_m}$ significance band, and the periodic-stationarity condition. Novomodelo's fitting procedure is this formulation written in correlation form over the $s_m$-standardized series.
  _Cited in [PAR(p) Inflow Model](/en/math/par-inflow-model) §3.5._

- **Maceira, M.E.P. & Damázio, J.M.** (2006). Use of the PAR(p) model in the stochastic dual dynamic programming optimization scheme used in the operation planning of the Brazilian hydropower system. _Probability in the Engineering and Informational Sciences_, 20(1), 143–156. [doi:10.1017/S0269964806060098](https://doi.org/10.1017/S0269964806060098)
  The periodic autoregressive PAR(p) model as fitted inside SDDP for the Brazilian system. Source of the iterative AR-order-reduction procedure that keeps composed lag contributions non-negative.
  _Cited in [PAR(p) Inflow Model](/en/math/par-inflow-model) §3.6, §7.6._

- **Treistman, F., Maceira, M.E.P., Damázio, J.M. & Cruz, C.B.** (2020). Periodic time series model with annual component applied to operation planning of hydrothermal systems. In _2020 International Conference on Probabilistic Methods Applied to Power Systems (PMAPS)_, Liège, Belgium, 1–6. [doi:10.1109/PMAPS47429.2020.9183472](https://doi.org/10.1109/PMAPS47429.2020.9183472)
  The PAR(p)-A model: the periodic autoregressive model augmented with an annual component, a regression term on the rolling annual average (the mean of the twelve previous monthly inflows), which extends the model's memory to long dry and wet periods.
  _Cited in [PAR(p) Inflow Model](/en/math/par-inflow-model) §7._

- **Larroyd, P.V., Pedrini, R., Beltrán, F., Teixeira, G., Finardi, E.C. & Picarelli, L.B.** (2022). Dealing with Negative Inflows in the Long-Term Hydrothermal Scheduling Problem. _Energies_, 15(3), 1115. [doi:10.3390/en15031115](https://doi.org/10.3390/en15031115)
  Penalty, truncation and truncation-combined-with-penalty strategies for negative PAR(p) inflows in SDDP: under each, the PAR state keeps the raw realization and a correction adds water to the inflow the water balance receives, bounded by the truncation amount under the truncation strategies. Its §2.5 shows the stage problems' values falling below the master problems built from the cuts under truncation, so the lower bound can exceed an upper bound evaluated on the stage problems.
  _Cited in [Inflow Non-Negativity Solution Methods](/en/math/inflow-nonnegativity) §6.2, §7, §9._

- **Maceira, M.E.P., Terry, L.A., Costa, F.S., Damázio, J.M. & Melo, A.C.G.** (2002). Chain of optimization models for setting the energy dispatch and spot price in the Brazilian system. In _Proceedings of the 14th Power Systems Computation Conference (PSCC)_, Seville, Spain.
  The NEWAVE / DECOMP / GEVAZP optimization chain for the Brazilian system, in which the medium-term study takes its terminal cost-to-go from the cuts of the long-term policy. Source of the DECOMP-style scenario tree — a deterministic trunk with branching at the final stage — expressed as a terminal fan of sibling nodes traversed by enumerated selection, and the published counterpart of the chained studies of [Post-Study Boundary](/en/math/post-study-boundary) §5.
  _Cited in [Scenario Generation](/en/math/scenario-generation) §6, [Post-Study Boundary](/en/math/post-study-boundary) §5._

---

## Boundary Conditions and Horizon Modes

- **Birge, J.R. & Zhao, G.** (2007). Successive linear approximation solution of infinite-horizon dynamic stochastic programs. _SIAM Journal on Optimization_, 18(4), 1165–1186. [doi:10.1137/060665506](https://doi.org/10.1137/060665506)
  Infinite-horizon discounted stochastic linear programs solved by cutting-plane approximation of a stationary value function, with a convergence proof.
  _Cited in [Horizon Modes](/en/math/horizon-modes) §6._

- **Shapiro, A. & Ding, L.** (2020). Periodical multistage stochastic programs. _SIAM Journal on Optimization_, 30(3), 2083–2102. [doi:10.1137/19M129406X](https://doi.org/10.1137/19M129406X)
  Infinite-horizon multistage programs with periodic data: the periodic analogue of the discounted Bellman equations, whose value functions repeat with the period, and the SDDP algorithm that shares cuts across the stages of one period.
  _Cited in [Horizon Modes](/en/math/horizon-modes) §6._

- **Costa, B.F.P., Calixto, A.O., Sousa, R.F.S., Figueiredo, R.T., Penna, D.D.J., Khenayfis, L.S. & Oliveira, A.M.R.** (2025). Boundary conditions for hydrothermal operation planning problems: the infinite horizon approach. _Proceeding Series of the Brazilian Society of Computational and Applied Mathematics_, 11(1), 1–7. [doi:10.5540/03.2025.011.01.0355](https://doi.org/10.5540/03.2025.011.01.0355)
  Periodic policy graph and infinite-horizon SDDP formulation for hydrothermal operation planning. The reserved cyclic design that [Horizon Modes](/en/math/horizon-modes) describes follows its presentation of the season function $\tau(t)$, the cycle convergence inequality, the season-indexed cut pool with its cut-sharing equation, and the fixed-point Bellman operator.
  _Cited in [Horizon Modes](/en/math/horizon-modes) §6._

---

## State Augmentation

- **Diniz, A.L. & Maceira, M.E.P.** (2013). Multi-lag Benders decomposition for power generation planning with nonanticipativity constraints on the dispatch of LNG thermal plants. In H.I. Gassmann & W.T. Ziemba (eds.), _Stochastic Programming: Applications in Finance, Energy, Planning and Logistics_, World Scientific Series in Finance, 443–464. [doi:10.1142/9789814407519_0016](https://doi.org/10.1142/9789814407519_0016)
  Thermal dispatch decided stages before delivery, carried as state of the stage problems of SDDP: the published counterpart of the anticipated-thermal commitments of [State Augmentation](/en/math/state-augmentation) §5.
  _Cited in [State Augmentation](/en/math/state-augmentation) §5._

---

## Software References

- **Dowson, O. & Kapelevich, L.** (2021). SDDP.jl: A Julia Package for Stochastic Dual Dynamic Programming. _INFORMS Journal on Computing_, 33(1), 27–33. [doi:10.1287/ijoc.2020.0987](https://doi.org/10.1287/ijoc.2020.0987). Documentation: [sddp.dev](https://sddp.dev/stable/)
  Reference SDDP implementation in Julia. Influenced the sampling-scheme abstractions, the convex-combination risk-measure structure and the notation conventions in Novomodelo. Its `EAVaR` measure puts the weight $\lambda$ on the expectation; [Risk Measures](/en/math/risk-measures) §3 gives the mapping to Novomodelo's $\lambda$.
  _Cited in [Notation Conventions](/en/overview/notation-conventions), [Scenario Generation](/en/math/scenario-generation) §3, [Risk Measures](/en/math/risk-measures) §3, [Policy Graphs](/en/math/policy-graphs) §4._

- **Huangfu, Q. & Hall, J.A.J.** (2018). Parallelizing the dual revised simplex method. _Mathematical Programming Computation_, 10(1), 119–142. [doi:10.1007/s12532-017-0130-5](https://doi.org/10.1007/s12532-017-0130-5)
  HiGHS dual simplex implementation. HiGHS is Novomodelo's default LP solver.
  _Background reference for [LP Warm-Start](/en/math/lp-warm-start)._

---

## Numerical Methods

- **Tomlin, J.A.** (1975). On scaling linear programming problems. In _Computational Practice in Mathematical Programming_, Mathematical Programming Studies 4, 146–166. [doi:10.1007/BFb0120718](https://doi.org/10.1007/BFb0120718)
  Compares scaling methods for linear programs, among them geometric-mean scaling, which sets each row or column factor from the largest and smallest magnitudes in it.
  _Cited in [LP Layout and Scaling](/en/math/lp-layout-and-scaling) §2.2._

- **Higham, N.J.** (1988). Computing a nearest symmetric positive semidefinite matrix. _Linear Algebra and its Applications_, 103, 103–118. [doi:10.1016/0024-3795(88)90223-6](https://doi.org/10.1016/0024-3795(88)90223-6)
  The nearest symmetric positive-semidefinite matrix in the Frobenius norm to a symmetric matrix is the matrix with its negative eigenvalues set to zero: the eigenvalue clipping applied when factorising the spatial correlation matrix.
  _Cited in [PAR(p) Inflow Model](/en/math/par-inflow-model) §6, [Scenario Generation](/en/math/scenario-generation) §2.1._

- **Elble, J.M. & Sahinidis, N.V.** (2012). Scaling linear optimization problems prior to application of the simplex method. _Computational Optimization and Applications_, 52(2), 345–371. [doi:10.1007/s10589-011-9420-4](https://doi.org/10.1007/s10589-011-9420-4)
  Computational comparison of the scaling methods applied before the simplex method, among them geometric-mean scaling and equilibration.
  _Cited in [LP Layout and Scaling](/en/math/lp-layout-and-scaling) §2.2._

- **Higham, N.J.** (2002). Computing the nearest correlation matrix — a problem from finance. _IMA Journal of Numerical Analysis_, 22(3), 329–343. [doi:10.1093/imanum/22.3.329](https://doi.org/10.1093/imanum/22.3.329)
  The nearest correlation matrix problem, which adds to the positive-semidefinite projection the unit-diagonal constraint that eigenvalue clipping does not keep.
  _Cited in [PAR(p) Inflow Model](/en/math/par-inflow-model) §6._

---

## Brazilian Power-System Context

- **CEPEL — Centro de Pesquisas de Energia Elétrica** (n.d.). _Documentação Técnica dos modelos para Planejamento da Operação do SIN – Ambiente Libs_. Online manual: [see.cepel.br/manual/libs/latest/](https://see.cepel.br/manual/libs/latest/)
  Official documentation of the NEWAVE / DECOMP / DESSEM suite of stochastic-dispatch models operated for the Brazilian system. Cited only for practitioner terms and notation: the equivalent-terms tables of the glossary, the GEVAZP residual distribution (section _Distribuição Lognormal 3 parâmetros_) and the PAR(p) notation (section _Modelo Autorregressivo Periódico - Par(p)_). The methods those models implement are credited to their primary articles above: FPHA → Diniz & Maceira (2008); PAR(p) and iterative order reduction → Maceira & Damázio (2006); PAR(p)-A → Treistman et al. (2020); DECOMP-style scenario tree → Maceira et al. (2002). Novomodelo's dead-volume filling model is its own and is not attributed here.
  _Cited in [Glossary — Brazilian Power-System Ecosystem](/en/reference/glossary/#brazilian-power-system-ecosystem) and [Glossary — Equivalent terms in other planning tools](/en/reference/glossary/#equivalent-terms-in-other-planning-tools)._
