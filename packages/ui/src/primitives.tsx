import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

/**
 * §5.10 primitives. Buttons/links carry the one-primary-per-view rule at the
 * call site — the components only render variants.
 */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const btnClass = (variant: ButtonVariant, small?: boolean) =>
  ["btn", `btn--${variant}`, small ? "btn--sm" : ""].filter(Boolean).join(" ");

export function Button({
  variant = "secondary",
  small,
  className: _ignored,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; small?: boolean }) {
  return <button className={btnClass(variant, small)} {...rest} />;
}

export function LinkButton({
  variant = "secondary",
  small,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant; small?: boolean }) {
  return <a className={btnClass(variant, small)} {...rest} />;
}

export type PillTone = "neutral" | "ok" | "warn" | "danger" | "accent";

export function StatusPill({ tone = "neutral", children }: { tone?: PillTone; children: ReactNode }) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}

export function Panel({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      {title ? <h2 className="panel__title">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

/** Tabs render as links; the active tab carries aria-current="page". */
export function Tabs({
  tabs,
  activeHref,
}: {
  tabs: { label: string; href: string }[];
  activeHref: string;
}) {
  return (
    <nav className="tabs" aria-label="Case sections">
      {tabs.map((t) => (
        <a
          key={t.href}
          href={t.href}
          className="tabs__tab"
          aria-current={t.href === activeHref ? "page" : undefined}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}

export function EmptyState({
  icon,
  sentence,
  action,
}: {
  icon?: ReactNode;
  sentence: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      {icon}
      <p className="empty__sentence">{sentence}</p>
      {action}
    </div>
  );
}

/** Skeleton block for async regions — no spinners on content surfaces. */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="stack" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}

export function Field({
  label,
  error,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input className="field__input" {...rest} />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}
