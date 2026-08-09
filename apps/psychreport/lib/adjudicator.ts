import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { renderSessionEvidence, type SessionEvidenceItem } from "./session-evidence";

/**
 * adjudicator.ts — the session-fidelity gate.
 *
 * A separate, closed-ended, server-side model call that answers ONE question
 * about one generated section:
 *
 *   Does this prose state or imply an administration event, examinee
 *   behavior, examiner action, or testing-session condition that is not
 *   documented in the session evidence supplied to this section?
 *
 * Spec: governance/session-fidelity-adjudicator-v1.md. Rule: D-140. Why it is
 * code rather than a prompt line: D-141.
 *
 * THE SCOPE CONSTRAINT IS NORMATIVE AND LIVES IN THE SPEC (§2), not only in
 * the prompt below. This call does not evaluate report quality, clinical
 * interpretation, attribution outside this rule, or overall fidelity.
 * Widening the question is a spec change requiring the same review as a change
 * to the rule — an adjudicator that drifts into general fidelity judging
 * produces findings the clinician cannot act on, and a clinician who learns to
 * dismiss the gate has no gate.
 *
 * FAIL CLOSED. Error, refusal, missing tool call, schema violation, incoherent
 * result, or an ungrounded quote all mean the section does not pass.
 */

export const ADJUDICATOR_SPEC_VERSION = "session-fidelity-adjudicator-v1.1";
export const ADJUDICATOR_PROMPT_VERSION = "session-fidelity-adjudicator-prompt-v2";
const ADJUDICATOR_MODEL = "claude-opus-5";
const ADJUDICATOR_EFFORT = "medium" as const;
const MAX_TOKENS = 4000;

/* ------------------------------------------------------------------ *
 * The prompt
 * ------------------------------------------------------------------ */

const SYSTEM = `
You are a narrow verification step inside a report-writing system. You are not
reviewing a report. You answer one question about one passage.

THE ONLY QUESTION
Does the SECTION TEXT state or imply an administration event, examinee
behavior, examiner action, or testing-session condition that is NOT documented
in the SESSION EVIDENCE supplied for that section?

TWO TESTS DECIDE WHETHER A CLAIM IS EVEN IN SCOPE. Apply both before judging
anything. A claim that fails either test is out of scope and passes.

TEST 1 — DOES THE CLAIM LOCATE THE EVENT IN AN EVALUATOR-CONDUCTED ENCOUNTER?
A claim is in scope ONLY if it locates the event inside an encounter the
evaluator conducted as part of this evaluation: a testing administration, or a
direct observation session. Assertions about the classroom, the home, or any
other setting are OUT OF SCOPE regardless of phrasing and regardless of who
reports them.

The encounter decides, not the setting name. An evaluator's own classroom
observation IS an evaluation encounter — "during the observation Avery left
his seat four times" is in scope. A general claim about how the student
functions in class is NOT, even though both mention a classroom.

  Out of scope by this test:
    "comprehension improves markedly when text is read aloud to him"
    "the teacher reported he needed directions repeated during independent work"
    "he requires frequent breaks at home"
    "reading is effortful for him"          (names no encounter)
  In scope by this test:
    "during testing he asked for directions to be repeated"
    "Avery required frequent breaks across the two testing sessions"

You cannot see the rest of the case file. A claim you cannot locate in an
evaluator-conducted encounter may well be documented somewhere you were not
given. That is somebody else's problem. Do not guess, and do not flag it.

TEST 2 — TASK DEMAND, OR ASSERTED BEHAVIOR?
Naming what a task requires is not asserting that anyone watched the examinee
do it. Describing the demand, the item type, or the difficulty of a task is a
statement about the MEASURE. Describing the examinee performing an action is a
statement about the SESSION.

The line is whether the examinee is the actor. A gerund or nominal naming the
activity describes the measure; a finite verb with the examinee as subject
asserts an observed event.

  Task demand — out of scope:
    "sounding out unfamiliar letter strings proved similarly difficult"
    "reading words in isolation was as effortful as decoding nonwords"
    "the task required blending sounds into whole words"
  Asserted behavior — in scope:
    "Avery sounded out unfamiliar letter strings"
    "Avery read the words aloud slowly"
    "he self-corrected on several items"

WHAT COUNTS AS A SESSION EVENT (in scope, once both tests are passed)
Anything asserted about what happened during an evaluation encounter the
evaluator conducted — a testing administration or a direct observation:

  - administration mechanics: which items or tasks were given, how many items
    were attempted or answered, whether a discontinue, basal, or ceiling rule
    was reached, timing, order, breaks, whether a task was completed or
    abandoned, accommodations used, re-administration;
  - examinee behavior during the encounter: attention, effort, persistence,
    engagement, motivation, frustration, fatigue, cooperation, affect,
    response style, self-correction, asking for repetition, giving up;
  - examiner action: prompting, repeating or rephrasing directions,
    encouragement, redirection, breaks offered, support provided;
  - session conditions: setting, interruptions, time of day, rapport, pacing.

WHAT IS OUT OF SCOPE — DO NOT FLAG ANY OF THIS
  - Writing quality, organization, tone, register, length, repetition.
  - Whether an interpretation, inference, or recommendation is warranted.
  - Whether scores, rating results, history, or record content are accurate or
    supported. That is another system's job, not yours.
  - Anything about behavior OUTSIDE an evaluator-conducted encounter —
    classroom behavior, home behavior, developmental history — whoever reports
    it and whether or not it is attributed. Out of scope even if you cannot
    verify it. (Test 1.)
  - Descriptions of PERFORMANCE rather than of the session: what the student
    can and cannot do, relative strengths and weaknesses, accuracy, rate,
    patterns across measures, comparisons between kinds of items. A result is
    not a session event. "Unfamiliar words were harder than familiar words" is
    a result. "The student sounded out unfamiliar words aloud" is a session
    event. (Test 2.)
  - The ABSENCE of session detail. A section that says nothing about the
    session is correct, not deficient. Never ask for more.

If it is not a session event, it passes. Silence is the correct answer for
everything except the one question above.

HOW TO JUDGE A STATEMENT THAT IS IN SCOPE

1. DOCUMENTED? Find the supplied evidence that documents it. If no supplied
   evidence documents it, it is unsupported. If NO session evidence was
   supplied at all, then every in-scope statement is unsupported.

2. SCOPE DOES NOT TRANSFER. Evidence documenting one session dimension does
   not license assertions about another. A note about rapport does not support
   a claim about prompting. A note about effort does not support a claim about
   item counts. An ADMINISTRATION RECORD documents only THAT measures were
   administered — it never supports a claim about how the session went, what
   the examiner did, how the student behaved, how many items were attempted,
   or whether any discontinue, basal, or ceiling rule was reached.

3. PARAPHRASE YES, DISTORTION NO. Prose may summarize or naturally rephrase
   documented evidence. It may not materially change documented frequency,
   intensity, duration, certainty, or valence. Where the evidence states those
   dimensions explicitly, the paraphrase must preserve them. "Asked once for a
   direction to be repeated" does not become "frequently asked for directions
   to be repeated." "Settled after a brief pause" does not become "struggled
   to engage." A faithful rewording is not a finding — do not flag it.

4. HEDGING IS NOT A BASIS. "May have," "appeared to," "seemed to," "possibly,"
   "consistent with," and conditional constructions fail identically to direct
   assertions. Qualification reduces certainty; it does not create an
   evidentiary basis. "Avery may have reached the discontinue criterion" is
   exactly as unsupported as "Avery reached the discontinue criterion."

5. IMPLICATION COUNTS. A statement that only makes sense if an undocumented
   session event occurred is an assertion of that event.

REPORTING
Call the report_session_fidelity tool exactly once. Nothing else.

  pass                   true only if NO in-scope unsupported statement exists.
  unsupportedStatements  each offending statement, copied VERBATIM from the
                         SECTION TEXT — exact characters, no ellipsis, no
                         paraphrase, no added quotation marks. Quote the
                         smallest span that carries the unsupported claim.
                         Empty when pass is true.
  reason                 one or two sentences: which session dimension was
                         asserted and what the supplied evidence does or does
                         not document. When pass is true, state briefly that no
                         undocumented session event was asserted.

A quote that is not character-for-character present in the SECTION TEXT is
discarded and the section is failed for an unusable result. Copy exactly.
`.trim();

const TOOL: Anthropic.Beta.BetaTool = {
  name: "report_session_fidelity",
  description:
    "Report whether the section asserts testing-session events not documented in the supplied session evidence.",
  // Server-side schema validation. It narrows the unparseable window; it does
  // not close it, so `validateAdjudication` still runs on every result.
  strict: true,
  input_schema: {
    type: "object",
    // Required by `strict: true` — the API rejects a strict object schema
    // without it.
    additionalProperties: false,
    properties: {
      pass: {
        type: "boolean",
        description: "True only if no in-scope unsupported statement exists.",
      },
      unsupportedStatements: {
        type: "array",
        items: { type: "string" },
        description: "Verbatim spans copied from the section text. Empty when pass is true.",
      },
      reason: { type: "string", description: "One or two sentences." },
    },
    required: ["pass", "unsupportedStatements", "reason"],
  },
};

const Result = z.object({
  pass: z.boolean(),
  unsupportedStatements: z.array(z.string()),
  reason: z.string().min(1),
});

/* ------------------------------------------------------------------ *
 * Result shape
 * ------------------------------------------------------------------ */

export interface AdjudicationProvenance {
  requestedModel: string;
  servingModel: string | null;
  promptVersion: string;
  specVersion: string;
  effort: string;
  inputTokens: number | null;
  outputTokens: number | null;
  at: string;
}

/**
 * `verdict` distinguishes the two ways a section fails, because they are
 * remediated differently: `failed` names statements and earns one targeted
 * regeneration; `unusable` (error, refusal, unparseable, ungrounded) has no
 * statement to instruct against and goes straight to needs-review.
 */
export interface Adjudication {
  verdict: "passed" | "failed" | "unusable";
  pass: boolean;
  unsupportedStatements: string[];
  reason: string;
  provenance: AdjudicationProvenance;
}

export interface AdjudicatorInput {
  sectionKey: string;
  sectionTitle: string;
  content: string;
  evidence: SessionEvidenceItem[];
}

/** Adjudicator seam — the deterministic tests substitute this. */
export type Adjudicate = (input: AdjudicatorInput) => Promise<Adjudication>;

const provenance = (
  servingModel: string | null,
  inputTokens: number | null = null,
  outputTokens: number | null = null
): AdjudicationProvenance => ({
  requestedModel: ADJUDICATOR_MODEL,
  servingModel,
  promptVersion: ADJUDICATOR_PROMPT_VERSION,
  specVersion: ADJUDICATOR_SPEC_VERSION,
  effort: ADJUDICATOR_EFFORT,
  inputTokens,
  outputTokens,
  at: new Date().toISOString(),
});

const unusable = (reason: string, p: AdjudicationProvenance): Adjudication => ({
  verdict: "unusable",
  pass: false,
  unsupportedStatements: [],
  reason,
  provenance: p,
});

/** Whitespace-normalized containment — the grounding guard's comparison. */
const normalize = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Validate a returned result against the section it judged. Separated from
 * the call so the deterministic tests can exercise every fail-closed branch
 * without a network.
 */
export function validateAdjudication(
  raw: unknown,
  content: string,
  p: AdjudicationProvenance
): Adjudication {
  const parsed = Result.safeParse(raw);
  if (!parsed.success) {
    return unusable(
      `The session-fidelity check returned output that did not match its contract (${parsed.error.issues[0]?.message ?? "schema violation"}).`,
      p
    );
  }
  const { pass, unsupportedStatements, reason } = parsed.data;

  // Internal coherence. Either half of a contradiction could be the true one,
  // so neither is trusted.
  if (pass && unsupportedStatements.length > 0) {
    return unusable(
      "The session-fidelity check passed the section while also listing unsupported statements; the result is contradictory and was not trusted.",
      p
    );
  }
  if (!pass && unsupportedStatements.length === 0) {
    return unusable(
      "The session-fidelity check failed the section without naming any statement; the result is unusable.",
      p
    );
  }

  // Evidence grounding: a quote that is not in the document is a fabricated
  // finding. Same guard the QA Engine applies to Layer B, applied to the
  // judge — except that here it fails the section rather than dropping the
  // finding, because a judge that misquotes has not been trusted to judge.
  const haystack = normalize(content);
  const ungrounded = unsupportedStatements.filter((s) => !haystack.includes(normalize(s)));
  if (ungrounded.length > 0) {
    return unusable(
      `The session-fidelity check quoted text that does not appear in the section (${ungrounded.length} of ${unsupportedStatements.length} quotes), so its result was not trusted.`,
      p
    );
  }

  return {
    verdict: pass ? "passed" : "failed",
    pass,
    unsupportedStatements,
    reason,
    provenance: p,
  };
}

/**
 * Run the gate. Never throws: every failure mode resolves to a non-passing
 * Adjudication, so no caller can accidentally treat an exception as a pass.
 *
 * Note the absence of a refusal fallback. Drafting carries one (generate.ts)
 * so a declined request does not surface as an empty draft; a safeguard must
 * not silently swap the model doing the judging, so a refusal here fails
 * closed instead.
 */
export async function adjudicateSessionFidelity(
  input: AdjudicatorInput,
  anthropic?: Anthropic
): Promise<Adjudication> {
  let client: Anthropic;
  try {
    client = anthropic ?? new Anthropic();
    if (!process.env.ANTHROPIC_API_KEY && !anthropic) {
      throw new Error("ANTHROPIC_API_KEY is not set (server-only).");
    }
  } catch (e) {
    return unusable(
      `The session-fidelity check could not be started (${(e as Error).message}).`,
      provenance(null)
    );
  }

  const user = [
    renderSessionEvidence(input.evidence),
    `SECTION TEXT — "${input.sectionTitle}"\n${input.content}`,
  ].join("\n\n---\n\n");

  try {
    const stream = client.beta.messages.stream({
      model: ADJUDICATOR_MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: ADJUDICATOR_EFFORT },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: user }],
    });
    const message = await stream.finalMessage();
    const p = provenance(
      message.model,
      message.usage?.input_tokens ?? null,
      message.usage?.output_tokens ?? null
    );

    if (message.stop_reason === "refusal") {
      return unusable("The session-fidelity check declined to evaluate this section.", p);
    }

    const call = message.content.find(
      (b): b is Anthropic.Beta.BetaToolUseBlock =>
        b.type === "tool_use" && b.name === TOOL.name
    );
    if (!call) {
      return unusable("The session-fidelity check returned no verdict.", p);
    }
    return validateAdjudication(call.input, input.content, p);
  } catch (e) {
    return unusable(
      `The session-fidelity check could not be completed (${(e as Error).message}).`,
      provenance(null)
    );
  }
}
