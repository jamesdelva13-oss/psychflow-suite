/**
 * full-report.eval.ts — generate COMPLETE reports on the Avery fixture and
 * measure what the session-fidelity gate does across a whole document.
 *
 *   npm run eval:full-report --workspace @suite/psychreport -- --n=5
 *
 * PERIODIC, NOT CI. Real model, real money, non-deterministic.
 *
 * The §9.2 measurement drafted ONE section (Assessment results) repeatedly.
 * That answers "how often does this section fabricate," and it cannot answer
 * the question a deployment decision actually turns on: across a full report,
 * how many flags does a clinician see, in which sections, and how many
 * survive the one permitted regeneration.
 *
 * Every section runs in ENFORCE mode, so each record carries both numbers:
 *   attempt 1's verdict  — the unaided drafting rate (what shadow would log)
 *   final outcome        — what the clinician would actually have seen
 *
 * Observations is expected to REFUSE structurally on this fixture: the case
 * carries no observation source, and D-140's first enforcement point declines
 * to draft one from adjacent material. That refusal is a correct result, not a
 * failure, and it is reported as its own category rather than folded into
 * either pass or flag.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildCaseContext, type CaseRow, type SourceRow } from "../lib/case-context";
import { buildGenerationInputs } from "../lib/source-policy";
import { REPORT_PLAN } from "../lib/report-plan";
import { generateSection, type GenerationResult } from "../lib/generate";
import { draftingPromptVersion } from "../lib/prompts";
import { ADJUDICATOR_PROMPT_VERSION } from "../lib/adjudicator";
import { WIAT4_SCORE_SET } from "../../../tools/fixtures/avery-scores";

/* ------------------------------------------------------------------ *
 * The Avery fixture, in memory — the same material tools/seed-avery.ts
 * writes to the dev instance.
 * ------------------------------------------------------------------ */

const caseRow: CaseRow = {
  id: "avery-eval",
  psychologist_id: "eval-owner",
  state: "SC",
  eval_type: "initial",
  referral_date: "2026-04-20",
  status: "assessment",
  first_name: "Avery",
  last_initial: "W",
  display_initials: "A.W.",
  grade: "4",
  student_ref: "avery-williams-canonical-fixture",
  priority_flag: false,
  created_at: "2026-04-20T12:00:00Z",
  deleted_at: null,
};

const base: SourceRow = {
  id: "",
  case_id: "avery-eval",
  informant_id: null,
  kind: "referral_form",
  collected_on: "2026-04-28",
  instrument: null,
  bank_id: null,
  bank_version: null,
  payload: null,
  locked: true,
  checksum: "fixture",
  version: 1,
  supersedes_source_id: null,
  created_at: "2026-04-28T14:30:00Z",
  deleted_at: null,
};

/** Teacher intake on the pinned v1.3.0 bank — the reading-concern responses. */
const teacherRow: SourceRow = {
  ...base,
  id: "11111111-1111-4111-8111-111111111111",
  kind: "referral_form",
  bank_id: "teacher-intake",
  bank_version: "1.3.0",
  payload: {
    responses: {
      "TCH-RDG-006": "well_below",
      "TCH-RDG-007": "well_below",
      "TCH-GEN-001": "yes",
    },
  },
};

/** RIE Capture: clinician-authored teacher-interview summary. */
const captureRow: SourceRow = {
  ...base,
  id: "22222222-2222-4222-8222-222222222222",
  kind: "interview",
  instrument: "capture",
  collected_on: "2026-05-05",
  payload: {
    setting: "Union Elementary — teacher interview",
    occurredOn: "2026-05-05",
    summaryFinal: [
      "Teacher interview corroborates the referral concern: word-level reading (decoding of",
      "multisyllabic words, oral reading fluency) well below grade expectations, with",
      "comprehension improving markedly when text is read aloud. Tier 2 phonics group since",
      "October of third grade; teacher reports slow but real gains on explicitly taught",
      "patterns that do not yet generalize to unfamiliar text. Strengths: strong oral",
      "vocabulary, leads small-group science discussions, sought out by peers. No attendance,",
      "vision, or hearing concerns reported.",
    ].join(" "),
  },
};

const scoreRow: SourceRow = {
  ...base,
  id: "33333333-3333-4333-8333-333333333333",
  kind: "score_set",
  instrument: WIAT4_SCORE_SET.instrument,
  collected_on: WIAT4_SCORE_SET.administeredOn,
  payload: WIAT4_SCORE_SET,
};

const SOURCES = [teacherRow, captureRow, scoreRow];

/* ------------------------------------------------------------------ */

const arg = (name: string, dflt: string): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : dflt;
};

async function pool<T, R>(items: T[], width: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(width, items.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

type SectionOutcome =
  | "passed"
  | "passed_after_retry"
  | "needs_review"
  | "refused";

interface SectionRun {
  report: number;
  key: string;
  title: string;
  outcome: SectionOutcome;
  /** Attempt 1's verdict — the unaided rate. */
  firstVerdict: "passed" | "failed" | "unusable" | null;
  flaggedAtFirstDraft: boolean;
  retried: boolean;
  retryCleared: boolean | null;
  firstStatements: string[];
  finalStatements: string[];
  content: string;
  refusalReason: string | null;
  words: number;
  inTokens: number;
  outTokens: number;
}

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

async function runSection(report: number, planIndex: number): Promise<SectionRun> {
  const plan = REPORT_PLAN[planIndex];
  const inputs = buildGenerationInputs(buildCaseContext(caseRow, SOURCES), []);
  let result: GenerationResult;
  try {
    result = await generateSection({ inputs, plan, verifications: [], gateMode: "enforce" });
  } catch (e) {
    return {
      report, key: plan.key, title: plan.title, outcome: "refused",
      firstVerdict: null, flaggedAtFirstDraft: false, retried: false, retryCleared: null,
      firstStatements: [], finalStatements: [], content: "",
      refusalReason: `generation error: ${(e as Error).message}`,
      words: 0, inTokens: 0, outTokens: 0,
    };
  }

  if (result.status === "refused") {
    return {
      report, key: plan.key, title: plan.title, outcome: "refused",
      firstVerdict: null, flaggedAtFirstDraft: false, retried: false, retryCleared: null,
      firstStatements: [], finalStatements: [], content: "",
      refusalReason: result.reason, words: 0, inTokens: 0, outTokens: 0,
    };
  }

  const f = result.section.fidelity;
  const first = f.attempts[0].adjudication;
  const retried = f.attempts.length > 1;
  let inTok = 0;
  let outTok = 0;
  for (const a of f.attempts) {
    inTok += a.generatedBy.inputTokens + (a.adjudication.provenance.inputTokens ?? 0);
    outTok += a.generatedBy.outputTokens + (a.adjudication.provenance.outputTokens ?? 0);
  }

  return {
    report,
    key: plan.key,
    title: plan.title,
    outcome: f.outcome as SectionOutcome,
    firstVerdict: first.verdict,
    flaggedAtFirstDraft: first.verdict !== "passed",
    retried,
    retryCleared: retried ? f.outcome === "passed_after_retry" : null,
    firstStatements: first.unsupportedStatements,
    finalStatements: f.unsupportedStatements,
    content: result.section.content,
    refusalReason: null,
    words: words(result.section.content),
    inTokens: inTok,
    outTokens: outTok,
  };
}

/* ------------------------------------------------------------------ *
 * Readable output
 * ------------------------------------------------------------------ */

function renderReport(n: number, runs: SectionRun[], at: string): string {
  const lines: string[] = [];
  lines.push(`# Psychoeducational Evaluation — Avery W.`);
  lines.push("");
  lines.push(`Grade 4 · Initial evaluation · referred 2026-04-20`);
  lines.push("");
  lines.push(
    `*Machine-drafted ${at} · draft ${n} of the evaluation run · Claude Opus 5 · ` +
      `drafting prompts \`${draftingPromptVersion()}\` · session-fidelity gate ` +
      `\`${ADJUDICATOR_PROMPT_VERSION}\` in enforce mode. Synthetic case; no real student data. ` +
      `Nothing here has been accepted by a clinician.*`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const r of runs) {
    lines.push(`## ${r.title}`);
    lines.push("");
    if (r.outcome === "refused") {
      lines.push(`> **Not drafted.** ${r.refusalReason}`);
      lines.push("");
      continue;
    }
    lines.push(r.content.trim());
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Appendix — what the session-fidelity gate did");
  lines.push("");
  lines.push(
    "This appendix is not part of the report. It records what the D-140 gate found " +
      "in each section, so the prose above can be read against it."
  );
  lines.push("");
  for (const r of runs) {
    if (r.outcome === "refused") {
      lines.push(`**${r.title}** — refused before generation. ${r.refusalReason}`);
      lines.push("");
      continue;
    }
    if (!r.flaggedAtFirstDraft) {
      lines.push(`**${r.title}** — cleared on the first draft. ${r.words} words.`);
      lines.push("");
      continue;
    }
    lines.push(`**${r.title}** — flagged on the first draft:`);
    lines.push("");
    for (const s of r.firstStatements) lines.push(`- "${s}"`);
    lines.push("");
    if (r.retryCleared) {
      lines.push(
        "  The regeneration cleared the gate. The prose above is the rewritten version; " +
          "the clinician would have seen no notice."
      );
    } else {
      lines.push(
        "  The regeneration did **not** clear the gate. The prose above is what the " +
          "clinician would see, with these statements named:"
      );
      lines.push("");
      for (const s of r.finalStatements) lines.push(`  - "${s}"`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. This harness calls the real model.");
    process.exit(2);
  }
  const n = Math.max(1, Number(arg("n", "5")));
  const width = Math.max(1, Number(arg("concurrency", "5")));
  const outDir = arg("out", "");

  console.log("Full-report generation — Avery fixture");
  console.log(`drafting ${draftingPromptVersion()} · gate ${ADJUDICATOR_PROMPT_VERSION} · enforce`);
  console.log(`${n} complete reports × ${REPORT_PLAN.length} sections · concurrency ${width}`);
  console.log(`${new Date().toISOString()}\n`);

  const started = Date.now();
  const jobs: { report: number; planIndex: number }[] = [];
  for (let r = 1; r <= n; r++) {
    for (let p = 0; p < REPORT_PLAN.length; p++) jobs.push({ report: r, planIndex: p });
  }

  let done = 0;
  const runs = await pool(jobs, width, async (j) => {
    const out = await runSection(j.report, j.planIndex);
    done += 1;
    process.stdout.write(`\r  ${done}/${jobs.length} sections drafted…`);
    return out;
  });
  process.stdout.write("\r" + " ".repeat(40) + "\r");

  const at = new Date().toISOString();
  const byReport = (r: number) =>
    REPORT_PLAN.map((p) => runs.find((x) => x.report === r && x.key === p.key)!);

  /* ---- per-report ---- */
  console.log("═".repeat(78));
  console.log("FLAGS PER REPORT");
  console.log("═".repeat(78));
  console.log("  report   sections drafted   flagged at 1st draft   cleared on retry   reached clinician");
  console.log("  " + "─".repeat(74));
  for (let r = 1; r <= n; r++) {
    const rs = byReport(r);
    const drafted = rs.filter((x) => x.outcome !== "refused");
    const flagged = drafted.filter((x) => x.flaggedAtFirstDraft);
    const cleared = flagged.filter((x) => x.retryCleared);
    const reached = drafted.filter((x) => x.outcome === "needs_review");
    console.log(
      `  ${String(r).padStart(6)}   ${String(drafted.length).padStart(16)}   ` +
        `${String(flagged.length).padStart(20)}   ${String(cleared.length).padStart(16)}   ` +
        `${String(reached.length).padStart(17)}`
    );
  }

  /* ---- per-section ---- */
  console.log("");
  console.log("═".repeat(78));
  console.log("FLAGS PER SECTION (across all reports)");
  console.log("═".repeat(78));
  console.log("  section                              mode                    1st-draft flags   cleared   reached");
  console.log("  " + "─".repeat(74));
  for (const p of REPORT_PLAN) {
    const rs = runs.filter((x) => x.key === p.key);
    const refused = rs.filter((x) => x.outcome === "refused").length;
    if (refused === rs.length) {
      console.log(`  ${p.title.padEnd(36)} ${p.mode.padEnd(24)} refused structurally (${refused}/${rs.length})`);
      continue;
    }
    const drafted = rs.filter((x) => x.outcome !== "refused");
    const flagged = drafted.filter((x) => x.flaggedAtFirstDraft);
    const cleared = flagged.filter((x) => x.retryCleared).length;
    const reached = drafted.filter((x) => x.outcome === "needs_review").length;
    console.log(
      `  ${p.title.padEnd(36)} ${p.mode.padEnd(24)} ${String(`${flagged.length}/${drafted.length}`).padStart(15)}   ` +
        `${String(cleared).padStart(7)}   ${String(reached).padStart(7)}`
    );
  }

  /* ---- statements ---- */
  const allFlagged = runs.filter((x) => x.flaggedAtFirstDraft);
  if (allFlagged.length) {
    console.log("");
    console.log("═".repeat(78));
    console.log("WHAT THE GATE CAUGHT");
    console.log("═".repeat(78));
    for (const r of allFlagged) {
      console.log(`  [report ${r.report}] ${r.title} — ${r.retryCleared ? "cleared on retry" : "REACHED CLINICIAN"}`);
      for (const s of r.firstStatements) console.log(`    · "${s}"`);
    }
  }

  /* ---- aggregate ---- */
  const drafted = runs.filter((x) => x.outcome !== "refused");
  const flagged = drafted.filter((x) => x.flaggedAtFirstDraft);
  const cleared = flagged.filter((x) => x.retryCleared).length;
  const reached = drafted.filter((x) => x.outcome === "needs_review").length;
  const totalWords = drafted.reduce((a, x) => a + x.words, 0);
  const inTok = runs.reduce((a, x) => a + x.inTokens, 0);
  const outTok = runs.reduce((a, x) => a + x.outTokens, 0);

  console.log("");
  console.log("═".repeat(78));
  console.log(`  ${drafted.length} sections drafted across ${n} reports · ${totalWords} words · ~${Math.round(totalWords / n)} words per report`);
  console.log(`  flagged at first draft   ${flagged.length}/${drafted.length}  (${((flagged.length / drafted.length) * 100).toFixed(0)}% of sections)`);
  console.log(`  cleared on the retry     ${cleared}/${flagged.length}`);
  console.log(`  REACHED THE CLINICIAN    ${reached}/${drafted.length}  — ${(reached / n).toFixed(1)} notices per complete report`);
  console.log(`  ${((Date.now() - started) / 60000).toFixed(1)} min · ${inTok.toLocaleString()} in / ${outTok.toLocaleString()} out`);

  /* ---- files ---- */
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "full-report-runs.json"), JSON.stringify({ n, at, runs }, null, 2));

    // Hand over two contrasting drafts: the one with the most gate activity,
    // and a clean one. Reading a clean report and a flagged one side by side is
    // what makes the gate's cost and benefit legible.
    const score = (r: number) => byReport(r).filter((x) => x.flaggedAtFirstDraft).length;
    const ranked = Array.from({ length: n }, (_, i) => i + 1).sort((a, b) => score(b) - score(a));
    const busiest = ranked[0];
    const cleanest = ranked[ranked.length - 1];
    const picks = busiest === cleanest ? [busiest] : [busiest, cleanest];

    for (const r of picks) {
      const label = r === busiest && score(busiest) > 0 ? "flagged" : "clean";
      const file = join(outDir, `avery-report-${r}-${label}.md`);
      writeFileSync(file, renderReport(r, byReport(r), at));
      console.log(`  → ${file}`);
    }
    console.log(`  → ${join(outDir, "full-report-runs.json")}`);
  }
}

main().catch((e) => {
  console.error("\nHARNESS FAILURE:", e?.message ?? e);
  process.exit(1);
});
