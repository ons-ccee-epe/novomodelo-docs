// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import lunaria from "@lunariajs/starlight";
import astroD2 from "astro-d2";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createKatexStrict } from "./scripts/rehype-katex-strict.mjs";

// Wrap each astro-d2 inline SVG in a <div class="d2-fig"> (scroll box + native
// sizing — see src/styles/diagrams.css and Footer.astro `sizeD2Figures`).
// astro-d2 nests an outer responsive <svg> around an inner <svg class="d2-svg">.
// We MUST wrap the OUTERMOST svg: wrapping the inner one puts a <div> inside an
// <svg>, which is invalid HTML — the browser foster-parents the div out, leaving
// an empty outer svg that fills the column (a huge blank gap, worst on tall
// diagrams). So we wrap only a top-level svg (parent is not an svg) that
// contains a d2-svg, and never recurse into it.
function rehypeWrapD2() {
  /** @param {any} el */
  const containsD2 = (el) => {
    if (!el || el.type !== "element") return false;
    const cls = /** @type {any[]} */ ([]).concat(el.properties?.className ?? []);
    if (cls.some((/** @type {any} */ c) => String(c).includes("d2-svg")))
      return true;
    return (el.children ?? []).some((/** @type {any} */ c) => containsD2(c));
  };
  /** @param {any} node */
  const walk = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const isRawD2 =
        (child.type === "raw" || child.type === "html") &&
        typeof child.value === "string" &&
        child.value.includes("d2-svg");
      const isOuterD2 =
        child.type === "element" &&
        child.tagName === "svg" &&
        node.tagName !== "svg" &&
        containsD2(child);
      if (isRawD2 || isOuterD2) {
        node.children[i] = {
          type: "element",
          tagName: "div",
          properties: { className: ["d2-fig"] },
          children: [child],
        };
        // do not recurse into the wrapped svg
      } else {
        walk(child);
      }
    }
  };
  return (/** @type {any} */ tree) => walk(tree);
}

const katexStrict = createKatexStrict();

// astro-d2 is registered before starlight. d2 is the SINGLE diagram tool
// (schematics, flowcharts, network one-lines); Observable-Plot islands cover
// computed math plots. Mermaid was retired — d2 renders build-time (zero client
// JS, one themable keystone in src/styles/diagrams.css). See
// docs/design/diagram-authoring.md.
export default defineConfig({
  // Architecture B: each version build sets its own base (e.g. "/vX.Y/").
  base: process.env.DOCS_BASE ?? "/",
  // Custom domain for absolute URLs (canonical links + sitemap). Cutover target;
  // methodology.cobre-rs.dev 301-redirects in. Env-overridable for a versioned build.
  site: process.env.DOCS_SITE ?? "https://docs.novomodelo.invalid",
  // D5: mdBook→Starlight URL preservation. Each key is an old mdBook (or
  // retired-site) path and each destination is a live page slug, one hop. mdBook
  // served each chapter at `/specs/<group>/<chapter>.html` (and the intro at
  // `/introduction.html`); Starlight serves the SAME chapters at clean
  // directory URLs with the `specs/` segment dropped: `/<group>/<chapter>/`
  // (and the landing page at `/`). The mapping is therefore mechanical:
  //   `/specs/<group>/<chapter>.html`  ->  `/<group>/<chapter>/`
  //   `/introduction.html`             ->  `/`
  // except that a chapter whose content lives on another page points at that
  // page. Every destination other than `/` is a slug from the starlight
  // `sidebar` block (the single source of truth for the page slugs); this map is
  // a hand-written static object literal (NOT computed from the sidebar at
  // config-eval time) so it stays greppable and reviewable, and its entries are
  // grouped by part, as the group comments mark.
  //
  // GitHub Pages serves static files only — no `_redirects`, no server-side
  // rewrites — so each entry must materialise as a static HTML page at the OLD
  // path. In `output: 'static'` (our default, no SSR adapter) Astro's native
  // `redirects` does exactly that: it emits a `<meta http-equiv="refresh">`
  // stub per entry into `dist/` (status codes are ignored in static mode). This
  // ships in the same `dist/` the deploy serves and needs NO new dependency.
  //
  // base-awareness: keys AND destinations are written as site-absolute paths
  // starting with "/" — do NOT hand-prefix `base`/`DOCS_BASE`: one map serves
  // every build. Astro writes each stub at its key's path under the build's
  // output root and its destination exactly as written (refresh target, title,
  // link text, canonical link), prefixing neither with `base`. build-versions.mjs
  // copies a versioned ("/vX.Y/") build under its `base` and prefixes each
  // stub's refresh target there (scripts/version-snapshot.mjs); the title, link
  // text and canonical link keep the unprefixed path. Destinations are
  // directory-style with a trailing slash to match Starlight's emitted URLs and
  // avoid an extra hop.
  //
  // TODO(D5, traffic data): the migration plan deferred the *policy* of URL
  // preservation to "decide with traffic data" — the entries below are the
  // mechanically-known chapter mappings; the residual is a USER decision and is
  // intentionally NOT pre-populated here. Pull inbound-link / referrer / 404
  // data for methodology.cobre-rs.dev, then decide:
  //   (a) Keep redirects at all? The site is young / blast radius is low, so the
  //       plan's default is to SHIP every entry below (cheap, static, no
  //       downside) — confirm or drop.
  //   (b) Any NON-chapter inbound URLs to add? e.g. old asset paths, deep
  //       `#fragment` targets (note: <meta refresh> cannot preserve a fragment —
  //       such links land on the page top), or pre-revamp slugs that no longer
  //       exist. Add a matching entry per the data, or accept the 404. Do NOT
  //       fabricate these without analytics.
  //   (c) Pre-revamp mdBook also exposed `/print.html` and `/toc.html` — decide
  //       whether either warrants a redirect (Starlight has no direct analogue).
  redirects: {
    // Part 1 — Introduction
    "/introduction.html": "/",
    "/specs/overview/what-novomodelo-solves.html": "/overview/what-novomodelo-solves/",
    "/specs/overview/sddp-framework-overview.html":
      "/overview/sddp-framework-overview/",
    "/specs/overview/notation-conventions.html":
      "/overview/notation-conventions/",
    "/specs/overview/how-to-read.html": "/overview/how-to-read/",
    // Part 2 — System Modelling
    "/specs/math/lp-formulation.html": "/math/lp-formulation/",
    "/specs/math/system-elements.html": "/math/system-elements/",
    "/specs/math/equipment-formulations.html": "/math/equipment-formulations/",
    "/specs/math/block-formulations.html": "/math/block-formulations/",
    "/specs/math/hydro-production-models.html": "/math/hydro-production-models/",
    "/specs/math/penalty-system.html": "/math/penalty-system/",
    "/specs/math/inflow-nonnegativity.html": "/math/inflow-nonnegativity/",
    // Part 3 — Stochastic Modelling
    "/specs/math/par-inflow-model.html": "/math/par-inflow-model/",
    "/specs/math/multi-resolution-studies.html":
      "/math/multi-resolution-studies/",
    "/specs/math/weekly-monthly-coupled-studies.html":
      "/math/post-study-boundary/",
    "/specs/math/scenario-generation.html": "/math/scenario-generation/",
    // Part 4 — The SDDP Algorithm
    "/specs/math/sddp-algorithm.html": "/math/sddp-algorithm/",
    "/specs/math/cut-management.html": "/math/cut-management/",
    "/specs/math/lp-warm-start.html": "/math/lp-warm-start/",
    "/specs/math/risk-measures.html": "/math/risk-measures/",
    "/specs/math/stopping-rules.html": "/math/stopping-rules/",
    "/specs/math/upper-bound-evaluation.html": "/math/upper-bound-evaluation/",
    "/specs/math/determinism-guarantees.html": "/math/determinism-guarantees/",
    "/specs/math/reproducibility-and-provenance.html":
      "/math/determinism-guarantees/",
    // Part 5 — Coupling and Boundary Conditions
    "/specs/math/horizon-modes.html": "/math/horizon-modes/",
    "/specs/math/discount-rate.html": "/math/discount-rate/",
    // Part 6 — Worked Examples
    "/specs/examples/toy-single-reservoir.html":
      "/examples/toy-single-reservoir/",
    "/specs/examples/toy-four-reservoir.html": "/examples/toy-four-reservoir/",
    // Part 7 — Reference
    "/specs/reference/glossary.html": "/reference/glossary/",
    "/specs/reference/bibliography.html": "/reference/bibliography/",
    // Retired software mdBook paths (the old docs.novomodelo.invalid served the mdBook
    // flat at these URLs). Map each to its unified twin; omitted chapters (crate
    // internals → GitHub READMEs, energy-variables, deterministic-suite,
    // creating-your-own) 404 by design. D5: no analytics yet — these cover the
    // mdBook SUMMARY chapters that have an unambiguous unified page.
    "/tutorial/what-novomodelo-solves.html": "/overview/what-novomodelo-solves/",
    "/guide/installation.html": "/getting-started/installation/",
    "/tutorial/quickstart.html": "/getting-started/quickstart/",
    "/guide/python-quickstart.html": "/getting-started/python-quickstart/",
    "/guide/configuration.html": "/running/configuration/",
    "/guide/performance-accelerators.html": "/running/performance/",
    "/guide/running-studies.html": "/running/running-studies/",
    "/guide/policy-management.html": "/running/policy-management/",
    "/guide/novomodelo-bridge.html": "/running/case-conversion/",
    "/guide/interpreting-results.html": "/running/interpreting-results/",
    "/tutorial/understanding-results.html": "/running/interpreting-results/",
    "/guide/cli-reference.html": "/reference/cli-reference/",
    "/guide/scalar-parameters.html": "/reference/case-format/constraints/",
    "/reference/case-format.html": "/reference/case-format/",
    "/reference/output-format.html": "/reference/output/",
    "/reference/flatbuffers-schema.html": "/reference/flatbuffers-schema/",
    "/reference/error-codes.html": "/reference/error-codes/",
    "/reference/schemas.html": "/reference/json-schemas/",
    "/guide/system-modeling.html": "/math/system-elements/",
    "/guide/network-topology.html": "/math/system-elements/",
    "/guide/hydro-plants.html": "/math/hydro-production-models/",
    "/guide/thermal-units.html": "/math/equipment-formulations/",
    "/guide/stochastic-modeling.html": "/math/par-inflow-model/",
    "/guide/block-modes.html": "/math/block-formulations/",
    "/guide/water-travel-time.html": "/math/state-augmentation/",
    "/examples/1dtoy.html": "/examples/toy-single-reservoir/",
    "/examples/4ree.html": "/examples/toy-four-reservoir/",
    // Retired site slugs (merged or split chapters; R8): one hop to the survivor or the split's index
    "/math/weekly-monthly-coupled-studies": "/math/post-study-boundary/",
    "/math/reproducibility-and-provenance": "/math/determinism-guarantees/",
    "/reference/case-directory-format": "/reference/case-format/",
    "/reference/output-format": "/reference/output/",
  },
  // D4: manual math renderer — remark-math parses $…$ / $$…$$, rehype-katex
  // renders to static .katex HTML at build time (zero client JS). NOT
  // starlight-katex (forbidden by D4). Registered on Astro 6.4's durable
  // `markdown.processor` via `unified({...})` from @astrojs/markdown-remark;
  // the legacy top-level `markdown.remarkPlugins`/`rehypePlugins` keys are
  // deprecated in 6.4 and intentionally NOT used. `unified()` keeps GFM + smart
  // punctuation on by default — we only extend it with the math plugins below.
  // remark runs before rehype, so parse-then-render ordering is automatic.
  // rehype-katex runs with `strict: "error"`, and the katex-strict recorder
  // after it collects every KaTeX error rehype-katex records. Its
  // `astro:build:done` hook then fails the build listing them
  // (scripts/rehype-katex-strict.mjs).
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      // prettier-ignore
      rehypePlugins: [[rehypeKatex, { strict: "error" }], katexStrict.rehypeKatexStrict, rehypeWrapD2],
    }),
  },
  integrations: [
    // astro-d2 renders ```d2 fenced blocks to inline SVG at build time. The `d2`
    // binary is NOT an npm package and must be on PATH at build time (CI: E7):
    //   curl -fsSL https://d2lang.com/install.sh | sh -s --
    // layout MUST be "elk" — never "tala" (unlicensed TALA watermarks output, E10).
    astroD2({
      inline: true,
      layout: "elk",
      theme: { default: "0", dark: "200" },
      // Tighten the whitespace around every diagram: astro-d2 defaults `pad` to
      // 100px on all sides (visible as a large empty margin above/around the
      // figure). 20px keeps shapes off the edge without the wasted space.
      pad: 20,
    }),
    starlight({
      title: "Novomodelo Documentation",
      // Translation-status dashboard (ticket-022). @lunariajs/starlight is a
      // STARLIGHT PLUGIN (not an Astro integration): it hooks Starlight's plugin
      // API to inject the `/lunaria` route, which reads git history + the tracked
      // English chapter sources (per lunaria.config.json) and renders per-page
      // pt-BR translation status. With no pt-br/ content yet it reports 0%
      // (untranslated) — the intended "ready for translators" state.
      //
      // Coverage + two design decisions (ticket-019, extending i18n/Lunaria to
      // the Epics 03–04 software content — math/_impl/*, reference/*, running/*,
      // getting-started/*):
      // (a) `math/_impl/_*.mdx` partials are STANDALONE translation units.
      //     `lunaria.config.json`'s `location` glob (`src/content/docs/**/*.{md,mdx}`)
      //     matches underscore basenames — Lunaria does NOT apply Starlight's
      //     `docsLoader` `[^_]*` routing exclusion — so each partial is tracked
      //     as its own row on the dashboard even though it renders inline into a
      //     host chapter via `<Tabs>`, not as its own routed page. This is
      //     intentional (strategy §5): math and config-layer prose localize
      //     independently. No config change was needed; confirmed empirically
      //     with a fast-glob run against the same pattern (61 matches, including
      //     all `_impl/_*.mdx` partials, `reference/*`, `running/*`, and
      //     `getting-started/*`).
      // (b) `src/content/docs/pt-br/` stays `.gitkeep`-only — NO mirrored pt-br
      //     stub scaffold. Starlight falls back to the English source for any
      //     untranslated page, so 0%-translated across the board (including the
      //     new software content) is the correct "ready for translators" state,
      //     not a defect. Do not add empty/stub pt-br `.md`/`.mdx` files — they
      //     would render as broken pages and skew the dashboard's status.
      plugins: [lunaria({ configPath: "./lunaria.config.json", route: "/lunaria" })],
      // Brand mark (ticket-011b, resolves ticket-009's deferred logo). The header
      // slot is small (~24px), so we use the ICON — a self-contained 128×128 copper
      // mark on a Midnight tile, the brand's "small contexts / 16px" form — NOT the
      // wide 400×120 wordmark logos (those duplicate "Novomodelo" beside the title and
      // scale to illegibility at this height). `replacesTitle: false` keeps the
      // "Novomodelo Methodology" title text beside the icon. Theme-adaptive (Starlight
      // logo:{dark,light}): the Midnight-tiled icon on dark; a light-surface-tiled
      // variant on light (cobre-icon-light.svg — derived, copper anchored darker so
      // it reads on the light tile). The dark-tiled icon is also the favicon.
      logo: {
        dark: "./src/assets/cobre-icon.svg",
        light: "./src/assets/cobre-icon-light.svg",
        alt: "Novomodelo",
        replacesTitle: false,
      },
      favicon: "/favicon.svg",
      // Unified interleaved sidebar (ticket-005, docs-unification strategy §5
      // sketch). NOT `autogenerate`: the curated TOC crosses content folders
      // (System Modelling…Coupling & Boundary Conditions are all `math/…`
      // chapters split across four groups) and the old Part-N-prefixed labels
      // are retired in favour of named groups that autogeneration cannot
      // reproduce. The leading Get-Started group is new (ticket-004 ported the
      // three `getting-started/*` pages); it also reclaims
      // `overview/what-novomodelo-solves` from the old first Part group, leaving the
      // renamed Introduction group with the remaining three overview slugs.
      // The System Modelling, Stochastic Modelling and SDDP Algorithm groups
      // follow spec §6.3. The pure-software Running Novomodelo group (§5 sketch,
      // ticket-013) lands between Coupling & Boundary Conditions and Worked
      // Examples: these `running/*` pages have no methodology twin, so they are
      // standalone MDX (no `<Tabs>`, no `_impl/` partials). The I/O reference
      // entries (the Case Format and Output Format groups, error-codes,
      // flatbuffers-schema) landed in the Reference group below (ticket-012);
      // `reference/cli-reference` (ticket-013) is the resolved borderline
      // decision — CLI reference lives in Reference, not Running Novomodelo. The
      // landing page (index.mdx → `/`) is the site root and is intentionally
      // NOT a sidebar entry.
      sidebar: [
        {
          label: "Get Started",
          items: [
            "overview/what-novomodelo-solves",
            "getting-started/installation",
            "getting-started/quickstart",
            "getting-started/python-quickstart",
          ],
        },
        {
          label: "Introduction",
          items: [
            "overview/sddp-framework-overview",
            "overview/notation-conventions",
            "overview/how-to-read",
          ],
        },
        {
          label: "System Modelling",
          items: [
            "math/system-elements",
            "math/equipment-formulations",
            "math/lp-formulation",
            "math/state-augmentation",
            "math/block-formulations",
            "math/hydro-production-models",
            "math/penalty-system",
          ],
        },
        {
          label: "Stochastic Modelling",
          items: [
            "math/policy-graphs",
            "math/par-inflow-model",
            "math/inflow-nonnegativity",
            "math/scenario-generation",
            "math/multi-resolution-studies",
          ],
        },
        {
          label: "The SDDP Algorithm",
          items: [
            "math/sddp-algorithm",
            "math/cut-management",
            "math/lp-layout-and-scaling",
            "math/lp-warm-start",
            "math/risk-measures",
            "math/stopping-rules",
            "math/upper-bound-evaluation",
            "math/determinism-guarantees",
          ],
        },
        {
          label: "Coupling & Boundary Conditions",
          items: [
            "math/horizon-modes",
            "math/post-study-boundary",
            "math/discount-rate",
          ],
        },
        {
          label: "Running Novomodelo",
          items: [
            "running/running-studies",
            "running/configuration",
            "running/policy-management",
            "running/performance",
            "running/hpc-deployment",
            "running/case-conversion",
            "running/interpreting-results",
            "running/troubleshooting",
          ],
        },
        {
          label: "Worked Examples",
          items: ["examples/toy-single-reservoir", "examples/toy-four-reservoir"],
        },
        {
          label: "Reference",
          items: [
            {
              label: "Case Format",
              collapsed: true,
              items: [
                { slug: "reference/case-format", label: "Overview" },
                "reference/case-format/stages",
                "reference/case-format/system",
                "reference/case-format/hydros",
                "reference/case-format/production-models",
                "reference/case-format/scenarios",
                "reference/case-format/constraints",
                "reference/case-format/penalties",
                "reference/case-format/initial-conditions",
              ],
            },
            "reference/generic-constraints",
            {
              label: "Output Format",
              collapsed: true,
              items: [
                { slug: "reference/output", label: "Overview" },
                "reference/output/training",
                "reference/output/simulation",
                "reference/output/policy",
                "reference/output/metadata",
                "reference/output/stochastic",
                "reference/output/hydro-models",
              ],
            },
            "reference/json-schemas",
            "reference/error-codes",
            "reference/flatbuffers-schema",
            "reference/cli-reference",
            "reference/python-api",
            "reference/glossary",
            "reference/bibliography",
          ],
        },
      ],
      // Architecture B version picker mounts by overriding the `SocialIcons`
      // header slot (the slot the spike proved green). This is distinct from
      // Starlight's `LanguageSelect` slot, so the i18n language picker (root /
      // pt-br) is untouched — the two coexist in the header.
      components: {
        SocialIcons: "./src/components/VersionPicker.astro",
        // Footer override (E10 ticket-031): appends third-party notices link;
        // ticket-034 extended this same component with the content-license line.
        Footer: "./src/components/Footer.astro",
      },
      // palette.css defines the --dgm-* diagram palette (light + dark), consumed
      // by JS components (ValueFunctionPlot.astro, via getComputedStyle) and any
      // currentColor/var() inline SVG. The astro-d2 KEYSTONE in diagrams.css uses
      // HARDCODED d2-palette hex (NOT --dgm vars), so the two files are independent
      // and the order between them is arbitrary (corrected per E2 review,
      // 2026-06-24). neutrals.css + brand.css (ticket-011b) override Starlight's
      // own --sl-color-* tokens onto the BRAND palette: neutrals.css owns the warm
      // greyscale (--sl-color-{black,gray-1..7,white}); brand.css owns the COPPER
      // accent triple (--sl-color-accent*), the FLOW-BLUE prose-link rule, and the
      // semantic aside hue families (note=blue/tip=patina/caution=amber/danger=red).
      // Both are a SEPARATE concern from palette.css (--dgm-* diagram vars); they
      // touch disjoint property sets, so neutrals-before-brand is for readability,
      // not cascade. fonts.css (E2 / ticket-009) self-hosts the brand faces via
      // Fontsource (IBM Plex Sans body / JetBrains Mono code, OFL 1.1) and sets
      // ONLY --sl-font / --sl-font-mono — again a SEPARATE concern. Order is
      // independent of the palette-before-diagrams keystone rule above.
      customCss: [
        "./src/styles/katex.css",
        "./src/styles/palette.css",
        "./src/styles/diagrams.css",
        "./src/styles/neutrals.css",
        "./src/styles/brand.css",
        "./src/styles/fonts.css",
        // layout.css (measure + table density) is a SEPARATE concern from the
        // colour/type files above — it touches only --sl-content-width, table
        // column floors and the right-sidebar TOC width, so its order among them
        // is arbitrary.
        "./src/styles/layout.css",
      ],
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        "pt-br": { label: "Português do Brasil", lang: "pt-BR" },
      },
      pagefind: false,
    }),
    katexStrict.integration,
  ],
});
