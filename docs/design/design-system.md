# Novo Modelo Design System

The visual identity of the Novo Modelo hotsite, captured as a design system so
the documentation site can adopt it.

**Source of truth.** `hotsite/style.css` at `8e2b7af` ("update the hotsite to the
designer's version 13", 2026-11-13). The hotsite served at
`https://docs.modelossetoreletrico.org.br/` was compared byte for byte with
`hotsite/index.html`, `hotsite/style.css` and `hotsite/main.js` on 2026-11-16 and
is identical. When the designer ships a new version, update this document in the
same PR.

**Scope.** Sections 1 to 8 record what the hotsite defines today. Section 9 lists
what the documentation needs and the hotsite does not define; each item there is
open until it carries a decision.

---

## 1. Principles

- **Institutional, quiet, light.** Graphite bands frame the page (header, footer,
  one dark section); content sits on white or a very light cool grey. The
  hotsite defines the light theme only; the docs add the dark variant of §11.
- **One accent.** Sea green `#86B7B3` is the only accent hue. It marks — bars,
  dots, borders, fills, focus — and never carries body text on a light ground.
- **Text in a darker accent.** Accent-coloured text on light grounds uses
  `#2F6C67`, the AA-safe shade of the same hue.
- **State is not colour alone.** Selected and current states add a border, an
  inset bar, a dot fill or a check mark (see `.gov-node[aria-selected]`,
  `.chip[aria-pressed]`, `.tl-item--done`).

---

## 2. Colour

### 2.1 Tokens

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg-dark` | `#23292C` | Graphite: header, institutional areas, dark section |
| `--color-bg-darker` | `#1A1F21` | Footer |
| `--color-bg-light` | `#F3F5F5` | Editorial backgrounds, inset panels |
| `--color-bg-faq` | `#F6F7F7` | FAQ section background |
| `--color-surface` | `#FFFFFF` | Content, cards |
| `--color-primary` | `#86B7B3` | Accent (RGB 134, 183, 179) |
| `--color-primary-hover` | `#9CC5C1` | Accent hover |
| `--color-primary-soft` | `#E7F1F0` | Pill and state backgrounds, search-hit highlight |
| `--color-accent` | `#2F6C67` | Accent **text** on light grounds; links |
| `--color-on-primary` | `#13201F` | Text on `--color-primary` |
| `--color-text` | `#1E2528` | Body text |
| `--color-muted` | `#545F63` | Secondary text |
| `--color-text-on-dark` | `#F2F5F5` | Text on graphite |
| `--color-muted-on-dark` | `#B6C1C3` | Secondary text on graphite |
| `--color-border` | `#DCE2E2` | Default border, dividers |
| `--color-border-strong` | `#C3CCCC` | Hover border, outline-button border, rails |
| `--color-border-dark` | `rgba(255, 255, 255, .14)` | Borders on graphite |
| `--color-focus` | `#86B7B3` | Focus ring (on graphite; see §7) |

### 2.2 Colours used outside the tokens

The hotsite also writes these values directly. A docs port turns each into a
token or drops it.

| Value | Where | Proposed token |
| --- | --- | --- |
| `#FFFFFF` / `#fff` | Headings, links and icons on graphite | `--color-on-dark-strong` |
| `#FBF7EF`, `#E9DEC6`, `#B88A2E`, `#8A6418` | `.notice--alert` background, border, left bar, icon | `--color-warning-*` family |
| `#646F72` | Search placeholder | `--color-placeholder` |
| `#FAFCFC` | Conditional timeline card background | fold into `--color-bg-light` or `--color-surface` |
| `#33444A` | Hero background while the photo loads | hero-only, keep local |
| `rgba(24, 30, 33, …)` | Hero overlay gradients | hero-only, keep local |
| `rgba(20, 26, 28, .18/.32)` | `.btn--ghost-light` background | `--color-ghost-bg` |
| `rgba(255, 255, 255, .06)` | Nav hover on graphite | `--color-hover-on-dark` |
| `rgba(134, 183, 179, .08–.8)` | Accent tints: repo-card hover, focus halo, shadow-run bars | `--color-primary-a*` alphas |
| `rgba(20, 30, 32, …)`, `rgba(0, 0, 0, .35/.5)` | Shadows | see §5.2 |

### 2.3 Contrast

WCAG 2.x contrast ratios, computed from the token values. AA requires 4.5:1 for
body text, 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold) and for UI
components and graphics.

**Text on light grounds**

| Text \ Ground | surface `#FFF` | bg-light `#F3F5F5` | bg-faq `#F6F7F7` | primary-soft `#E7F1F0` | primary `#86B7B3` |
| --- | --- | --- | --- | --- | --- |
| text `#1E2528` | 15.55 | 14.21 | 14.49 | 13.51 | 6.99 |
| muted `#545F63` | 6.57 | 6.01 | 6.13 | 5.71 | 2.95 ✗ |
| accent `#2F6C67` | 6.07 | 5.54 | 5.65 | 5.27 | 2.73 ✗ |
| on-primary `#13201F` | — | — | — | — | 7.53 |
| primary `#86B7B3` | 2.23 ✗ | 2.03 ✗ | 2.07 ✗ | 1.93 ✗ | — |

**Text on graphite**

| Text \ Ground | bg-dark `#23292C` | bg-darker `#1A1F21` |
| --- | --- | --- |
| text-on-dark `#F2F5F5` | 13.44 | 15.18 |
| white `#FFF` | 14.74 | 16.64 |
| muted-on-dark `#B6C1C3` | 8.00 | 9.04 |
| primary `#86B7B3` | 6.62 | 7.48 |

**Non-text**

| Pair | Ratio | Note |
| --- | --- | --- |
| primary on surface | 2.23 | Below 3:1: as a focus ring or the only boundary of a control on white it fails 1.4.11; the hotsite switches the ring to `--color-accent` on light sections (§7) |
| border-strong on surface | 1.64 | Decorative only; controls bordered with it rely on their label text |
| border on surface | 1.31 | Decorative only |

**Rules that follow**

1. Body and secondary text on light grounds: `--color-text` or `--color-muted`.
2. Accent-coloured text, links, eyebrows and labels on light grounds:
   `--color-accent`. Never `--color-primary`.
3. On a `--color-primary` fill, text is `--color-on-primary` (or `--color-text`);
   never `--color-muted` or `--color-accent`.
4. On graphite, `--color-primary` is allowed as text (eyebrows, repo type, ranges).
5. A focus ring or the sole outline of a control on light grounds uses
   `--color-accent`; `--color-primary` only on graphite.

---

## 3. Typography

### 3.1 Families

| Token | Stack | Use |
| --- | --- | --- |
| `--font-sans` | `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` | Body, UI |
| `--font-display` | `"Inter Display", "Inter", system-ui, …` | `h1`–`h3`, numbers and names that read as headings |
| `--font-mono` | `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | Code, CLI samples, file and identifier names (§9, D2). The hotsite writes this stack on `.repo-name` without a token |

Faces shipped as WOFF2 in `hotsite/assets/fonts/` under the SIL Open Font
License 1.1 (`LICENSE-Inter.txt`):

| Family | Weights |
| --- | --- |
| Inter | 400 Regular, 500 Medium, 600 SemiBold |
| Inter Display | 500 Medium, 600 SemiBold |

All faces use `font-display: swap`. There is no italic and no 700.

### 3.2 Scale

| Role | Size | Line height | Weight | Family | Tracking |
| --- | --- | --- | --- | --- | --- |
| Hero title | `clamp(2rem, 1.15rem + 2.1vw, 3rem)` | 1.1 | 600 | display | −0.02em |
| `h2` | `clamp(1.75rem, 1.2rem + 1.6vw, 2.5rem)` | 1.15 | 600 | display | −0.012em |
| Panel title (`h3` large) | `clamp(1.375rem, 1.2rem + .6vw, 1.75rem)` | 1.2 | 600 | display | −0.012em |
| `h3` | 1.1875rem (19 px) | 1.35 | 600 | display | −0.012em |
| Lead | 1.1875rem | 1.6 | 400 | sans | — |
| Body | 1.0625rem (17 px); 1rem below 768 px | 1.65 | 400 | sans | — |
| Small body | .9375rem (15 px) | inherit | 400 | sans | — |
| `h4` | .9375rem | inherit | 600 | sans | — |
| Eyebrow / label | .8125rem (13 px), uppercase | inherit | 600 | sans | .06–.08em |
| Caption / meta | .75rem (12 px) | inherit | 500 | sans | — |

Numbers that line up (dates, counters, steps) use
`font-variant-numeric: tabular-nums`. Body is antialiased with
`text-rendering: optimizeLegibility`. Hero and long headings use
`text-wrap: balance`.

---

## 4. Spacing and layout

| Token | Value |
| --- | --- |
| `--spacing` | 8 px (base unit) |
| `--space-1` … `--space-6`, `--space-8` | 8, 16, 24, 32, 40, 48, 64 px |
| `--section-space` | `clamp(4rem, 8vw, 7rem)` (section padding) |
| `--container-width` | 1240 px |
| `--container-narrow` | 960 px |
| `--gutter` | `clamp(1.25rem, 4vw, 2.5rem)` |
| `--header-height` | 68 px; 60 px below 768 px |

Container: `max-width: calc(var(--container-width) + var(--gutter) * 2)` with the
gutter as inline padding. Running text is held to 54–80 ch (`68ch` for intros).

Breakpoints (max-width): 1199 px (header collapses to a menu button), 1279 px
(tablet: three-column grids drop to two), 1023 px, 767 px (mobile: single column).
One min-width breakpoint at 1600 px for the hero.

Component paddings off the 8 px scale (1.125rem, 1.375rem, 1.75rem) are used for
optical balance; a docs port keeps them inside components, not as new tokens.

---

## 5. Shape and elevation

### 5.1 Radii

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | 8 px | Buttons, menu items, small panels |
| `--radius` | 12 px | Cards, notices, FAQ empty state |
| `--radius-lg` | 16 px | Large cards, panels, sections in a box |
| `--radius-pill` | 999 px | Pills, chips, contact links |

Off-scale values in the hotsite: 13 px (`.faq-item`) and 14 px (FAQ search
input). Treat both as `--radius` in a port.

### 5.2 Shadows

| Token / use | Value |
| --- | --- |
| `--shadow-card` | `0 1px 2px rgba(20, 30, 32, .04), 0 8px 24px -16px rgba(20, 30, 32, .18)` |
| Submenu | `0 16px 40px -16px rgba(0, 0, 0, .35)` |
| Selected governance node | `0 10px 30px -18px rgba(20, 30, 32, .45)` plus a 4 px inset accent bar |

Cards are flat with a 1 px border at rest; `--shadow-card` appears on hover or
on the open/current item.

---

## 6. Motion

| Token | Value |
| --- | --- |
| `--ease` | `cubic-bezier(.2, .7, .2, 1)` |
| `--dur` | 220 ms |

Longer one-off durations: 260 ms (panel and accordion reveal), 700 ms (hero
entrance, staggered 60 ms). Hover lift is at most `translateY(-2px)`; press is
`translateY(1px)`. Under `prefers-reduced-motion: reduce` every animation and
transition drops to 0.01 ms and smooth scrolling is off.

---

## 7. Focus and accessibility

- `:focus-visible` draws a 3 px outline in `--color-focus` with a 3 px offset.
  On light sections (`.section--white`, `.section--light`, `.section--faq`,
  `.status`, `.submenu`) the outline colour switches to `--color-accent`.
- Interactive targets are at least 44 × 44 px (buttons 48 px tall).
- A skip link appears on focus.
- `forced-colors: active` adds a `CanvasText` outline to selected states.
- A print stylesheet hides the header, hero media and interactive controls and
  expands collapsed content.

---

## 8. Components and brand

**Components defined in the hotsite** (class names in `hotsite/style.css`):
buttons (`.btn--primary`, `.btn--outline`, `.btn--ghost-light`), `.pill`,
`.chip`, `.icon-btn`, notices (`.notice--plan`, `.notice--alert`), disclosure
and FAQ accordion, `.eyebrow` (13 px uppercase label with a 20 × 2 px accent
dash), bullet lists with a 6 px accent dot, cards (`.ed-card` with a 32 × 3 px
accent tab, `.pillar`, `.val-card`, `.path`), timeline, status strip, sticky
graphite header with submenu, footer.

**Brand assets** in `hotsite/assets/`:

| Asset | File | Note |
| --- | --- | --- |
| Favicon | `icons/favicon.svg` | |
| ONS logo | `logos/ons-branca.png` | White, for graphite only |
| CCEE logo | `logos/ccee-branca.png` | White, for graphite only |
| EPE logo | `logos/epe-branca.png` | White, for graphite only |
| Wordmark | `.brand-mark` + `.brand-name` | Built in HTML/CSS, not an image |

The three institutional logos are sized for optical balance, not equal height:
ONS 26 px, CCEE 16 px, EPE 28 px in the header; 30, 19 and 33 px in the footer.

---

## 9. What the documentation needs beyond the hotsite

The hotsite is a single light page with no code, diagrams or charts. Each item
below needs a decision before the docs port; record it here when made.

| ID | Gap | Why the docs need it | Decision |
| --- | --- | --- | --- |
| D1 | Dark theme | The docs open in dark and offer a theme switch; the hotsite has no `prefers-color-scheme` or `data-theme` | **Decided 2026-11-16:** the light theme follows the hotsite strictly. The dark theme stays, with the theme switch, as the dark variant of §11 (approved 2026-11-16) |
| D2 | Code font | Code blocks, inline code and CLI samples; the hotsite only uses the system monospace stack on one element | **Decided 2026-11-16:** keep the hotsite's system monospace stack as `--font-mono`. No web font is shipped for code, so JetBrains Mono and its Fontsource package leave the docs |
| D3 | Element palette for diagrams and charts | Hydro, thermal, non-controllable source, deficit and generic elements need distinct hues that sit with the single sea-green accent and keep contrast on the light grounds and on the dark variant (D1) | **Decided 2026-11-16:** the element palette of §10 |
| D4 | Header treatment and logo | The docs header is light today; the hotsite's wordmark and logos are white-on-graphite | **Decided 2026-11-17 (revises the graphite header of 2026-11-16):** the header keeps Starlight's own layout and title ("Documentação do Novo Modelo"), with no wordmark or institutional logos, and follows the theme through the design-system tokens: light ground (`--color-bg-faq`) with the `--color-accent` title in light, graphite (`--color-dark-surface`) with the `#86B7B3` title in dark. Only the favicon comes from the hotsite |
| D5 | Semantic colours | Starlight asides (note, tip, caution, danger) need info / success / warning / danger hues; the hotsite only has the warning values of `.notice--alert` | **Decided 2026-11-16 (version 2, after the review asked for "tom do hotsite"):** every aside takes the hotsite `.notice` shape (neutral ground, 1 px border, 3 px start bar, 12 px radius) and only the hotsite grounds. Note and tip = `.notice--plan` (`--color-bg-light`, `--color-primary` bar, `--color-accent` title, 5.54:1); caution = `.notice--alert` (`--color-warning-*`, 5.02:1); danger = the `.notice--plan` ground with the `--color-el-deficit` bar and `--color-el-deficit-strong` title (8.66:1). Dark: surface ground, same bars, titles `#86B7B3` (6.62), `#E3C27A` on `#2E2618` (8.72), `#F09A92` (6.84) |
| D6 | Link style in running text | The hotsite links are `--color-accent` with a 1 px underline offset 3 px; confirm for the docs body | **Decided 2026-11-16:** follow the hotsite. Links in running text are `--color-accent` (`#2F6C67`, 6.07:1 on white), underlined with `text-decoration-thickness: 1px` and `text-underline-offset: 3px`, thickening to 2 px on hover. Links on graphite use `--color-text-on-dark` and turn `--color-primary` on hover |
| D7 | Token file | One `tokens.css` shared by `hotsite/` and `src/styles/`, or two copies kept in sync by a check | **Deferred 2026-11-16, decision later.** In place meanwhile: two copies kept in sync by a check. `hotsite/style.css` stays the designer's file, replaced whole on each new version; `src/styles/tokens.css` uses the same token names, and `npm run check:hex` fails when a token both declare holds different values (number and spacing formatting aside) |

---

## 10. Element palette for diagrams, charts and entity pages (D3)

Four hues mark element types; everything else uses the accent and the neutrals.
Each hue is solved to a relative luminance of about 0.168, so the **same hex**
works as a stroke on every ground of both themes: at least 4.4:1 on the light
grounds (text-safe on white) and at least 3:1 (WCAG 1.4.11, graphics) on
graphite. That matters because d2 `classes` take a literal colour, not a CSS
variable, so a semantic stroke cannot change with the theme.

| Element | Class / token | Stroke | On white | On `#F3F5F5` | On `#23292C` | On `#1A1F21` |
| --- | --- | --- | --- | --- | --- | --- |
| Hydro, reservoir, inflow | `hydro` / `--color-el-hydro` | `#3378A3` | 4.82 | 4.41 | 3.06 | 3.45 |
| Thermal | `thermal` / `--color-el-thermal` | `#9B6719` | 4.83 | 4.41 | 3.05 | 3.45 |
| Non-controllable source (wind, solar) | `ncs` / `--color-el-ncs` | `#5D7C2F` | 4.78 | 4.37 | 3.08 | 3.48 |
| Deficit, load shedding | `deficit` / `--color-el-deficit` | `#C7463D` | 4.80 | 4.39 | 3.07 | 3.46 |
| Generic (bus, demand, process) | no class / `--color-accent` | theme token | 6.07 | 5.54 | — | — |

Rules:

1. Only the four element hues may appear as hex in a d2 fence, and only as
   `stroke` in the `classes` block. Fills stay neutral and come from the
   keystone in `src/styles/diagrams.css`.
2. Generic elements take no class; the keystone draws them in the accent
   token of the current theme.
3. Charts read the same hues from `--color-el-*` (via `--dgm-*` in
   `palette.css`); entity pages map their families to them in `entity.css`:
   hydrology → hydro, equipment → thermal, network → accent, rules → muted.
4. A label drawn in an element hue sits on a light ground only; on graphite
   labels use `--color-text-on-dark`.
5. Tints for chip and card backgrounds, and text drawn in an element hue,
   change with the theme: `--color-el-*-soft` and `-strong` in light,
   `--color-dark-el-*-soft` and `-light` in dark (§11). Only the four stroke
   hexes are shared by both themes.

---

## 11. Dark variant (D1)

The hotsite has no dark theme. The docs keep one, derived from the hotsite's
own graphite: the footer graphite is the page, the header graphite the
surface, and sea green carries accent text as well as fills, because on
graphite it has contrast to spare. Tokens are `--color-dark-*` in
`src/styles/tokens.css`; the Starlight dark scope in `neutrals.css`,
`brand.css`, `palette.css` and `entity.css` reads them.

| Role | Light | Dark | Token (dark) | Dark contrast |
| --- | --- | --- | --- | --- |
| Page background | `#FFFFFF` | `#1A1F21` | `--color-dark-bg` | — |
| Surface: nav, sidebar, cards, header | `#F3F5F5` (header `#F6F7F7`) | `#23292C` | `--color-dark-surface` | — |
| Code, chips, raised panels | `#F6F7F7` | `#2C3337` | `--color-dark-surface-2` | — |
| Headings | `#1E2528` | `#F2F5F5` | `--color-dark-heading` | 15.18 on the page |
| Body text | `#1E2528` | `#D5DCDD` | `--color-dark-text` | 11.97 page, 10.60 surface |
| Secondary text | `#545F63` | `#B6C1C3` | `--color-dark-muted` | 9.04 page, 8.00 surface, 6.97 surface-2 |
| Links, accent text, focus | `#2F6C67` | `#86B7B3` | `--color-dark-accent` | 7.48 page, 6.62 surface |
| Link hover | `#2F6C67` + 2 px underline | `#9CC5C1` | `--color-dark-accent-hover` | 8.85 page |
| Text on a sea-green fill (pill) | `#FFFFFF` on `#2F6C67` | `#13201F` on `#86B7B3` | `--color-on-primary` | 7.53 |
| Accent tint | `#E7F1F0` | `#20393A` | `--color-dark-accent-soft` | accent on it 5.53 |
| Borders | `#DCE2E2` | `#353D41` | `--color-dark-border` | decorative; inline code text on it 7.97 |
| Strong borders | `#C3CCCC` | `#4A5458` | `--color-dark-border-strong` | decorative |

Element hues in the dark theme:

| Element | Stroke (both themes) | Tint (dark) | Text on tint (dark) | Contrast |
| --- | --- | --- | --- | --- |
| Hydro | `#3378A3` (3.45 on the page) | `#1C2A33` | `#8DBEDD` | 7.38 |
| Thermal | `#9B6719` (3.45) | `#2E2618` | `#E0B46A` | 7.75 |
| Non-controllable source | `#5D7C2F` (3.48) | `#232B1B` | `#B4CC86` | 8.32 |
| Deficit | `#C7463D` (3.46) | `#321F1D` | `#F09A92` | 7.22 |
| Warning (caution aside) | bar `#B88A2E` | `#2E2618` | `#E3C27A` | 8.72 |

Charts use the light shades as marks in the dark theme (thermal 8.64:1,
hydro 8.35:1 on the page) so thin lines keep their weight; d2 strokes keep the
four shared hexes. Asides keep the hotsite `.notice` shape: note, tip and danger on
`--color-dark-surface` (titles 6.62, 6.62 and 6.84:1), caution on the
thermal tint with `#E3C27A` (8.72:1). The header follows the theme: graphite in dark. The
EnergyPath bands keep the light-theme hues, whose white labels hold 4.82:1
or more.
