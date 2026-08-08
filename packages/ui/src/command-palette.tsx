"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

/**
 * CommandPalette (§5.9) — ⌘K navigation. Every navigable screen registers
 * here (the "new features aren't done until they're in the palette" rule).
 * States: empty (suggested) · results · no-results. The no-results state
 * gains its "Ask the Assistant instead" handoff when the Assistant exists
 * (VS-4); until then it stays plain — no dead control.
 */

export interface PaletteItem {
  group: "Go to" | "Cases" | "Actions";
  label: string;
  href: string;
  keywords?: string;
}

export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setActive(0);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.label} ${i.keywords ?? ""} ${i.group}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const groups = ["Go to", "Cases", "Actions"] as const;

  const onInputKey = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      window.location.assign(results[active].href);
    }
  };

  return (
    <>
      <div className="palette-backdrop" onClick={() => setOpen(false)} />
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          className="palette__input"
          placeholder="Go to…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKey}
          aria-label="Search screens and cases"
        />
        {results.length === 0 ? (
          <p className="palette__none">No matches for “{query.trim()}”.</p>
        ) : (
          <ul className="palette__list">
            {groups.map((g) => {
              const inGroup = results.filter((r) => r.group === g);
              if (inGroup.length === 0) return null;
              return (
                <li key={g}>
                  <div className="palette__group eyebrow">{g}</div>
                  <ul className="palette__sublist">
                    {inGroup.map((r) => {
                      const idx = results.indexOf(r);
                      return (
                        <li
                          key={r.href}
                          className={`palette__item${idx === active ? " is-active" : ""}`}
                        >
                          <a href={r.href}>{r.label}</a>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
