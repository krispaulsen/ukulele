---
name: commit
description: Create a git commit on the active branch: inspect status/diff, stage relevant files, draft a typed message (fix:/feature:/docs:/refactor:/chore:/test:), get approval, then commit. Use when the user asks to commit, create a commit, or runs /commit. Never force-push or commit secrets.
---

# Commit

Create a clean, intentional commit on the **current branch** only. Do not push unless the user explicitly asks (and never force-push).

## Workflow

### 1. Inspect the working tree

Run in parallel:

- `git status`
- `git diff` (unstaged)
- `git diff --cached` (staged)
- `git log -5 --oneline` (for message style context)

If nothing is staged and there are unstaged changes, use the unstaged diff. If some files are already staged, prefer `--cached` for the message and still review unstaged changes.

### 2. Choose what to stage

Stage **relevant** project files with `git add` (paths as needed; avoid `git add .` unless the tree is clean of junk).

**Ignore / do not stage:**

- `node_modules/`, build output (`dist/`, `build/`, `.vite/`, coverage)
- lockfile churn unless the change intentionally updates dependencies
- local env files (`.env`, `.env.local`) and credentials
- secrets, keys, tokens, or private config
- unrelated scratch files the user did not intend

If secrets or `.env` appear in the diff, **stop**, warn the user, and do not commit them.

### 3. Draft the commit message

Pattern:

```text
<type>: <short summary of what changed>
```

Allowed types (pick one):

| Type | Use when |
|------|----------|
| **`fix:`** | Bugs, regressions, corrections, hardening of existing behavior |
| **`feature:`** | New capability, UI, API, or user-visible behavior |
| **`docs:`** | Documentation only (README, API tables, AGENTS.md, comments that are pure docs) |
| **`refactor:`** | Internal restructure/rename/cleanup with **no intended behavior change** |
| **`chore:`** | Tooling, dependencies, config, seed scripts, housekeeping that is not product behavior |
| **`test:`** | Adding, updating, or fixing tests only (or primarily tests) |

How to choose when unsure:

- User-visible or API behavior change → `feature:` or `fix:`
- Same behavior, cleaner structure → `refactor:`
- Docs only → `docs:`
- Tests only → `test:`
- Everything else non-product → `chore:`

If one commit mixes concerns, prefer the dominant intent (e.g. a feature plus a small test → `feature:`; tests alone for existing code → `test:`). Split into separate commits only when the user asks or the mix is clearly unrelated.

Rules:

- Do **not** use square brackets around the type (e.g. not `[fix]`).
- Summary: imperative or concise present tense; focus on **why/what**, not a file list.
- One line preferred; add a blank line and body only if needed for multi-part changes.
- Keep it strong and specific (e.g. `fix: prevent favorites 304 caching` not `fix: update files`).


### 4. Get approval

Show the user:

- Branch name
- Files to be committed
- Proposed message

Ask them to approve or edit the message. **Do not run `git commit` until they approve** (or supply an alternate message).

### 5. Commit

On Windows PowerShell, avoid HEREDOC; use a simple message form:

```bash
git commit -m "fix: example summary"
```

If the message needs multiple lines and the shell supports it safely, use multiple `-m` flags (subject then body).

Do **not** use `--no-verify` unless the user explicitly requests it after a hook failure.

### 6. Confirm

After a successful commit, show:

- New commit hash (short)
- Subject line
- `git status` (should be clean or show only unstaged leftovers)

## Never

1. **Force push** (`--force`, `--force-with-lease`) or rewrite shared history as part of this skill.
2. **Commit secrets** (API keys, passwords, `.env`, private keys, tokens).
3. Commit to a branch other than the current one, or create/switch branches, unless the user asks.
4. Push unless the user explicitly asks to push after the commit.

## Edge cases

- **Empty commit / nothing to commit**: say so; do not invent a commit.
- **Partial intent**: if the working tree mixes unrelated work, stage only the files that match the user's request and say what was left unstaged.
- **Pre-commit hook failure**: report the hook output; fix only if the user wants; do not bypass hooks by default.
- **Detached HEAD**: warn and ask before committing.
