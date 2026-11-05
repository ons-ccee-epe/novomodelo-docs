# Novomodelo Docs — Development Guidelines

## Project Overview

Novomodelo-docs is the **single, unified documentation site** for the Novomodelo ecosystem
— an Astro Starlight site that layers the SDDP methodology reference (math, worked
examples) with the user-facing software guide (install, configure, I/O, CLI,
examples) for hydrothermal dispatch. It is the one documentation property; the
legacy `novomodelo/book/` mdBook is retired and the developer/crate-internal layer now
lives as per-crate `README.md` files + `ARCHITECTURE.md` in the `novomodelo` repo.

- **Dev**: `npm run dev` (Astro dev server)
- **Build**: `npm run build`; `npm run build:versions` for multi-version assembly
- **Build hygiene**: `npm run build` exits 1 when a page Lunaria tracks
  (`src/content/docs/**/*.{md,mdx}` outside `pt-br/`, per `lunaria.config.json`)
  has no commit history: Lunaria reads each tracked page's git history for the
  `/lunaria` route. Build and verify on committed state.
- **KaTeX**: manual remark-math + rehype-katex (D4) wired in `astro.config.mjs`
  — NOT a Starlight plugin. Math is rendered to static HTML at build time (zero
  client JS).
- **Source**: all chapters live under `src/content/docs/`; the sidebar/TOC is
  configured in `astro.config.mjs` (Starlight `sidebar`), not a flat text
  table-of-contents file.
- **Audience & domain**: the unified site serves `docs.modelossetoreletrico.org.br`.

The actual Novomodelo code at the main org repo is the **ground truth**. When specs
diverge from the code, the spec must be updated — not the other way around.

---

## Current State

**Synced to: novomodelo v0.20.0 (2026-11-03).**

The corpus is a **unified two-layer reference**: the annotation-free **math
layer** (formulation, algorithm, worked examples) interleaved per topic with a
version-scoped **software layer** (Configure / I·O tabs, the I/O Reference, and
Running Novomodelo), organised into the interleaved sidebar configured in
`astro.config.mjs`. Only crate-internal/developer architecture lives outside this
site, as `novomodelo` per-crate READMEs + `ARCHITECTURE.md` (see "Unified corpus & the
developer surface" below). Versioning is **build-per-version**
(`versions.json`): `latest` is built from the working tree and served at `/`,
and each `versions[]` entry is a frozen snapshot of one earlier novomodelo minor,
built from its `ref` (a 40-hex commit SHA on `main`, never a tag) and served at
`/vX.Y/`. A novomodelo patch release updates `latest` in place; a frozen snapshot is
never edited (a fix branches from its SHA and moves `ref`). Every frozen minor
is kept until novomodelo v1.0.0, then the last two or three. README `## Versioning`
is the freeze runbook.

## Hard Rules

- **Ground truth**: code > spec. When they diverge, update the spec.
- **No novomodelo version numbers in the math layer.** `math/*` and the overview/
  notation/glossary carry no novomodelo version annotations (no "as of vX.Y",
  "added in", "earlier releases", migration notes) — the math is always-true and
  instance-agnostic. The **software layer** (`_impl/*` partials, `reference/*`,
  `running/*`) may carry version-scoped config/I·O/CLI detail: each documentation
  version (`latest` at `/` or a frozen `/vX.Y/` snapshot) describes the novomodelo
  release its `versions.json` `novomodelo` field names. This is the two-layer expression
  of the T1 versioning tension.
- **Batched edits**: a change that touches multiple chapters must land as a single
  batch (one commit / one PR) — there is no propagation registry, so the corpus
  only stays consistent if every affected chapter is edited together. (Example:
  the v0.10.0 sync touched block-formulations, lp-formulation, system-elements,
  penalty-system, cut-management, par-inflow, determinism, notation, the `_impl`
  partials, and the reference pages as one batched set of commits.)
- **Serialization (novomodelo code fact)**: `postcard` for MPI broadcast,
  `FlatBuffers` for policy persistence. Never `bincode`.
- **No `Box<dyn Trait>` (novomodelo code fact)**: novomodelo uses enum dispatch for
  closed variant sets (e.g. `CommBackend`, `LocalCommKind`). The solver
  `Profile` is an associated type of `SolverInterface`, resolved at compile
  time (a generic, not an enum). Reflect this if a chapter describes the solver
  interface.
- **Site colours**: the accent is **Copper** (`#B87333`), not blue — never infer
  it from the diagram palette (`.claude/rules/diagrams.md`).
- **Current-state voice, both layers.** Every page in both layers states what
  novomodelo does now, with no change narration (no "now", "no longer", "previously",
  "used to", "formerly", "fixed in", "was broken", "BREAKING", "new in",
  "as of vX", "this release", migration notes, Before/After examples,
  removed-key lists, or "Earlier documentation…" / "Known discrepancy" boxes).
  The software layer may state current version-scoped facts (keys, pins, flags)
  but never change history; a current-behaviour caveat is a neutral fact, never
  "a bug where…".
- **Generic positioning.** Main areas (`index.mdx` lead, CTAs and persona cards,
  `overview/*`, `getting-started/*`, the sidebar labels, and every section
  heading outside `running/case-conversion.mdx` and `reference/glossary.md`)
  name no other planning tool (no NEWAVE, DECOMP, DESSEM or GEVAZP) and use
  generic phrasing such as "Coming from other software?" or "Converting an
  existing case", linking to `running/case-conversion`. NEWAVE and DECOMP are
  named on the bridge page; named term-mapping tables and named equivalent terms
  live only in the glossary and the bridge page, and other pages carry a generic
  pointer ("for equivalent terms in other planning tools, see the Glossary").
  Literal file or identifier references and bibliography citations are exempt.
- **pt-BR translation in the same commit.** Every English page under
  `src/content/docs/` has its translation at `src/content/docs/pt-br/<same path>`.
  An English change (edit, new page, delete, rename, sidebar label) lands with
  its pt-BR counterpart in the same commit — read
  `.claude/rules/translation-ptbr.md` before any commit that touches English
  pages. A `PreToolUse` hook blocks `git commit` when a counterpart is missing.

---

## Rules (Read When Relevant)

Detailed rules live in `.claude/rules/` and auto-load when a matching file is
read; open them directly when working on the topic without reading a page first.

| Rule | Loads on | Covers |
| --- | --- | --- |
| `translation-ptbr.md` | any page, `astro.config.mjs`, `src/components/**` | EN↔pt-BR sync contract, pre-commit procedure, the sync hook |
| `authoring.md` | any page, `public/schemas/**` | Two-layer corpus, math-layer and software-layer standards, voice gates, vendored JSON schemas |
| `sddp-lp.md` | LP / cut / warm-start / determinism pages, policy management, error codes | LP layout, state pinning, cut subgradient, block modes, scaling, warm start, cut pool, checkpoint format, policy-load gates |
| `hydro.md` | FPHA, cascade, inflow non-negativity, generic constraints pages | FPHA fit, water travel time, inflow-slack methods, `hydro_inflow` term |
| `thermals-and-discounting.md` | state augmentation, equipment, discount, post-study pages | Anticipated thermals, discount factors |
| `commissioning.md` | penalty, system-elements, entity pages | Filling, commissioning windows, initial storage, canonical entity order |
| `stochastic.md` | scenario generation, PAR, multi-resolution pages | Historical sampling, correlation target, moment matching, noise groups, MPI fingerprint |
| `diagrams.md` | `src/figures/**`, `src/components/**`, `src/styles/**`, `.mdx` pages | d2 + Observable Plot only, semantic colours, site accent |
| `quality-gates.md` | `scripts/**`, `package.json`, CI workflows | Gate prerequisites (d2, novomodelo binary, KaTeX strict) and CI wiring |

The translation guide and glossary is
`src/content/docs/pt-br/_GLOSSARIO-E-CRITERIOS-DA-TRADUCAO.md`.

---

## Quality Gates

```bash
# export NOVOMODELO_BIN=~/.local/opt/novomodelo-v0.20.0/novomodelo-cli-x86_64-unknown-linux-gnu/novomodelo
npm run check:figures && npm run check:voice && npm run check:counts \
  && npm run check:version && npm run check:narration && npm run check:error-coverage \
  && npm run check:input-schemas && npm run check:glossary && npm run check:python-api \
  && npm run check:gc-examples && npm run check:type-spelling && npm run check:d2 \
  && npm run check:spdx && npm run refresh:recordings -- --check \
  && npm run build && npm run check && npm run check:math \
  && npm run build:versions && npm run check:links && npm test && npm run check:e10
```

Prerequisites and CI wiring: `.claude/rules/quality-gates.md`.

---

## Key References

| Resource                  | Location                                                        | Purpose                                                      |
| ------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Novomodelo code (ground truth) | `https://github.com/ons-ccee-epe/novomodelo/`                           | Actual implementation                                       |
| Unified docs site         | `https://docs.modelossetoreletrico.org.br/`                                   | This site (methodology + software layer)                    |
| Crate READMEs + ARCHITECTURE | `https://github.com/ons-ccee-epe/novomodelo/` (`crates/*/README.md`, `ARCHITECTURE.md`) | Developer/crate-internal surface (not on the site) |
| CHANGELOG                 | `https://github.com/ons-ccee-epe/novomodelo/CHANGELOG.md`               | Per-release feature list (sync source)                      |
| Diagram authoring guide   | [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md) | Tool selection + design system for diagrams        |
| Translation guide (pt-BR) | [`src/content/docs/pt-br/_GLOSSARIO-E-CRITERIOS-DA-TRADUCAO.md`](src/content/docs/pt-br/_GLOSSARIO-E-CRITERIOS-DA-TRADUCAO.md) | Form rules, approved terminology, glossary |
