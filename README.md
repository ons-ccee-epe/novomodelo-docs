# novomodelo-docs

**Novomodelo Documentation** for the [Novomodelo](https://github.com/ons-ccee-epe/novomodelo)
ecosystem — the mathematics, algorithm, and worked examples behind its
SDDP-based hydrothermal dispatch, together with how the software implements them.

Built with [Astro Starlight](https://starlight.astro.build/). The site is not
published yet: it goes live at the fork's documentation domain, for which
`docs.novomodelo.invalid` stands in (see **Deployment**).

> **Scope.** This is the **single, unified** docs site: an annotation-free math
> layer (formulation, algorithm, worked examples) interleaved per topic with a
> version-scoped software layer (configure / I·O tabs, the I/O reference, and
> running Novomodelo). Only developer/crate internals live outside it, as `novomodelo`
> per-crate READMEs + `ARCHITECTURE.md`. The Novomodelo code is the ground truth —
> when a spec diverges from the code, the spec is updated.

## Local development

Requires **Node 25+**. The [`d2`](https://d2lang.com/) binary (v0.7.1) must be on
`PATH` for D2 figures to render — see `.github/workflows/starlight-ci.yml` for the
pinned install; without it, `npm run build` and `npm run dev` abort with
"Could not find D2".

```bash
npm install            # or: npm ci
npm run dev            # Astro dev server with live reload
npm run build          # static build → dist/
npm run build:versions # multi-version assembly (versions.json) → dist/
```

## Stack

| Concern        | Tool                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Site framework | [Astro Starlight](https://starlight.astro.build/)                                                                            |
| Math           | KaTeX via manual `remark-math` + `rehype-katex` (rendered at build time, zero client JS)                                     |
| Diagrams       | inline [D2](https://d2lang.com/) (ELK engine) for every diagram — schematics, flowcharts, network one-lines (build-time SVG) |
| Math plots     | [Observable Plot](https://observablehq.com/plot/) islands backed by a unit-tested TypeScript compute layer                   |
| i18n           | Starlight-native (`en` + `pt-br`) + [Lunaria](https://lunaria.dev/) translation dashboard                                    |
| Versioning     | latest at `/`, one frozen snapshot per novomodelo minor at `/vX.Y/` (no plugin); see `build-versions.mjs` + `versions.json`       |

## Structure

```
src/
├── content/
│   └── docs/             # the unified corpus — math layer + interleaved software layer
│       ├── index.mdx     #   landing page
│       ├── getting-started/ #   Get Started — installation, quickstart, Python quickstart
│       ├── overview/     #   Get Started (what Novomodelo solves) and Introduction
│       ├── math/         #   System Modelling, Stochastic Modelling, The SDDP Algorithm, Coupling & Boundary Conditions
│       │   └── _impl/    #   software-layer Configure / I·O / Notes partials, rendered as tabs on the math pages
│       ├── running/      #   Running Novomodelo
│       ├── examples/     #   Worked Examples
│       ├── reference/    #   Reference — CLI, error codes, schemas, Python API, glossary, bibliography
│       │   ├── case-format/ #   Reference > Case Format
│       │   └── output/   #   Reference > Output Format
│       └── pt-br/        #   pt-BR locale scaffold (.gitkeep only); feeds no sidebar group
├── content.config.ts
├── components/           # Astro islands (Observable Plot figures, version picker, footer)
├── figures/              # tested TypeScript compute layer for the plots (*.ts + *.test.ts)
└── styles/               # site palette, figure/KaTeX/font CSS
astro.config.mjs          # integrations + the Starlight sidebar (groups and page order)
build-versions.mjs        # multi-version build orchestrator
scripts/                  # quality-gate and refresh scripts, with their tests and fixtures (see below)
public/                   # static assets: vendored input schemas/, quickstart recordings, THIRD-PARTY-NOTICES.txt
```

## Quality gates

```bash
npm run build         # fails on any KaTeX strict-mode violation or parse error (scripts/rehype-katex-strict.mjs); run it first
npm test              # tested-compute layer + script unit tests (node --test); the i18n-locale test reads dist/
npm run check         # astro check (types)
npm run check:math    # KaTeX $$-block render parity (reads dist/)
npm run check:links   # internal link integrity across every version (reads dist/ after `npm run build:versions`)
npm run check:figures # no retired-figure reference, the figure scope assertions hold, and every Plot island imports a tested src/figures module with an aria-label
npm run check:voice   # hype phrases, unpinned "typical" numbers, instance magnitudes (two-voice methodology)
npm run check:counts  # stated counts match their tables and files: column/field counts, the generic-constraint variable catalog, the vendored schema count (public/schemas)
npm run check:version # novomodelo-version references vs the Synced-to anchor
npm run check:narration # change narration, both zones (ratchet: scripts/doc-lint-allow.txt)
npm run check:glossary # glossary: no file/path/config tokens, A–Z index complete (ratchet: scripts/doc-lint-allow.txt)
npm run check:error-coverage # every emitted ErrorKind/LoadError variant has an error-codes section; unemitted ones are reserved
npm run check:input-schemas # vendored input schemas match the case-format tables: names both ways, required flags, enums
npm run check:python-api # every public novomodelo-python stub symbol has an anchor in reference/python-api (stubs: scripts/pystubs/)
npm run check:d2      # D2 uses the ELK engine, never TALA
npm run check:spdx    # 100% FOSS dependency audit
npm run check:gc-examples # every gc-check fence behaves as marked under novomodelo v0.18.0 (NOVOMODELO_BIN or novomodelo on PATH)
npm run refresh:recordings -- --check # quickstart.gif matches scripts/recordings-provenance.json (check only)
npm run check:type-spelling # reference Type cells use the reference-conventions §4 vocabulary
npm run check:e10     # third-party-notices / content-licensing completeness
```

## Deployment

A push to `main` triggers `.github/workflows/starlight-deploy.yml`, which builds the
site, runs the build checks, and publishes it to GitHub Pages at
`docs.novomodelo.invalid`. Nothing is published yet: GitHub Pages is not enabled for
this repository, and `docs.novomodelo.invalid` stands in for the fork's documentation
domain. The full gate suite, including the doc-lint gates, runs in
`.github/workflows/starlight-ci.yml` on pull requests to `main`.

## Versioning

`versions.json` lists the documentation versions. `latest` is built from the
working tree and served at `/`. Each `versions` entry is a frozen snapshot of one
novomodelo minor, built from its `ref` (a 40-hex commit SHA on `main`) and served at
its `base` (`/vX.Y/`). The version picker lists `latest`, then `versions` in file
order, newest first. A novomodelo patch release updates `latest` in place. A frozen
snapshot is never edited: a fix branches from its `ref`, and `ref` moves to the
fix commit (see **Fixing a frozen version**). Every frozen minor is kept until
novomodelo v1.0.0; from then on, only the last two or three minors.

**Freezing vX.Y in the docs sync for novomodelo vX.(Y+1).0**

1. Read the SHA of the last `main` commit documenting novomodelo vX.Y.z with
   `git ls-remote origin refs/heads/main` (normally the merge commit of the last
   vX.Y sync PR).
2. Insert the new entry at the top of `versions`:
   `{ "slug": "vX.Y", "label": "vX.Y", "base": "/vX.Y/", "ref": "<40-hex SHA>", "novomodelo": "vX.Y.z" }`.
   `novomodelo` is the value `latest.novomodelo` holds before the bump.
3. Once the novomodelo vX.(Y+1).0 tag exists, make one commit that:
   - sets `DEFAULT_NOVOMODELO_REF` (`scripts/novomodelo-ref.mjs`) and `latest.novomodelo` to
     vX.(Y+1).0;
   - re-vendors `scripts/error-kinds.json` with `npm run refresh:error-kinds`
     and removes the `**Status:** Reserved.` lines of the kinds the new release
     emits (`src/content/docs/reference/error-codes.mdx`);
   - moves the CI novomodelo pin (the step name, URL and archive sha256 in
     `.github/workflows/starlight-ci.yml`) and the `check:gc-examples` line of
     this README;
   - regenerates `scripts/fixtures/gc-overlay/` per its README;
   - moves every `vX.Y.z` page pin (census:
     `/usr/bin/grep -rnE 'v[0-9]+\.[0-9]+\.[0-9]+' src/content/docs`; the frozen
     `versions` entries keep their `novomodelo` values). A `capture:` marker moves
     only when its block is re-captured with the new release binary, a
     `quoted from source: … at novomodelo vX.Y.z` marker only when it is re-checked
     at the new tag, and third-party versions and novomodelo-bridge links are not
     pins;
   - re-vendors the schemas and the Python stubs
     (`npm run refresh:schemas -- --ref vX.(Y+1).0`,
     `npm run refresh:pystubs -- --ref vX.(Y+1).0`) and updates the recording
     record `scripts/recordings-provenance.json`, then checks it with
     `npm run refresh:recordings -- --check`.
4. From novomodelo v1.0.0 on, delete every entry but those of the last two or three
   minors; a deleted entry's `/vX.Y/` URLs then 404.
5. Run `npm run build:versions` (it logs `=== building vX.Y  (base=/vX.Y/) ===`),
   then `npm run check:links`, then `npm test`, and record `du -sh dist`.
6. Serve `dist/` (`python3 -m http.server -d dist 8080`) and check the picker on
   `/` and on `/vX.Y/`: it lists every version, `/vX.Y/` shows "documents novomodelo
   vX.Y.z", and selecting `latest` returns to `/`.
7. Before merging, run `git fetch origin main`; then `git log <SHA>..origin/main`
   lists no commit outside the sync, and `git ls-remote origin refs/heads/main`
   names the same commit as `origin/main`. If another commit landed on `main`,
   move `ref` to it.

**Fixing a frozen version.** Branch from the entry's `ref` and commit the fix. On
a branch from `main`, run `git merge -s ours <fix-branch>` (the tree stays
`main`'s) and land that branch through a PR merged with a merge commit, never a
squash; then move `ref` to the fix commit. `scripts/versions-json.test.mjs` fails
on a squash, because the fix commit is then not an ancestor of HEAD.

**Dependency bumps.** Every frozen version must build green in the bump PR (CI
builds them all). The first bump that breaks one switches the snapshot builds to
a per-snapshot `npm ci`.

## Origin and credits

novomodelo-docs is developed by Operador Nacional do Sistema Elétrico - ONS,
Câmara de Comercialização de Energia Elétrica - CCEE and Empresa de Pesquisa
Energética - EPE, with other contributors, as a fork of
[cobre-docs](https://github.com/cobre-rs/cobre-docs), the documentation of
[Cobre](https://github.com/cobre-rs/cobre). The fork was created from
cobre-docs's documentation of the Cobre v0.18.0 release (commit `71f0cb9`,
tagged `fork-point` in this repository); every commit up to and including it is
cobre-docs's and is preserved unchanged here.

## License

Copyright 2026 Rogerio J. M. Alves and Cobre Contributors.
Copyright 2026 Operador Nacional do Sistema Elétrico - ONS, Câmara de
Comercialização de Energia Elétrica - CCEE, Empresa de Pesquisa Energética - EPE
and Contributors.

Licensed under the [Apache License 2.0](LICENSE), the license of the Novomodelo
codebase. It covers the whole repository: the documentation content (prose,
equations, figures) and the code (build scripts, Astro components,
configuration). [`NOTICE`](NOTICE) states where the fork comes from.

See [`public/THIRD-PARTY-NOTICES.txt`](public/THIRD-PARTY-NOTICES.txt) for the bundled
third-party dependencies.
