#!/usr/bin/env bash
# PreToolUse hook (Bash): before a `git commit`, block when an English page is
# committed without its pt-br counterpart, or a sidebar label without a pt-BR
# translation. Exit 2 hands the report to Claude, which translates and retries.
# Contract: .claude/rules/translation-ptbr.md
set -euo pipefail

INPUT=$(cat)

read_field() {
    python3 -c "
import sys, json
try:
    d = json.loads(sys.argv[1])
    v = d.get('tool_input', {}).get('command', '') if sys.argv[2] == 'command' else d.get(sys.argv[2], '')
    print(v or '')
except Exception:
    print('')
" "$INPUT" "$1" 2>/dev/null || true
}

COMMAND=$(read_field command)
CWD=$(read_field cwd)

if ! printf '%s' "$COMMAND" | grep -Eq '(^|[;&|[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+commit([[:space:]]|$)'; then
    exit 0
fi

if printf '%s' "$COMMAND" | grep -Eq '(^|[[:space:]])PTBR_SYNC_SKIP=1([[:space:]]|$)'; then
    exit 0
fi

REPO=$(git -C "${CWD:-${CLAUDE_PROJECT_DIR:-.}}" rev-parse --show-toplevel 2>/dev/null || true)
if [ -z "$REPO" ] || [ ! -f "$REPO/lunaria.config.json" ]; then
    exit 0
fi
cd "$REPO"

INCLUDE_UNSTAGED=0
if printf '%s' "$COMMAND" | grep -Eq 'commit.*([[:space:]]--all([[:space:]]|$)|[[:space:]]-[a-zA-Z]*a[a-zA-Z]*([[:space:]]|$))'; then
    INCLUDE_UNSTAGED=1
fi

python3 - "$INCLUDE_UNSTAGED" <<'PY' >&2 && exit 0 || exit 2
import os, re, subprocess, sys

include_unstaged = sys.argv[1] == "1"
DOCS = "src/content/docs/"
PT = DOCS + "pt-br/"

def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=False).stdout

def name_status(*extra):
    changes = {}
    for line in git("diff", *extra, "--name-status", "-M").splitlines():
        parts = line.split("\t")
        status = parts[0][0]
        if status == "R" and len(parts) == 3:
            changes[parts[1]] = "D"
            changes[parts[2]] = "A"
        elif len(parts) >= 2:
            changes[parts[-1]] = status
    return changes

changes = name_status("--cached")
if include_unstaged:
    for path, st in name_status().items():
        changes.setdefault(path, st)

def is_en_page(p):
    return p.startswith(DOCS) and not p.startswith(PT) and p.endswith((".md", ".mdx"))

missing, outdated, orphaned = [], [], []
for path, st in sorted(changes.items()):
    if not is_en_page(path):
        continue
    pt = PT + path[len(DOCS):]
    if st == "D":
        if os.path.exists(pt) and changes.get(pt) != "D":
            orphaned.append((path, pt))
    elif pt not in changes:
        (outdated if os.path.exists(pt) else missing).append((path, pt))

labels = []
if "astro.config.mjs" in changes:
    diff = git("diff", "--cached", "-U0", "--", "astro.config.mjs") +(git("diff", "-U0", "--", "astro.config.mjs") if include_unstaged else "")
    for line in diff.splitlines():
        if line.startswith("+") and not line.startswith("+++") and re.search(r"\blabel:", line) \
                and "pt-BR" not in line and "lang:" not in line:
            labels.append(line[1:].strip())

if not (missing or outdated or orphaned or labels):
    sys.exit(0)

print("BLOCKED by .claude/hooks/check-ptbr-sync.sh — the English pages and their pt-BR")
print("translations are out of sync in this commit. Follow .claude/rules/translation-ptbr.md:")
print("translate the change into the pt-br file (guide: .claude/rules/glossario-traducao-ptbr.md),")
print("`git add` it, and run the same commit again.\n")
if outdated:
    print("English page changed, pt-br counterpart not in this commit (diff the English file and mirror every prose change):")
    for en, pt in outdated:
        print(f"  {en}\n    -> {pt}")
if missing:
    print("New English page with no pt-br counterpart (create a full translation):")
    for en, pt in missing:
        print(f"  {en}\n    -> {pt}")
if orphaned:
    print("English page deleted or renamed, pt-br counterpart left behind (delete or move it too):")
    for en, pt in orphaned:
        print(f"  {en}\n    -> {pt}")
if labels:
    print('astro.config.mjs: sidebar label added without translations: { "pt-BR": "..." }:')
    for l in labels:
        print(f"  {l}")
sys.exit(1)
PY
