/**
 * Plain-language labels for case fields (directive Stage C: plain labels,
 * never internal object taxonomies). UI copy only — no check or status
 * semantics live here.
 */

export const STATUS_LABEL: Record<string, string> = {
  referral: "Referral received",
  data_collection: "Collecting information",
  assessment: "Assessment underway",
  report: "Report in progress",
  qa: "In review",
  meeting: "Meeting scheduled",
  complete: "Complete",
};

/** Ordered stages behind the CaseStatus progress line. */
export const STATUS_ORDER = [
  "referral",
  "data_collection",
  "assessment",
  "report",
  "qa",
  "meeting",
  "complete",
] as const;

export const EVAL_TYPE_LABEL: Record<string, string> = {
  initial: "Initial evaluation",
  reeval: "Reevaluation",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export function evalTypeLabel(evalType: string): string {
  return EVAL_TYPE_LABEL[evalType] ?? evalType;
}

/** 0..1 position of a status along the workflow, for the progress line. */
export function statusProgress(status: string): number {
  const i = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
  if (i < 0) return 0;
  return i / (STATUS_ORDER.length - 1);
}

export function studentDisplayName(student: {
  firstName: string | null;
  lastInitial: string | null;
  displayInitials: string;
}): string {
  if (student.firstName && student.lastInitial) {
    return `${student.firstName} ${student.lastInitial}.`;
  }
  return student.displayInitials;
}
