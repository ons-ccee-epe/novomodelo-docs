// Testable helpers for the landing step of build-versions.mjs.
//
// The site root serves the hotsite (hotsite/: plain HTML, CSS and JavaScript,
// not built by Astro) and every documentation version lives under
// versions.json latest.base ("/docs/"). Once every version is assembled under
// that base, assembleLanding fills the root of dist/:
//
//   • the hotsite, without its maintainer README.txt;
//   • the docs 404 page as dist/404.html, the page GitHub Pages serves for any
//     missing path (its asset URLs already carry the docs base);
//   • the files of public/ except the astro-d2 render cache, so a static URL
//     keeps its root path, among them /schemas/<name>.schema.json, the $id of
//     each vendored input schema;
//   • a redirect stub at every pt-BR page path under pt-br/ of the latest
//     docs: <base>pt-br/<p>/ goes to <base><p>/, where pt-BR is served (the
//     root locale), and <base>pt-br/ to <base>;
//   • a redirect stub at the path the docs had when they were served at "/":
//     /<p>/ goes to <base>en/<p>/ for an English page, so those links stay in
//     English, and to <base><p>/ for every other page (a frozen /vX.Y/ page,
//     the Lunaria dashboard). The /en/ and /pt-br/ paths never existed at "/"
//     and get no root stub.
//
// Every stub keeps the query and fragment. Nothing is overwritten: a hotsite or
// public/ entry that already exists at the root, or a stub whose index.html
// already exists, fails the build.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, relative, sep } from "node:path";

const HOTSITE_EXCLUDE = new Set(["README.txt"]);
const PUBLIC_EXCLUDE = new Set(["d2"]);

const escapeHtml = (s) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export function redirectStubHtml(target) {
  const url = encodeURI(target);
  const attr = escapeHtml(url);
  const js = JSON.stringify(url).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0;url=${attr}">
<title>Redirecting to ${attr}</title>
<script>location.replace(${js} + location.search + location.hash)</script>
</head>
<body><p>This page moved to <a href="${attr}">${attr}</a>.</p></body>
</html>
`;
}

// Every page directory of the docs tree, relative to it, the docs root
// excluded ("math/x" for docs/math/x/index.html).
function pageDirs(docsDir) {
  const paths = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (entry.name === "index.html" && dir !== docsDir) {
        paths.push(relative(docsDir, dir).split(sep).join("/"));
      }
    }
  };
  walk(docsDir);
  return paths;
}

// The /pt-br/ stubs of the latest docs: pt-br/<p> -> /<segment>/<p>/ for each
// pt-BR page <p> whose English page en/<p> exists, and pt-br -> /<segment>/.
export function localeRedirects(docsDir, segment) {
  const dirs = new Set(pageDirs(docsDir));
  const redirects = [];
  if (existsSync(join(docsDir, "index.html")) && dirs.has("en")) {
    redirects.push({ path: "pt-br", target: `/${segment}/` });
  }
  for (const dir of dirs) {
    if (!dir.startsWith("en/")) continue;
    const page = dir.slice("en/".length);
    if (dirs.has(page)) {
      redirects.push({ path: `pt-br/${page}`, target: `/${segment}/${page}/` });
    }
  }
  return redirects;
}

// The root stubs for the URLs the docs had at "/": an English page en/<p>
// keeps /<p>/ in English; any other page <p> that is not pt-BR (its root path
// is the English page's) or a /pt-br/ stub goes to /<segment>/<p>/.
export function legacyRedirects(docsDir, segment) {
  const dirs = new Set(pageDirs(docsDir));
  const redirects = [];
  for (const dir of dirs) {
    if (dir === "en" || dir === "pt-br" || dir.startsWith("pt-br/")) continue;
    if (dir.startsWith("en/")) {
      redirects.push({
        path: dir.slice("en/".length),
        target: `/${segment}/${dir}/`,
      });
    } else if (!dirs.has(`en/${dir}`)) {
      redirects.push({ path: dir, target: `/${segment}/${dir}/` });
    }
  }
  return redirects;
}

function writeStubs(dist, root, label, redirects) {
  for (const { path, target } of redirects) {
    const stub = join(root, path, "index.html");
    if (existsSync(stub)) {
      throw new Error(
        `build:versions: the redirect stub for ${label}${path}/ would overwrite dist/${relative(dist, stub).split(sep).join("/")}`,
      );
    }
    mkdirSync(join(root, path), { recursive: true });
    writeFileSync(stub, redirectStubHtml(target));
  }
}

function copyEntries(fromDir, dist, exclude, label) {
  for (const name of readdirSync(fromDir)) {
    if (exclude.has(name)) continue;
    const dest = join(dist, name);
    if (existsSync(dest)) {
      throw new Error(
        `build:versions: ${label} entry "${name}" would overwrite dist/${name}`,
      );
    }
    cpSync(join(fromDir, name), dest, { recursive: true });
  }
}

export function assembleLanding({ dist, docsBase, hotsiteDir, publicDir }) {
  const segment = docsBase.replace(/^\/+|\/+$/g, "");
  if (segment === "") {
    throw new Error(
      'build:versions: versions.json latest.base is "/", which leaves no root for the hotsite',
    );
  }
  const docsDir = join(dist, segment);

  copyEntries(hotsiteDir, dist, HOTSITE_EXCLUDE, "hotsite/");
  copyEntries(publicDir, dist, PUBLIC_EXCLUDE, "public/");

  const notFound = join(dist, "404.html");
  if (existsSync(notFound)) {
    throw new Error("build:versions: dist/404.html already exists");
  }
  cpSync(join(docsDir, "404.html"), notFound);

  const legacy = legacyRedirects(docsDir, segment);
  const locale = localeRedirects(docsDir, segment);
  writeStubs(dist, docsDir, `/${segment}/`, locale);
  writeStubs(dist, dist, "/", legacy);
  return { stubs: legacy.length, localeStubs: locale.length };
}
