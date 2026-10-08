# Diagram Authoring Guide

**Scope.** This guide defines **which tool each kind of methodology-reference
diagram uses**, and the conventions that keep them visually coherent. It covers
diagrams embedded in chapters under `src/content/docs/` and the compute components
under `src/components/` and `src/figures/`.

> **Paths in this guide are repo-root-relative**: `src/content/docs/`,
> `src/components/`, `src/styles/diagrams.css`, and `astro.config.mjs`.

---

## 1. Tool selection

### 1.1 Decision table

Two tools, one job each: **d2** draws every diagram; **Observable Plot** draws
every computed math plot.

| Diagram content                                                                            | Tool                       | Why                                                                                                      |
| ------------------------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Mathematical function, distribution, convergence curve, histogram                          | **Observable Plot** island | Compute layer unit-tested; markers/curves derived from the math, not placed by eye                       |
| Composed block diagram (nested containers, labeled regions, data flow with math in labels) | **inline D2** (`astro-d2`) | Code-defined topology in a text fence; PR-reviewable as diffs; theme-adaptive via the `.d2-svg` keystone |
| Flowchart, state machine, sequential pipeline, lifecycle, loop                             | **inline D2** (`astro-d2`) | d2 draws directed graphs with `shape: diamond` decisions; build-time SVG, zero client JS, one keystone   |
| Power-system one-line (buses, generators, demand/deficit arrows)                           | **inline D2** (`astro-d2`) | D2 handles spatial schematics; covers both schematic and spatial diagram roles                           |

Observable Plot covers the math-plot role (it _computes_ the curve from tested
code — d2 cannot). D2 covers everything else. There are no other diagram tools
on the site, and **no Mermaid**: flowcharts are d2, so every diagram renders at
build time with one themable keystone. (Mermaid stays fine in the `novomodelo`
READMEs and `ARCHITECTURE.md`, which GitHub renders.)

### 1.2 Decision tree

````
Does the diagram's content reduce to a mathematical function or distribution?
├── YES → Observable Plot island                              (§3)
│
Is it any other diagram — labeled boxes / nested containers / arrows, a
power-system one-line, OR a flowchart / decision tree / state machine / loop?
├── YES → inline ```d2 block                                  (§4)
│
None of the above clearly fits → stop and discuss, do not improvise.
````

### 1.3 Consistency rule (non-negotiable)

**A family of related diagrams uses the same tool.** If the LP section needs
three column-layout schematics, they are all inline D2 — not two in one tool and
one in another. Mixed tools within a domain fragment the visual identity and make
the reader re-learn vocabulary. When a new diagram joins an existing family, it
inherits the family's tool.

### 1.4 Figures in conceptual & overview chapters

**Conceptual and overview chapters earn their visuals.** A chapter that
introduces an idea before its deep treatment (Part 1, and any "in one page"
overview) should pair the key equation(s) with a diagram and/or a tested-compute
plot — the model is SDDP.jl's `first_steps`. Text-only is the exception, not the
default; a single well-chosen figure lowers the onboarding barrier more than
another paragraph.

- **Reuse, don't re-author.** A tested-compute plot may appear as a teaser in an
  overview chapter _and_ in the deep chapter that owns it — one instance per page
  (each island uses a fixed element `id`). Reusing the same component keeps the
  teaser correct-by-construction; do not fork a second, hand-tuned copy.
- **Embedding.** A chapter that embeds an Observable Plot island must be `.mdx`
  (import with the standard relative path, e.g.
  `import ValueFunctionPlot from "../../../components/ValueFunctionPlot.astro"`).
  Inline ` ```d2 ` fences work in plain `.md` too.
- **Notation parity.** Keep the overview's symbols identical to the deep chapter
  it previews — never introduce a parallel notation just for the overview.
- **Restraint.** Figures must teach, not decorate. Pick the one or two that carry
  the concept; do not dump every figure from the deep chapters into the overview.

Reference: `src/content/docs/overview/sddp-framework-overview.mdx` pairs the
Bellman recursion with the SDDP-loop d2 flowchart and the
ValueFunction / Convergence / CVaR plots — each section gets exactly one figure.

---

## 2. Rendering policy

Each tool has a fixed render path:

| Tool            | Render time | How                                                               | Theme adaptation                          |
| --------------- | ----------- | ----------------------------------------------------------------- | ----------------------------------------- |
| Observable Plot | Client-side | Astro island reads `--dgm-*` CSS vars; re-renders on theme toggle | `getComputedStyle` → CSS vars             |
| D2              | Build time  | `astro-d2` renders ` ```d2 ` fences to inline SVG                 | `.d2-svg` keystone (`[data-theme]` remap) |

**D2 engine: ELK, never TALA.** The `astro-d2` integration is configured with
`layout: "elk"` in `astro.config.mjs`. TALA is a proprietary layout engine that
watermarks output when used without a licence — using it breaks the build. The
`check:d2` guard (`npm run check:d2`) enforces ELK-only at CI time. Never change
the layout engine without resolving the licence question first.

**No committed SVG assets for D2.** Diagrams render from their inline fence
source — there is no separate SVG file to commit or maintain. Observable Plot
components are Astro islands (`.astro` files) — no static SVG either.

---

## 3. Observable Plot — math plots

**Use when** the diagram's content is a function, distribution, convergence
curve, or any quantity that can be computed from a formula.

### 3.1 Correctness rule

**The math IS the diagram.** Tangent slopes come from the analytic derivative.
Quantiles come from numerical inversion of the CDF. Convergence bounds come from
the actual bound computation. Never position markers by eye.

The compute functions live in `src/figures/<name>.ts` and are asserted by a
sibling `src/figures/<name>.test.ts`. The render layer (`.astro` island) consumes
this tested compute module — it does no arithmetic of its own.

### 3.2 Structure

Every math-plot figure has two files:

- **`src/figures/<name>.ts`** — pure TypeScript compute layer. Exports functions
  and data-point arrays derived from the math. No rendering, no DOM access, no
  `import` of Observable Plot. Example: `src/figures/valueFunction.ts` exports
  `Q(v)`, `dQ(v)`, `samples()`, and `bendersTangentAt()`.
- **`src/components/<Name>Plot.astro`** — Astro island. Imports from the compute
  module, reads `--dgm-*` CSS vars via `getComputedStyle`, builds the Observable
  Plot `marks` array, and re-renders on the `data-theme` attribute toggle.
  Example: `src/components/ValueFunctionPlot.astro`.

### 3.3 Theme-adaptive colours

Read palette vars from the document root — never hard-code hex:

```typescript
const curve =
  getComputedStyle(document.documentElement)
    .getPropertyValue("--dgm-curve")
    .trim() || "#b87333";
const accent =
  getComputedStyle(document.documentElement)
    .getPropertyValue("--dgm-accent")
    .trim() || "#4a8b6f";
```

Set `style: { background: "transparent" }` on the plot so it blends with
Starlight's light and dark page backgrounds.

Observe `data-theme` attribute changes so the plot recolours on theme toggle:

```typescript
new MutationObserver(render).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
```

### 3.4 Starting point

Clone `src/components/ValueFunctionPlot.astro` and its compute module
`src/figures/valueFunction.ts` + `src/figures/valueFunction.test.ts` as the
reference implementation. It demonstrates:

- Convex function Q(v) + Benders tangents (correct by construction from `dQ`)
- `--dgm-curve` / `--dgm-accent` / `--dgm-text` var reads
- Three unit tests: slope matches finite-difference, tangent touches Q at pin,
  cut is a lower bound everywhere on the curve

The unit tests (`npm test`) provide the correctness guarantee: every marker,
tangent, and quantile is asserted from formula evaluation — the core advantage of
the tested-compute model over a static rendering approach.

---

## 4. D2 — schematics and composed block diagrams

**Use when** the diagram is a composition of labeled boxes, data-flow arrows, or
a spatial schematic (power-system one-line, hardware topology, LP column layout).
D2 is the single tool for both topology/layout diagrams and spatial domain
diagrams — the two-tool pipeline (§1.1) has no third option.

### 4.1 Inline fence placement

D2 schematics live as inline fenced blocks in the chapter `.md` or `.mdx` file:

````markdown
```d2
LP stage-T: {
  x-columns: "state | gen | hydro | …"
  c-vector: "obj. coeff."
}
```
````

`astro-d2` renders the fence to an inline SVG at build time. No separate source
file; no separate SVG to commit. The fence IS the source.

### 4.2 Theme adaptation & the brand keystone

D2 SVGs rendered by `astro-d2` carry d2's built-in palette **class names**
(`fill-N1`, `stroke-B1`, …). d2 emits its own light/dark hexes under
`@media (prefers-color-scheme)`, which would follow the OS preference rather than
Starlight's manual toggle. The `.d2-svg` keystone in `src/styles/diagrams.css`
overrides that: it re-keys every palette class to a **brand token** — the warm
neutrals from `neutrals.css` (`--sl-color-*`) and the copper/patina/flow-blue
diagram palette from `palette.css` (`--dgm-*`). Those tokens are already
`[data-theme]`-scoped, so a **single** rule per class themes both light and dark
(no duplicated blocks); `!important` beats d2's emitted hex.

The look is **copper linework on warm-neutral cards** — matching the copper
Observable-Plot curves, so the two figure systems cohere. The slot→brand map
lives once at the top of `diagrams.css` (tune there):

- **Neutrals** N1…N7 → the warm ink→background ramp (`--sl-color-white` … `--sl-color-black`).
- **Primary** B1/B2 → a **softened copper** line colour (copper desaturated
  toward a warm grey, so it reads as an accent, not a dominating stroke); B4/B5
  → neutral card fills (background < container < node depth ramp).
- **Accent fills** AA/AB → neutral (d2 assigns these to some shapes, e.g. the
  cylinder body, with no semantic meaning — so they render as ordinary cards).
- **Decision diamonds** (`fill-N4`) → a subtle neutral, not a heavy mid-grey.

#### Semantic node colours (per-node, brand palette)

Intentional colour by element type is applied **in the d2 source** via a
`classes` block, NOT through the palette slots. This is the diagram design
system's semantic vocabulary — reuse the same class names and hexes across every
schematic so a reader learns the code once:

| Element                        | Class     | Colour (hex)          | Brand role       |
| ------------------------------ | --------- | --------------------- | ---------------- |
| Hydro / reservoir / inflow     | `hydro`   | `#4a90b8` Flow Blue   | water / hydro    |
| Thermal                        | `thermal` | `#f5a623` Spark Amber | energy           |
| Renewables (NCS: wind / solar) | `ncs`     | `#4a8b6f` Patina      | secondary        |
| Deficit / load-shed            | `deficit` | `#dc4c4c` Signal Red  | error / critical |
| Generic (bus, demand, process) | _(none)_  | softened copper       | keystone default |

```d2
classes: {
  hydro: {style: {stroke: "#4a90b8"}}
  thermal: {style: {stroke: "#f5a623"}}
  ncs: {style: {stroke: "#4a8b6f"}}
  deficit: {style: {stroke: "#dc4c4c"}}
}
res: "Reservoir v" {shape: cylinder; class: hydro}
```

Only the **border** takes the semantic colour (a fixed brand hex — the same value
the asides use, so it reads on both themes); the fill stays neutral and
theme-flips via the keystone, keeping label contrast safe. d2 drops the
`stroke-B1` palette class on a custom-styled node, so the semantic border
survives the keystone's `!important`. **Do not** name a node the same as a class
(`hydro`/`thermal`/`deficit` collide) — rename the node id (e.g. `gen_h`).

**Never introduce ad-hoc hex colors** beyond this semantic vocabulary in a D2
fence. If a diagram genuinely needs a new semantic colour, add it to the table
above.

### 4.3 Engine: ELK, never TALA

The `layout: "elk"` setting in `astro.config.mjs` is mandatory. Do not change
it. See §2 for the TALA watermark rationale.

### 4.4 Reference implementations

- `src/content/docs/math/lp-layout-and-scaling.md` — inline ` ```d2 ` block (LP
  column-layout schematic)
- `src/content/docs/math/par-inflow-model.mdx` — inline ` ```d2 ` block (PAR
  stored-vs-computed schematic)
- `src/content/docs/math/system-elements.mdx` — inline ` ```d2 ` block
  (power-system one-line; exercises the semantic node-colour vocabulary in §4.2)
- `src/content/docs/math/sddp-algorithm.mdx` — inline ` ```d2 ` block (the SDDP
  iteration-cycle **loop/flowchart**; a folded decision diamond)
- `src/content/docs/examples/toy-single-reservoir.mdx` — inline ` ```d2 ` block
  (network one-line with the semantic `hydro` / `thermal` / `deficit` classes)

### 4.5 Sizing & readability

astro-d2 wraps each diagram in a **responsive** outer `<svg>` that scales to fill
the content column. Left alone that both **shrinks** a wide diagram until its
text is illegible (a 1800px schematic in an ~810px column → ~7px text, unreadable
even on desktop) **and enlarges** a small one to oversized shapes/text. Every
diagram is instead pinned to its **native size** by two cooperating pieces:

- **`.d2-fig` wrapper + native sizing (automatic).** The `rehypeWrapD2` plugin
  (`astro.config.mjs`) wraps each d2 SVG in `<div class="d2-fig">`, and a small
  `sizeD2Figures` script (`src/components/Footer.astro`) reads each figure's
  viewBox and pins the outer svg to its native px width — so the diagram renders
  1:1 (text at its authored ~16px) on every screen. The `.d2-fig` CSS
  (`src/styles/diagrams.css`) then **centres** a diagram narrower than the column
  and **scrolls** one wider than it (horizontally, inside its own box — the page
  never h-scrolls). A tiny script is unavoidable here: pure CSS can't read the
  viewBox through astro-d2's nested-svg wrapper. You get this for free; no
  per-diagram markup.
- **Prefer vertical / compact layouts (authoring).** Native sizing makes a wide
  diagram _readable_, but it still scrolls. To avoid the scroll on desktop, keep
  a diagram's natural width near the column: reach for `direction: down`, keep
  labels to a title + one short line, and use `rectangle` over `circle` (circles
  inflate to fit their text). A wide horizontal network almost always reads
  better re-laid vertically — e.g. `system-elements` went from a 2166px
  horizontal sprawl (~7px text) to a 717px vertical one-line (16px, fits the
  column) just by flipping `direction: right` → `down` and dropping circles.

Rule of thumb: **aim for a native width ≤ the content column (~810px)**; past
that the wrapper keeps it readable but the reader has to scroll.

### 4.6 Shape vocabulary

Shape carries meaning — use it consistently so a reader learns the grammar once.
Set it with `{shape: …}` (d2 default is `rectangle`).

| Shape              | d2                     | Use for                                                                                   |
| ------------------ | ---------------------- | ----------------------------------------------------------------------------------------- |
| **Rectangle**      | _(default)_            | A process step, an equipment/component, a bus — the workhorse node.                       |
| **Oval / ellipse** | `shape: oval`          | A source or a sink / a start or terminal: inflow, demand, deficit, `stopped`.             |
| **Diamond**        | `shape: diamond`       | A decision / branch condition (`converged?`). Fold "compute X → test X" into the diamond. |
| **Cylinder**       | `shape: cylinder`      | Storage — a reservoir, a persisted file/checkpoint.                                       |
| **Parallelogram**  | `shape: parallelogram` | Input / output data (case files, a written artifact) — the I/O of a pipeline.             |
| **Circle**         | `shape: circle`        | A node in a graph or tree whose label is **short** (a scenario-tree stage/branch node).   |
| **Container**      | `name: "…" { … }`      | A labelled region grouping child nodes (LP column groups, the forward / backward passes). |

Rules:

- **Meaning, not decoration.** Don't mix shapes for the same role across a family
  of diagrams; a bus is always a rectangle, a reservoir always a cylinder.
- **Circles inflate — keep them small.** d2 sizes a `circle` to fit its label, so
  a multi-word label produces a huge circle. Reserve circles for one-token nodes,
  and cap the size with a shared class when you have many:
  `classes: { n: {shape: circle; width: 46; height: 46} }` then `x: 1 {class: n}`.
  Push longer descriptions onto the **edge** label (`a -> b: "branch 1"`), not
  into the circle. For anything with a real label, prefer a rectangle.
- **Semantic colour is orthogonal to shape** — a hydro node is Flow Blue (§4.2)
  whether it's a rectangle, cylinder, or oval.

### 4.7 Layout gotchas (ELK)

A few d2/ELK behaviours cause the recurring "overflows / giant elements" bugs.
Reach for these before hand-shrinking a diagram:

- **`classes` is root-level only.** Define it at the top of the fence, never
  nested inside a container — a container-local `classes: { … }` is a parse
  error (the page fails to compile). Classes are global once defined.
- **Disconnected nodes ignore `direction`.** ELK lays a container's children in
  a **row** (to minimise area) when there are no edges between them, regardless
  of `direction: down`. To stack a _list_ of nodes vertically (e.g. constraint
  rows, config groups), set **`grid-columns: 1`** on the container — or, when an
  order is meaningful, connect them with edges (`a -> b -> c`).
- **Stack sibling containers with an edge.** Two top-level containers with no
  edge between them also sit side-by-side (→ wide). A single connecting edge
  (`forward -> backward: "…"`) plus `direction: down` stacks them and doubles as
  the conceptual link.
- **Titles set the minimum width.** A container is at least as wide as its title
  string. A long panel title, not the content, is often what overflows — keep
  titles short and put detail in node labels or the prose.

---

## 5. D2 — flowcharts, loops, and state machines

**Use when** the diagram is a flowchart, decision tree, state machine, loop, or
sequential pipeline. d2 draws all of them at build time — one keystone, zero
client JS. The palette and semantic
colours are §4.2; this section is the flowchart-specific idiom.

d2 draws directed graphs natively:

- **Direction**: `direction: down` (default for a vertical flow) or
  `direction: right`. The Starlight content column is ~56rem — a wide `right`
  flow with many nodes scrolls horizontally, so prefer `down` for long chains.
- **Decisions**: `conv: converged? {shape: diamond}`. Fold a "compute X → test X"
  pair into the decision itself to save a node and vertical space.
- **Start / stop**: `{shape: oval}`.
- **Edges & labels**: `a -> b: label`; a back-edge (`conv -> start: no`) closes a
  loop.
- **Multi-line labels**: `"Title\ndetail line"` — `\n` is a real newline in a
  quoted label (rendered as themed SVG text). **Avoid `|md|` markdown blocks** —
  they render as HTML `<foreignObject>`, which the `.d2-svg` keystone cannot
  theme (the text would not recolour on toggle).
- **Restraint**: keep node labels to a title + one short line. The surrounding
  prose carries the detail; an overloaded node balloons the layout (a 3-line box
  in a 5-node vertical chain runs ~1.5k px tall).

Starting point: the SDDP iteration loop in
`src/content/docs/math/sddp-algorithm.mdx` §3 — a forward-pass container, a
backward-pass container whose solve → aggregate → synchronize chain loops over
the stages, then cut selection, the lower bound and a "Stopping rules met?"
diamond that loops back to the forward pass or exits to simulation. The d2
source IS the spec source — no committed asset.

---

## 6. Naming and paths

| Asset kind      | Source location                                                           | How rendered                         |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| Observable Plot | `src/components/<Name>Plot.astro` + `src/figures/<name>.ts` (+`.test.ts`) | Client-side island, no committed SVG |
| D2 diagram      | Inline ` ```d2 ` fence in the chapter `.md` / `.mdx`                      | Build-time inline SVG by `astro-d2`  |

Component naming: `<Name>` is PascalCase, matching the Astro component filename.
Compute module: `<name>` is camelCase, matching the `.ts` and `.test.ts` filenames.
There is no `dNN` prefix scheme for inline fences (they have no filesystem path).
Observable Plot components do not need a numeric prefix — name by semantic role
(e.g., `ValueFunctionPlot`, `CvarPlot`, `ConvergencePlot`).

---

## 7. Quality gates

Before committing a diagram change:

- `npm run check:figures` — asserts every `src/components/*Plot.astro` island imports a
  `src/figures/<name>.ts` that has a sibling `src/figures/<name>.test.ts`, and carries
  `role="img"` with a non-empty `aria-label`; it also asserts the content corpus references
  no retired figure.
- `npm run check:d2` — asserts all ` ```d2 ` fences use ELK layout (no TALA).
- `npm run check:math` — asserts math rendering parity (remark-math + rehype-katex).
- `npm test` — runs the full test suite including `src/figures/*.test.ts`; the
  tested compute layer must be green (correctness guarantee).

All four must pass before the PR is opened.

---

## 8. Anti-patterns

- **Don't** hand-author SVGs for methodology diagrams. Without a source of
  truth, they bitrot silently and nobody can review a small change.
- **Don't** hand-draw ASCII / box-drawing diagrams (`┌─┐`, `│`, `▼`, `●───●`) in
  a code fence — they don't theme, don't scale, and can't be reviewed as a diff.
  Author a ` ```d2 ` block instead. (A directory tree from `tree` and a literal
  terminal-output capture are _not_ diagrams and may stay as text.)
- **Don't** mix tools within a diagram family. If one LP section diagram is
  inline D2, all diagrams in that section are inline D2.
- **Don't** use D2 for a math plot (use Observable Plot) or Observable Plot for
  a diagram (use D2). The table in §1.1 is not a suggestion.
- **Don't** use Observable Plot as a layout tool. If the diagram has no computed
  math, it is not an Observable Plot diagram.
- **Don't** hard-code hex colors in Observable Plot islands. All color references
  go through `--dgm-*` CSS vars read at render time.
- **Don't** use TALA as the D2 layout engine. Always `layout: "elk"`. The
  `check:d2` guard will catch this, but catch it in authoring first.
- **Don't** overload a d2 flowchart node with multi-line detail — it balloons
  the ELK layout. Keep to a title + one line; the prose carries the rest (§5).
- **Don't** colour d2 nodes with ad-hoc hex. Use the semantic `classes`
  vocabulary in §4.2 (`hydro`/`thermal`/`ncs`/`deficit`); extend that table if a
  genuinely new category is needed.
- **Don't** position Observable Plot markers by eye. Every marker, tangent, and
  quantile must come from a formula evaluation in `src/figures/<name>.ts`,
  asserted by `src/figures/<name>.test.ts`.
