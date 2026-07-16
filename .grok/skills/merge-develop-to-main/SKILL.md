---
name: merge-develop-to-main
description: Merge the develop branch into main and push origin/main. Checks out main, updates from remote, merges develop, pushes main, then returns to the previous branch when safe. Use when the user asks to merge develop to main, promote develop, release to main, ship main, or runs /merge-develop-to-main.
---

# Merge develop → main (and push)

Promote `develop` into `main` with a normal (non-force) merge, then push `origin/main`. Prefer a clean, reversible workflow; stop and report on conflicts or dirty trees.

## Preconditions (stop if any fail)

Run:

```bash
git status
git branch --show-current
git rev-parse --abbrev-ref HEAD
```

**Hard stops — do not continue until fixed or the user explicitly overrides:**

1. **Dirty working tree** — uncommitted changes (staged or unstaged). Stash/commit first; do not discard user work.
2. **Detached HEAD** — warn and ask before proceeding.
3. **Missing branches** — `develop` or `main` does not exist locally or on `origin` after fetch.
4. **Secrets in flight** — if status shows `.env` or credential files as changes to be merged unexpectedly, stop and warn.

Remember the **starting branch** (usually `develop`) so you can switch back at the end.

## Workflow

### 1. Fetch and inspect

```bash
git fetch origin
git log --oneline --left-right main...develop
git log --oneline origin/main..develop
```

Show the user a short summary:

- Current branch
- How many commits `develop` is ahead of `main` (or that they already match)
- Whether `main` is behind `origin/main`

If `develop` has nothing new for `main`, say so and **do not** empty-merge or push unless the user still wants it.

### 2. Update local main

```bash
git checkout main
git pull origin main
```

If pull fails (diverged history, auth, network), stop and report. Do **not** force-pull or reset hard unless the user explicitly requests a destructive fix.

### 3. Merge develop into main

Prefer a merge commit so history shows the promotion:

```bash
git merge develop --no-ff -m "Merge branch 'develop' into main"
```

If the user has already approved a different merge style (e.g. fast-forward only when linear), honor that; default is `--no-ff`.

**On conflicts:**

1. Do **not** push.
2. List conflicting files.
3. Either resolve carefully with the user, or `git merge --abort` and leave `main` clean.
4. Never use force flags to “make it go away.”

### 4. Push main

This skill **does** push `main` (user intent when invoking it):

```bash
git push origin main
```

- Use a **normal** push only.
- **Never** `--force`, `--force-with-lease`, or history rewrite on `main`.
- If the push is rejected (remote ahead), fetch/pull/rebase or merge as appropriate **with user confirmation**, then retry a normal push.

### 5. Return to the previous branch

```bash
git checkout <starting-branch>
```

Skip only if the starting branch was already `main` or checkout would be unsafe; say where HEAD is left.

### 6. Confirm

Report:

- New `main` tip (short hash + subject)
- That `origin/main` was updated (or push skipped/failed)
- Current branch after return
- Any follow-ups (e.g. `develop` still needs a push of its own commits)

Optional useful checks:

```bash
git status
git log -3 --oneline main
git rev-parse --short main origin/main
```

## Never

1. **Force-push** `main` (or any branch) as part of this skill.
2. **`git reset --hard`** or discard uncommitted work to unblock the merge.
3. **Merge secrets** (`.env`, keys, tokens) without stopping to warn.
4. **Push other branches** unless the user asked (this skill only pushes `main`).
5. **Delete branches** or change default branch settings.

## Edge cases

| Situation | Action |
|-----------|--------|
| Already up to date | Tell the user; optional no-op push only if they insist |
| `main` only exists on remote | `git checkout -b main origin/main` then continue |
| Local `develop` behind `origin/develop` | Warn; offer to update `develop` first before merging |
| Merge conflict | Abort or resolve with user; never push partial merge |
| Hooks fail on merge/push | Report output; do not bypass with `--no-verify` unless user asks |
| Protected branch / permissions | Report remote error; do not try force workarounds |

## Windows / PowerShell notes

- Chain sequential commands with `;` if needed (avoid `&&` if the shell does not support it).
- Keep merge messages simple: `git merge develop --no-ff -m "Merge branch 'develop' into main"`.
