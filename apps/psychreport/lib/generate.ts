import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SectionMode } from "@suite/reasoning-contracts";
import type { GenerationInputs } from "./source-policy";
import type { ScoreVerification } from "./scores";
import { gateSection, renderCaseData, type SectionPlan } from "./report-plan";
import { systemPrompt, userPrompt } from "./prompts";

/**
 * generate.ts — the single path from case context to drafted prose.
 *
 * The whole VS-3 safety argument lives in this function's signature: it
 * takes `GenerationInputs`, which cannot be constructed without every
 * source's interpretation policy, and it assembles the prompt through
 * `userPrompt`, which always emits the SOURCE LIMITS block when sources
 * exist. There is no call path that reaches the model with `{data}` alone —
 * the shape that made D-099/D-118 possible.
 *
 * Model posture: Claude Opus 5 with adaptive thinking (on by default) at
 * `high` effort. Streaming, because a long section plus thinking can exceed
 * the non-streaming timeout. Sampling parameters are not sent — they are
 * rejected on this model, and prompt-level steering is the supported lever.
 */

const MODEL = "claude-opus-5";
const EFFORT = "high" as const;
const MAX_TOKENS = 16000;

export interface GeneratedSection {
  sectionKey: string;
  title: string;
  mode: SectionMode;
  content: string;
  /** Sources this section actually drew on (DESIGN-SYSTEM §5.6 footer). */
  sourceIds: string[];
  /** Provenance: what ran, not what we asked for. See the note below. */
  generatedBy: {
    requestedModel: string;
    servingModel: string;
    effort: string;
    stopReason: string | null;
    inputTokens: number;
    outputTokens: number;
    at: string;
  };
}

export type GenerationResult =
  | { ok: true; section: GeneratedSection }
  | { ok: false; reason: string };

function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set (server-only).");
  }
  return new Anthropic();
}

/**
 * Draft one section. Returns a refusal rather than prose whenever the
 * structural gate says the section cannot be honestly written from what the
 * case contains.
 */
export async function generateSection(args: {
  inputs: GenerationInputs;
  plan: SectionPlan;
  verifications: ScoreVerification[];
  anthropic?: Anthropic;
}): Promise<GenerationResult> {
  const { inputs, plan, verifications } = args;

  const gate = gateSection(inputs, plan);
  if (!gate.ok) return { ok: false, reason: gate.reason };

  const caseData = renderCaseData(inputs, gate.sources, verifications);
  const system = systemPrompt(plan.mode);
  const user = userPrompt({ ...inputs, sources: gate.sources }, caseData);

  const anthropic = args.anthropic ?? client();

  const stream = anthropic.beta.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // Refusal fallback: a declined request is re-run server-side rather than
    // surfacing to the clinician as an unexplained empty draft. Which model
    // actually served the text is recorded below, never assumed.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: EFFORT },
    system: [
      // Mode-stable prefix — identical for every case drafted in this mode.
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: user }],
  });

  const message = await stream.finalMessage();

  // Check the stop reason before reading content: a refusal carries empty or
  // partial content, and partial prose must never be presented as a draft.
  if (message.stop_reason === "refusal") {
    return {
      ok: false,
      reason:
        "The model declined to draft this section. Review the case material for anything that may have triggered a safety filter, or draft this section yourself.",
    };
  }

  const content = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!content) {
    return { ok: false, reason: "The model returned no text for this section." };
  }

  return {
    ok: true,
    section: {
      sectionKey: plan.key,
      title: plan.title,
      mode: plan.mode,
      content,
      sourceIds: gate.sources.map((s) => s.source.sourceId),
      generatedBy: {
        requestedModel: MODEL,
        // `message.model` is what produced the text. If a fallback served
        // the request, the provenance records the model that actually wrote
        // the prose — the record must not claim a model that did not run.
        servingModel: message.model,
        effort: EFFORT,
        stopReason: message.stop_reason,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        at: new Date().toISOString(),
      },
    },
  };
}
