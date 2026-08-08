import { QuestionBank } from "@suite/case-model";
import type { ContextSource } from "./case-context";
import bank13raw from "@suite/content/banks/teacher-form.v1.3.0.json" with { type: "json" };

/**
 * Case Materials presentation (directive §8.4 / Stage C): finalized Sources
 * rendered with plain-language labels — source identity and provenance are
 * preserved underneath, but the list never looks like a forensic evidence
 * system. Extraction summaries state what was FOUND, never what a model
 * thinks.
 */

export interface MaterialCard {
  sourceId: string;
  state: "ready" | "superseded";
  kind: "teacher_intake" | "interview" | "other";
  title: string;
  meta: string;
  summary: string;
  note?: string;
}

export interface InspectDetail {
  title: string;
  provenance: [string, string][];
  /** Plain question/answer pairs (teacher intake) or labeled text blocks. */
  content: { label: string; text: string }[];
}

interface TeacherPayload {
  bankId: string;
  bankVersion: string;
  responses: Record<string, string | string[]>;
  submittedAt: string;
}

interface CapturePayload {
  kind: string;
  setting: string;
  occurredOn: string;
  notes: string;
  summaryFinal: string | null;
}

const truncate = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

export function materialCard(cs: ContextSource): MaterialCard {
  const s = cs.source;
  const state = cs.superseded ? "superseded" : "ready";

  if (s.kind === "referral_form") {
    const payload = cs.payload as TeacherPayload;
    const count = Object.keys(payload.responses ?? {}).length;
    return {
      sourceId: s.sourceId,
      state,
      kind: "teacher_intake",
      title: "Teacher input",
      meta: `${s.bank?.bankId ?? "form"} v${s.bank?.bankVersion ?? "?"} · collected ${s.collectedOn}`,
      summary: `${count} responses from the classroom teacher, finalized and unchanged since submission.`,
      note: cs.superseded ? "Replaced by a newer version" : undefined,
    };
  }

  if (s.kind === "interview") {
    const payload = cs.payload as CapturePayload;
    return {
      sourceId: s.sourceId,
      state,
      kind: "interview",
      title: "Interview notes and summary",
      meta: `interview · ${s.collectedOn} · ${payload.setting ?? ""}`.trimEnd(),
      summary: payload.summaryFinal
        ? truncate(payload.summaryFinal, 160)
        : "Session notes, finalized.",
      note: cs.superseded ? "Replaced by a newer version" : undefined,
    };
  }

  return {
    sourceId: s.sourceId,
    state,
    kind: "other",
    title: s.instrument ?? s.kind,
    meta: `${s.kind} · collected ${s.collectedOn}`,
    summary: "Finalized source.",
    note: cs.superseded ? "Replaced by a newer version" : undefined,
  };
}

/** Question-id → prompt/option labels from the pinned bank version. */
function bankLabels(): Map<string, { prompt: string; options: Map<string, string> }> {
  const bank = QuestionBank.parse(bank13raw);
  const map = new Map<string, { prompt: string; options: Map<string, string> }>();
  for (const mod of bank.modules) {
    for (const q of mod.questions) {
      map.set(q.id, {
        prompt: q.prompt,
        options: new Map((q.options ?? []).map((o) => [o.value, o.label])),
      });
    }
  }
  return map;
}

/** Full inspection detail for the source drawer ("Why this is here"). */
export function inspectDetail(cs: ContextSource): InspectDetail {
  const s = cs.source;
  const provenance: [string, string][] = [
    ["Collected", s.collectedOn],
    ["Finalized", s.createdAt.slice(0, 10)],
    ["Version", String(s.version)],
  ];
  if (s.bank) provenance.push(["Instrument", `${s.bank.bankId} v${s.bank.bankVersion}`]);
  if (s.checksum) provenance.push(["Integrity checksum", `${s.checksum.slice(0, 16)}…`]);

  if (s.kind === "referral_form") {
    const payload = cs.payload as TeacherPayload;
    const labels = bankLabels();
    const content = Object.entries(payload.responses ?? {}).map(([qid, answer]) => {
      const q = labels.get(qid);
      const values = Array.isArray(answer) ? answer : [answer];
      const text = values.map((v) => q?.options.get(v) ?? v).join("; ");
      return { label: q?.prompt ?? qid, text };
    });
    return { title: "Teacher input", provenance, content };
  }

  if (s.kind === "interview") {
    const payload = cs.payload as CapturePayload;
    const content: { label: string; text: string }[] = [];
    if (payload.summaryFinal) content.push({ label: "Finalized summary", text: payload.summaryFinal });
    if (payload.notes) content.push({ label: "Session notes", text: payload.notes });
    return { title: "Interview notes and summary", provenance, content };
  }

  return { title: s.instrument ?? s.kind, provenance, content: [] };
}
