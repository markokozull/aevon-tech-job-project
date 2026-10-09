# Pregled ulaznih računa

An interface for an accountant to review and confirm incoming invoices: the original document next to the extracted data, with every uncertain or missing value pointed out.

## How to run

Requires Node 20.19+ or 22.12+ and Yarn 1.

```bash
make            # or: make start, or: yarn install && yarn dev
```

Then open http://localhost:5173. (`make help` lists the other shortcuts.)

Without Node, with Docker only:

```bash
make docker     # or: docker build -t invoice-review . && docker run --rm -p 8080:80 invoice-review
```

Then open http://localhost:8080. This serves the production build; the first build takes a few minutes.

- Invoice data is `invoices.json`; the originals (photos, scans, PDFs) are in `public/originals/`. Five invoices have no original, and the app says so.
- There is no backend. Confirmations and corrections are kept in the browser's `localStorage` (`invoice-review:confirmed`, `invoice-review:corrections`). Delete them in DevTools → Application → Local Storage to start over.
- `make build` (or `yarn build`) type-checks and builds; `make lint` (or `yarn lint`) runs ESLint.

---

> **TODO (Marko):** everything below is raw material, not finished text. The brief asks for these sections *in your own words*: keep what you agree with, rewrite it your way, delete the rest. Remove these TODO notes before submitting.

## Who I built it for

> **TODO (Marko):** describe the accountant and their day in your words.

Raw material:
- One accountant, 40 small client companies, several hundred invoices a month: PDFs, scans, phone photos (in the data: WhatsApp images, "IMG_0479.JPG", "scan0042.pdf").
- Today: original in one window, extracted data in another, comparing field by field. Slow, and errors still slip through.
- Probably works per company and per month (month-end close), not in the order invoices arrive.
- Most invoices are fine; the time goes into the few where the extraction is unsure or wrong. The UI should make those few obvious and the rest quick.

## Decisions

> **TODO (Marko):** pick 3–5, at least one about something left out, and explain each in your words.

Candidates, with the reasons behind them:

1. **Original and extracted data on one screen.** The brief's core problem is comparing across two windows. The review screen puts the photo or PDF on the left and the fields on the right.
2. **Confidence on every field, coloured by how much to worry** (blue ≥ 80 %, orange 70–79 %, red < 70 %). Checks on top of that: missing required fields, net + VAT ≠ total, buyer ≠ the client, line items not adding up. The 80 % line is a placeholder to tune with real error data.
3. **No green "ready" status.** An early version had a green "Spremno" chip, which implied the invoice was correct when it only meant no check fired. Unflagged invoices now say "Bez upozorenja"; green only means a person confirmed it.
4. **Corrections are stored apart from what the system read.** `invoices.json` is never changed; each corrected field keeps the original value. That makes it always clear what a person changed, and it's the data for measuring the extraction (see below).
5. **Confirming is never blocked, but never blind.** Invoices with warnings can be confirmed, because the accountant decides, not the software. Before that, a popup lists the remaining warnings and any unsaved edits.
6. **Built for working through a batch.** Status filters (clean ones first, then the flagged ones), a per-firm view for month-end, Prethodni / Sljedeći through the filtered list, and the next invoice opens automatically after confirming.

Deliberately left out (candidates):
- **Editing line items (Stavke).** Bookkeeping mostly runs on the header totals, which are editable; line items are a cross-check, and the sum row shows when they don't add up. Editing them properly needs adding missing lines (inv-006/007 look like a line was missed), which is a much bigger feature. Depends on whether line items are booked (see questions).
- **Confirming many invoices at once.** It would save clicks on clean invoices, but "no warnings" doesn't mean correct; bulk confirm brings back exactly the errors that slip through today.
- **Discarding duplicates.** Duplicates are now detected and warned about (same number + supplier + total; inv-006/007 in the data, and deliberately *not* inv-001/012, the same supplier's monthly repeat of the same amount). But there's no "discard" action, so the extra copy stays in Ulazni. The right behaviour depends on how the accountant handles duplicates today.
- **Tracking what was exported.** "Izvezi CSV" on Potvrđeni exports what the filters show (identifiers written so Excel keeps them exact), but doesn't remember what was already exported, so the same invoice could be imported twice. A real version would mark invoices as exported, or export straight into the bookkeeping software.

## Questions for a real accountant

> **TODO (Marko):** choose three and phrase them your way.

Candidates:
- Which fields do you actually type into your bookkeeping software? Do you book line items, or only the totals and VAT?
- When an invoice is missing something (e.g. due date or currency), can you still book it, or does it go back to the client?
- How do you handle the same invoice arriving twice, as a photo and as a PDF?
- Do you work per company and month, or in the order invoices arrive?
- Which mistake costs you most: a wrong amount, a wrong date, the wrong supplier, or a duplicate?

## How I'd know it works

> **TODO (Marko):** pick what you'd measure and why.

Ideas:
- **Time per invoice** from opening to confirming, split into flagged and clean, compared with how long it takes today.
- **Errors that still get through:** invoices moved back from Potvrđeni, and errors found later (by the client, an auditor or at month-end).
- **Corrections per field**, from the stored corrections: shows where the extraction is weakest.
- **Whether the warnings are right:** how often a field ≥ 80 % still gets corrected (threshold too low?) versus how often flagged fields are confirmed unchanged (too many false alarms?).
- **How often "Svejedno potvrdi" is used:** if it's most of the time, the warnings are noise.

## AI

> **TODO (Marko):** say what you used and give one example where you rejected or rewrote a suggestion, in your words.

Facts:
- Claude Code (Claude Opus) in VS Code, with `CLAUDE.md` and `docs/TASK.md` as project context, project skills for committing (`/commit`) and reviewing (`/review`), and headless Chrome screenshots to check layouts.

Examples from this project where the AI's suggestion was rejected or changed:
- The AI suggested showing confidence only when it's low, and editing one field at a time. You designed the review form yourself (percentages on every field, "Spremi promjene" next to "Potvrdi račun") and had it rebuilt that way.
- The AI's red/orange icon-and-severity redesign of the fields was reverted.
- The AI's first status chip, a green "Spremno", overclaimed. Asking what it actually meant led to "Bez upozorenja".
- The AI's first version put a "Potvrdi" button in every list row; you replaced it with "Pregledaj", so nothing is confirmed without opening it.

## Sketch

> **TODO (Marko):** optional — add a photo of any sketch made before coding, or remove this section.
