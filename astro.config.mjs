// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import lunaria from "@lunariajs/starlight";
import astroD2 from "astro-d2";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createKatexStrict } from "./scripts/rehype-katex-strict.mjs";
import rehypeAsciiHeadingIds from "./scripts/rehype-ascii-heading-ids.mjs";

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
  // Custom domain for absolute URLs (canonical links + sitemap). Env-overridable
  // for a versioned build.
  site: process.env.DOCS_SITE ?? "https://docs.modelossetoreletrico.org.br",
  // D5: mdBook→Starlight URL preservation. Each key is an old mdBook (or
  // retired-site) path and each destination is a live English page, one hop:
  // those old URLs were English, and English is served under `/en/` (pt-BR is
  // the root locale). mdBook served each chapter at
  // `/specs/<group>/<chapter>.html` (and the intro at `/introduction.html`);
  // Starlight serves the SAME chapters at clean directory URLs with the
  // `specs/` segment dropped: `/en/<group>/<chapter>/` (and the English home at
  // `/en/`). The mapping is therefore mechanical:
  //   `/specs/<group>/<chapter>.html`  ->  `/en/<group>/<chapter>/`
  //   `/introduction.html`             ->  `/en/`
  // except that a chapter whose content lives on another page points at that
  // page. Every destination other than `/en/` is `/en/` followed by a slug from
  // the starlight `sidebar` block (the single source of truth for the page
  // slugs); this map is
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
  // data for the old URLs, then decide:
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
    "/introduction.html": "/en/",
    "/specs/overview/what-novomodelo-solves.html":
      "/en/overview/what-novomodelo-solves/",
    "/specs/overview/sddp-framework-overview.html":
      "/en/overview/sddp-framework-overview/",
    "/specs/overview/notation-conventions.html":
      "/en/overview/notation-conventions/",
    "/specs/overview/how-to-read.html": "/en/overview/how-to-read/",
    // Part 2 — System Modelling
    "/specs/math/lp-formulation.html": "/en/math/lp-formulation/",
    "/specs/math/system-elements.html": "/en/math/system-elements/",
    "/specs/math/equipment-formulations.html":
      "/en/math/equipment-formulations/",
    "/specs/math/block-formulations.html": "/en/math/block-formulations/",
    "/specs/math/hydro-production-models.html":
      "/en/math/hydro-production-models/",
    "/specs/math/penalty-system.html": "/en/math/penalty-system/",
    "/specs/math/inflow-nonnegativity.html": "/en/math/inflow-nonnegativity/",
    // Part 3 — Stochastic Modelling
    "/specs/math/par-inflow-model.html": "/en/math/par-inflow-model/",
    "/specs/math/multi-resolution-studies.html":
      "/en/math/multi-resolution-studies/",
    "/specs/math/weekly-monthly-coupled-studies.html":
      "/en/math/post-study-boundary/",
    "/specs/math/scenario-generation.html": "/en/math/scenario-generation/",
    // Part 4 — The SDDP Algorithm
    "/specs/math/sddp-algorithm.html": "/en/math/sddp-algorithm/",
    "/specs/math/cut-management.html": "/en/math/cut-management/",
    "/specs/math/lp-warm-start.html": "/en/math/lp-warm-start/",
    "/specs/math/risk-measures.html": "/en/math/risk-measures/",
    "/specs/math/stopping-rules.html": "/en/math/stopping-rules/",
    "/specs/math/upper-bound-evaluation.html":
      "/en/math/upper-bound-evaluation/",
    "/specs/math/determinism-guarantees.html":
      "/en/math/determinism-guarantees/",
    "/specs/math/reproducibility-and-provenance.html":
      "/en/math/determinism-guarantees/",
    // Part 5 — Coupling and Boundary Conditions
    "/specs/math/horizon-modes.html": "/en/math/horizon-modes/",
    "/specs/math/discount-rate.html": "/en/math/discount-rate/",
    // Part 6 — Worked Examples
    "/specs/examples/toy-single-reservoir.html":
      "/en/examples/toy-single-reservoir/",
    "/specs/examples/toy-four-reservoir.html":
      "/en/examples/toy-four-reservoir/",
    // Part 7 — Reference
    "/specs/reference/glossary.html": "/en/reference/glossary/",
    "/specs/reference/bibliography.html": "/en/reference/bibliography/",
    // Retired software mdBook paths (the old site served the mdBook flat at these
    // URLs). Map each to its unified twin; omitted chapters (crate
    // internals → GitHub READMEs, energy-variables, deterministic-suite,
    // creating-your-own) 404 by design. D5: no analytics yet — these cover the
    // mdBook SUMMARY chapters that have an unambiguous unified page.
    "/tutorial/what-novomodelo-solves.html":
      "/en/overview/what-novomodelo-solves/",
    "/guide/installation.html": "/en/getting-started/installation/",
    "/tutorial/quickstart.html": "/en/getting-started/quickstart/",
    "/guide/python-quickstart.html": "/en/getting-started/python-quickstart/",
    "/guide/configuration.html": "/en/running/configuration/",
    "/guide/performance-accelerators.html": "/en/running/performance/",
    "/guide/running-studies.html": "/en/running/running-studies/",
    "/guide/policy-management.html": "/en/running/policy-management/",
    "/guide/novomodelo-bridge.html": "/en/running/case-conversion/",
    "/guide/interpreting-results.html": "/en/running/interpreting-results/",
    "/tutorial/understanding-results.html": "/en/running/interpreting-results/",
    "/guide/cli-reference.html": "/en/reference/cli-reference/",
    "/guide/scalar-parameters.html": "/en/reference/case-format/constraints/",
    "/reference/case-format.html": "/en/reference/case-format/",
    "/reference/output-format.html": "/en/reference/output/",
    "/reference/flatbuffers-schema.html": "/en/reference/flatbuffers-schema/",
    "/reference/error-codes.html": "/en/reference/error-codes/",
    "/reference/schemas.html": "/en/reference/json-schemas/",
    "/guide/system-modeling.html": "/en/math/system-elements/",
    "/guide/network-topology.html": "/en/math/system-elements/",
    "/guide/hydro-plants.html": "/en/math/hydro-production-models/",
    "/guide/thermal-units.html": "/en/math/equipment-formulations/",
    "/guide/stochastic-modeling.html": "/en/math/par-inflow-model/",
    "/guide/block-modes.html": "/en/math/block-formulations/",
    "/guide/water-travel-time.html": "/en/math/state-augmentation/",
    "/examples/1dtoy.html": "/en/examples/toy-single-reservoir/",
    "/examples/4ree.html": "/en/examples/toy-four-reservoir/",
    // Retired site slugs (merged or split chapters; R8): one hop to the survivor or the split's index
    "/math/weekly-monthly-coupled-studies": "/en/math/post-study-boundary/",
    "/math/reproducibility-and-provenance": "/en/math/determinism-guarantees/",
    "/reference/case-directory-format": "/en/reference/case-format/",
    "/reference/output-format": "/en/reference/output/",
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
  // (scripts/rehype-katex-strict.mjs). rehypeAsciiHeadingIds runs last: it
  // assigns every heading its id, as Astro computes it, without diacritics
  // (pt-BR `histórica` -> `historica`; scripts/rehype-ascii-heading-ids.mjs).
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      // prettier-ignore
      rehypePlugins: [[rehypeKatex, { strict: "error" }], katexStrict.rehypeKatexStrict, rehypeWrapD2, rehypeAsciiHeadingIds],
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
      title: { en: "Novomodelo Documentation", "pt-BR": "Documentação do Novo Modelo" },
      // Translation-status dashboard (ticket-022). @lunariajs/starlight is a
      // STARLIGHT PLUGIN (not an Astro integration): it hooks Starlight's plugin
      // API to inject the `/lunaria` route, which reads git history + the tracked
      // English chapter sources (per lunaria.config.json) and renders per-page
      // pt-BR translation status: a pt-br/ page whose English source changed
      // after it was translated shows as outdated.
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
      // (b) `src/content/docs/pt-br/` mirrors the English pages with full
      //     translations, following the guide in
      //     `.claude/rules/glossario-traducao-ptbr.md` (outside the content
      //     tree, so it is never published). The English sources stay the
      //     translation source even though pt-BR is the root locale (see
      //     `locales` below): Starlight would serve the root (pt-BR) content at
      //     the /en/ URL of an English page that is missing, so every page
      //     keeps its twin in the other locale. Do not add empty/stub pt-br
      //     `.md`/`.mdx` files — they would render as broken pages and skew the
      //     dashboard's status.
      plugins: [lunaria({ configPath: "./lunaria.config.json", route: "/lunaria" })],
      // Curated sidebar, NOT `autogenerate`: the TOC crosses content folders
      // (`overview/`, `entities/`, `math/`, `getting-started/`, `running/`,
      // `reference/`) and groups pages by topic and by study step, which
      // autogeneration cannot reproduce. Six sections, in this order: Get Started,
      // Model entities, Methodology reference, Running studies, Execution
      // reference and Worked Examples. Each reference section follows the section
      // it complements and starts collapsed: Methodology reference (the five
      // methodology blocks, the glossary and the bibliography) follows Model
      // entities; Execution reference (the generic-constraint language, JSON
      // schemas, error codes, FlatBuffers schema, CLI and Python API) follows
      // Running studies. Running studies follows the steps of a study: the
      // Case Format group sits under "Preparing the case" and the Output Format
      // group under "Analysing results". Every section and subsection label
      // carries its pt-BR translation (Starlight shows `translations[lang]` and
      // falls back to `label`, which stays English). The home pages
      // (pt-br/index.mdx -> `/`, index.mdx -> `/en/`) are intentionally NOT
      // sidebar entries.
      sidebar: [
        {
          label: "Get Started", translations: { "pt-BR": "Comece aqui" },
          items: [
            "overview/what-novomodelo-solves",
            "overview/how-the-model-decides",
            "overview/how-to-read",
          ],
        },
        {
          label: "Model entities", translations: { "pt-BR": "Entidades do modelo" },
          items: [
            {
              label: "Inflows", translations: { "pt-BR": "Afluências" },
              items: ["entities/inflows/inflows", "entities/inflows/scenarios"],
            },
            {
              label: "Generation", translations: { "pt-BR": "Geração" },
              items: [
                "entities/generation/hydro-plants",
                "entities/generation/thermal-plants",
                "entities/generation/non-controllable-sources",
                "entities/generation/pumping-stations",
              ],
            },
            {
              label: "Network", translations: { "pt-BR": "Rede" },
              items: [
                "entities/network/buses",
                "entities/network/lines",
                "entities/network/energy-contracts",
              ],
            },
            {
              label: "Consumption", translations: { "pt-BR": "Consumo" },
              items: ["entities/consumption/load", "entities/consumption/deficit"],
            },
            "entities/time-structure",
            "entities/water-value",
            "entities/generic-constraints",
            "entities/penalties",
            "entities/risk-aversion",
          ],
        },
        {
          label: "Methodology reference", translations: { "pt-BR": "Referência metodológica" },
          collapsed: true,
          items: [
            {
              label: "Introduction", translations: { "pt-BR": "Introdução" },
              items: [
                "overview/sddp-framework-overview",
                "overview/notation-conventions",
              ],
            },
            {
              label: "System Modelling", translations: { "pt-BR": "Modelagem do sistema" },
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
              label: "Stochastic Modelling", translations: { "pt-BR": "Modelagem estocástica" },
              items: [
                "math/policy-graphs",
                "math/par-inflow-model",
                "math/inflow-nonnegativity",
                "math/scenario-generation",
                "math/multi-resolution-studies",
              ],
            },
            {
              label: "The SDDP Algorithm", translations: { "pt-BR": "O algoritmo da PDDE" },
              items: [
                "math/sddp-algorithm",
                "math/cut-management",
                "math/par-folding",
                "math/lp-layout-and-scaling",
                "math/lp-warm-start",
                "math/risk-measures",
                "math/stopping-rules",
                "math/upper-bound-evaluation",
                "math/determinism-guarantees",
              ],
            },
            {
              label: "Coupling & Boundary Conditions", translations: { "pt-BR": "Acoplamento e condições de contorno" },
              items: [
                "math/horizon-modes",
                "math/post-study-boundary",
                "math/discount-rate",
              ],
            },
            "reference/glossary",
            "reference/bibliography",
          ],
        },
        {
          label: "Running studies", translations: { "pt-BR": "Execução de estudos" },
          items: [
            "getting-started/installation",
            {
              label: "Execution modes", translations: { "pt-BR": "Modos de execução" },
              items: [
                "getting-started/quickstart",
                "getting-started/python-quickstart",
                "running/mcp-server",
              ],
            },
            {
              label: "Preparing the case", translations: { "pt-BR": "Preparando o caso" },
              items: [
                {
                  label: "Case Format", translations: { "pt-BR": "Formato do caso" },
                  collapsed: true,
                  items: [
                    { slug: "reference/case-format", label: "Overview", translations: { "pt-BR": "Visão geral" } },
                    "reference/case-format/stages",
                    "reference/case-format/system",
                    "reference/case-format/hydros",
                    "reference/case-format/production-models",
                    "reference/case-format/scenarios",
                    "reference/case-format/constraints",
                    "reference/case-format/penalties",
                    "reference/case-format/boundary-conditions",
                    "reference/case-format/initial-conditions",
                  ],
                },
                "running/configuration",
                "running/case-conversion",
              ],
            },
            {
              label: "Running the study", translations: { "pt-BR": "Executando o estudo" },
              items: ["running/running-studies", "running/policy-management"],
            },
            {
              label: "Performance and scale", translations: { "pt-BR": "Desempenho e escala" },
              items: ["running/performance", "running/hpc-deployment"],
            },
            {
              label: "Analysing results", translations: { "pt-BR": "Analisando resultados" },
              items: [
                {
                  label: "Output Format", translations: { "pt-BR": "Formato de saída" },
                  collapsed: true,
                  items: [
                    { slug: "reference/output", label: "Overview", translations: { "pt-BR": "Visão geral" } },
                    "reference/output/training",
                    "reference/output/simulation",
                    "reference/output/policy",
                    "reference/output/metadata",
                    "reference/output/stochastic",
                    "reference/output/hydro-models",
                  ],
                },
                "running/interpreting-results",
              ],
            },
            "running/troubleshooting",
          ],
        },
        {
          label: "Execution reference", translations: { "pt-BR": "Referência de execução" },
          collapsed: true,
          items: [
            "reference/generic-constraints",
            "reference/json-schemas",
            "reference/error-codes",
            "reference/flatbuffers-schema",
            "reference/cli-reference",
            "reference/python-api",
          ],
        },
        {
          label: "Worked Examples", translations: { "pt-BR": "Exemplos resolvidos" },
          items: ["examples/toy-single-reservoir", "examples/toy-four-reservoir"],
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
      // 2026-06-24). neutrals.css + brand.css override Starlight's own
      // --sl-color-* tokens onto the design-system tokens (tokens.css,
      // docs/design/design-system.md): neutrals.css owns the greyscale
      // (--sl-color-{black,gray-1..7,white}); brand.css owns the sea-green accent
      // triple (--sl-color-accent*), the prose-link rule and the asides.
      // Both are a SEPARATE concern from palette.css (--dgm-* diagram vars); they
      // touch disjoint property sets, so neutrals-before-brand is for readability,
      // not cascade. fonts.css self-hosts the hotsite's Inter and Inter Display
      // (OFL 1.1, WOFF2 in src/fonts/), uses the system monospace stack for code,
      // and sets --sl-font / --sl-font-mono — again a SEPARATE concern. Order is
      // independent of the palette-before-diagrams keystone rule above.
      customCss: [
        // tokens.css holds the design-system values (docs/design/design-system.md)
        // every file below reads; it comes first so its custom properties are
        // declared before any consumer.
        "./src/styles/tokens.css",
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
        // components.css: Starlight's type scale, buttons and active state in
        // the hotsite's terms (design-system.md §3, §5, §8).
        "./src/styles/components.css",
        // header.css: the hotsite's fixed graphite header in both themes (D4).
        "./src/styles/header.css",
        "./src/components/entity/entity.css",
      ],
      // pt-BR is the root locale, served at the docs base, and English is
      // served under en/. The sources keep English at the root of
      // src/content/docs/ and pt-BR in pt-br/: the content ids
      // (scripts/locale-id.mjs, src/content.config.ts) map pt-br/<p> to <p>
      // and every other <p> to en/<p>.
      defaultLocale: "root",
      locales: {
        root: { label: "Português", lang: "pt-BR" },
        en: { label: "English", lang: "en" },
      },
      pagefind: false,
    }),
    katexStrict.integration,
  ],
});
