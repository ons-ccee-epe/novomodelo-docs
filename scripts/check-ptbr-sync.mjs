// check:ptbr-sync — every commit keeps the English pages and their pt-BR
// translations in sync (.claude/rules/translation-ptbr.md).
//
// A commit that changes an English page under src/content/docs/ (outside
// pt-br/) must change src/content/docs/pt-br/<same path> too; a new English page
// needs its pt-br counterpart, a deleted or renamed one takes its counterpart
// with it, and a sidebar label added to astro.config.mjs carries a pt-BR
// translation. A commit whose message has the trailer `PT-BR-Sync: skip` is
// exempt (used only when the author explicitly commits without translation).
//
// Modes:
//   --staged [--message-file F] [--include-unstaged]
//       Check the index about to be committed. Run by .githooks/commit-msg
//       (installed by `npm install` via core.hooksPath) and by the Claude Code
//       PreToolUse hook .claude/hooks/check-ptbr-sync.sh.
//   --range BASE..HEAD
//       Check each non-merge commit in the range on its own. Run by
//       .github/workflows/starlight-ci.yml on every pull request.
//
// Exit 0 when in sync, 1 when a commit is out of sync, 2 on a usage error.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DOCS = "src/content/docs/";
const PT = DOCS + "pt-br/";
export const SKIP_TRAILER = "PT-BR-Sync: skip";

/**
 * Parse `git diff --name-status -M` output into {path: status}, a rename split
 * into a deletion of the old path and an addition of the new one.
 */
export function parseNameStatus(text) {
  const changes = new Map();
  for (const line of text.split("\n")) {
    if (!line) continue;
    const parts = line.split("\t");
    const status = parts[0][0];
    if (status === "R" && parts.length === 3) {
      changes.set(parts[1], "D");
      changes.set(parts[2], "A");
    } else if (parts.length >= 2) {
      changes.set(parts.at(-1), status);
    }
  }
  return changes;
}

/** Added sidebar `label:` lines in an astro.config.mjs diff that lack a pt-BR translation. */
export function untranslatedLabels(configDiff) {
  return configDiff
    .split("\n")
    .filter(
      (l) =>
        l.startsWith("+") &&
        !l.startsWith("+++") &&
        /\blabel:/.test(l) &&
        !l.includes("pt-BR") &&
        !l.includes("lang:"),
    )
    .map((l) => l.slice(1).trim());
}

/**
 * Find the sync violations of one change set.
 * @param {Map<string,string>} changes path → git status letter
 * @param {string} configDiff unified diff of astro.config.mjs ("" if untouched)
 * @param {(path: string) => boolean} exists whether a path exists after the change
 */
export function findSyncViolations(changes, configDiff, exists) {
  const outdated = [];
  const missing = [];
  const orphaned = [];
  for (const [path, status] of [...changes].sort(([a], [b]) => a.localeCompare(b))) {
    if (!path.startsWith(DOCS) || path.startsWith(PT) || !/\.mdx?$/.test(path)) continue;
    const pt = PT + path.slice(DOCS.length);
    if (status === "D") {
      if (exists(pt) && changes.get(pt) !== "D") orphaned.push([path, pt]);
    } else if (!changes.has(pt)) {
      (exists(pt) ? outdated : missing).push([path, pt]);
    }
  }
  const labels = changes.has("astro.config.mjs") ? untranslatedLabels(configDiff) : [];
  return { outdated, missing, orphaned, labels };
}

export function isEmpty(v) {
  return !(v.outdated.length || v.missing.length || v.orphaned.length || v.labels.length);
}

/** Whether a commit message carries the `PT-BR-Sync: skip` trailer (comment lines ignored). */
export function hasSkipTrailer(message) {
  const body = message
    .split("\n")
    .filter((l) => !l.startsWith("#"))
    .join("\n")
    .trimEnd();
  const lastParagraph = body.split(/\n\s*\n/).at(-1) ?? "";
  return /^PT-BR-Sync:\s*skip\s*$/im.test(lastParagraph);
}

export function formatReport(v, heading) {
  const out = [heading];
  const section = (title, pairs) => {
    if (!pairs.length) return;
    out.push(title);
    for (const [en, pt] of pairs) out.push(`  ${en}\n    -> ${pt}`);
  };
  section(
    "English page changed, pt-br counterpart not in this commit (mirror every prose change):",
    v.outdated,
  );
  section("New English page with no pt-br counterpart (create a full translation):", v.missing);
  section(
    "English page deleted or renamed, pt-br counterpart left behind (delete or move it too):",
    v.orphaned,
  );
  if (v.labels.length) {
    out.push('astro.config.mjs: sidebar label added without translations: { "pt-BR": "..." }:');
    for (const l of v.labels) out.push(`  ${l}`);
  }
  return out.join("\n");
}

const HOW_TO_FIX =
  "Follow .claude/rules/translation-ptbr.md: translate the change into the pt-br file\n" +
  "(guide: .claude/rules/glossario-traducao-ptbr.md), `git add` it, and commit again.\n" +
  `To commit without the translation on purpose, add the trailer \`${SKIP_TRAILER}\`\n` +
  "as the last line of the commit message.\n";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function gitOk(...args) {
  try {
    execFileSync("git", args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function checkStaged({ messageFile, includeUnstaged }) {
  if (messageFile && hasSkipTrailer(readFileSync(messageFile, "utf8"))) return 0;
  // A merge commit brings in commits that were checked on their own branch.
  if (existsSync(join(git("rev-parse", "--git-dir").trim(), "MERGE_HEAD"))) return 0;

  const changes = parseNameStatus(git("diff", "--cached", "--name-status", "-M"));
  let configDiff = git("diff", "--cached", "-U0", "--", "astro.config.mjs");
  if (includeUnstaged) {
    for (const [p, s] of parseNameStatus(git("diff", "--name-status", "-M"))) {
      if (!changes.has(p)) changes.set(p, s);
    }
    configDiff += git("diff", "-U0", "--", "astro.config.mjs");
  }
  const v = findSyncViolations(changes, configDiff, (p) => existsSync(p));
  if (isEmpty(v)) return 0;
  console.error(
    formatReport(
      v,
      "BLOCKED by check:ptbr-sync — the English pages and their pt-BR translations are\n" +
        "out of sync in this commit.\n",
    ),
  );
  console.error("\n" + HOW_TO_FIX);
  return 1;
}

function checkRange(range) {
  const shas = git("rev-list", "--no-merges", "--reverse", range).split("\n").filter(Boolean);
  let failed = 0;
  for (const sha of shas) {
    const message = git("log", "-1", "--format=%B", sha);
    if (hasSkipTrailer(message)) continue;
    const changes = parseNameStatus(
      git("diff-tree", "--root", "--no-commit-id", "-r", "-M", "--name-status", sha),
    );
    const configDiff = changes.has("astro.config.mjs")
      ? git("diff-tree", "--root", "--no-commit-id", "-p", "-U0", sha, "--", "astro.config.mjs")
      : "";
    const v = findSyncViolations(changes, configDiff, (p) => gitOk("cat-file", "-e", `${sha}:${p}`));
    if (isEmpty(v)) continue;
    failed++;
    console.error(formatReport(v, `\n${sha.slice(0, 7)} ${message.split("\n")[0]}`));
  }
  if (!failed) {
    console.log(`check:ptbr-sync: ${shas.length} commit(s) in ${range} keep English and pt-BR in sync`);
    return 0;
  }
  console.error(
    `\ncheck:ptbr-sync: ${failed} of ${shas.length} commit(s) in ${range} out of sync.\n` +
      "Fix each commit (e.g. `git rebase -i` and amend the translation into it).\n" +
      HOW_TO_FIX,
  );
  return 1;
}

function main(argv) {
  const opt = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  if (argv.includes("--staged")) {
    return checkStaged({
      messageFile: opt("--message-file"),
      includeUnstaged: argv.includes("--include-unstaged"),
    });
  }
  const range = opt("--range");
  if (range) return checkRange(range);
  console.error(
    "usage: check-ptbr-sync.mjs --staged [--message-file F] [--include-unstaged]\n" +
      "       check-ptbr-sync.mjs --range BASE..HEAD",
  );
  return 2;
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  process.exit(main(process.argv.slice(2)));
}
