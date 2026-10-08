// Contract test for versions.json (ticket-006). Each frozen entry pins `ref`
// to a 40-hex commit SHA on HEAD's history: a branch or tag ref would build and
// silently move a published /vX.Y/ snapshot. latest.novomodelo is deliberately not
// compared with the frozen minors (novomodelo-ref.test.mjs owns latest.novomodelo).
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SLUG = /^v(\d+)\.(\d+)$/;
const SHA = /^[0-9a-f]{40}$/;

function minorKey(slug) {
  const m = SLUG.exec(slug);
  return m && [Number(m[1]), Number(m[2])];
}

function latestProblems(latest) {
  const problems = [];
  if (latest.base !== "/") {
    problems.push(`latest: base ${JSON.stringify(latest.base)} is not "/"`);
  }
  if ("ref" in latest) {
    problems.push("latest: has a ref; latest builds from the working tree");
  }
  if ("slug" in latest) {
    problems.push("latest: has a slug; latest is served at /");
  }
  return problems;
}

function orderProblems(versions) {
  const problems = [];
  const slugs = versions.map((v) => v.slug);
  for (const slug of new Set(slugs)) {
    if (slugs.indexOf(slug) !== slugs.lastIndexOf(slug)) {
      problems.push(`versions: slug ${JSON.stringify(slug)} is not unique`);
    }
  }
  for (let i = 1; i < slugs.length; i++) {
    const prev = minorKey(slugs[i - 1]);
    const next = minorKey(slugs[i]);
    if (prev && next && (next[0] - prev[0] || next[1] - prev[1]) > 0) {
      problems.push(
        `versions: ${slugs[i - 1]} is listed before the newer ${slugs[i]}; sort newest first by [major, minor]`,
      );
    }
  }
  return problems;
}

function entryProblems(v, i, isAncestor) {
  const at = `versions[${i}] ${JSON.stringify(v.slug)}`;
  const problems = [];
  if (!SLUG.test(v.slug)) problems.push(`${at}: slug does not match vX.Y`);
  if (v.label !== v.slug) {
    problems.push(
      `${at}: label ${JSON.stringify(v.label)} does not equal the slug`,
    );
  }
  if (v.base !== `/${v.slug}/`) {
    problems.push(`${at}: base ${JSON.stringify(v.base)} is not "/${v.slug}/"`);
  }
  if (/^(v\d+\.\d+)\.\d+$/.exec(v.novomodelo)?.[1] !== v.slug) {
    problems.push(
      `${at}: novomodelo ${JSON.stringify(v.novomodelo)} is not a ${v.slug}.N release`,
    );
  }
  if (!SHA.test(v.ref)) {
    problems.push(
      `${at}: ref ${JSON.stringify(v.ref)} is not a 40-hex commit SHA; a branch or tag would move the frozen snapshot`,
    );
    return problems;
  }
  try {
    if (!isAncestor(v.ref)) {
      problems.push(`${at}: ref ${v.ref} is not an ancestor of HEAD`);
    }
  } catch (err) {
    problems.push(`${at}: ${err.message}`);
  }
  return problems;
}

function validateVersions(cfg, isAncestor) {
  return [
    ...latestProblems(cfg.latest),
    ...orderProblems(cfg.versions),
    ...cfg.versions.flatMap((v, i) => entryProblems(v, i, isAncestor)),
  ];
}

// `merge-base --is-ancestor` exits 1 for "not an ancestor"; every other
// non-zero exit (unknown object, shallow clone) is a git failure, never a pass.
function gitIsAncestor(repo) {
  return (ref) => {
    const args = ["-C", repo, "merge-base", "--is-ancestor", ref, "HEAD"];
    const r = spawnSync("git", args, { encoding: "utf8" });
    if (r.status === 0) return true;
    if (r.status === 1) return false;
    throw new Error(
      `git ${args.join(" ")} failed: ${r.error?.message ?? `exit ${r.status ?? r.signal}: ${r.stderr.trim()}`}`,
    );
  };
}

const committed = JSON.parse(
  readFileSync(new URL("../versions.json", import.meta.url), "utf8"),
);

test("latest is the working tree at /", () => {
  assert.deepEqual(latestProblems(committed.latest), []);
});

test("versions are unique and newest first", () => {
  assert.deepEqual(orderProblems(committed.versions), []);
});

for (const [i, v] of committed.versions.entries()) {
  test(`${v.slug} is frozen at ${v.base} from a commit on HEAD's history`, () => {
    assert.deepEqual(entryProblems(v, i, gitIsAncestor(REPO_ROOT)), []);
  });
}

function git(cwd, ...args) {
  return execFileSync(
    "git",
    [
      "-C",
      cwd,
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      "user.name=versions-json test",
      "-c",
      "user.email=versions-json@test.invalid",
      ...args,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
}

// Built on first use so a git failure fails only the tests that need the repo.
// after() removes every repo created, a half-built one included.
const tempDirs = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

let fixture;
function tempRepo() {
  if (fixture) return fixture;
  const dir = mkdtempSync(join(tmpdir(), "versions-json-"));
  tempDirs.push(dir);
  git(dir, "init", "-q");
  git(dir, "symbolic-ref", "HEAD", "refs/heads/main");
  git(dir, "commit", "-q", "--allow-empty", "-m", "base");
  const base = git(dir, "rev-parse", "HEAD");
  git(dir, "checkout", "-q", "-b", "side");
  git(dir, "commit", "-q", "--allow-empty", "-m", "side");
  const side = git(dir, "rev-parse", "HEAD");
  git(dir, "checkout", "-q", "main");
  fixture = { dir, base, side };
  return fixture;
}

const ABSENT_SHA = "1234567890abcdef1234567890abcdef12345678";
const anyRefIsAncestor = () => true;

const entry = (slug, ref) => ({
  slug,
  label: slug,
  base: `/${slug}/`,
  ref,
  novomodelo: `${slug}.0`,
});

const config = (...versions) => ({
  latest: { label: "latest", base: "/", novomodelo: "v0.17.0" },
  versions,
});

function assertOneProblem(problems, pattern) {
  assert.equal(problems.length, 1, problems.join("\n"));
  assert.match(problems[0], pattern);
}

test("accepts entries newest first by [major, minor] whose refs are ancestors of HEAD", () => {
  const { dir, base } = tempRepo();
  const cfg = config(entry("v1.0", base), entry("v0.18", base));
  assert.deepEqual(validateVersions(cfg, gitIsAncestor(dir)), []);
});

test("rejects a branch-name ref (main)", () => {
  const cfg = config(entry("v0.17", "main"));
  assertOneProblem(
    validateVersions(cfg, anyRefIsAncestor),
    /ref "main" is not a 40-hex commit SHA/,
  );
});

test("rejects a tag ref (v0.17.0)", () => {
  const cfg = config(entry("v0.17", "v0.17.0"));
  assertOneProblem(
    validateVersions(cfg, anyRefIsAncestor),
    /ref "v0\.17\.0" is not a 40-hex commit SHA/,
  );
});

test("rejects a 39-hex ref", () => {
  const cfg = config(entry("v0.17", ABSENT_SHA.slice(1)));
  assertOneProblem(
    validateVersions(cfg, anyRefIsAncestor),
    /ref "[0-9a-f]{39}" is not a 40-hex commit SHA/,
  );
});

test("rejects a 40-hex commit that is not an ancestor of HEAD", () => {
  const { dir, side } = tempRepo();
  const cfg = config(entry("v0.17", side));
  assertOneProblem(
    validateVersions(cfg, gitIsAncestor(dir)),
    new RegExp(`ref ${side} is not an ancestor of HEAD$`),
  );
});

test("rejects an unknown object as a git failure, not a non-ancestor", () => {
  const { dir } = tempRepo();
  const problems = validateVersions(
    config(entry("v0.17", ABSENT_SHA)),
    gitIsAncestor(dir),
  );
  assertOneProblem(
    problems,
    new RegExp(
      `git -C .+ merge-base --is-ancestor ${ABSENT_SHA} HEAD failed: exit 128: fatal: `,
    ),
  );
  assert.doesNotMatch(problems[0], /not an ancestor/);
});

test("rejects two entries in the wrong order", () => {
  const cfg = config(entry("v0.18", ABSENT_SHA), entry("v1.0", ABSENT_SHA));
  assertOneProblem(
    validateVersions(cfg, anyRefIsAncestor),
    /v0\.18 is listed before the newer v1\.0/,
  );
});

test("rejects an entry missing base", () => {
  const { base: _base, ...noBase } = entry("v0.17", ABSENT_SHA);
  assertOneProblem(
    validateVersions(config(noBase), anyRefIsAncestor),
    /base undefined is not "\/v0\.17\/"/,
  );
});
