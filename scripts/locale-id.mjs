// Content ids of the docs collection (src/content.config.ts). The sources keep
// English at the root of src/content/docs/ and pt-BR in pt-br/; the ids serve
// pt-BR at the docs root and English under en/. Apart from that prefix, an id
// is Astro's default glob id, so only the URLs depend on this mapping.
import { slug } from "github-slugger";

const PT_DIR = "pt-br/";

// Astro's default glob id for a path relative to src/content/docs/: the
// extension removed, each segment slugged by github-slugger, a trailing
// /index dropped.
export function defaultSlug(entry) {
  return entry
    .replace(/\.[^./]+$/, "")
    .split("/")
    .map((segment) => slug(segment))
    .join("/")
    .replace(/\/index$/, "");
}

// The content id, and so the URL, of a source path relative to
// src/content/docs/: pt-br/<rest> is served as <rest>, any other <rest> as
// en/<rest>, and the two index.mdx home pages as "index" and "en".
export function localeId(entry) {
  if (entry.startsWith(PT_DIR)) return defaultSlug(entry.slice(PT_DIR.length));
  const id = defaultSlug(entry);
  return id === "index" ? "en" : `en/${id}`;
}
