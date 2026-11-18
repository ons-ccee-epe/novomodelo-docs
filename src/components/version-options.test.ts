// Mirrors src/components/plot-i18n.test.ts (node:test + node:assert/strict).
import test from "node:test";
import assert from "node:assert/strict";
import {
  englishHome,
  entryLabel,
  normBase,
  versionOptions,
} from "./version-options.ts";

// The shape of versions.json once a bilingual minor is frozen: latest and v0.20
// serve pt-BR at their base and English under en/; v0.19 is English only.
const cfg = {
  latest: {
    label: "latest",
    base: "/docs/",
    novomodelo: "v0.21.0",
    locales: ["pt-br", "en"],
  },
  versions: [
    {
      slug: "v0.20",
      label: "v0.20.0",
      base: "/docs/v0.20/",
      locales: ["pt-br", "en"],
    },
    { slug: "v0.19", label: "v0.19.1", base: "/docs/v0.19/" },
  ],
};

const values = (options: { value: string }[]) => options.map((o) => o.value);
const selected = (options: { value: string; selected: boolean }[]) =>
  options.filter((o) => o.selected).map((o) => o.value);

test("normBase forces a trailing slash and is idempotent", () => {
  assert.equal(normBase("/docs/v0.20/"), "/docs/v0.20/");
  assert.equal(normBase("/docs/v0.20"), "/docs/v0.20/");
  assert.equal(normBase("/"), "/");
});

test("englishHome is the base plus en/ when pt-BR is the root, else the base", () => {
  assert.equal(englishHome(cfg.latest), "/docs/en/");
  assert.equal(englishHome(cfg.versions[0]), "/docs/v0.20/en/");
  assert.equal(englishHome(cfg.versions[1]), "/docs/v0.19/");
  assert.equal(
    englishHome({ label: "v0.19.1", base: "/docs/v0.19", locales: ["en"] }),
    "/docs/v0.19/",
  );
});

test("an English page lists latest, then every frozen version in file order, at its English home", () => {
  const { options } = versionOptions(cfg, "/docs/", false);
  assert.deepEqual(values(options), [
    "/docs/en/",
    "/docs/v0.20/en/",
    "/docs/v0.19/",
  ]);
  assert.deepEqual(
    options.map((o) => o.label),
    ["v0.21.0 (latest)", "v0.20.0", "v0.19.1"],
  );
});

test("a pt-BR page lists only the versions that serve pt-BR, at their bases", () => {
  const { options } = versionOptions(cfg, "/docs/", true);
  assert.deepEqual(values(options), ["/docs/", "/docs/v0.20/"]);
  assert.deepEqual(
    options.map((o) => o.label),
    ["v0.21.0 (mais recente)", "v0.20.0"],
  );
});

test("latest reads as its novomodelo release and a latest tag; a frozen entry reads as its label", () => {
  assert.equal(entryLabel(cfg, cfg.latest, false), "v0.21.0 (latest)");
  assert.equal(entryLabel(cfg, cfg.latest, true), "v0.21.0 (mais recente)");
  assert.equal(entryLabel(cfg, cfg.versions[1], true), "v0.19.1");
});

test("a latest entry without a novomodelo release falls back to its label", () => {
  const bare = { latest: { label: "latest", base: "/docs/" }, versions: [] };
  assert.equal(entryLabel(bare, bare.latest, false), "latest");
});

test("exactly the entry of the build's base is current and selected", () => {
  const atSnapshot = versionOptions(cfg, "/docs/v0.20", false);
  assert.equal(atSnapshot.current, cfg.versions[0]);
  assert.deepEqual(selected(atSnapshot.options), ["/docs/v0.20/en/"]);

  const atLatest = versionOptions(cfg, "/docs/", true);
  assert.equal(atLatest.current, cfg.latest);
  assert.deepEqual(selected(atLatest.options), ["/docs/"]);
});

test("a pt-BR page keeps its own entry even when versions.json gives it no pt-BR locale", () => {
  const { options } = versionOptions(cfg, "/docs/v0.19/", true);
  assert.deepEqual(values(options), ["/docs/", "/docs/v0.20/", "/docs/v0.19/"]);
  assert.deepEqual(selected(options), ["/docs/v0.19/"]);
});

test("a base no entry names falls back to latest as the current entry", () => {
  const { current, options } = versionOptions(cfg, "/elsewhere/", false);
  assert.equal(current, cfg.latest);
  assert.deepEqual(selected(options), []);
});

test("a lone pt-BR version leaves a single option, so the picker renders no select", () => {
  const ptOnlyLatest = {
    latest: cfg.latest,
    versions: [cfg.versions[1]],
  };
  assert.equal(versionOptions(ptOnlyLatest, "/docs/", true).options.length, 1);
});
