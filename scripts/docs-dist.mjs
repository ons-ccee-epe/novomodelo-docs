// Where the latest docs build sits inside dist/.
//
// `npm run build:versions` serves the hotsite at the dist/ root and nests every
// documentation version under versions.json latest.base, so the latest docs
// are at dist/docs/. A plain `npm run build` emits the latest docs at the dist/
// root (Astro writes to the outDir root whatever its base). The gates that read
// built pages (check:math, check:e10, i18n-locale.test) call latestDocsDist so
// they read the docs pages after either build.

import { existsSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";

export function latestDocsDist(
  distRoot,
  versionsText = readFileSync(new URL("../versions.json", import.meta.url), "utf8"),
) {
  const segment = JSON.parse(versionsText).latest.base.replace(/^\/+|\/+$/g, "");
  if (segment === "") return distRoot;
  const nested = join(distRoot, segment);
  return existsSync(join(nested, "index.html")) ? nested + sep : distRoot;
}
