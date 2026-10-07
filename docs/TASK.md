# Task brief: Incoming invoice review (Pregled ulaznih računa)

Job-interview frontend task. Original brief is in Croatian, dated 2026-10-07, author Ante Milinković. This is a faithful English summary; original Croatian terms are kept where useful.

## What they evaluate

> "We're not interested in how much you can build, but in **what** you would build and **why**."

- There is no correct solution. **Fewer screens with a clear reason behind every decision** beat a finished app where you can't explain why something is where it is.
- Every UI/product decision should be defensible in the interview. Prefer deliberate omissions over feature creep.

## The problem

- An accountant (računovođa) at a bookkeeping service manages **40 small companies**.
- Each month they receive **several hundred incoming invoices** from them: PDFs, scans, phone photos.
- The system automatically reads each invoice and extracts data. Usually correct, but not always, and **sometimes it isn't sure**.
- Before an invoice goes into bookkeeping, the accountant must **review and confirm** it.
- Today: invoice open in one window, extracted data in another, comparing **field by field**. Too slow, and errors still slip through.

**Build an interface in which the accountant reviews and confirms invoices.** What it looks like, what it can do, and what it **deliberately can't** do is up to me.

## What's provided

- `invoices.json` with ~25 invoices, plus images of the originals for **some** of them (not all).
- Every extracted field has a **value and a confidence from 0 to 1**.
- **The data is not clean**, just like in reality. Expect missing/malformed values, low confidence, inconsistencies.
- No backend, none needed. State can live wherever I choose.

## Constraints

- React 18+ and TypeScript.
- Ready-made component library (chosen: **MUI**). Don't spend time styling buttons; show how existing components are composed into something that serves the user.
- AI tools are allowed and encouraged. Adding agentic-development files (like this one, CLAUDE.md) is allowed.
- **Deadline: two working days from receiving the brief.** If time runs out, stop and write down what would come next.

## Deliverables

A link to a Git repository. **Commit as you go and don't squash.**

README, **in my own words** and short:

1. **How to run it**, ideally with one command.
2. **Who I built it for.** How I imagine this accountant and their day.
3. **Three to five decisions** I made and why. At least one must be about something I **deliberately left out**.
4. **Three questions** I'd ask a real accountant before this goes to production.
5. **How I'd know it works.** What I'd measure to prove the new way beats the old one.
6. **AI:** what I used, and one example where I rejected or rewrote its suggestion.

Optional but valued: a photo of any sketch made before coding, even on paper.

## Interview after submission (50-minute video call)

Have the app running locally and the editor open.

1. **Demo (10 min).** Present it as if to the accountant, not to the interviewers.
2. **Product decisions (20 min).** "Why is this like this, and what if it were different?"
3. **Code (15 min).** Walk through one invoice from loading to confirmation, so that path in the code should be easy to follow.
4. **My questions (5 min).**
