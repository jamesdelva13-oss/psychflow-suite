/**
 * Respondent-facing student label (D-120): first name + last initial, e.g.
 * "Maya R." — falling back to the pre-D-120 initials for older cases. Full
 * identity never appears in links, logs, or pages; this is the ONLY student
 * label a respondent sees.
 */
export function studentDisplay(c: {
  first_name?: string | null;
  last_initial?: string | null;
  display_initials?: string | null;
}): string {
  if (c.first_name && c.last_initial) return `${c.first_name} ${c.last_initial.toUpperCase()}.`;
  return c.display_initials ?? "";
}
