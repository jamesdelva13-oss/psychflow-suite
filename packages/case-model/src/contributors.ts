/**
 * contributors.ts — the canonical organization / profile / role / assignment
 * model (decisions.md D-131, added in the D-046 consolidation).
 *
 * D-131 makes multidisciplinary architecture first-class:
 *   - A case may have multiple professional contributors across disciplines
 *     WITHOUT changing case identity or Source/Evidence semantics. Nothing in
 *     this file touches the Case, Source, or Evidence schemas; contributors
 *     attach to a case through CaseAssignment records, never by widening Case.
 *   - Case activity preserves actor attribution: attribution is by stable
 *     `profileId` and survives an assignment ending. Ending an assignment
 *     removes authorization, never history.
 *   - Authorization is governed HERE — organization/profile/role/assignment —
 *     and is never embedded ad hoc in contributor records. A contributor
 *     record carries no permission flags; whether a professional may act on a
 *     case is answered only by `mayActOnCase` over their assignments.
 *
 * Psychology is the first discipline through the full pipe; additional
 * disciplines phase in after slice validation (D-131). The single-psychologist
 * MVP (D-003) is the degenerate case: one profile, one lead assignment.
 */

import { z } from "zod";

const IsoDateTime = z.string().datetime();

/** Disciplines a professional profile may carry. school_psychology is first
 *  through the full pipe (D-131); the rest phase in after slice validation. */
export const Discipline = z.enum([
  "school_psychology",
  "speech_language",
  "occupational_therapy",
  "physical_therapy",
  "special_education",
  "social_work",
  "school_counseling",
  "nursing",
  "other",
]);
export type TDiscipline = z.infer<typeof Discipline>;

/* ---------- Organization ---------- */

export const Organization = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  createdAt: IsoDateTime,
});
export type TOrganization = z.infer<typeof Organization>;

/* ---------- ProfessionalProfile ---------- */

export const ProfessionalProfile = z.object({
  profileId: z.string(),
  /** Solo practice = null (D-003 lineage); district tier sets it. */
  organizationId: z.string().nullable().default(null),
  /**
   * Bridge to the authenticated identity (RIE's psychologists.id IS the
   * Supabase auth.uid()). Lets the profile model attach to the existing
   * auth/RLS posture without changing it.
   */
  authUserId: z.string().nullable().default(null),
  discipline: Discipline,
  displayName: z.string().min(1),
  credentials: z.string().optional(),      // "NCSP", "CCC-SLP", ...
  createdAt: IsoDateTime,
});
export type TProfessionalProfile = z.infer<typeof ProfessionalProfile>;

/* ---------- CaseAssignment ---------- */

/**
 * Roles a professional can hold ON A CASE. Deliberately minimal: role answers
 * "what may they do on this case," discipline lives on the profile ("what are
 * they"), and the two are never conflated.
 */
export const AssignmentRole = z.enum([
  "lead_evaluator",
  "contributor",
  "reviewer",
]);
export type TAssignmentRole = z.infer<typeof AssignmentRole>;

export const CaseAssignment = z
  .object({
    assignmentId: z.string(),
    caseId: z.string(),
    profileId: z.string(),
    role: AssignmentRole,
    startedAt: IsoDateTime,
    /** Non-null = assignment over. Removes authorization, never attribution. */
    endedAt: IsoDateTime.nullable().default(null),
    createdAt: IsoDateTime,
  })
  .superRefine((a, ctx) => {
    if (a.endedAt && a.endedAt < a.startedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endedAt"],
        message: "endedAt cannot precede startedAt.",
      });
    }
  });
export type TCaseAssignment = z.infer<typeof CaseAssignment>;

/* ---------- Actor attribution ---------- */

/**
 * The attribution unit for case activity. By-id, not by-assignment: an audit
 * event, a finalized Source, or a Capture summary is attributed to the
 * profile that acted, and stays attributed after the assignment ends.
 */
export const ActorRef = z.object({
  profileId: z.string(),
});
export type TActorRef = z.infer<typeof ActorRef>;

/* ---------- Authorization guards (the canonical answer, D-131) ---------- */

/** An assignment currently in force at `at` (default: now). */
export function isAssignmentActive(a: TCaseAssignment, at?: string): boolean {
  const t = at ?? new Date().toISOString();
  return a.startedAt <= t && (a.endedAt === null || a.endedAt > t);
}

/**
 * Whether a professional may act on a case. THE canonical authorization
 * question — nothing else (a contributor record, a discipline, an org
 * membership alone) grants case access.
 */
export function mayActOnCase(
  profileId: string,
  caseId: string,
  assignments: TCaseAssignment[],
  at?: string,
): boolean {
  return assignments.some(
    (a) =>
      a.profileId === profileId &&
      a.caseId === caseId &&
      isAssignmentActive(a, at),
  );
}

/** Roles that may add material to the case record (reviewers read). */
export function mayContributeContent(role: TAssignmentRole): boolean {
  return role === "lead_evaluator" || role === "contributor";
}
