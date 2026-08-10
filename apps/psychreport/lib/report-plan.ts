import type { SectionMode } from "@suite/reasoning-contracts";
import type { GenerationInputs, PolicedSource } from "./source-policy";
import { buildScoreRows, type ScoreSetPayload, type ScoreVerification } from "./scores";
import { inspectDetail } from "./materials";
import type { ContextSource } from "./case-context";

/**
 * report-plan.ts — which sections exist, what mode each is written in, and
 * which sources may feed it. Pure and unit-tested; no model, no I/O.
 *
 * Directive §9.1: preserve the mode-scoped architecture — one mode per
 * block, never one generic "write a psych report" prompt — and never expose
 * the internal mode labels in routine UI (`title` is what the user sees).
 */

export interface SectionPlan {
  key: string;
  title: string;
  mode: SectionMode;
  /** Source kinds eligible to feed this section. */
  sourceKinds: string[];
  /** Shown when the case carries none of the eligible sources. */
  emptyReason: string;
  /**
   * Rendered tables this section carries, ahead of its prose. Declarative so
   * the report plan owns placement — the table enumerates and the prose
   * interprets one level coarser (parameter block §6 P1/P2), which only works
   * if they sit in the same section.
   */
  tables?: string[];
}

/** Ordered to match the one synthetic district template (lib/templates.ts). */
export const REPORT_PLAN: SectionPlan[] = [
  {
    key: "reason-for-referral",
    title: "Reason for referral",
    mode: "SOURCE_FAITHFUL",
    sourceKinds: ["referral_form", "interview"],
    emptyReason: "No teacher input or interview material has reached this case.",
  },
  {
    key: "background",
    title: "Background and educational history",
    mode: "SOURCE_FAITHFUL",
    sourceKinds: ["referral_form", "interview"],
    emptyReason: "No teacher input or interview material has reached this case.",
  },
  {
    key: "observations",
    title: "Observations",
    mode: "DIRECT_OBSERVATION",
    sourceKinds: ["observation"],
    emptyReason:
      "No observation has been added to this case. Observations are written from a recorded classroom or testing-session observation, not inferred from other sources.",
  },
  {
    key: "assessment-results",
    title: "Assessment results",
    mode: "DESCRIPTIVE_RESULTS",
    sourceKinds: ["score_set"],
    emptyReason: "No assessment results have been added to this case.",
    // Interpretation also draws on score sets but carries no table: repeating
    // it there would be the striped-screen failure, and P1 puts the numbers
    // where the results are enumerated.
    tables: ["score_summary"],
  },
  {
    key: "interpretation",
    title: "Interpretation and summary",
    mode: "INTEGRATED_INTERPRETATION",
    sourceKinds: ["referral_form", "interview", "score_set", "observation", "rating_scale"],
    emptyReason: "No finalized material is available to interpret.",
  },
  {
    key: "recommendations",
    title: "Recommendations",
    mode: "RECOMMENDATION",
    sourceKinds: ["referral_form", "interview", "score_set", "observation", "rating_scale"],
    emptyReason: "No finalized material is available to base recommendations on.",
  },
];

export const planFor = (key: string): SectionPlan | undefined =>
  REPORT_PLAN.find((s) => s.key === key);

/** Sources eligible for a section, by kind. */
export const eligibleSources = (
  inputs: GenerationInputs,
  plan: SectionPlan
): PolicedSource[] => inputs.sources.filter((s) => plan.sourceKinds.includes(s.source.kind));

export type Refusal = { ok: false; reason: string };
export type Ready = { ok: true; sources: PolicedSource[] };

/**
 * Structural gate, evaluated before any model call.
 *
 * Two refusals, both of which the ceiling architecture requires:
 *   - no eligible source at all — a section with nothing behind it is not
 *     drafted from adjacent material (§9.3: an omission is missing
 *     information, never a finding);
 *   - an integrating mode where NO source may be integrated — every source
 *     resolves to DESCRIBE_ONLY or DO_NOT_INTERPRET, so a cross-source
 *     synthesis would necessarily exceed some source's ceiling. Refusing is
 *     the only correct answer; the prompt cannot be trusted to self-police
 *     an impossibility.
 */
export function gateSection(inputs: GenerationInputs, plan: SectionPlan): Ready | Refusal {
  const sources = eligibleSources(inputs, plan);
  if (sources.length === 0) return { ok: false, reason: plan.emptyReason };

  if (plan.mode === "INTEGRATED_INTERPRETATION") {
    const integrable = sources.filter(
      (s) =>
        s.ceiling === "INTEGRATE_WITH_QUALIFICATION" || s.ceiling === "FULL_INTERPRETATION"
    );
    if (integrable.length === 0) {
      return {
        ok: false,
        reason:
          "Every available source is limited to description — none may be used in cross-source synthesis yet. Resolve the outstanding source limitations before drafting an interpretation.",
      };
    }
  }

  return { ok: true, sources };
}

/* ------------------------------------------------------------------ *
 * Case-data rendering
 * ------------------------------------------------------------------ */

interface CapturePayload {
  setting?: string;
  occurredOn?: string;
  notes?: string;
  summaryFinal?: string | null;
}

/**
 * Render one policed source as plain text for the prompt.
 *
 * Scores are the sensitive case (§9.4). Rows whose extraction the clinician
 * has NOT confirmed are WITHHELD from the model entirely — the model
 * narrates validated results, so a number nobody has checked against the
 * protocol must not be available to narrate. Their absence is stated, so
 * the omission reads as missing information rather than as an absent
 * finding.
 */
export function renderSource(
  cs: PolicedSource,
  verifications: ScoreVerification[]
): string {
  const s = cs.source;

  if (s.kind === "score_set") {
    const payload = cs.payload as ScoreSetPayload;
    const rows = buildScoreRows(payload, verifications, s.sourceId);
    const usable = rows.filter((r) => !r.needsVerification);
    const withheld = rows.length - usable.length;

    const lines = usable.map(
      (r) =>
        `  ${r.subtest}: standard score ${r.standardScore}, 95% CI ${r.ci95[0]}–${r.ci95[1]}, percentile ${r.percentile}`
    );
    const head = `${cs.label} — ${payload.instrument}, administered ${payload.administeredOn} (${payload.form})`;
    const note =
      withheld > 0
        ? `\n  (${withheld} additional score${withheld === 1 ? "" : "s"} on this measure ${withheld === 1 ? "is" : "are"} awaiting verification and ${withheld === 1 ? "is" : "are"} therefore not available. Do not refer to ${withheld === 1 ? "it" : "them"}.)`
        : "";
    return `${head}\n${lines.join("\n")}${note}`;
  }

  if (s.kind === "interview") {
    const payload = cs.payload as CapturePayload;
    const parts = [`${cs.label} — ${payload.setting ?? "interview"}, ${s.collectedOn}`];
    if (payload.summaryFinal) parts.push(`  Clinician summary: ${payload.summaryFinal}`);
    if (payload.notes) parts.push(`  Session notes:\n${indent(payload.notes)}`);
    return parts.join("\n");
  }

  if (s.kind === "referral_form") {
    // Reuse the same bank-resolved question/answer rendering the source
    // drawer shows the clinician, so the model reads exactly what the
    // practitioner can inspect.
    const detail = inspectDetail({
      source: cs.source,
      payload: cs.payload,
      superseded: false,
    } as ContextSource);
    const qa = detail.content.map((c) => `  ${c.label}\n    ${c.text}`).join("\n");
    return `${cs.label} — collected ${s.collectedOn}\n${qa}`;
  }

  return `${cs.label} — ${s.kind}, collected ${s.collectedOn}`;
}

const indent = (text: string): string =>
  text
    .split("\n")
    .map((l) => `    ${l}`)
    .join("\n");

/** The full CASE DATA payload for one section. */
export function renderCaseData(
  inputs: GenerationInputs,
  sources: PolicedSource[],
  verifications: ScoreVerification[]
): string {
  const student = inputs.student.firstName ?? inputs.student.displayInitials;
  const header = `Student: ${student}, grade ${inputs.student.grade}. Evaluation: ${inputs.evalType}.`;
  return [header, ...sources.map((s) => renderSource(s, verifications))].join("\n\n");
}
