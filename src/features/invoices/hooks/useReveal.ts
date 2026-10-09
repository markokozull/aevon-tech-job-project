import { useEffect, type RefObject } from "react";

// Each change of `signal` brings the element into view (and puts the cursor
// in its input, if it has one). A new signal for the same element repeats
// it, e.g. when the same warning is picked twice.
export function useReveal(
  ref: RefObject<HTMLElement | null>,
  signal: number | null,
) {
  useEffect(() => {
    const element = ref.current;
    if (signal === null || !element) return;
    // Inside a section that is still opening, wait for it to finish, or
    // the scroll lands on the old position.
    const opening = element.closest(
      ".MuiCollapse-root:not(.MuiCollapse-entered)",
    );
    const timer = setTimeout(
      () => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element
          .querySelector<HTMLElement>(
            "input:not([type='hidden']), textarea, [role='combobox']",
          )
          ?.focus({ preventScroll: true });
      },
      opening ? 350 : 0,
    );
    return () => clearTimeout(timer);
  }, [ref, signal]);
}
