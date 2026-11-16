#!/usr/bin/env bash
# PreToolUse hook (Bash): before a `git commit`, block when an English page is
# committed without its pt-br counterpart, or a sidebar label without a pt-BR
# translation. Exit 2 hands the report to Claude, which translates and retries.
# The check itself is scripts/check-ptbr-sync.mjs, shared with the git
# commit-msg hook (.githooks/commit-msg) and the CI gate. This hook runs before
# the whole Bash command, so it sees the index as it is before any `git add` in
# the same command; the commit-msg hook catches what it misses.
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

if printf '%s' "$COMMAND" | grep -Eqi 'PT-BR-Sync:[[:space:]]*skip'; then
    exit 0
fi

REPO=$(git -C "${CWD:-${CLAUDE_PROJECT_DIR:-.}}" rev-parse --show-toplevel 2>/dev/null || true)
if [ -z "$REPO" ] || [ ! -f "$REPO/scripts/check-ptbr-sync.mjs" ]; then
    exit 0
fi
cd "$REPO"

ARGS=(--staged)
if printf '%s' "$COMMAND" | grep -Eq 'commit.*([[:space:]]--all([[:space:]]|$)|[[:space:]]-[a-zA-Z]*a[a-zA-Z]*([[:space:]]|$))'; then
    ARGS+=(--include-unstaged)
fi

node scripts/check-ptbr-sync.mjs "${ARGS[@]}" && exit 0 || exit 2
