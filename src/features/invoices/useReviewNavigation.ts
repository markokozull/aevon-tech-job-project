import { useState } from "react";

// Which side the next invoice slides in from.
export type SlideFrom = "left" | "right" | null;

// Which invoice is open for review, and the list it was opened from, so
// "Prethodni" / "Sljedeći" walk that same list. The list is a snapshot:
// confirming an invoice doesn't reshuffle the order mid-way.
export function useReviewNavigation() {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [slideFrom, setSlideFrom] = useState<SlideFrom>(null);
  // The last invoice opened, so the list can come back on its page.
  const [lastId, setLastId] = useState<string | null>(null);

  const index = reviewingId === null ? -1 : queue.indexOf(reviewingId);
  const prevId = index > 0 ? queue[index - 1] : null;
  const nextId =
    index >= 0 && index < queue.length - 1 ? queue[index + 1] : null;

  const goTo = (id: string, from: SlideFrom) => {
    setSlideFrom(from);
    setReviewingId(id);
    setLastId(id);
  };

  // `listIds`: the list the invoice was opened from, in its current order
  // and with its current filters.
  const open = (id: string, listIds: string[]) => {
    setQueue(listIds);
    goTo(id, null);
  };

  const close = () => setReviewingId(null);

  // After confirming, move on to the next invoice in the list that still
  // needs review; back to the list when there is none.
  const advance = (confirmedId: string, confirmedIds: ReadonlySet<string>) => {
    const next = queue
      .slice(index + 1)
      .find((id) => id !== confirmedId && !confirmedIds.has(id));
    if (next) goTo(next, "right");
    else close();
  };

  return {
    reviewingId,
    lastId,
    // 0-based position in the list, or null when opened from nowhere.
    position: index >= 0 ? { index, total: queue.length } : null,
    slideFrom,
    goPrev: prevId ? () => goTo(prevId, "left") : null,
    goNext: nextId ? () => goTo(nextId, "right") : null,
    open,
    close,
    advance,
  };
}
