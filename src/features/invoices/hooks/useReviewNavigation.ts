import { useState } from "react";

// Which side the next invoice slides in from.
export type SlideFrom = "left" | "right" | null;

type View = {
  // Invoice open for review; null shows the list.
  reviewingId: string | null;
  slideFrom: SlideFrom;
  // The last invoice opened, so the list can come back on its page.
  lastId: string | null;
};

// Which invoice is open for review, and the list it was opened from, so
// "Prethodni" / "Sljedeći" walk that same list. The list is a snapshot:
// confirming an invoice doesn't reshuffle the order mid-way.
export function useReviewNavigation() {
  const [view, setView] = useState<View>({
    reviewingId: null,
    slideFrom: null,
    lastId: null,
  });
  const [queue, setQueue] = useState<string[]>([]);
  const { reviewingId } = view;

  const index = reviewingId === null ? -1 : queue.indexOf(reviewingId);
  const prevId = index > 0 ? queue[index - 1] : null;
  const nextId =
    index >= 0 && index < queue.length - 1 ? queue[index + 1] : null;

  const goTo = (id: string, from: SlideFrom) =>
    setView({ reviewingId: id, slideFrom: from, lastId: id });

  // `listIds`: the list the invoice was opened from, in its current order
  // and with its current filters.
  const open = (id: string, listIds: string[]) => {
    setQueue(listIds);
    goTo(id, null);
  };

  const close = () => setView((current) => ({ ...current, reviewingId: null }));

  // Jump to a related invoice (e.g. its duplicate). If it's not in the list,
  // it's slotted in right after the current one, so "Prethodni" leads back.
  const jumpTo = (id: string) => {
    const target = queue.indexOf(id);
    if (target >= 0) {
      goTo(id, target < index ? "left" : "right");
      return;
    }
    setQueue((current) => [
      ...current.slice(0, index + 1),
      id,
      ...current.slice(index + 1),
    ]);
    goTo(id, "right");
  };

  // After confirming, move on to the next invoice in the list that still
  // needs review; back to the list when there is none. Confirming waits for
  // the server, so the accountant may have left in the meantime (e.g. via
  // the sidebar): then they stay where they went.
  const advance = (confirmedId: string, confirmedIds: ReadonlySet<string>) => {
    const next = queue
      .slice(index + 1)
      .find((id) => id !== confirmedId && !confirmedIds.has(id));
    setView((current) => {
      if (current.reviewingId !== confirmedId) return current;
      return next
        ? { reviewingId: next, slideFrom: "right", lastId: next }
        : { ...current, reviewingId: null };
    });
  };

  return {
    reviewingId,
    lastId: view.lastId,
    // 0-based position in the list, or null when opened from nowhere.
    position: index >= 0 ? { index, total: queue.length } : null,
    slideFrom: view.slideFrom,
    goPrev: prevId ? () => goTo(prevId, "left") : null,
    goNext: nextId ? () => goTo(nextId, "right") : null,
    open,
    close,
    jumpTo,
    advance,
  };
}
