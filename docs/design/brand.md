# Novomodelo-docs — Brand & Colour Application

> **Authority:** `~/git/novomodelo/docs/internal/BRAND-GUIDELINES.md` (main `novomodelo` repo).
> Brand assets: `~/git/novomodelo/assets/` (`novomodelo-logo-{dark,light}.svg`, `cobre-icon.svg`).
> This document records **how the docs site applies the brand**; the main-repo
> guidelines are the **source of truth** — when they diverge, the guidelines win.
>
> **Consult this (and the authority) before ANY theming change.** Do **not** infer
> brand colours from the diagram palette (`--dgm-*`): its `--dgm-hydro` is Flow Blue
> for hydro/water marks only, never the UI accent.

## Palette (from `BRAND-GUIDELINES.md` §2.2)

**Primary (the identity — warm):**

| Name         | Hex       | Role                                                          |
| ------------ | --------- | ------------------------------------------------------------- |
| Copper       | `#B87333` | **Brand primary** — chrome accent, icon fills, accent borders |
| Copper Light | `#D4956A` | Highlights, hover, accent-text on dark                        |
| Copper Dark  | `#8B5E3C` | Depth, pressed, accent-text on light                          |
| Patina       | `#4A8B6F` | Secondary accent, success/"stable", non-hydro diagram accents |

**Secondary accents (use with restraint):**

| Name        | Hex       | Role                                                                 |
| ----------- | --------- | -------------------------------------------------------------------- |
| Spark Amber | `#F5A623` | Warnings / `caution` asides / energy indicators                      |
| Signal Red  | `#DC4C4C` | Errors / `danger` asides                                             |
| Flow Blue   | `#4A90B8` | **Links, informational states, water/hydro only** — NOT the identity |

**Neutrals (dark — primary):** Midnight `#0F1419` (bg) · Surface `#1A2028` · Border
`#2D3440` · Muted `#8B9298` · Body `#C8C6C2` · Bright `#E8E6E3`.
**Neutrals (light):** `#FAFAF8` (bg) · Surface `#F0EDE8` · Border `#D4D0CA` · Muted
`#6B7280` · Body `#374151` · Dark `#1A2028`.

## How the docs site applies it

- **Chrome accent → Copper.** `--sl-color-accent*` (active sidebar item, header,
  focus rings, hover, buttons) = the copper ramp. This is the dominant identity.
- **Inline prose links → Flow Blue.** The brand table assigns Flow Blue to "Links",
  so content links (`.sl-markdown-content a`) stay flow-blue — a **targeted** override,
  visibly distinct from the copper chrome. (Chrome copper, links blue.)
- **Warm neutrals**, not Starlight's cool greys: page bg Midnight `#0F1419` (dark) /
  `#FAFAF8` (light), with the brand body/border/muted greys. WCAG AA on body text.
- **Semantic asides:** `note`/info → Flow Blue · `tip` → Patina · `caution` → Spark
  Amber · `danger` → Signal Red.
- **Diagram palette (`--dgm-*`):** copper (`storage`), patina (`runtime`, `accent`),
  copper-light (`curve`). **Flow Blue is reserved for hydro/water** (`--dgm-hydro`);
  non-hydro accent marks (e.g. Benders tangents) use Patina. The `.d2-svg` keystone
  re-keys d2's palette classes onto these tokens and the warm neutrals, so d2 diagrams
  and Observable Plot figures share one palette (see
  [`diagram-authoring.md`](diagram-authoring.md) §4.2).
- **Logo + favicon:** the **icon mark beside the "Novomodelo Documentation" title**,
  **theme-adaptive** via Starlight `logo:{dark,light}` — `cobre-icon.svg` (Midnight
  tile) on dark, `cobre-icon-light.svg` (light brand-surface tile; a **derived**
  variant with copper anchored on the readable `#B87333`..`#8B5E3C` range, since the
  original's lighter gradient stops wash out on a light tile) on light. `cobre-icon.svg`
  is also the favicon. The wide `novomodelo-logo-{dark,light}.svg` **wordmark** logos are
  for README-scale headers, **not** the small (~40px) site header — they scale to
  illegibility and duplicate "Novomodelo" beside the title.

## Design principles that constrain styling (§2.4)

1. **Copper warmth.** Differentiate from the sea of blue developer tools — copper
   accents on neutral backgrounds, used with restraint.
2. **Dark-first.** Dark is the default; light is the alternative.
3. **Technical, not trendy.** No decorative gradients, no rounded-everything.

## Typography (§2.3)

IBM Plex Sans (body/headings) · JetBrains Mono (code), self-hosted via Fontsource
(SIL OFL). See `src/styles/fonts.css`.

## Where it's implemented

| File                      | Holds                                                                |
| ------------------------- | -------------------------------------------------------------------- |
| `src/styles/brand.css`    | `--sl-color-accent*` copper ramp + the flow-blue prose-link override |
| `src/styles/neutrals.css` | the warm-neutral Starlight greyscale/bg/text override                |
| `src/styles/palette.css`  | `--dgm-*` diagram palette (copper/patina + `--dgm-hydro`)            |
| `src/styles/diagrams.css` | `.d2-svg` keystone: d2 palette classes → the brand tokens            |
| `src/styles/fonts.css`    | brand fonts (`--sl-font` / `--sl-font-mono`)                         |
| `astro.config.mjs`        | `logo`, favicon, `customCss` order                                   |
