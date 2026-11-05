---
paths:
  - "src/content/docs/**/*.{md,mdx}"
  - "astro.config.mjs"
  - "src/components/**"
  - "lunaria.config.json"
---

# pt-BR Translation Sync

Every English page under `src/content/docs/` (outside `pt-br/`) has a full
Brazilian Portuguese counterpart at the same relative path under
`src/content/docs/pt-br/` — `_impl/_*.mdx` partials included. The two stay in
sync **in the same commit**: an English change lands together with its pt-BR
translation, never in a later "translation catch-up" commit.

## 1. What must be mirrored

| English change | pt-BR action (same commit) |
| --- | --- |
| Prose, heading, table, admonition, frontmatter `title`/`description`, D2 label, code comment edited or added | Translate the change into `pt-br/<same path>` |
| Formula, code block, JSON key, CLI flag, file name, `import` changed | Apply the identical change to `pt-br/<same path>` (not translated) |
| New page | Create `pt-br/<same path>` with a full translation — never a stub |
| Page deleted or renamed | Delete or rename the pt-br counterpart |
| Link target or heading anchor changed | Update the pt-br link (`/pt-br/` prefix, anchor of the translated heading) |
| Sidebar entry added in `astro.config.mjs` | Add `translations: { "pt-BR": "..." }` to its `label` |
| New Observable Plot label | Add it to `src/components/plot-i18n.ts` |
| New entity card text | Fill both `en` and `pt` in `src/components/entity/entities.ts` |

## 2. How to translate

The guide `src/content/docs/pt-br/_GLOSSARIO-E-CRITERIOS-DA-TRADUCAO.md` is
normative: read it before translating. It fixes the form rules (what is never
translated, link and anchor rules, units, voice, "Novo Modelo" naming), the
approved terminology (SDDP → PDDE, forward/backward pass → simulação
forward/backward, …) and the glossary. Reuse the wording already in the pt-br
page for unchanged context; translate only the delta, keeping the section
structure parallel to the English page.

## 3. Before every commit

1. List the English pages in the commit:
   `git diff --cached --name-only -- src/content/docs ':!src/content/docs/pt-br'`.
2. For each, read the English diff (`git diff --cached -- <file>`) and check the
   pt-br file already carries every change from §1; translate whatever is
   missing and `git add` the pt-br file.
3. Run `npm run check:links` when a link or heading changed (pt-br anchors are
   ASCII-only).

The `PreToolUse` hook `.claude/hooks/check-ptbr-sync.sh` enforces the file-level
part of this: it blocks `git commit` when an English page is staged without its
pt-br counterpart (or a pt-br counterpart is missing or orphaned), or a sidebar
label lacks `pt-BR`, and prints the pairs to fix. The hook only checks that the
pt-br file is in the commit; checking that its content covers the English diff
is your job (§3.2).

**Skipping**: prefix the commit with `PTBR_SYNC_SKIP=1` only when the user
explicitly asks to commit without the translation. Never use it on your own
judgement.

## 4. Lunaria

`/lunaria` marks a pt-br page outdated when its English source has a later
commit. Committing both files together keeps the dashboard green; a
translation-only commit after the English one also works but leaves a window
where the page is reported outdated.
