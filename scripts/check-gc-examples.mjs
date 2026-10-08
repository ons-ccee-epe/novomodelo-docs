// Generic-constraint example gate (E15 ticket-242, GRD-05; R63, R65, R102, ADR-021).
//
// Every `gc-check` fence of reference/generic-constraints.mdx must behave under the
// real `novomodelo validate` as its meta says (D-160-4, docs/design/reference-conventions.md
// section 7): `title="<case-relative path>"` names the file the fence content IS,
// `gc-check="accept"` requires exit 0 and `gc-check="reject"` requires exit 1 with an
// `error` object. A fence without `gc-check` is illustrative and is not run.
//
// Case assembly follows the G3 decision (design/g3-ci-binary.md, B1 + F1): the binary
// comes from NOVOMODELO_BIN or `novomodelo` on PATH (CI installs the pinned release asset,
// ticket-243); `novomodelo init --template 1dtoy` writes the scaffold into a path that does
// not exist yet (a non-empty target exits 2); the committed overlay
// scripts/fixtures/gc-overlay/ (ticket-242a, root README.md excluded) is copied over it
// and must validate on its own; then each fence is spliced ALONE into a fresh copy of
// that case, replacing the file at its `title` path (D-179-2). A `title` that names
// no file of that assembled case is a BAD-META problem: a file written to an unknown
// path is read by no `validate` step, so its verdict would say nothing about the fence.
//
// A verdict is the exit status plus the presence of an `error` object in the
// `validate --json` stdout: the success object has no `error` key, and `phase` alone
// cannot attribute a refusal to the spliced fence (it is the same for a malformed
// hydros.json), which is why the overlay is validated first. The refusal's kind and
// message are not compared. The pinned binary is identified by `novomodelo version` line 1,
// which must carry the tag in scripts/novomodelo-ref.mjs DEFAULT_NOVOMODELO_REF. A development
// build prints the same line, so a binary whose real path (a bare `novomodelo` resolved
// through PATH, symlinks followed) lies inside `/target/release/` or `/target/debug/`
// is refused before it is run.
//
// Usage: node scripts/check-gc-examples.mjs
// Exit 0 when every fence behaves as marked; 1 listing each problem; 2 on a setup error
// (binary missing, of another version or inside a cargo build tree, fixture directory
// missing, `init` failing, page unreadable). Reads source files only (no build).

import { spawnSync } from "node:child_process";
import {
  accessSync,
  constants,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DEFAULT_NOVOMODELO_REF } from "./novomodelo-ref.mjs";

const PAGE_LABEL = "src/content/docs/reference/generic-constraints.mdx";
const PAGE = fileURLToPath(new URL(`../${PAGE_LABEL}`, import.meta.url));
const FIXTURE_DIR = fileURLToPath(
  new URL("./fixtures/gc-overlay", import.meta.url),
);

const OPEN_RE = /^(`{3,})(\S*)\s*(.*)$/;
const CLOSE_RE = /^(`{3,})\s*$/;
const TITLE_RE = /^(?:[a-z0-9_]+\/)*[a-z0-9_]+\.json$/;
// D-160-4 makes a misspelled option an error: any info-string option name that starts
// with `gc` or holds `check` marks the fence as checked, so a typo of gc-check is a
// BAD-META problem instead of an illustrative fence. Double-quoted values are blanked
// first, so words inside a value are never read as option names.
const OPTION_NAME_RE = /(?:^|\s)([A-Za-z][\w-]*)(?==|\s|$)/g;
const GC_LIKE_RE = /^gc|check/i;
const gcOptionNames = (info) =>
  [...info.replace(/"[^"]*"/g, '""').matchAll(OPTION_NAME_RE)]
    .map((match) => match[1])
    .filter((name) => GC_LIKE_RE.test(name));

const option = (meta, name) =>
  new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(meta)?.[1];

// --- Pure helpers (exported for scripts/check-gc-examples.test.mjs) ---------

// Page text -> { fences: [{ line, title, check, body }], problems: [BAD-META] }.
// Only fences with a gc-check-like option are read; a malformed one is a problem
// and is not returned as a fence. `line` is the 1-based opening line.
export function extractGcFences(text) {
  const fences = [];
  const problems = [];

  const finish = ({ line, lang, meta, body }, closed) => {
    const gcNames = gcOptionNames(`${lang} ${meta}`);
    if (gcNames.length === 0) return;
    const check = option(meta, "gc-check");
    const title = option(meta, "title");
    const details = [];
    if (!closed) details.push("the fence is not closed");
    if (lang !== "json") {
      details.push(`language must be json, found ${lang || "none"}`);
    }
    for (const name of gcNames.filter((n) => n !== "gc-check")) {
      details.push(`unknown option ${name}; a checked fence uses gc-check`);
    }
    if (
      gcNames.includes("gc-check") &&
      check !== "accept" &&
      check !== "reject"
    ) {
      details.push('gc-check must be "accept" or "reject", in double quotes');
    }
    if (title === undefined || !TITLE_RE.test(title)) {
      details.push(
        "title must be a lowercase case-relative .json path, in double quotes",
      );
    }
    for (const detail of details)
      problems.push({ code: "BAD-META", line, detail });
    if (details.length === 0) {
      fences.push({ line, title, check, body: body.join("\n") });
    }
  };

  let open = null;
  text.split(/\r?\n/).forEach((raw, index) => {
    if (open === null) {
      const match = OPEN_RE.exec(raw);
      if (match) {
        open = {
          ticks: match[1].length,
          line: index + 1,
          lang: match[2],
          meta: match[3],
          body: [],
        };
      }
      return;
    }
    const close = CLOSE_RE.exec(raw);
    if (close && close[1].length >= open.ticks) {
      finish(open, true);
      open = null;
    } else {
      open.body.push(raw);
    }
  });
  if (open !== null) finish(open, false);
  return { fences, problems };
}

// null when one `validate --json` run behaves as the fence's `check` says.
export function classifyOutcome(check, { status, stdout }) {
  let verdict;
  try {
    verdict = JSON.parse(stdout);
  } catch (error) {
    return {
      code: "BAD-OUTPUT",
      detail: `stdout is not JSON (exit status ${status}): ${error.message}`,
    };
  }
  if (
    verdict === null ||
    typeof verdict !== "object" ||
    Array.isArray(verdict)
  ) {
    return {
      code: "BAD-OUTPUT",
      detail: `stdout is not a JSON object (exit status ${status})`,
    };
  }
  const error = verdict.error;
  const refused = typeof error === "object" && error !== null;
  if (check === "accept") {
    if (status === 0 && !refused) return null;
    return {
      code: "UNEXPECTED-REJECT",
      detail: refused ? error.message : `exit status ${status}`,
    };
  }
  if (status === 0) {
    return {
      code: "UNEXPECTED-ACCEPT",
      detail: "novomodelo validate accepted the fence (exit status 0)",
    };
  }
  if (status === 1 && refused) return null;
  return {
    code: "NOT-A-REFUSAL",
    detail: `expected exit status 1 with an error object, got exit status ${status} ${refused ? "with" : "without"} an error object`,
  };
}

const CARGO_BUILD_TREE = /\/target\/(?:release|debug)\//;

// Real path of the executable `bin` names (a bare name is looked up on `env.PATH`),
// or null when there is none; the spawn then reports the missing binary.
function resolveBinary(bin, env) {
  const candidates = bin.includes("/")
    ? [bin]
    : (env.PATH ?? "")
        .split(delimiter)
        .filter((dir) => dir !== "")
        .map((dir) => join(dir, bin));
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return realpathSync(candidate);
    } catch (error) {
      if (!["ENOENT", "ENOTDIR", "EACCES"].includes(error.code)) throw error;
    }
  }
  return null;
}

// null when line 1 of `novomodelo version` names `defaultRef`, else the setup-error message.
export function checkNovomodeloVersion(versionStdout, defaultRef) {
  const match = /^novomodelo\s+(v\S+)/.exec(versionStdout.split(/\r?\n/, 1)[0]);
  if (match === null) return "unreadable novomodelo version output";
  return match[1] === defaultRef
    ? null
    : `novomodelo version ${match[1]} differs from DEFAULT_NOVOMODELO_REF ${defaultRef}`;
}

// Runs the whole check. `setupError` (a message, else null) stops the run before any
// verdict; otherwise `problems` are { code, line, detail, at } (`line` null and `at`
// the bare page label for a page-wide or fixture problem) and `accepted` / `rejected`
// count the fences that behaved as marked.
export function runGcExamples({
  pageText,
  pageLabel,
  fixtureDir,
  novomodeloBin,
  defaultRef,
  env = process.env,
}) {
  const childEnv = { ...env, NO_COLOR: "1" };
  const novomodelo = (args) =>
    spawnSync(novomodeloBin, args, { encoding: "utf8", env: childEnv });
  const verdict = (caseDir) => novomodelo(["validate", "--json", caseDir]);
  const locate = ({ code, line = null, detail }) => ({
    code,
    line,
    detail,
    at: line === null ? pageLabel : `${pageLabel}:${line}`,
  });
  const result = { setupError: null, problems: [], accepted: 0, rejected: 0 };

  const real = resolveBinary(novomodeloBin, childEnv);
  if (real !== null && CARGO_BUILD_TREE.test(real)) {
    result.setupError = `novomodelo binary ${real} lies inside a cargo build tree (/target/release/ or /target/debug/); set NOVOMODELO_BIN or PATH to the pinned release binary`;
    return result;
  }

  const version = novomodelo(["version"]);
  if (version.error) {
    result.setupError =
      version.error.code === "ENOENT"
        ? `novomodelo binary not found: ${novomodeloBin}; set NOVOMODELO_BIN or put novomodelo on PATH`
        : `cannot run novomodelo binary ${novomodeloBin}: ${version.error.message}`;
    return result;
  }
  const mismatch = checkNovomodeloVersion(version.stdout, defaultRef);
  if (mismatch !== null) {
    result.setupError = mismatch;
    return result;
  }
  if (!statSync(fixtureDir, { throwIfNoEntry: false })?.isDirectory()) {
    result.setupError = `fixture directory not found: ${fixtureDir}`;
    return result;
  }

  const { fences, problems } = extractGcFences(pageText);
  result.problems.push(...problems.map(locate));
  if (fences.length === 0) {
    if (problems.length === 0) {
      result.problems.push(
        locate({
          code: "NO-FENCES",
          detail: "the page holds no gc-check fence",
        }),
      );
    }
    return result;
  }

  const tmp = mkdtempSync(join(tmpdir(), "gc-examples-"));
  try {
    const base = join(tmp, "base");
    const init = novomodelo(["init", "--template", "1dtoy", base]);
    if (init.status !== 0) {
      result.setupError = `novomodelo init failed (exit status ${init.status}): ${init.stderr.trim()}`;
      return result;
    }
    const readme = resolve(fixtureDir, "README.md");
    cpSync(fixtureDir, base, {
      recursive: true,
      filter: (source) => resolve(source) !== readme,
    });
    const baseOutcome = classifyOutcome("accept", verdict(base));
    if (baseOutcome !== null) {
      result.problems.push(
        locate({
          code: "FIXTURE-INVALID",
          detail: `the overlay ${fixtureDir} over the 1dtoy scaffold is not accepted: ${baseOutcome.detail}`,
        }),
      );
      return result;
    }

    for (const fence of fences) {
      const target = join(base, fence.title);
      if (!existsSync(target) || !statSync(target).isFile()) {
        result.problems.push(
          locate({
            code: "BAD-META",
            line: fence.line,
            detail: `title ${fence.title} names no file of the assembled case; a checked fence replaces an existing file`,
          }),
        );
        continue;
      }
      const caseDir = join(tmp, `case-${fence.line}`);
      cpSync(base, caseDir, { recursive: true });
      const file = join(caseDir, fence.title);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${fence.body}\n`);
      const outcome = classifyOutcome(fence.check, verdict(caseDir));
      if (outcome === null) {
        result[fence.check === "accept" ? "accepted" : "rejected"] += 1;
      } else {
        result.problems.push(locate({ ...outcome, line: fence.line }));
      }
    }
    return result;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// Main (run only when invoked directly) so importing this module for the node:test
// fixture neither reads the page nor spawns anything.
function main() {
  let pageText;
  try {
    pageText = readFileSync(PAGE, "utf8");
  } catch (error) {
    console.error(
      `check:gc-examples: could not read ${PAGE_LABEL}: ${error.message}`,
    );
    process.exit(2);
  }
  const { setupError, problems, accepted, rejected } = runGcExamples({
    pageText,
    pageLabel: PAGE_LABEL,
    fixtureDir: FIXTURE_DIR,
    novomodeloBin: process.env.NOVOMODELO_BIN || "novomodelo",
    defaultRef: DEFAULT_NOVOMODELO_REF,
  });
  if (setupError !== null) {
    console.error(`check:gc-examples: ${setupError}`);
    process.exit(2);
  }
  if (problems.length > 0) {
    console.log(`FAIL: ${problems.length} problem(s)`);
    for (const problem of problems) {
      console.log(
        `check:gc-examples: ${problem.code} ${problem.at} ${problem.detail}`,
      );
    }
    process.exit(1);
  }
  console.log(
    `OK: ${accepted + rejected} generic-constraint examples behave as marked under novomodelo ${DEFAULT_NOVOMODELO_REF} (${accepted} accepted, ${rejected} rejected)`,
  );
  process.exit(0);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
