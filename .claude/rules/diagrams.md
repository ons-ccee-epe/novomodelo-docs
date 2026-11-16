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
Plot island under `src/figures/` + `src/components/`) or an **entity
illustration** (`src/components/entity/illustrations/`, `EnergyPath.astro`):

→ Follow [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md).
**Three kinds of figure** on the site: **d2** draws every structural diagram
(build-time SVG, one themable keystone in `src/styles/diagrams.css`);
**Observable Plot** draws every computed math plot; an **entity illustration**
(a picture on an entity page or the home energy path) is a hand-drawn
inline-SVG Astro component, coloured only through the `--ent-*`/`--ep-*` tokens
of `src/components/entity/entity.css` (light and dark values; a family palette
separate from the d2 semantic classes), with bilingual labels, `role="img"`, a
non-empty `aria-label` and, on entity pages, a `figcaption`
(diagram-authoring.md §9). Never redraw an entity illustration in d2. **Mermaid was retired (2026-07)** on the site — never add a
` ```mermaid ` fence here (it is fine in the `novomodelo` READMEs/ARCHITECTURE.md, which
GitHub renders). Semantic node colours (hydro `#3378a3`, thermal `#9b6719`,
NCS `#5d7c2f`, deficit `#c7463d`, generic → the accent, no class) come from the
`classes` vocabulary in diagram-authoring.md §4.2 and design-system.md §10, not
ad-hoc hex; `npm run check:hex` rejects any other hex in a d2 fence.

**Site colours**: the design system is `docs/design/design-system.md` (from the
hotsite) and every colour is a token in `src/styles/tokens.css` — read both
before any theming. In the light theme the accent is sea green (`--color-primary`
`#86B7B3` for fills, `--color-accent` `#2F6C67` for text and links); the dark
theme keeps its previous copper values until its variant lands (design-system.md
§9, D1). **Never infer the accent from the diagram palette** (`--dgm-*` in
`src/styles/palette.css`; its `--dgm-hydro` is the hydro hue for water marks
only, not the UI accent).
