import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { CaptureKind, SummaryGeneration } from "../capture-core";

// The suite's provider adapter (data-posture §7): server-side only, payloads
// already pseudonymized by the caller, schema-constrained output, and every
// proposal logged with pinned prompt/schema/model versions. This is the ONLY
// place in apps/intake that talks to a model (D-125 scope: capture summaries).

export const CAPTURE_SUMMARY_PROMPT_VERSION = "capture-summary-v1";
export const CAPTURE_SUMMARY_SCHEMA_VERSION = "capture-summary-schema-v1";

// Pinned via env so a version bump is a deliberate, recorded act.
const requestedModel = () => process.env.RIE_CAPTURE_MODEL ?? "claude-opus-5";

// Response contract, stated twice on purpose: the JSON Schema constrains the
// model server-side (data-posture §7 "schema-constrained"); the zod schema
// re-validates what actually came back. The repo's zod v3 can't feed the SDK's
// zodOutputFormat helper (it needs zod v4), so the wire schema is literal.
const SummaryOut = z.object({ summary: z.string() });
const SUMMARY_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "Faithful prose summary of the notes; no added facts or conclusions.",
    },
  },
  required: ["summary"],
  additionalProperties: false,
} as const;

// Minimum-necessary prompt (D-110): task rules only, no case data. The
// escape hatch it must carry (D-111): gaps flagged in the notes are preserved,
// never resolved.
const SYSTEM_PROMPT = `You summarize a school psychologist's own session notes into a brief, faithful summary. The psychologist will review, correct, and approve the summary before it enters the case record.

Rules:
- Use only information present in the notes. Do not add facts, scores, interpretations, diagnoses, or eligibility statements.
- Preserve attribution: keep who reported, said, or did what (for example, "the teacher reported ...").
- Refer to the student only as "the student."
- If the notes flag something as unclear, unknown, or missing, preserve that flag; do not resolve or fill it.
- Write plain professional prose organized by topic, roughly 100-250 words. No headings, no bullet lists.`;

export class CaptureSummaryError extends Error {
  constructor(
    message: string,
    public readonly code: "refused" | "truncated" | "unparseable" | "provider_error"
  ) {
    super(message);
  }
}

export interface CaptureSummaryInput {
  /** Pseudonymized notes — caller runs pseudonymizeNotes() first. */
  notes: string;
  kind: CaptureKind;
  setting: string | null;
  occurredOn: string;
}

export async function summarizeCaptureNotes(
  input: CaptureSummaryInput
): Promise<{ text: string; generation: SummaryGeneration }> {
  const client = new Anthropic(); // ANTHROPIC_API_KEY from server env only
  const model = requestedModel();

  const response = await client.messages.create({
    model,
    max_tokens: 4096, // summaries are deliberately short; thinking stays on (model default)
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Session type: ${input.kind}\nSetting: ${input.setting ?? "not recorded"}\nDate: ${input.occurredOn}\n\nNotes:\n${input.notes}`,
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: SUMMARY_JSON_SCHEMA },
    },
  });

  if (response.stop_reason === "refusal") {
    throw new CaptureSummaryError(
      "The model declined to process these notes. Write the summary manually or adjust the notes.",
      "refused"
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new CaptureSummaryError(
      "The summary was cut off. Try summarizing a shorter span of notes.",
      "truncated"
    );
  }
  const textBlock = response.content.find((b) => b.type === "text");
  let parsed: z.infer<typeof SummaryOut> | null = null;
  if (textBlock && textBlock.type === "text") {
    try {
      parsed = SummaryOut.parse(JSON.parse(textBlock.text));
    } catch {
      parsed = null;
    }
  }
  if (!parsed?.summary?.trim()) {
    throw new CaptureSummaryError("The model returned no usable summary.", "unparseable");
  }

  return {
    text: parsed.summary.trim(),
    generation: {
      requestedModel: model,
      servedModel: response.model,
      promptVersion: CAPTURE_SUMMARY_PROMPT_VERSION,
      schemaVersion: CAPTURE_SUMMARY_SCHEMA_VERSION,
      pseudonymized: true,
      createdAt: new Date().toISOString(),
    },
  };
}
