import type { ReactElement } from "react";

/**
 * Inline icon set — stroke follows currentColor so icons inherit the text
 * color of their context (rail, cards, empty states). No icon-library
 * dependency; every glyph is hand-kept and 20×20 on a 24 grid.
 */

type IconProps = { size?: number; title?: string };

function svg(path: ReactElement, { size = 20, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {path}
    </svg>
  );
}

export const IconHome = (p: IconProps = {}) =>
  svg(<path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9.5 21v-6h5v6" />, p);

export const IconCases = (p: IconProps = {}) =>
  svg(<path d="M3 7h6l2 2h10v11H3V7Zm0 0V5h5" />, p);

export const IconLibrary = (p: IconProps = {}) =>
  svg(<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4V4Zm16 0h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6V4Z" />, p);

export const IconTemplate = (p: IconProps = {}) =>
  svg(<path d="M5 3h10l4 4v14H5V3Zm10 0v4h4M9 12h6M9 16h6" />, p);

export const IconDocument = (p: IconProps = {}) =>
  svg(<path d="M6 2h9l4 4v16H6V2Zm9 0v4h4M9.5 11h5M9.5 15h5" />, p);

export const IconInterview = (p: IconProps = {}) =>
  svg(<path d="M4 5h16v11H9l-5 4V5Zm4.5 5.5h7" />, p);

export const IconCheck = (p: IconProps = {}) => svg(<path d="m5 12.5 4.5 4.5L19 7.5" />, p);

export const IconWarn = (p: IconProps = {}) =>
  svg(<path d="M12 3 2.5 20h19L12 3Zm0 7v4.5m0 3v.5" />, p);

export const IconClose = (p: IconProps = {}) => svg(<path d="M6 6l12 12M18 6 6 18" />, p);

export const IconSearch = (p: IconProps = {}) =>
  svg(<path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm5.2 11.2L21 20.5" />, p);

export const IconUser = (p: IconProps = {}) =>
  svg(<path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm-8 17c.8-4 4-6 8-6s7.2 2 8 6" />, p);
