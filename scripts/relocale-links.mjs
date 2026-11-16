// Link codemod for the locale URLs: pt-BR pages are served at the docs root
// and English pages under /en/ (scripts/locale-id.mjs), so a root-relative page
// link written in a source has to match its page's locale. In every file a
// /pt-br/<p> target becomes /<p>; in an English file a /<p> target whose <p>
// is an English page slug (or empty, the home) becomes /en/<p>. Assets, other
// paths, external, relative and fragment-only links are left alone, as is
// everything inside a fenced code block. A second run rewrites nothing.
//
// CLI: `node scripts/relocale-links.mjs` rewrites every .md/.mdx file under
// src/content/docs/ in place, partials included (an _impl/ partial sits in its
// page's locale directory), and prints the counts. Re-run it on a branch that
// still carries old-form links after rebasing.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defaultSlug } from "./locale-id.mjs";

// Where a page link is written: an inline Markdown link (a title may follow),
// a reference definition, an href attribute, the href property of an MDX
// object literal (the entity pages' link lists), a frontmatter `link:` line.
// Group 1 is everything before the target, group 2 the root-relative target.
const LINK_PATTERNS = [
  /(\]\()(\/[^\s)]*)/g,
  /(^\s*\[[^\]]+\]:\s+)(\/\S*)/g,
  /(\shref=["'])(\/[^"'\s]*)/g,
  /(\bhref:\s*["'`])(\/[^"'`\s]*)/g,
  /(^\s*link:\s+)(\/\S*)/g,
];
const FENCE = /^\s*(```|~~~)/;
const PT_PREFIX = /^\/pt-br(?=$|[/?#])/;

function relocateTarget(target, locale, enSlugs) {
  if (PT_PREFIX.test(target)) {
    const rest = target.replace(PT_PREFIX, "");
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  if (locale !== "en") return target;
  const [, path, tail] = /^\/([^?#]*)(.*)$/s.exec(target);
  const key = path.replace(/\/$/, "");
  return key === "" || enSlugs.has(key) ? `/en/${path}${tail}` : target;
}

export function relocaleLinks(text, { locale, enSlugs }) {
  let rewritten = 0;
  let inFence = false;
  const lines = text.split("\n").map((line) => {
    if (FENCE.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    return LINK_PATTERNS.reduce(
      (out, pattern) =>
        out.replace(pattern, (whole, lead, target) => {
          const next = relocateTarget(target, locale, enSlugs);
          if (next === target) return whole;
          rewritten += 1;
          return `${lead}${next}`;
        }),
      line,
    );
  });
  return { text: lines.join("\n"), rewritten };
}

function main() {
  const root = fileURLToPath(new URL("../src/content/docs/", import.meta.url));
  const files = readdirSync(root, { recursive: true })
    .map((p) => p.split(sep).join("/"))
    .filter((p) => /\.(md|mdx)$/.test(p))
    .sort();
  const isPt = (p) => p.startsWith("pt-br/");
  const enSlugs = new Set(
    files
      .filter((p) => !isPt(p) && !p.split("/").at(-1).startsWith("_"))
      .map(defaultSlug),
  );
  const counts = { en: 0, "pt-BR": 0 };
  let changed = 0;
  for (const p of files) {
    const locale = isPt(p) ? "pt-BR" : "en";
    const out = relocaleLinks(readFileSync(root + p, "utf8"), {
      locale,
      enSlugs,
    });
    if (out.rewritten === 0) continue;
    writeFileSync(root + p, out.text);
    changed += 1;
    counts[locale] += out.rewritten;
  }
  const total = counts.en + counts["pt-BR"];
  console.log(
    `relocale-links: ${total} links rewritten in ${changed} files (en ${counts.en}, pt-BR ${counts["pt-BR"]})`,
  );
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
