// Heading ids without diacritics.
//
// Heading ids follow the heading text (github-slugger, via Astro's
// rehypeHeadingIds), so a pt-BR heading such as "Recusas da biblioteca
// histórica" gets the id `recusas-da-biblioteca-histórica`, which the address
// bar and shared links show percent-encoded (`hist%C3%B3rica`). This plugin runs
// the same rehypeHeadingIds first, so every id is computed exactly as Astro and
// Starlight compute it, then strips the diacritics from the ids it generated:
// `histórica` → `historica`, `não` → `nao`, `caça` → `caca`. English ids carry
// no diacritics and come out unchanged. Letters with no decomposition (β, σ)
// stay. An id written explicitly in the source is kept as written. A collision
// that stripping creates within a page gets a `-1`, `-2`… suffix.
//
// Register it in `markdown.processor` `rehypePlugins` (astro.config.mjs).
// Starlight's own rehypeHeadingIds runs later and assigns an id only to a
// heading without one, so the table of contents and the heading anchor links
// use these ids. pt-BR link fragments in the sources are written the same way
// (see the translation guide, .claude/rules/glossario-traducao-ptbr.md).
import { rehypeHeadingIds } from "@astrojs/markdown-remark";

const HEADING = /^h[1-6]$/;

// Depth-first, document-order walk over the element nodes of a hast tree.
function eachElement(node, fn) {
  if (node.type === "element") fn(node);
  for (const child of node.children ?? []) eachElement(child, fn);
}

/** NFD-decompose `s` and drop the combining marks (accents, tilde, cedilla). */
export function stripDiacritics(s) {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

export default function rehypeAsciiHeadingIds() {
  const assignIds = rehypeHeadingIds();
  return function transformer(tree, file) {
    const generated = new Set();
    eachElement(tree, (node) => {
      if (HEADING.test(node.tagName) && typeof node.properties?.id !== "string") {
        generated.add(node);
      }
    });
    assignIds(tree, file);

    const used = new Set();
    eachElement(tree, (node) => {
      if (HEADING.test(node.tagName) && !generated.has(node)) used.add(node.properties.id);
    });
    eachElement(tree, (node) => {
      if (!generated.has(node)) return;
      const base = stripDiacritics(node.properties.id);
      let id = base;
      for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      node.properties.id = id;
    });

    const headings = file.data?.astro?.headings;
    if (Array.isArray(headings)) {
      let i = 0;
      eachElement(tree, (node) => {
        if (HEADING.test(node.tagName) && headings[i]) headings[i++].slug = node.properties.id;
      });
    }
  };
}
