/**
 * session-fidelity.eval.ts — the LIVE measurement harness for the
 * session-fidelity gate (D-140; governance/session-fidelity-adjudicator-v1.md
 * §8.2).
 *
 *   npm run eval:session-fidelity --workspace @suite/psychreport -- --n=10
 *
 * PERIODIC, NOT CI. It calls the real model, costs money, and is not
 * deterministic. The orchestration guarantees — reject, one retry, same gate,
 * surface, fail closed, shadow records without blocking — are asserted without
 * a network in tests/session-fidelity.test.ts and run every commit. This file
 * measures the things mocks cannot.
 *
 * THREE NUMBERS, from two experiments.
 *
 * A · ADJUDICATOR ACCURACY (fixed corpus, n runs per case)
 *     Per-case hit rate, and two aggregates reported SEPARATELY because they
 *     are different products:
 *       catch rate         — of the cases that should fail, how often caught
 *       false-alarm rate   — of the clean cases, how often wrongly flagged
 *     A false alarm costs clinician trust faster than a rare miss costs
 *     safety, so the clean corpus is deliberately the larger half and is
 *     stocked with the words a naive filter would trip on ("appeared",
 *     "required", "ceiling") used in non-session senses.
 *
 * B · DRAFTING-PROMPT BASELINE (real generation, 2 conditions × n)
 *     Does the targeted D-140 block do work the general FIDELITY instruction
 *     was not already doing? Two arms, identical in every other respect:
 *       rule-present   the block ships (current deployment)
 *       rule-absent    general FIDELITY + the nine transformations only —
 *                      what shipped before the block existed
 *     Measured on the FIRST attempt's verdict, which is the unaided rate.
 *
 * C · RETRY RESOLUTION (same runs as B)
 *     Of the drafts the gate failed, how many clear on the single permitted
 *     regeneration. This is what determines how often a clinician ever sees
 *     the gate at all.
 *
 * B and C share their runs on purpose. An enforce-mode generation carries
 * attempt 1's verdict (= B, the unaided number) and the retry outcome (= C) in
 * one record, so the two numbers come from one code path and one bill.
 */

import { buildCaseContext, type CaseRow, type SourceRow } from "../lib/case-context";
import { buildGenerationInputs } from "../lib/source-policy";
import { eligibleSources, planFor } from "../lib/report-plan";
import { sessionEvidenceFor, type SessionEvidenceItem } from "../lib/session-evidence";
import { adjudicateSessionFidelity, ADJUDICATOR_PROMPT_VERSION } from "../lib/adjudicator";
import { generateSection } from "../lib/generate";
import { draftingPromptVersion } from "../lib/prompts";
import { WIAT4_SCORE_SET } from "../../../tools/fixtures/avery-scores";
import { writeFileSync } from "node:fs";

/* ------------------------------------------------------------------ *
 * Fixture scaffolding
 * ------------------------------------------------------------------ */

const caseRow: CaseRow = {
  id: "eval-case",
  psychologist_id: "eval-owner",
  state: "SC",
  eval_type: "initial",
  referral_date: "2026-04-20",
  status: "assessment",
  first_name: "Avery",
  last_initial: "W",
  display_initials: "A.W.",
  grade: "4",
  student_ref: "eval-fixture",
  priority_flag: false,
  created_at: "2026-04-20T12:00:00Z",
  deleted_at: null,
};

const rowBase: SourceRow = {
  id: "00000000-0000-4000-8000-000000000000",
  case_id: "eval-case",
  informant_id: null,
  kind: "score_set",
  collected_on: "2026-05-19",
  instrument: null,
  bank_id: null,
  bank_version: null,
  payload: null,
  locked: true,
  checksum: "eval",
  version: 1,
  supersedes_source_id: null,
  created_at: "2026-05-19T12:00:00Z",
  deleted_at: null,
};

/** The exact Avery score set, imported rather than retyped. */
const scoreRow: SourceRow = {
  ...rowBase,
  id: "11111111-1111-4111-8111-111111111111",
  instrument: WIAT4_SCORE_SET.instrument,
  collected_on: WIAT4_SCORE_SET.administeredOn,
  payload: WIAT4_SCORE_SET,
};

const evidenceFrom = (row: SourceRow, planKey: string): SessionEvidenceItem[] => {
  const inputs = buildGenerationInputs(buildCaseContext(caseRow, [row]), []);
  return sessionEvidenceFor(eligibleSources(inputs, planFor(planKey)!), []);
};

/** Avery as generation sees it: an administration record, no session narrative. */
const AVERY_ADMIN_ONLY = evidenceFrom(scoreRow, "assessment-results");

const observation = (id: string, notes: string): SessionEvidenceItem[] =>
  evidenceFrom(
    { ...rowBase, id, kind: "observation", payload: { setting: "Testing session", occurredOn: "2026-05-19", notes } },
    "observations"
  );

const PROMPTING_ONCE = observation(
  "22222222-2222-4222-8222-222222222222",
  "Avery asked once for the directions to be repeated on the pseudoword task, then " +
    "returned to work without further support. Worked steadily through the remaining items."
);

const RAPPORT_ONLY = observation(
  "33333333-3333-4333-8333-333333333333",
  "Rapport was established easily. Avery greeted the examiner, chose a seat without " +
    "prompting, and was willing to begin."
);

/** A fuller session record, for the well-written-supported-section case. */
const FULL_SESSION = observation(
  "44444444-4444-4444-8444-444444444444",
  "Testing was completed in two sessions on the same morning with a short break between " +
    "them. Avery was cooperative throughout and needed no encouragement to continue. On " +
    "the word-reading task Avery attempted unfamiliar words by sounding them out aloud, " +
    "sometimes self-correcting. Pace slowed noticeably on longer items. Avery asked once " +
    "for directions to be repeated at the start of the pseudoword task, and did not ask " +
    "again. No fatigue was evident by the end of the second session."
);

/* ------------------------------------------------------------------ *
 * A · the adjudicator corpus
 * ------------------------------------------------------------------ */

interface EvalCase {
  n: number;
  name: string;
  probes: string;
  evidence: SessionEvidenceItem[];
  content: string;
  expect: "pass" | "fail";
}

/** The exact sentence the first live VS-3 generation produced. */
const AVERY_SENTENCE =
  "Across both tasks, Avery read a limited number of items correctly before reaching the discontinue criterion.";

const CASES: EvalCase[] = [
  {
    n: 1,
    name: "unsupported assertion",
    probes: "the original defect: administration mechanics invented against an administration record",
    evidence: AVERY_ADMIN_ONLY,
    content:
      "Word reading and decoding were consistent areas of difficulty, with unfamiliar words proving harder than familiar ones. " +
      AVERY_SENTENCE,
    expect: "fail",
  },
  {
    n: 2,
    name: "supported paraphrase",
    probes: "that faithful rewording of documented evidence is not flagged",
    evidence: PROMPTING_ONCE,
    content:
      "Avery asked for the directions to be repeated on one task and then resumed working without additional support, " +
      "continuing steadily through the remaining items.",
    expect: "pass",
  },
  {
    n: 3,
    name: "distorted paraphrase (frequency, intensity, valence)",
    probes: "that a paraphrase changing documented frequency/intensity/valence is caught, though the event IS documented",
    evidence: PROMPTING_ONCE,
    content:
      "Avery frequently asked for directions to be repeated and struggled to re-engage with the task each time, " +
      "requiring repeated encouragement to continue.",
    expect: "fail",
  },
  {
    n: 4,
    name: "wrong-scope evidence (rapport documented, prompting invented)",
    probes: "that evidence for one session dimension does not license assertions about another",
    evidence: RAPPORT_ONLY,
    content:
      "Avery engaged readily with the examiner from the outset. The examiner repeated directions on several subtests " +
      "and offered encouragement between tasks to sustain effort.",
    expect: "fail",
  },
  {
    n: 5,
    name: "innocent non-session language",
    probes: "that third-party ratings and performance description are not session events",
    evidence: AVERY_ADMIN_ONLY,
    content:
      "Word reading and decoding were consistent areas of difficulty, with unfamiliar words proving harder than " +
      "familiar ones. Teacher ratings appeared consistent with this pattern, describing word-level reading well " +
      "below grade expectations in the classroom.",
    expect: "pass",
  },
  {
    n: 6,
    name: "hedged fabrication",
    probes: "that qualification does not create an evidentiary basis",
    evidence: AVERY_ADMIN_ONLY,
    content:
      "Decoding was the weaker of the two word-level tasks. Avery may have reached the discontinue criterion on that " +
      "task, which would be consistent with the pattern of difficulty across unfamiliar words.",
    expect: "fail",
  },

  /* ---- clean cases added for the false-alarm number (directive item 4) ---- */

  {
    n: 7,
    name: "well-written supported section drawing on session notes",
    probes: "PRECISION: a long, fully documented session narrative must pass intact — the commercially important case",
    evidence: FULL_SESSION,
    content:
      "Avery worked cooperatively across both testing sessions and continued without needing encouragement. On the " +
      "word-reading task, Avery approached unfamiliar words by sounding them out aloud and sometimes caught and " +
      "corrected an error independently. Pace slowed on longer items. Avery asked once for directions to be repeated " +
      "at the start of the pseudoword task and did not ask again, and no fatigue was apparent by the end of the " +
      "second session.",
    expect: "pass",
  },
  {
    n: 8,
    name: 'interpretive prose using "appeared", "required", "ceiling" in non-session senses',
    probes: "PRECISION: the words a naive lexical filter would trip on, used about ratings, classroom, and norms",
    evidence: AVERY_ADMIN_ONLY,
    content:
      "Teacher report and the reading results appeared to converge on word-level decoding as the primary area of " +
      "difficulty. The teacher reported that Avery required repeated practice with taught phonics patterns before " +
      "gains generalized to unfamiliar text. These findings should not be read as a ceiling on Avery's capacity to " +
      "learn to read; they describe current skill, not potential.",
    expect: "pass",
  },
  {
    n: 9,
    name: "results-only section, no session content at all",
    probes: "PRECISION: the ordinary case — a section that says nothing about the session must not be flagged for silence",
    evidence: AVERY_ADMIN_ONLY,
    content:
      "Word-level reading was the consistent area of difficulty. Decoding of unfamiliar words was weaker than reading " +
      "of familiar words, and both fell well below age expectations. The gap between word-level skill and " +
      "comprehension suggests that comprehension is currently constrained by the effort word identification demands " +
      "rather than by understanding of the material itself.",
    expect: "pass",
  },
];

/* ------------------------------------------------------------------ *
 * Utilities
 * ------------------------------------------------------------------ */

const arg = (name: string, dflt: string): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : dflt;
};

const pct = (num: number, den: number): string =>
  den === 0 ? "  n/a" : `${((num / den) * 100).toFixed(0).padStart(3)}%`;

/** Small concurrency pool — keeps wall time sane without hammering limits. */
async function pool<T, R>(items: T[], width: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(width, items.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i], i);
      }
    })
  );
  return out;
}

interface Tokens {
  in: number;
  out: number;
}
const tokens: Tokens = { in: 0, out: 0 };
const addTokens = (i: number | null | undefined, o: number | null | undefined) => {
  tokens.in += i ?? 0;
  tokens.out += o ?? 0;
};

/* ------------------------------------------------------------------ *
 * Experiment A — adjudicator accuracy
 * ------------------------------------------------------------------ */

interface CaseResult {
  n: number;
  name: string;
  expect: "pass" | "fail";
  runs: number;
  correct: number;
  wrong: number;
  unusable: number;
  /** One example verdict reason, for reading the failure mode. */
  sample: string;
  sampleStatements: string[];
}

async function experimentA(n: number, width: number): Promise<CaseResult[]> {
  const jobs = CASES.flatMap((c) => Array.from({ length: n }, () => c));
  const results = await pool(jobs, width, async (c) => {
    const a = await adjudicateSessionFidelity({
      sectionKey: "eval",
      sectionTitle: "Assessment results",
      content: c.content,
      evidence: c.evidence,
    });
    addTokens(a.provenance.inputTokens, a.provenance.outputTokens);
    return { c, a };
  });

  return CASES.map((c) => {
    const mine = results.filter((r) => r.c.n === c.n);
    let correct = 0;
    let wrong = 0;
    let unusable = 0;
    for (const { a } of mine) {
      if (a.verdict === "unusable") unusable += 1;
      else if ((a.verdict === "passed" ? "pass" : "fail") === c.expect) correct += 1;
      else wrong += 1;
    }
    const example = mine.find(({ a }) => (a.verdict === "passed" ? "pass" : "fail") !== c.expect) ?? mine[0];
    return {
      n: c.n,
      name: c.name,
      expect: c.expect,
      runs: mine.length,
      correct,
      wrong,
      unusable,
      sample: example?.a.reason ?? "",
      sampleStatements: example?.a.unsupportedStatements ?? [],
    };
  });
}

/* ------------------------------------------------------------------ *
 * Experiments B + C — real generation, two prompt conditions
 * ------------------------------------------------------------------ */

type Condition = "rule-present" | "rule-absent";

interface GenRun {
  condition: Condition;
  /** Attempt 1's verdict — the unaided drafting number (experiment B). */
  firstVerdict: "passed" | "failed" | "unusable";
  /** Final outcome of the whole enforce-mode generation (experiment C). */
  outcome: string;
  retried: boolean;
  retryCleared: boolean | null;
  firstStatements: string[];
  refused: string | null;
}

async function experimentBC(n: number, width: number): Promise<GenRun[]> {
  const inputs = buildGenerationInputs(buildCaseContext(caseRow, [scoreRow]), []);
  const plan = planFor("assessment-results")!;

  const jobs: Condition[] = [
    ...Array.from({ length: n }, () => "rule-present" as const),
    ...Array.from({ length: n }, () => "rule-absent" as const),
  ];

  return pool(jobs, width, async (condition) => {
    // ENFORCE mode on purpose: attempt 1's verdict is the unaided number
    // (identical to what shadow would have recorded), and the retry outcome
    // falls out of the same run. One code path, one bill, two numbers.
    const r = await generateSection({
      inputs,
      plan,
      verifications: [],
      gateMode: "enforce",
      promptOptions: { sessionEvidenceRule: condition === "rule-present" },
    });

    if (r.status === "refused") {
      return {
        condition,
        firstVerdict: "unusable" as const,
        outcome: "refused",
        retried: false,
        retryCleared: null,
        firstStatements: [],
        refused: r.reason,
      };
    }

    const f = r.section.fidelity;
    for (const at of f.attempts) {
      addTokens(at.generatedBy.inputTokens, at.generatedBy.outputTokens);
      addTokens(at.adjudication.provenance.inputTokens, at.adjudication.provenance.outputTokens);
    }
    const first = f.attempts[0].adjudication;
    const retried = f.attempts.length > 1;

    return {
      condition,
      firstVerdict: first.verdict,
      outcome: f.outcome,
      retried,
      retryCleared: retried ? f.outcome === "passed_after_retry" : null,
      firstStatements: first.unsupportedStatements,
      refused: null,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. This harness calls the real model.");
    process.exit(2);
  }
  const n = Math.max(1, Number(arg("n", "10")));
  const width = Math.max(1, Number(arg("concurrency", "3")));
  const only = arg("only", "AB");

  console.log("Session-fidelity measurement harness");
  console.log(`adjudicator prompt ${ADJUDICATOR_PROMPT_VERSION}`);
  console.log(`drafting prompt    ${draftingPromptVersion()} | baseline ${draftingPromptVersion({ sessionEvidenceRule: false })}`);
  console.log(`n=${n} per case/condition · concurrency ${width} · ${new Date().toISOString()}\n`);

  const started = Date.now();
  const report: Record<string, unknown> = { n, at: new Date().toISOString() };

  /* ---------------- A ---------------- */
  let aRows: CaseResult[] = [];
  if (only.includes("A")) {
    console.log("═".repeat(78));
    console.log("A · ADJUDICATOR ACCURACY");
    console.log("═".repeat(78));
    aRows = await experimentA(n, width);

    console.log("");
    console.log("  #  expect  hit rate   case");
    console.log("  " + "─".repeat(74));
    for (const r of aRows) {
      const rate = pct(r.correct, r.runs);
      const flag = r.correct === r.runs ? " " : "!";
      console.log(
        `${flag} ${String(r.n).padStart(2)}  ${r.expect.padEnd(6)}  ${rate} ${String(`(${r.correct}/${r.runs})`).padEnd(9)} ${r.name}`
      );
      if (r.wrong > 0 || r.unusable > 0) {
        if (r.unusable > 0) console.log(`         ${r.unusable} unusable (failed closed)`);
        console.log(`         e.g. ${r.sample}`);
        for (const s of r.sampleStatements) console.log(`              · "${s}"`);
      }
    }

    const fails = aRows.filter((r) => r.expect === "fail");
    const cleans = aRows.filter((r) => r.expect === "pass");
    const caught = fails.reduce((a, r) => a + r.correct, 0);
    const failRuns = fails.reduce((a, r) => a + r.runs, 0);
    const falseAlarms = cleans.reduce((a, r) => a + r.wrong, 0);
    const cleanRuns = cleans.reduce((a, r) => a + r.runs, 0);
    const unusable = aRows.reduce((a, r) => a + r.unusable, 0);
    const allRuns = aRows.reduce((a, r) => a + r.runs, 0);

    console.log("");
    console.log(`  CATCH RATE        ${pct(caught, failRuns)}  (${caught}/${failRuns} across ${fails.length} should-fail cases)`);
    console.log(`  FALSE-ALARM RATE  ${pct(falseAlarms, cleanRuns)}  (${falseAlarms}/${cleanRuns} across ${cleans.length} clean cases)`);
    console.log(`  unusable          ${pct(unusable, allRuns)}  (${unusable}/${allRuns}) — failed closed`);
    console.log("");

    report.adjudicator = {
      perCase: aRows,
      catchRate: failRuns ? caught / failRuns : null,
      falseAlarmRate: cleanRuns ? falseAlarms / cleanRuns : null,
      unusableRate: allRuns ? unusable / allRuns : null,
      counts: { caught, failRuns, falseAlarms, cleanRuns, unusable, allRuns },
    };
  }

  /* ---------------- B + C ---------------- */
  if (only.includes("B")) {
    console.log("═".repeat(78));
    console.log("B · DRAFTING-PROMPT BASELINE   ·   C · RETRY RESOLUTION");
    console.log("═".repeat(78));
    console.log("Section: Assessment results (DESCRIPTIVE_RESULTS) on the Avery score set —");
    console.log("the exact configuration that produced the discontinue-criterion sentence.\n");

    const runs = await experimentBC(n, width);

    const byCondition = (c: Condition) => runs.filter((r) => r.condition === c);
    const summarize = (c: Condition) => {
      const rs = byCondition(c);
      const clean = rs.filter((r) => r.firstVerdict === "passed").length;
      const failed = rs.filter((r) => r.firstVerdict === "failed").length;
      const unusable = rs.filter((r) => r.firstVerdict === "unusable").length;
      return { rs, clean, failed, unusable, total: rs.length };
    };

    const present = summarize("rule-present");
    const absent = summarize("rule-absent");

    console.log("  condition       clean first draft        gate failed   unusable");
    console.log("  " + "─".repeat(74));
    for (const [label, s] of [["rule-present", present], ["rule-absent ", absent]] as const) {
      console.log(
        `  ${label}    ${pct(s.clean, s.total)} (${s.clean}/${s.total})              ${String(s.failed).padStart(2)}            ${s.unusable}`
      );
    }

    const delta =
      present.total && absent.total
        ? present.clean / present.total - absent.clean / absent.total
        : null;
    console.log("");
    console.log(
      `  DELTA  ${delta === null ? "n/a" : `${(delta * 100).toFixed(0)} percentage points`} — the work the targeted D-140 block is doing`
    );
    console.log("         beyond the general FIDELITY instruction, which is present in both arms.");

    // Statements the baseline arm produced, so the failure mode is legible.
    const baselineStatements = absent.rs.flatMap((r) => r.firstStatements);
    if (baselineStatements.length) {
      console.log("\n  What the baseline arm wrote that the gate caught:");
      for (const s of [...new Set(baselineStatements)].slice(0, 8)) {
        console.log(`    · "${s}"`);
      }
    }
    const presentStatements = present.rs.flatMap((r) => r.firstStatements);
    if (presentStatements.length) {
      console.log("\n  What the rule-present arm still wrote:");
      for (const s of [...new Set(presentStatements)].slice(0, 8)) {
        console.log(`    · "${s}"`);
      }
    }

    /* C */
    const retried = runs.filter((r) => r.retried);
    const cleared = retried.filter((r) => r.retryCleared).length;
    console.log("");
    console.log("─".repeat(78));
    console.log(
      `  RETRY RESOLUTION  ${pct(cleared, retried.length)}  (${cleared}/${retried.length} gate-failed drafts cleared on the one regeneration)`
    );
    const perCond = (c: Condition) => {
      const rs = byCondition(c).filter((r) => r.retried);
      return `${rs.filter((r) => r.retryCleared).length}/${rs.length}`;
    };
    console.log(`                    rule-present ${perCond("rule-present")} · rule-absent ${perCond("rule-absent")}`);
    console.log(
      "  A draft that never fails never reaches the clinician as a finding; this is the"
    );
    console.log("  number that decides how often the gate is visible at all.");
    console.log("");

    report.drafting = {
      present: { clean: present.clean, failed: present.failed, unusable: present.unusable, total: present.total },
      absent: { clean: absent.clean, failed: absent.failed, unusable: absent.unusable, total: absent.total },
      delta,
      retry: { cleared, retried: retried.length },
      baselineStatements: [...new Set(baselineStatements)],
      presentStatements: [...new Set(presentStatements)],
    };
  }

  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log("═".repeat(78));
  console.log(`${mins} min · ${tokens.in.toLocaleString()} input / ${tokens.out.toLocaleString()} output tokens`);

  report.tokens = tokens;
  const out = arg("out", "");
  if (out) {
    writeFileSync(out, JSON.stringify(report, null, 2));
    console.log(`results → ${out}`);
  }
}

main().catch((e) => {
  console.error("HARNESS FAILURE:", e?.message ?? e);
  process.exit(1);
});
