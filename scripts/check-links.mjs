// Internal link-check gate (E3 ticket-016, the epic's exit gate; extended by
// drift-remediation ticket-002 to also resolve #fragment anchors).
//
// Tickets 013/014/015 rewrote every cross-chapter mdBook link to a Starlight
// root-relative slug (e.g. `[…](/math/cut-management)`) but deliberately deferred
// broken-link detection to this script. It proves, mechanically and with no new
// dependency, that every internal link in the BUILT corpus resolves to a real
// page AND, when the link carries a `#fragment`, to a real heading id on that
// page: it walks `dist/**/*.html`, extracts every `href`, skips the links that
// are not internal page links (external / mailto / protocol-relative / asset),
// and asserts each remaining target maps to a file Astro actually emitted —
// then, for any `#fragment`, that the fragment matches an `id`/`name` attribute
// emitted on the target page. A pure in-page link (`#foo`) is resolved against
// the SOURCE page's own ids, not skipped — it is a real intra-page link.
//
// Why a static-HTML crawl (not lychee/linkinator): the corpus links are entirely
// internal root-relative slugs, so no network crawler and no running server is
// needed — this keeps the zero-new-dependency, plain-Node convention of
// check-math-parity.mjs and build-versions.mjs, and runs straight over `dist/`.
//
// Resolution model (Starlight emits directory-style URLs): a slug `/math/x`
// resolves to `dist/math/x/index.html`. Links appear both with and without a
// trailing slash and may carry a `#fragment`/`?query`, the latter stripped
// before page resolution. `/` is the landing page → `dist/index.html`. The build
// `base` (DOCS_BASE) is honoured: an absolute href carrying the base prefix has
// it stripped before resolving against `dist/`. The whole tree is walked, so
// the links on the pt-BR pages at the docs root and on the English pages under
// `en/` are validated alike (intentional — not special-cased).
// Anchor ids are read directly from each target file's emitted HTML (github-
// slugger's output), never re-derived from heading text.
//
// Run AFTER `npm run build`. Exits 0 when every internal link AND every
// `#fragment` resolves; exits 1 listing each unresolved link as
// `<source-html> -> <href>`, marking a resolved-page-but-missing-fragment case
// as `<source-html> -> <href> (missing #fragment)`, or with a build-first
// message when `dist/` is absent.
//
// Link policy: a link can resolve and still break the reading path. Every
// `<a href>` on a page of the latest docs also fails when its target is a
// redirect stub (`<source-html> -> <href> (links to a redirect stub)`) or a page
// whose `<html lang>` differs from the source's (`<source-html> -> <href>
// (crosses language: en → pt-BR)`). Redirect stubs, the frozen snapshots under
// each versions.json `versions[].base` and the Lunaria dashboard, which lists
// both locales by design, are exempt as sources and as targets. `<link>` tags
// (hreflang alternates, canonical) are not `<a>` links and are not checked.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { latestDocsDist } from "./docs-dist.mjs";

const distRoot = fileURLToPath(new URL("../dist/", import.meta.url));

// The build `base` (Architecture B: e.g. "/v0.8/"). Absolute hrefs are emitted
// with this prefix, so it is stripped before resolving against dist/. Normalised
// to a leading-and-trailing-slash form ("/" stays "/").
const rawBase = process.env.DOCS_BASE ?? "/";
const base = `/${rawBase.replace(/^\/+|\/+$/g, "")}/`.replace(/\/{2,}/g, "/");

// Asset extensions: links to these are static files, not pages, and are out of
// scope for the page-resolution check (they are emitted/copied by Astro, not
// content slugs).
const ASSET_EXT = new Set([
  ".svg",
  ".css",
  ".js",
  ".mjs",
  ".map",
  ".json",
  ".xml",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".pdf",
  ".zip",
]);

// Matches an `id="..."`/`name="..."` attribute, anchored to the preceding
// whitespace so a hyphenated attribute like `data-id="..."` is never mistaken
// for a plain `id`. Raw text, no entity-decoding — matches the id exactly as
// Starlight/github-slugger emits it.
const ANCHOR_ATTR_PATTERN = /\s(?:id|name)="([^"]*)"/g;

// Pure helper: the Set of every id/name attribute value found in `html`.
// Exported for the node:test fixture.
export function extractAnchors(html) {
  const anchors = new Set();
  for (const match of html.matchAll(ANCHOR_ATTR_PATTERN)) {
    anchors.add(match[1]);
  }
  return anchors;
}

const HTML_LANG_PATTERN = /<html\b[^>]*\slang="([^"]*)"/i;
const REFRESH_META_PATTERN = /<meta\b[^>]*\shttp-equiv=(["'])refresh\1/i;

// The `lang` attribute of the page's <html> element, or null when it has none.
export function htmlLang(html) {
  return HTML_LANG_PATTERN.exec(html)?.[1] ?? null;
}

// True for a redirect stub: an Astro `redirects` page or a build:versions stub,
// both a <meta http-equiv="refresh">.
export function isRedirectStub(html) {
  return REFRESH_META_PATTERN.test(html);
}

// Why a link whose target exists still fails: it lands on a redirect stub, or
// on a page in another language. null when it does neither.
export function linkPolicy(sourceHtml, targetHtml) {
  if (isRedirectStub(targetHtml)) return "redirect-stub";
  const from = htmlLang(sourceHtml);
  const to = htmlLang(targetHtml);
  if (from !== null && to !== null && from !== to) return "crosses-language";
  return null;
}

// Recursively collect every .html file under dist/ (shape mirrors
// check-math-parity.mjs's collectSourceFiles walker). The whole tree is walked,
// both locales and every version included, so links on every built page are
// checked.
function collectHtmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(`${full}/`));
    } else if (entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

// True for links that are NOT internal page links and must be skipped:
// external schemes, protocol-relative, empty hrefs, and asset files. A
// `#fragment` (page-relative or pure in-page) is never skipped here — it is
// routed to fragment resolution in the main loop.
function shouldSkip(href) {
  if (href === "") return true;
  if (href.startsWith("//")) return true; // protocol-relative (external)
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return true; // http:, https:, mailto:, tel:, …
  const ext = path.extname(href.split(/[?#]/, 1)[0]).toLowerCase();
  if (ASSET_EXT.has(ext)) return true;
  return false;
}

// Resolve an internal href to its dist/ file, honouring directory-style URLs.
// Returns the resolved absolute path on success, or null if no candidate exists.
// `sourceFile` is the absolute path of the HTML page the href was found in, used
// to resolve relative (non-leading-slash) links against the page's directory.
function resolveTarget(href, sourceFile) {
  // Strip query and fragment.
  let pathname = href.split(/[?#]/, 1)[0];

  let abs;
  if (pathname.startsWith("/")) {
    // Root-relative: strip the build base prefix, then resolve under dist/.
    if (base !== "/" && pathname.startsWith(base)) {
      pathname = "/" + pathname.slice(base.length);
    } else if (base !== "/" && pathname === base.slice(0, -1)) {
      // Href equals the base without its trailing slash (e.g. "/v0.8").
      pathname = "/";
    }
    abs = path.join(distRoot, "." + pathname);
  } else {
    // Relative link: resolve against the source page's directory.
    abs = path.resolve(path.dirname(sourceFile), pathname);
  }

  // Candidate forms, in order: directory-style index.html, an .html sibling, the
  // literal path as a file. `/` (→ distRoot) is covered by the index.html form.
  const candidates = [path.join(abs, "index.html"), `${abs}.html`, abs];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

// --- Main (run only when invoked directly, not when imported by a test) ------
// Walk dist/, collect failures, print, and exit. Kept behind a direct-run guard
// so importing this module for `extractAnchors` (the node:test fixture) does
// NOT trigger the crawl or process.exit.
function main() {
  if (!existsSync(distRoot)) {
    console.error(
      "check:links: dist/ not found — run `npm run build` before `npm run check:links`.",
    );
    process.exit(1);
  }

  const htmlFiles = collectHtmlFiles(distRoot).sort();
  const hrefPattern = /href="([^"]*)"/g;
  const failures = [];
  // Anchor ids per resolved file path, parsed once per file no matter how many
  // hrefs target it.
  const anchorCache = new Map();
  function anchorsFor(filePath, html) {
    let anchors = anchorCache.get(filePath);
    if (anchors === undefined) {
      anchors = extractAnchors(html ?? readFileSync(filePath, "utf8"));
      anchorCache.set(filePath, anchors);
    }
    return anchors;
  }

  let linksChecked = 0;
  let fragmentsChecked = 0;
  let policyChecked = 0;

  // Paths, relative to dist/, exempt from the link policy: the frozen snapshots
  // and the Lunaria dashboard of the latest docs ("" or "docs/" as its root).
  const versions = JSON.parse(
    readFileSync(new URL("../versions.json", import.meta.url), "utf8"),
  );
  const latestRel = latestDocsDist(distRoot).slice(distRoot.length);
  const exemptPrefixes = [
    ...versions.versions.map((v) => v.base.replace(/^\/+/, "")),
    `${latestRel}lunaria/`,
  ];
  const isExempt = (relPath) =>
    exemptPrefixes.some((prefix) => relPath.startsWith(prefix));
  const htmlCache = new Map();
  function htmlFor(filePath) {
    let html = htmlCache.get(filePath);
    if (html === undefined) {
      html = readFileSync(filePath, "utf8");
      htmlCache.set(filePath, html);
    }
    return html;
  }
  const anchorHrefPattern = /<a\b[^>]*?\shref="([^"]*)"/g;

  for (const sourceFile of htmlFiles) {
    const html = readFileSync(sourceFile, "utf8");
    const rel = sourceFile.slice(distRoot.length);
    for (const match of html.matchAll(hrefPattern)) {
      const href = match[1];
      if (shouldSkip(href)) continue;
      linksChecked += 1;

      const hashIndex = href.indexOf("#");
      const fragment = hashIndex === -1 ? null : href.slice(hashIndex + 1);

      if (href.startsWith("#")) {
        // Pure in-page fragment: resolve against the SOURCE page's own ids.
        fragmentsChecked += 1;
        if (!anchorsFor(sourceFile, html).has(fragment)) {
          failures.push({ source: rel, href, missingFragment: true });
        }
        continue;
      }

      const target = resolveTarget(href, sourceFile);
      if (target === null) {
        failures.push({ source: rel, href });
        continue;
      }
      if (fragment !== null) {
        fragmentsChecked += 1;
        if (!anchorsFor(target).has(fragment)) {
          failures.push({ source: rel, href, missingFragment: true });
        }
      }
    }

    if (isExempt(rel) || isRedirectStub(html)) continue;
    for (const match of html.matchAll(anchorHrefPattern)) {
      const href = match[1];
      if (shouldSkip(href) || href.startsWith("#")) continue;
      const target = resolveTarget(href, sourceFile);
      if (target === null || !target.endsWith(".html")) continue;
      if (isExempt(target.slice(distRoot.length))) continue;
      policyChecked += 1;
      const targetHtml = htmlFor(target);
      const policy = linkPolicy(html, targetHtml);
      if (policy !== null) {
        failures.push({
          source: rel,
          href,
          policy,
          from: htmlLang(html),
          to: htmlLang(targetHtml),
        });
      }
    }
  }

  if (failures.length > 0) {
    console.error(
      `check:links: ${failures.length} broken internal link(s) across ${htmlFiles.length} HTML file(s):\n`,
    );
    for (const f of failures) {
      const suffix = f.missingFragment
        ? " (missing #fragment)"
        : f.policy === "redirect-stub"
          ? " (links to a redirect stub)"
          : f.policy === "crosses-language"
            ? ` (crosses language: ${f.from} → ${f.to})`
            : "";
      console.error(`  ${f.source} -> ${f.href}${suffix}`);
    }
    process.exit(1);
  }

  console.log(
    `check:links: ${htmlFiles.length} HTML files crawled, ${linksChecked} internal links checked, ${fragmentsChecked} fragments checked, ${policyChecked} page links checked for language and redirects, 0 broken.`,
  );
  process.exit(0);
}

// Run when executed as `node scripts/check-links.mjs`; stay inert when
// imported (the comparison holds because Node sets argv[1] to the entry script).
// `argv[1]` is absent when loaded via `node -e`/an importer with no entry file,
// so guard before pathToFileURL — an import context is never a direct run.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
