---
name: commit
description: Commit pending changes as small, atomic, buildable commits after the user approves the proposed split. Use when the user asks to commit, or runs /commit.
---

# Commit

The commit history of this repo is reviewed as part of a job-interview submission. It must read as a clean, honest record of how the project was built: small steps, each one making sense on its own.

## Steps

1. **Inspect.** Run `git status --short` and `git diff` (plus `git diff --cached` if anything is staged). Read new untracked files too. If there is nothing to commit, say so and stop.

2. **Quick self-review.** While reading the diff, look for things that shouldn't be committed as they are:
   - Obvious bugs: wrong condition, unhandled `null` from the extracted data, a prop or callback that's passed but never used.
   - Leftovers: `console.log`, commented-out code, TODOs that should be done now, debug values.
   - Changes that don't belong in this commit set (unrelated edits, accidental files).

   This is a skim, not a full review (that's the `review` skill). Don't fix anything; list what you found in the approval message (step 4) and let the user decide. If nothing stood out, say so in one line.

3. **Plan the split.** Group the changes into atomic commits, one logical change per commit (e.g. "remove template CSS" separate from "add sidebar"). For each planned commit check:
   - It **builds on its own**: no commit may import a file that a later commit adds, or keep importing a file it deletes. If a file needs an intermediate version to keep a commit buildable, plan to stage that version with `git hash-object -w` + `git update-index --cacheinfo` instead of touching the working tree.
   - Unrelated edits (e.g. a CLAUDE.md fix) get their own commit.
   - Nothing generated or local slips in (`dist/`, `node_modules/`, `.env*`, editor files).

4. **Ask for approval.** Show the self-review findings first, then the plan as a numbered list: commit message + the files in each. Wait for the user to approve or adjust. Do not commit before that.

5. **Verify.** Run `yarn build` and `yarn lint` on the final working tree. If either fails, report the errors and stop. Do not commit broken code or "fix" it silently.

6. **Commit** in the planned order. Then show `git log --oneline` for the new commits and `git status --short`.

## Rules

- **Identity:** author is `Marko <mqrk00design@gmail.com>` (repo-local git config). If `git config user.name` / `user.email` differ, stop and ask.
- **Message style:** short imperative subject, sentence case, no trailing period, no `feat:`-style prefixes (e.g. `Add permanent sidebar navigation`). Add a body only when the *why* isn't obvious from the subject.
- **No `Co-Authored-By` or other AI attribution trailers.**
- **Never** squash, amend, rebase, or force-push commits that have been pushed. Never `git push` unless the user explicitly asks.
- Don't commit the user's half-finished work in progress without asking. If unsure whether a change is ready, ask.
