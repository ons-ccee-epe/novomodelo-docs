---
paths:
  - "scripts/**"
  - "package.json"
  - ".github/workflows/**"
  - "build-versions.mjs"
  - "versions.json"
---

# Quality Gates — Tooling Notes

The full gate command is in `CLAUDE.md` → Quality Gates. These are the
prerequisites and CI wiring behind it.

- **d2 v0.7.1** on `PATH`: without it `npm run build` and `npm run dev` abort with
  "Could not find D2".
- **novomodelo v0.21.0** for `check:gc-examples`: `NOVOMODELO_BIN`, else `novomodelo` on `PATH`.
  The gate exits 2 when the binary is missing, lies under a cargo
  `target/release/` or `target/debug/` directory, or reports a version other
  than `DEFAULT_NOVOMODELO_REF` in `scripts/novomodelo-ref.mjs`.
- **KaTeX strict**: `npm run build` fails on any KaTeX strict-mode violation or
  parse error (`scripts/rehype-katex-strict.mjs`); `npm run dev` does not run
  this check.

- **pt-BR sync** (`scripts/check-ptbr-sync.mjs`): `npm install` sets
  `core.hooksPath` to `.githooks`, whose `commit-msg` hook runs it on every
  commit; `npm run check:ptbr-sync` checks each commit in `origin/main..HEAD`.
  Contract: `.claude/rules/translation-ptbr.md`.

- **pt-BR sentence case** (`scripts/check-ptbr-case.mjs`): pt-BR headings,
  frontmatter titles and the `astro.config.mjs` pt-BR labels; proper nouns and
  named terms are listed in its `EXEMPT_TERMS`, and words with two or more
  capitals are exempt by rule, except that each part of a hyphenated word is checked on its own (`Pós-Estudo` is flagged). Grandfathered hits use rule id `ptbr-title-case`
  in `scripts/doc-lint-allow.txt`. Rule text: `.claude/rules/glossario-traducao-ptbr.md` rule 8.

`.github/workflows/starlight-ci.yml` runs every gate on pull requests to `main`
(the build as `npm run build:versions`; pt-BR sync over each PR commit); `.github/workflows/starlight-deploy.yml`
runs only the build checks, on push to `main`. `README.md` describes each gate in
one line (`## Quality gates`; `build:versions` under `## Local development`;
the freeze runbook is `## Versioning`).
