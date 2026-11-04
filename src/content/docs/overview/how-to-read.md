---
title: How to Read This Site
description: Navigation guide — the site's sidebar groups, what each covers, and reading paths for different readers.
---

## Purpose

This chapter is a navigation guide. It describes the site's sidebar groups, explains what each group covers, and suggests reading paths for different readers. A reader deciding whether this site matches their needs should read this chapter first.

## 1. Site Structure

The site is organised into the groups shown in the sidebar, in this order: Get Started, Model entities, Running studies, Worked Examples and Technical reference. The methodology chapters sit inside Technical reference, in the Methodology subgroup. Each group is an on-ramp for new readers, an entity-by-entity explanation of the model, a guide to using the software, a worked illustration of the method, or a set of methodology and lookup pages.

**Get Started** answers what Novomodelo computes ([What Novomodelo Solves](/overview/what-novomodelo-solves)) and holds [How the model decides](/overview/how-the-model-decides), the model's decision loop in one page, and this navigation guide. Readers deciding whether Novomodelo fits their problem should start here.

**Model entities** explains the model one entity at a time, with one page for each of the 16 entities, in a flat list under "Model entities": what each entity is, what the model decides about it and where its formulas and files are. The [home page](/#entidades) shows the same entities along the path of energy.

**Running studies** walks through installing Novomodelo and running a first study from the CLI ([Installation](/getting-started/installation), [Quickstart](/getting-started/quickstart)) or from Python ([Python Quickstart](/getting-started/python-quickstart)), or through an AI agent ([AI Agents](/running/mcp-server)), followed by the pages on configuring and running studies, reusing a trained policy, running at scale, converting an existing case and interpreting the results. Readers who run studies return to it after the Quickstart.

**Introduction** (the first group of the Methodology subgroup) establishes the conceptual and notational foundation for the rest of the site: a one-page framing of the SDDP algorithm for readers new to stochastic dynamic programming ([The SDDP Framework in One Page](/overview/sddp-framework-overview)), the complete notation used throughout ([Notation Conventions](/overview/notation-conventions)), and, as a companion, this navigation guide (kept in Get Started). Its chapters can be read in order or consulted individually.

**System Modelling** defines the power system entities and the stage LP that Novomodelo solves at each iteration. This group is the mathematical foundation for everything that follows: hydro plants, thermal units, transmission lines, penalty structures, the stage LP and the state it carries between stages. Readers who want to understand how the physical system is represented in the optimisation should begin here.

**Stochastic Modelling** covers the inflow uncertainty model. Novomodelo uses periodic autoregressive models (PAR) to generate scenario trees; this group explains the policy graph that links the stages, the PAR model structure and its fitting procedure, the treatment of negative inflow realizations, the scenario generation pipeline, and studies that mix stage resolutions. Readers interested in how uncertainty is handled, without being concerned with the optimisation algorithm, can read this group independently of The SDDP Algorithm.

**The SDDP Algorithm** is the core of the methodology. It covers the forward and backward passes, cut generation and management, the LP layout and its scaling, warm-start strategies, risk measures, stopping rules, upper-bound evaluation, and determinism guarantees. Readers coming from the SDDP literature will find the connections to standard treatments here; readers new to SDDP should read Introduction and System Modelling first.

**Coupling & Boundary Conditions** covers how a study's horizon is closed: the horizon mode, the post-study boundary that values the state left at the end of the horizon (chained studies included), and how discounting interacts with the cut approximation. See [Horizon Modes](/math/horizon-modes) for the entry point.

**Worked Examples** provides two pedagogical walkthroughs of the SDDP loop: a single-reservoir toy case and a four-reservoir toy case, both small enough to verify by hand. These chapters trace the forward pass, the backward pass, cut construction and the lower-bound update with concrete numbers. The novomodelo repository ships the runnable cases [`examples/1dtoy`](https://github.com/ons-ccee-epe/novomodelo/tree/main/examples/1dtoy) and [`examples/4ree`](https://github.com/ons-ccee-epe/novomodelo/tree/main/examples/4ree); each walkthrough states how its numbers relate to its case. Readers learning SDDP by doing should start with the worked examples after reading Introduction.

**Technical reference** contains the Methodology subgroup described above, followed by the lookup pages: the input and output formats, the command-line and Python interfaces, the error codes, the glossary and the bibliography. Use this group as a lookup resource during reading, not as a starting point.

## 2. Tools and Interfaces

Novomodelo runs from the `novomodelo` command-line program and from the `novomodelo-python` package. [What Novomodelo Solves §4](/overview/what-novomodelo-solves#4-how-novomodelo-is-used) describes both interfaces and the files a run writes. The methodology chapters use "case directory" and "configuration" as concrete terms for the artefacts a user manages; these map directly to both interfaces.

Readers interested in the design commitments that underpin these interfaces — reproducibility, determinism, declaration order invariance and agent-readability — should read [What Novomodelo Solves §5](/overview/what-novomodelo-solves#5-methodology-principles).

## 3. Reading Paths

Different readers enter this site from different directions. Find the row that matches you:

| Reader | Reading path |
| ------ | ------------ |
| Run studies | [Installation](/getting-started/installation), then the [Quickstart](/getting-started/quickstart), then the Running studies group, starting with [Running Studies](/running/running-studies) and [Convergence & Diagnostics](/running/interpreting-results). |
| Coming from other software? | [What Novomodelo Solves §6](/overview/what-novomodelo-solves#6-coming-from-other-software), then [Converting an existing case](/running/case-conversion); for equivalent terms in other planning tools, see the [Glossary](/reference/glossary). |
| Work in Python | The [Python Quickstart](/getting-started/python-quickstart), then the [Python API](/reference/python-api) reference. |
| New to SDDP | Read [What Novomodelo Solves](/overview/what-novomodelo-solves) and all of Introduction, then read System Modelling to understand the LP, then read The SDDP Algorithm for the algorithm itself. The worked examples in Worked Examples reinforce the concepts. |
| Familiar with SDDP, new to Novomodelo | Skim What Novomodelo Solves and Introduction, read [Notation Conventions](/overview/notation-conventions) carefully, then read The SDDP Algorithm. Cross-reference System Modelling for the stage LP and its state when The SDDP Algorithm refers to stage variables. |
| Looking for a specific topic | Use the sidebar to navigate to the relevant group. The SDDP Algorithm covers the algorithm; System Modelling covers the LP and system model; Stochastic Modelling covers the inflow uncertainty model; Coupling & Boundary Conditions covers boundary conditions. [Notation Conventions](/overview/notation-conventions) resolves notation questions, and Running studies covers the software in use. |

## Cross-References

- [What Novomodelo Solves](/overview/what-novomodelo-solves) — the problem statement, algorithm name, methodology guarantees, user-facing capability summary, and an orientation for readers coming from other software
- [The SDDP Framework in One Page](/overview/sddp-framework-overview) — one-page algorithmic framing for readers new to stochastic dynamic programming
- [Notation Conventions](/overview/notation-conventions) — complete symbol table for index sets, parameters, decision variables, and dual variables
- [System Element Modeling Overview](/math/system-elements) — the elements of the system and their variables: System Modelling entry point
- [PAR(p) Inflow Model](/math/par-inflow-model) — periodic autoregressive inflow model: Stochastic Modelling entry point
- [SDDP Algorithm](/math/sddp-algorithm) — forward pass, backward pass, cut generation, convergence: The SDDP Algorithm entry point
- [Horizon Modes](/math/horizon-modes) — boundary conditions and horizon-mode design: Coupling & Boundary Conditions entry point
