---
name: review
description: Review code changes against this project's goals (interview task, messy invoice data, a code path walked through live). Manual only; run /review, optionally with a git range like main..HEAD or HEAD~3..HEAD.
disable-model-invocation: true
---

# Review

A deeper review than the skim in the `commit` skill. This project is judged on the reasoning behind each decision and the code is walked through live in the interview, so the review looks at product sense and readability as well as bugs.

## Scope

- No argument: uncommitted changes (`git diff` + `git diff --cached` + untracked files).
- An argument: treat it as a git range (e.g. `main..HEAD`, `HEAD~3..HEAD`) and review `git diff <range>`.

Read the changed files in full, not just the diff hunks, where the surrounding code matters.

## What to check

1. **Messy data.** Every extracted value can be `null`, have low confidence, or be malformed (see `docs/TASK.md`). Does the change handle that, or does it assume clean data? Check against the real `invoices.json` when in doubt, e.g. with a quick `node -e` over the file.
2. **Correctness.** Wrong conditions, off-by-one, rounding on amounts, state that can get out of sync, effects with missing dependencies.
3. **Honest UI.** Does any label, colour or status claim more than the code knows? (Example from this repo: a green "Spremno" chip implied an invoice was correct when it only meant no check had fired.) Is anything flagged ever hidden from the accountant?
4. **Scope.** Is there a user reason for every new element? Flag features that can't be defended in the interview, and abstractions added before they are needed.
5. **The walkthrough path.** Load → review → confirm must stay easy to trace: `data.ts` → `App.tsx` → `InvoiceTable` → `InvoiceReview` → `useReviewState`. Flag anything that makes that path harder to follow (indirection, logic spread across files, unclear names).
6. **Project constraints** from `CLAUDE.md`: `import type`, no `enum`/`namespace`, no unused symbols, component files export only components, styling via theme and `sx`, double quotes + semicolons.

## Output

- Findings ranked most important first. For each: `file:line`, what's wrong, a concrete scenario where it bites, and a suggested fix.
- A separate short list of **product questions for Marko**: decisions the review can't settle because they're his to make and defend.
- If nothing worth raising was found, say so plainly. Don't pad the list.

Don't edit any files. Wait for the user to pick what to fix.

For a generic multi-pass bug hunt, the built-in `/code-review` exists too; this skill is the project-specific one.
