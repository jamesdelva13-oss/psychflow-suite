import type { ReactNode } from "react";

/**
 * The app frame (§4): dark navy navigation rail at --sidebar-w, content on
 * --paper. The rail collapses to icons at 1024 and becomes a top icon bar at
 * phone widths — all CSS-driven, no client state. Discipline identity is
 * carried by labels, never accent hues.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export function AppFrame({
  brand,
  items,
  activeHref,
  user,
  children,
}: {
  brand: string;
  items: NavItem[];
  activeHref: string;
  /** Rail-bottom slot: identity + sign-out (settings live here per §8.1). */
  user?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app-frame">
      <nav className="nav-rail" aria-label="Primary">
        <div className="nav-rail__brand">
          <span className="nav-rail__brand-full">{brand}</span>
        </div>
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="nav-rail__item"
            aria-current={
              activeHref === item.href || (item.href !== "/" && activeHref.startsWith(item.href))
                ? "page"
                : undefined
            }
          >
            {item.icon}
            <span className="nav-rail__label">{item.label}</span>
          </a>
        ))}
        <div className="nav-rail__spacer" />
        {user ? <div className="nav-rail__user">{user}</div> : null}
      </nav>
      <main className="app-content">
        <div className="app-content__inner">{children}</div>
      </main>
    </div>
  );
}
