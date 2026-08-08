"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconClose } from "./icons";

/**
 * Drawer (§5.10) — right-side overlay, focus-trapped, Esc closes the topmost
 * surface (§6). Open/close is URL-driven: closeHref navigates back to the
 * surface without the drawer, so the drawer works as a server-rendered
 * overlay with no client open-state.
 */
export function Drawer({
  title,
  closeHref,
  children,
}: {
  title: string;
  closeHref: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex]:not([tabindex="-1"])')
      );
    (focusables()[0] ?? panel).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.location.assign(closeHref);
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeHref]);

  return (
    <>
      <a href={closeHref} className="drawer-backdrop" aria-label="Close details" />
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="drawer__head">
          <h2 className="panel__title">{title}</h2>
          <a className="btn btn--ghost btn--sm" href={closeHref} aria-label="Close">
            <IconClose size={16} />
          </a>
        </div>
        {children}
      </div>
    </>
  );
}
