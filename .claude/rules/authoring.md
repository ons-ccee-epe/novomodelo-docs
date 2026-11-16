---
paths:
  - "src/content/docs/**/*.{md,mdx}"
  - "public/schemas/**"
---

# Authoring Standards — Two-Layer Corpus

Auto-loads when editing any documentation page (English or `pt-br/`). The
Hard Rules in `CLAUDE.md` (current-state voice, no versions in the math layer,
generic positioning, batched edits) apply on top of these.

## Unified corpus & the developer surface

The site is **one corpus with two layers**, interleaved topic-by-topic. This
_inverts_ the previous "relocated domains" rule: user-facing architecture-adjacent
content (configuration, I/O files, output schemas, CLI, examples, results) now
**does** live here, as the software layer — it is not exiled to a separate guide.

- **Math layer** — the page body: formulation, algorithm, notation, worked
  examples. Annotation-free and instance-agnostic (see Math-Layer standards).
- **Software layer** — imported sibling partials rendered as tabs
  (`math/_impl/_<topic>.configure.mdx`, `.io.mdx`, `.notes.mdx`) plus the
  `reference/*` and `running/*` pages. Version-scoped; may carry concrete config
  keys, output-schema columns, CLI flags, and instance detail.
- **Source-vs-render split (hard)**: math stays in the topic's own `math/*`
  file; the software layers live in **separate** `_impl/_*` partial files
  rendered as `<Tabs>`. The partial **filename** must start with `_`
  (`_impl/_hydro.configure.mdx`) — Starlight's `docsLoader` globs `**/[^_]*` by
  **basename**, so the `_` on the directory alone is not enough. This keeps
  per-release config churn out of the annotation-free math file.
- **Developer / crate internals stay OUT of the site.** Crate responsibilities,
  the dependency graph, `SolverError` classification internals, the GIL/MPI
  safety contract, and other implementation architecture live as **`novomodelo`
  per-crate `README.md` + `ARCHITECTURE.md`** on GitHub. Reference them from a
  chapter only via a trailing cross-link, never by reintroducing the content.
- **Two-way backlink contract**: a software-layer partial links up to the math
  it implements; the reference/running pages link back to the topic chapter.
  Keep both directions live (the `check:links` gate enforces resolution).

## Math-Layer Authoring Standards

The math layer is a **general, instance-agnostic methodology reference** — not an
implementation guide, not a deployment-specific tutorial. (Codified from the
Part-1 docs review, 2026-06; scoped to `math/*` + overview/notation/glossary.)

- **No instance magic numbers.** Reference and symbol tables carry meaning, units,
  and structure — never "typical size/value" columns or instance counts (plant
  counts, `$/MWh` ranges, horizon lengths). Those hold for some studies and are
  absurd for others; concrete numbers belong only in an explicit **worked example**
  (Worked Examples) or the software layer. If a number encoded a methodological _ordering_
  (e.g. a penalty hierarchy), keep the ordering in prose and drop the absolute
  values.
- **Symbol keys stay conceptual.** Notation keys and overview tables define what a
  symbol _means_; they do not carry solver internals (reduced costs, column
  pinning, prescalers, hot-path details). Keep those in the derivation section that
  owns them — reinforces _code > spec_.
- **Don't justify symbol choices.** State the notation clearly; do not explain why a
  symbol was chosen (no etymology/provenance asides, especially Portuguese). The
  bilingual **glossary** and practitioner term-maps (`reference/glossary.md` and
  the bridge (case-conversion) page, `running/case-conversion.mdx`) are a
  deliberate translation aid for DECOMP/DESSEM/NEWAVE practitioners — those stay.
- **Conceptual / overview chapters earn their visuals.** Introduce an idea with the
  equation(s) + a diagram + the tested-compute plots (use `.mdx` to embed the
  Observable Plot islands), and keep notation consistent with the deep chapters the
  overview previews. (Model: SDDP.jl `first_steps`.)
- **No dev artifacts ship as content.** Spike/scaffold renderer-checks, TODO demos,
  and harness probes never appear on the published site.
- **Voice gates.** `check:voice`, `check:version`, `check:narration` and
  `check:glossary` share the ratchet `scripts/doc-lint-allow.txt`: an entry
  grandfathers one rule at one `path:line`, any other hit fails its gate, and an
  entry that matches no hit fails its gate as STALE. The commands are under
  Quality Gates.

## Software-Layer Authoring Standards

The software layer (`_impl/*` partials, `reference/*`, `running/*`) is the
**version-scoped, user-facing** counterpart. It **may** carry concrete config
keys, JSON field tables, output-schema columns, CLI flags, and example values —
the things the math layer forbids. It still follows _code > spec_ (verify every
field/flag against the current novomodelo code, not stale prose), stays user-facing
(no crate internals — those are novomodelo READMEs), and keeps its `_`-prefixed
partial filenames so the render split holds.

## JSON schemas

The 18 input schemas are generated in `novomodelo` from `novomodelo-io`
types; this site **vendors** a committed copy (`public/schemas/`) refreshed by
`npm run refresh:schemas -- --ref <tag>` (reads a git ref, never the novomodelo working
tree). Refresh on each novomodelo release; the freshness gate stays in `novomodelo`.
