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
//   • a redirect stub at every page path of the docs tree with the base
//     removed: dist/<p>/index.html sends /<p>/ to <base><p>/, query and
//     fragment included, which keeps the links into the docs from when they
//     were served at "/" (and /vX.Y/ for a frozen version) working.
//
// Nothing is overwritten: a hotsite or public/ entry that already exists at the
// root, or a stub whose index.html already exists, fails the build.

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

export function legacyPagePaths(docsDir) {
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

  const paths = legacyPagePaths(docsDir);
  for (const p of paths) {
    const stub = join(dist, p, "index.html");
    if (existsSync(stub)) {
      throw new Error(
        `build:versions: the redirect stub for /${p}/ would overwrite dist/${p}/index.html`,
      );
    }
    mkdirSync(join(dist, p), { recursive: true });
    writeFileSync(stub, redirectStubHtml(`/${segment}/${p}/`));
  }
  return { stubs: paths.length };
}
