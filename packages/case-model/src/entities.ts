/**
 * entities.ts — the five core entities (decisions.md D-006, D-007).
 *
 *   Case ── Informant ── Source ── Evidence ── Claim
 *
 * Rules encoded here rather than left to convention:
 *   - Minimal PII: Case carries initials/grade, never full name or DOB (D-006).
 *   - Retention fields exist from day one (D-004).
 *   - Evidence must carry at least one construct tag OR a topography (D-007).
 *   - Claims of evidentiary types must cite >=1 Evidence ID; missing_information
 *     and recommended_follow_up may stand alone (D-007).
 *   - AI-produced records carry generation provenance (D-008).
 */

import { z } from "zod";
import { ConstructId } from "./taxonomy.schema";

/* ---------- shared vocabulary ---------- */

export const Topography = z.enum([
  "noncompliance",
  "avoidance",
  "aggression",
  "withdrawal",
  "disruption",
]);
export type TTopography = z.infer<typeof Topography>;

export const HypothesizedFunction = z.enum([
  "escape",
  "attention",
  "tangible",
  "sensory",
]);

export const ClaimType = z.enum([
  "reported_fact",
  "respondent_opinion",
  "cross_source_synthesis",
  "system_inference",
  "missing_information",
  "recommended_follow_up",
]);
export type TClaimType = z.infer<typeof ClaimType>;

/** Provenance for anything a model produced (D-008). */
export const GenerationProvenance = z.object({
  modelId: z.string(),
  promptVersion: z.string(),
  schemaVersion: z.string(),
  generatedAt: z.string().datetime(),
});

/** Retention controls present on every data-bearing record (D-004). */
export const Retention = z.object({
  autoPurgeDays: z.number().int().positive().nullable().default(null),
  deletedAt: z.string().datetime().nullable().default(null),
});

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/* ---------- Case ---------- */

export const Case = z.object({
  caseId: z.string(),
  /** D-003: unused in MVP, present for district readiness. */
  organizationId: z.string().nullable().default(null),
  state: z.enum(["SC", "NC"]),
  evalType: z.enum(["initial", "reevaluation"]),
  referralDate: IsoDate,
  status: z
    .enum(["referral", "data_collection", "assessment", "report", "qa", "meeting", "complete"])
    .default("referral"),
  /** Minimal PII by design (D-006). The psychologist's own records hold identity. */
  student: z.object({
    studentRef: z.string(),          // internal pseudonymous reference
    displayInitials: z.string().max(5),
    grade: z.string(),
    ageYearsMonths: z.string().regex(/^\d{1,2}:\d{1,2}$/).optional(),
  }),
  priorityFlag: z.boolean().default(false), // e.g., harm-risk gate from intake
  retention: Retention.default({ autoPurgeDays: null, deletedAt: null }),
  createdAt: z.string().datetime(),
});
export type TCase = z.infer<typeof Case>;

/* ---------- Informant ---------- */

export const Informant = z.object({
  informantId: z.string(),
  caseId: z.string(),
  role: z.enum([
    "teacher",
    "sped_teacher",
    "interventionist",
    "parent_guardian",
    "student",
    "related_service",
    "administrator",
    "psychologist",
    "other",
  ]),
  relationship: z.string().optional(),      // "3rd grade gen ed, reading block"
  monthsKnownStudent: z.number().int().nonnegative().optional(),
  preferredLanguage: z.string().optional(),
});
export type TInformant = z.infer<typeof Informant>;

/* ---------- Source ---------- */

export const Source = z.object({
  sourceId: z.string(),
  caseId: z.string(),
  informantId: z.string().nullable().default(null), // null for records/documents
  kind: z.enum([
    "referral_form",
    "rating_scale",
    "interview",
    "observation",
    "score_set",
    "prior_report",
    "records",
    "work_sample",
    "other",
  ]),
  collectedOn: IsoDate,
  instrument: z.string().nullable().default(null),  // "BASC-3 TRS", "WISC-V", ...
  /** For form submissions: exactly which bank + version produced this (D-013). */
  bank: z
    .object({ bankId: z.string(), bankVersion: z.string() })
    .nullable()
    .default(null),
  /** Where the raw payload lives (storage key / local ref). Raw is stored before AI (D-007). */
  payloadRef: z.string().nullable().default(null),
  locked: z.boolean().default(false),              // true once submitted/final
  checksum: z.string().nullable().default(null),
  retention: Retention.default({ autoPurgeDays: null, deletedAt: null }),
  createdAt: z.string().datetime(),
});
export type TSource = z.infer<typeof Source>;

/* ---------- Evidence ---------- */

export const ConstructTag = z.object({
  id: ConstructId,
  status: z.enum(["reported", "hypothesis", "corroborated"]).default("reported"),
});

export const Score = z.object({
  type: z.enum(["standard", "scaled", "t", "percentile", "raw", "other"]),
  value: z.number(),
  percentile: z.number().min(0).max(100).optional(),
  ciLow: z.number().optional(),
  ciHigh: z.number().optional(),
  ciLevel: z.enum(["90", "95"]).optional(),
});

export const Evidence = z
  .object({
    evidenceId: z.string(),
    caseId: z.string(),
    sourceId: z.string(),
    /** Specific response items within the source that support this (quote verification anchors). */
    responseIds: z.array(z.string()).default([]),
    constructTags: z.array(ConstructTag).default([]),
    topography: Topography.optional(),
    hypothesizedFunction: HypothesizedFunction.optional(),
    polarity: z.enum(["concern", "strength", "neutral"]),
    severity: z.enum(["mild", "moderate", "marked"]).nullable().default(null),
    statement: z.string(),                 // normalized claim wording
    verbatim: z.string().optional(),       // respondent's exact words
    score: Score.optional(),
    extractionMethod: z.enum(["llm", "rule", "manual", "score_import"]),
    generation: GenerationProvenance.optional(), // required when extractionMethod === "llm"
    createdAt: z.string().datetime(),
  })
  .superRefine((ev, ctx) => {
    if (ev.constructTags.length === 0 && !ev.topography) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Evidence must carry at least one construct tag or a topography (D-007).",
      });
    }
    if (ev.extractionMethod === "llm" && !ev.generation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "LLM-extracted Evidence must record generation provenance (D-008).",
      });
    }
    if (ev.hypothesizedFunction && !ev.topography) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hypothesizedFunction requires a topography (functions describe observed behavior).",
      });
    }
  });
export type TEvidence = z.infer<typeof Evidence>;

/* ---------- Claim ---------- */

const EVIDENTIARY: ReadonlySet<string> = new Set([
  "reported_fact",
  "respondent_opinion",
  "cross_source_synthesis",
]);

export const Claim = z
  .object({
    claimId: z.string(),
    caseId: z.string(),
    outputSection: z.string(),             // "referral_summary.strengths", ...
    text: z.string(),
    claimType: ClaimType,
    evidenceIds: z.array(z.string()).default([]),
    status: z.enum(["draft", "edited", "approved", "excluded"]).default("draft"),
    generation: GenerationProvenance.optional(),
    approvedBy: z.string().nullable().default(null),
    approvedAt: z.string().datetime().nullable().default(null),
  })
  .superRefine((c, ctx) => {
    if (EVIDENTIARY.has(c.claimType) && c.evidenceIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Claim of type "${c.claimType}" must cite at least one Evidence ID (D-007). ` +
          "Unsupported statements are system_inference, missing_information, or recommended_follow_up.",
      });
    }
    if (c.status === "approved" && (!c.approvedBy || !c.approvedAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Approved claims must record approver and timestamp.",
      });
    }
  });
export type TClaim = z.infer<typeof Claim>;
