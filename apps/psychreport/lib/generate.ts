import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SectionMode } from "@suite/reasoning-contracts";
import type { GenerationInputs } from "./source-policy";
import type { ScoreVerification } from "./scores";
import { gateSection, renderCaseData, type SectionPlan } from "./report-plan";
import {
  systemPrompt,
  userPrompt,
  sourcePolicyBlock,
  DRAFTING_PROMPT_VERSION,
  GENERATION_SPEC_VERSION,
} from "./prompts";
import { sessionEvidenceFor } from "./session-evidence";
import { buildEvidenceSnapshot, type EvidenceSnapshot } from "./evidence-snapshot";
import {
  adjudicateSessionFidelity,
  ADJUDICATOR_SPEC_VERSION,
  type Adjudicate,
  type Adjudication,
} from "./adjudicator";

/**
 * generate.ts — the single path from case context to drafted prose.
 *
 * The VS-3 safety argument lives in this function's signature: it takes
 * `GenerationInputs`, which cannot be constructed without every source's
 * interpretation policy, and it assembles the prompt through `userPrompt`,
 * which always emits the SOURCE LIMITS block when sources exist. There is no
 * call path that reaches the model with `{data}` alone — the shape that made
 * D-099/D-118 possible.
 *
 * VS-3 adds the second enforcement point. FIDELITY and the mode contracts
 * prohibit inventing testing-session events, and the first live generation
 * invented one anyway ("...before reaching the discontinue criterion", against
 * a fixture documenting no session behavior at all). Those prohibitions are
 * prompt text, and per D-141 prompt text is not a safeguard. The gate below
 * is: it can reject output.
 *
 *   draft → adjudicate → pass, or one targeted regeneration → the SAME gate
 *   → pass, or surface to the clinician as needing review.
 *
 * Never loops. Never deletes language. Fails closed.
 *
 * Model posture: Claude Opus 5 with adaptive thinking (on by default) at
 * `high` effort. Streaming, because a long section plus thinking can exceed
 * the non-streaming timeout. Sampling parameters are not sent — they are
 * rejected on this model, and prompt-level steering is the supported lever.
 */

const MODEL = "claude-opus-5";
const EFFORT = "high" as const;
const MAX_TOKENS = 16000;

export interface GenerationProvenance {
  requestedModel: string;
  servingModel: string;
  effort: string;
  stopReason: string | null;
  inputTokens: number;
  outputTokens: number;
  at: string;
}

/** One drafting attempt and the verdict it received. Both are persisted. */
export interface GenerationAttempt {
  /** 1 for the first draft, 2 for the single permitted regeneration. */
  attempt: number;
  content: string;
  generatedBy: GenerationProvenance;
  adjudication: Adjudication;
}

export type FidelityOutcome = "passed" | "passed_after_retry" | "needs_review";

export interface SectionFidelity {
  /** The gate that ran, by spec version. */
  gate: string;
  outcome: FidelityOutcome;
  /** Every attempt, rejected drafts included — nothing is discarded. */
  attempts: GenerationAttempt[];
  /** Named statements from the final failing verdict. Empty unless needs_review. */
  unsupportedStatements: string[];
  /** The final failing verdict's reason. Null when the section passed. */
  reason: string | null;
}

export interface GeneratedSection {
  sectionKey: string;
  title: string;
  mode: SectionMode;
  /** The surfaced text — the final attempt, whether or not it cleared the gate. */
  content: string;
  /** Sources this section actually drew on (DESIGN-SYSTEM §5.6 footer). */
  sourceIds: string[];
  /** Provenance: what ran, not what we asked for. See the note below. */
  generatedBy: GenerationProvenance;
  promptVersion: string;
  specVersion: string;
  /** What was supplied to this generation, verbatim. See evidence-snapshot.ts. */
  evidenceSnapshot: EvidenceSnapshot;
  fidelity: SectionFidelity;
}

/**
 * A discriminated union with three arms on purpose. `needs_review` carries
 * prose that did NOT clear the gate, and a caller must not be able to reach it
 * by pattern-matching a boolean `ok` — every consumer has to decide what to do
 * with a section the gate rejected twice.
 */
export type GenerationResult =
  | { status: "ok"; section: GeneratedSection }
  | {
      status: "needs_review";
      section: GeneratedSection;
      unsupportedStatements: string[];
      reason: string;
    }
  | { status: "refused"; reason: string };

function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set (server-only).");
  }
  return new Anthropic();
}

type Turn = Anthropic.Beta.BetaMessageParam;

interface Draft {
  content: string;
  generatedBy: GenerationProvenance;
}

/** One drafting call. Returns a refusal string rather than partial prose. */
async function draft(
  anthropic: Anthropic,
  system: string,
  messages: Turn[]
): Promise<Draft | { refusal: string }> {
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
    messages,
  });

  const message = await stream.finalMessage();

  // Check the stop reason before reading content: a refusal carries empty or
  // partial content, and partial prose must never be presented as a draft.
  if (message.stop_reason === "refusal") {
    return {
      refusal:
        "The model declined to draft this section. Review the case material for anything that may have triggered a safety filter, or draft this section yourself.",
    };
  }

  const content = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!content) return { refusal: "The model returned no text for this section." };

  return {
    content,
    generatedBy: {
      requestedModel: MODEL,
      // `message.model` is what produced the text. If a fallback served the
      // request, the provenance records the model that actually wrote the
      // prose — the record must not claim a model that did not run.
      servingModel: message.model,
      effort: EFFORT,
      stopReason: message.stop_reason,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      at: new Date().toISOString(),
    },
  };
}

/**
 * The targeted correction turn. It names each unsupported statement verbatim
 * and forecloses the obvious wrong fix — hedging the sentence instead of
 * removing it — because a hedged version of an undocumented session event
 * fails this gate identically (D-140).
 *
 * "Change nothing else" is deliberate: the remedy is the removal of an
 * unsupported claim, not a rewrite that quietly drops supported content.
 */
export function correctionTurn(adj: Adjudication): string {
  const listed = adj.unsupportedStatements.map((s) => `  - "${s}"`).join("\n");
  return [
    "The draft above states or implies testing-session events that are not documented in the evidence supplied for this section:",
    listed,
    `Reason: ${adj.reason}`,
    "Rewrite the section. Remove each statement listed above, or replace it with what the supplied evidence actually documents.",
    'Do not hedge it instead. "May have", "appeared to", "seemed to", and "consistent with" do not create an evidentiary basis — a qualified version of an undocumented session event is rejected identically.',
    "Do not add any other detail about the testing session, the examiner, or the student's behavior during it.",
    "Change nothing else: preserve every statement the supplied evidence does support.",
    "Return only the prose for this block — no headings, no preamble, no commentary, no markdown.",
  ].join("\n\n");
}

/**
 * Draft one section.
 *
 * Returns `refused` — no prose at all — whenever the structural gate says the
 * section cannot be honestly written from what the case contains. Returns
 * `needs_review` when prose exists but did not clear the session-fidelity gate
 * after its one permitted regeneration; the text is surfaced with the
 * unsupported statements named, never silently deleted.
 */
export async function generateSection(args: {
  inputs: GenerationInputs;
  plan: SectionPlan;
  verifications: ScoreVerification[];
  anthropic?: Anthropic;
  /** Seam for the deterministic orchestration tests. */
  adjudicate?: Adjudicate;
}): Promise<GenerationResult> {
  const { inputs, plan, verifications } = args;

  const gate = gateSection(inputs, plan);
  if (!gate.ok) return { status: "refused", reason: gate.reason };

  const caseData = renderCaseData(inputs, gate.sources, verifications);
  const system = systemPrompt(plan.mode);
  const scopedInputs = { ...inputs, sources: gate.sources };
  const user = userPrompt(scopedInputs, caseData);

  // The session evidence is derived from the SECTION's gated sources, not from
  // the whole case: a section is judged against what it was actually given.
  const sessionEvidence = sessionEvidenceFor(gate.sources, verifications);
  const snapshot = buildEvidenceSnapshot({
    sectionKey: plan.key,
    mode: plan.mode,
    sources: gate.sources,
    sourceLimits: sourcePolicyBlock(gate.sources),
    caseData,
    sessionEvidence,
    scoreVerifications: verifications,
  });

  const anthropic = args.anthropic ?? client();
  const adjudicate: Adjudicate =
    args.adjudicate ?? ((input) => adjudicateSessionFidelity(input, anthropic));

  const messages: Turn[] = [{ role: "user", content: user }];
  const attempts: GenerationAttempt[] = [];

  // Attempt 1, then AT MOST one regeneration. The loop bound is the constant
  // below and nothing inside the body can extend it — "never loop" is a
  // property of the control flow, not of the exit conditions.
  const MAX_ATTEMPTS = 2;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const drafted = await draft(anthropic, system, messages);
    if ("refusal" in drafted) {
      // A refusal on the retry still leaves attempt 1's rejected prose, which
      // failed the gate; there is nothing passing to surface.
      return { status: "refused", reason: drafted.refusal };
    }

    // `adjudicateSessionFidelity` never throws, but the seam is replaceable.
    // A gate that throws must still fail closed rather than propagate an
    // exception some upper layer might swallow into a success.
    let adjudication: Adjudication;
    try {
      adjudication = await adjudicate({
        sectionKey: plan.key,
        sectionTitle: plan.title,
        content: drafted.content,
        evidence: sessionEvidence,
      });
    } catch (e) {
      adjudication = {
        verdict: "unusable",
        pass: false,
        unsupportedStatements: [],
        reason: `The session-fidelity check failed to run (${(e as Error).message}).`,
        provenance: {
          requestedModel: "unknown",
          servingModel: null,
          promptVersion: "unknown",
          specVersion: ADJUDICATOR_SPEC_VERSION,
          effort: "unknown",
          inputTokens: null,
          outputTokens: null,
          at: new Date().toISOString(),
        },
      };
    }

    attempts.push({ attempt, content: drafted.content, generatedBy: drafted.generatedBy, adjudication });

    const section = (outcome: FidelityOutcome): GeneratedSection => ({
      sectionKey: plan.key,
      title: plan.title,
      mode: plan.mode,
      content: drafted.content,
      sourceIds: gate.sources.map((s) => s.source.sourceId),
      generatedBy: drafted.generatedBy,
      promptVersion: DRAFTING_PROMPT_VERSION,
      specVersion: GENERATION_SPEC_VERSION,
      evidenceSnapshot: snapshot,
      fidelity: {
        gate: ADJUDICATOR_SPEC_VERSION,
        outcome,
        attempts,
        unsupportedStatements: outcome === "needs_review" ? adjudication.unsupportedStatements : [],
        reason: outcome === "needs_review" ? adjudication.reason : null,
      },
    });

    if (adjudication.verdict === "passed") {
      return { status: "ok", section: attempt === 1 ? section("passed") : section("passed_after_retry") };
    }

    // FAIL CLOSED, two ways.
    //
    // `unusable` — the gate itself errored, refused, or returned something
    // that could not be trusted. The section does not pass. It does NOT earn a
    // regeneration: there is no named statement to write an instruction
    // around, and re-rolling the draft does not repair the adjudicator.
    //
    // `failed` — a substantive verdict with named statements. One targeted
    // regeneration, then the identical gate again.
    const lastAttempt = attempt === MAX_ATTEMPTS;
    if (adjudication.verdict === "unusable" || lastAttempt) {
      const s = section("needs_review");
      return {
        status: "needs_review",
        section: s,
        unsupportedStatements: s.fidelity.unsupportedStatements,
        reason: adjudication.reason,
      };
    }

    messages.push(
      { role: "assistant", content: drafted.content },
      { role: "user", content: correctionTurn(adjudication) }
    );
  }

  /* c8 ignore next 2 -- unreachable: the loop returns on every path. */
  throw new Error("generateSection: unreachable");
}
