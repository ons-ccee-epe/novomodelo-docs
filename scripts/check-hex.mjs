// Hex-colour gate (docs/design/design-system.md §2 and §10).
//
// The design system keeps every colour of the docs site in one file,
// src/styles/tokens.css. This gate fails when a hex colour appears anywhere
// else in the styles, the components or the pages, so a new colour has to go
// through the tokens (and the design-system document) first.
//
// What is read, and what counts as a hex colour:
//   src/styles/**/*.css, src/components/**/*.{css,astro,ts}
//       every `#rgb`, `#rrggbb` or `#rrggbbaa` outside comments
//       (`/* */`, `//`, `<!-- -->`). tokens.css is the one file exempt.
//   src/content/docs/**/*.{md,mdx}
//       inside a ```d2 fence: every hex, which must be one of the four element
//       hues of design-system.md §10 (D2_ELEMENT_HUES);
//       outside fences: a hex in a colour position only (after a quote, `=`,
//       or `:`), so heading anchors such as `/#23a-sampling` are not colours.
//
// It also compares the tokens with the hotsite (D7): a custom property that
// both src/styles/tokens.css and hotsite/style.css declare on :root must hold
// the same value, so a new designer version of the hotsite that changes a
// token fails here until tokens.css follows it.
//
// An exception, if one is ever needed, goes in scripts/hex-allow.txt (absent
// today), one `path<TAB>hex<TAB>reason` per line. A stale exception (no longer
// found) is reported too, so the file shrinks with the code.
//
// Exports `findHexes(text, path)`, `checkFiles(files, allow)` and
// `parseAllow(text)` behind a direct-run guard.
//
// Run any time (reads sources, no build needed):
//   node scripts/check-hex.mjs [--root <dir>]

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const TOKENS_FILE = "src/styles/tokens.css";
export const D2_ELEMENT_HUES = new Set(["#3378a3", "#9b6719", "#5d7c2f", "#c7463d"]);

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g;
const HEX_IN_COLOUR_POSITION =
  /(?<=["'=:]\s*)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g;

/** Blank out comments, keeping newlines so line numbers survive. */
function stripComments(text, path) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  let out = text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank);
  if (!path.endsWith(".css")) {
    // `//` line comments, but not the `//` of a URL scheme (`https://`).
    out = out.replace(/(^|[^:"'`])\/\/[^\n]*/g, (m, pre) => pre + blank(m.slice(pre.length)));
  }
  return out;
}

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

/**
 * Hex colours of one file, as `{ line, hex, inD2 }` (hex lower-cased).
 * @param {string} text
 * @param {string} path repo-relative, forward slashes
 */
export function findHexes(text, path) {
  const hits = [];
  if (/\.mdx?$/.test(path)) {
    const lines = text.split("\n");
    let inD2 = false;
    let inFence = false;
    lines.forEach((line, i) => {
      const fence = line.match(/^\s*(```+|~~~+)\s*([\w-]*)/);
      if (fence) {
        if (!inFence) {
          inFence = true;
          inD2 = fence[2] === "d2";
        } else {
          inFence = false;
          inD2 = false;
        }
        return;
      }
      if (inFence && !inD2) return;
      const re = inD2 ? HEX : HEX_IN_COLOUR_POSITION;
      for (const m of line.matchAll(re)) {
        hits.push({ line: i + 1, hex: m[0].toLowerCase(), inD2 });
      }
    });
    return hits;
  }
  const clean = stripComments(text, path);
  for (const m of clean.matchAll(HEX)) {
    hits.push({ line: lineOf(clean, m.index), hex: m[0].toLowerCase(), inD2: false });
  }
  return hits;
}

/**
 * Custom properties declared in the first `:root { … }` block of a stylesheet,
 * values normalised (lower case, single spaces), comments ignored.
 * @param {string} css
 */
export function rootTokens(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const block = clean.match(/:root\s*\{([\s\S]*?)\}/);
  const tokens = new Map();
  if (!block) return tokens;
  for (const m of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    // `0.14` and `.14` are the same number: drop a leading zero before comparing
    // and `rgba(0,0,0,.5)` is `rgba(0, 0, 0, .5)`: one space after each comma
    const value = m[2]
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\s*,\s*/g, ", ")
      .toLowerCase()
      .replace(/(^|[^\d.])0\.(\d)/g, "$1.$2");
    tokens.set(m[1], value);
  }
  return tokens;
}

/**
 * D7: a token both files declare must hold the same value, so the docs and
 * the hotsite cannot drift apart (design-system.md §9, D7).
 * @param {string} docsTokensCss  src/styles/tokens.css
 * @param {string} hotsiteCss     hotsite/style.css
 */
export function checkHotsiteSync(docsTokensCss, hotsiteCss) {
  const docs = rootTokens(docsTokensCss);
  const hot = rootTokens(hotsiteCss);
  const problems = [];
  for (const [name, value] of docs) {
    if (hot.has(name) && hot.get(name) !== value) {
      problems.push(
        `check:hex: HOTSITE-DRIFT ${name} is ${value} in ${TOKENS_FILE} but ${hot.get(name)} in hotsite/style.css`,
      );
    }
  }
  return problems;
}

/** @param {string} text */
export function parseAllow(text) {
  const allow = new Map();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [path, hex] = line.split("\t");
    if (!path || !hex) continue;
    const key = `${path}\t${hex.toLowerCase()}`;
    allow.set(key, false);
  }
  return allow;
}

/**
 * @param {{ path: string, text: string }[]} files
 * @param {Map<string, boolean>} allow  key `path\thex`, value = seen
 * @returns {string[]} problems
 */
export function checkFiles(files, allow) {
  const problems = [];
  for (const { path, text } of files) {
    if (path === TOKENS_FILE) continue;
    for (const { line, hex, inD2 } of findHexes(text, path)) {
      const key = `${path}\t${hex}`;
      if (allow.has(key)) {
        allow.set(key, true);
        continue;
      }
      if (inD2) {
        if (!D2_ELEMENT_HUES.has(hex)) {
          problems.push(`check:hex: NOT-AN-ELEMENT-HUE ${path}:${line} ${hex} (d2 fences take only the §10 element hues)`);
        }
        continue;
      }
      problems.push(`check:hex: HEX-OUTSIDE-TOKENS ${path}:${line} ${hex} (use a token from ${TOKENS_FILE})`);
    }
  }
  for (const [key, seen] of allow) {
    if (!seen) {
      const [path, hex] = key.split("\t");
      problems.push(`check:hex: STALE-EXCEPTION ${path} ${hex} (remove it from scripts/hex-allow.txt)`);
    }
  }
  return problems;
}

function walk(dir, exts) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(walk(full, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf("--root");
  const root = rootIdx >= 0 ? args[rootIdx + 1] : fileURLToPath(new URL("..", import.meta.url));
  const paths = [
    ...walk(join(root, "src", "styles"), [".css"]),
    ...walk(join(root, "src", "components"), [".css", ".astro", ".ts"]),
    ...walk(join(root, "src", "content", "docs"), [".md", ".mdx"]),
  ].filter((p) => !p.endsWith(".test.ts"));
  const files = paths.map((p) => ({
    path: relative(root, p).split(sep).join("/"),
    text: readFileSync(p, "utf8"),
  }));
  let allowText = "";
  try {
    allowText = readFileSync(join(root, "scripts", "hex-allow.txt"), "utf8");
  } catch {
    // no exceptions file: every hit is a problem
  }
  const problems = checkFiles(files, parseAllow(allowText));
  const tokensFile = files.find((f) => f.path === TOKENS_FILE);
  let hotsiteCss = "";
  try {
    hotsiteCss = readFileSync(join(root, "hotsite", "style.css"), "utf8");
  } catch {
    // no hotsite in this checkout: nothing to compare
  }
  if (tokensFile && hotsiteCss) problems.push(...checkHotsiteSync(tokensFile.text, hotsiteCss));
  if (problems.length) {
    process.stdout.write(`FAIL: ${problems.length} problem(s)\n${problems.join("\n")}\n`);
    process.exit(1);
  }
  process.stdout.write(`check:hex: OK (${files.length} files)\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
