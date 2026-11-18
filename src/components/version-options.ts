// Option logic of VersionPicker.astro, kept out of the component so
// version-options.test.ts can test it.
//
// `locales` on a versions.json entry lists the locales its build serves, root
// locale first: ["pt-br", "en"] serves pt-BR at `base` and English at
// `base` + "en/"; an absent `locales` means English only, at `base`.

export interface VersionEntry {
  label: string;
  base: string;
  novomodelo?: string;
  locales?: string[];
}

export interface VersionsConfig {
  latest: VersionEntry;
  versions: VersionEntry[];
}

export interface VersionOption {
  value: string;
  label: string;
  selected: boolean;
}

export const normBase = (b: string): string => (b.endsWith("/") ? b : b + "/");

const servesPtBr = (v: VersionEntry): boolean =>
  v.locales?.includes("pt-br") ?? false;

export const englishHome = (v: VersionEntry): string =>
  v.locales?.[0] === "pt-br" ? `${normBase(v.base)}en/` : normBase(v.base);

// How the picker names an entry: latest reads as the novomodelo release it
// documents plus a latest tag, and a frozen entry reads as its label.
export function entryLabel(
  cfg: VersionsConfig,
  v: VersionEntry,
  pt: boolean,
): string {
  if (v !== cfg.latest || !v.novomodelo) return v.label;
  return `${v.novomodelo} (${pt ? "mais recente" : "latest"})`;
}

// The entry of the build at `baseUrl` is current (latest when none matches).
// An English page lists every version at its English home; a pt-BR page lists
// the versions that serve pt-BR, at their base, and always its own.
export function versionOptions(
  cfg: VersionsConfig,
  baseUrl: string,
  pt: boolean,
): { current: VersionEntry; options: VersionOption[] } {
  const here = normBase(baseUrl);
  const all = [cfg.latest, ...cfg.versions];
  const isHere = (v: VersionEntry): boolean => normBase(v.base) === here;
  const current = all.find(isHere) ?? cfg.latest;
  const shown = pt ? all.filter((v) => isHere(v) || servesPtBr(v)) : all;
  const options = shown.map((v) => ({
    value: pt ? normBase(v.base) : englishHome(v),
    label: entryLabel(cfg, v, pt),
    selected: isHere(v),
  }));
  return { current, options };
}
