---
paths:
  - "src/figures/**"
  - "src/components/**"
  - "src/styles/**"
  - "docs/design/diagram-authoring.md"
  - "src/content/docs/**/*.mdx"
---

# Diagrams, Plots & Site Colours

Auto-loads when editing figures, components, styles, or any `.mdx` page (where
` ```d2 ` fences and Plot islands live).

When **authoring or editing a diagram** (inline ` ```d2 ` or a tested Observable
Plot island under `src/figures/` + `src/components/`):

→ Follow [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md).
**Two tools only** on the site: **d2** draws every diagram (build-time SVG, one
themable keystone in `src/styles/diagrams.css`); **Observable Plot** draws every
computed math plot. **Mermaid was retired (2026-07)** on the site — never add a
` ```mermaid ` fence here (it is fine in the `novomodelo` READMEs/ARCHITECTURE.md, which
GitHub renders). Semantic node colours (hydro→Flow Blue, thermal→Spark Amber,
NCS→Patina, deficit→Signal Red, generic→copper) come from the `classes` vocabulary
in diagram-authoring.md §4.2, not ad-hoc hex.

**Site colours**: the accent is **Copper** (`#B87333`), not blue — read
`src/styles/` (`brand.css`, `neutrals.css`, `palette.css`) before any theming.
**Never infer the accent from the diagram palette** (`--dgm-*` in
`src/styles/palette.css`; its `--dgm-hydro` is Flow Blue for hydro/water marks
only, not the UI accent).
