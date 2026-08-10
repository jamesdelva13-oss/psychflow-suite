/**
 * verify-migration-0009.mjs — execute migration 0009 against a real Postgres
 * (PGlite, PG 18) BEFORE the DDL is applied to any instance, and prove the
 * properties it is supposed to have — plus the negative controls that show
 * each constraint actually bites.
 *
 *   node tools/verify-migration-0009.mjs
 *
 * Why this exists: D-141 says a safeguard is code that can reject. A CHECK
 * constraint nobody has executed is a claim about a safeguard, not a
 * safeguard. This runs the real DDL and tries to violate every rule it
 * asserts.
 *
 * The RLS/grant block is stripped: it needs Supabase's `auth.uid()` and the
 * `authenticated` role, neither of which exists here. Everything stripped is
 * printed, so nothing is silently skipped.
 */

import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SQL_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations", "0009_report_sections.sql");

const full = readFileSync(SQL_PATH, "utf8");

// Strip from the RLS header to the end.
const rlsAt = full.indexOf("-- RLS — readable and writable only within the caller's own cases");
const head = rlsAt === -1 ? full : full.slice(0, full.lastIndexOf("---------------------------------------------------------------------------", rlsAt));
const stripped = full.slice(head.length);

const db = await PGlite.create();

let pass = 0;
let fail = 0;

const ok = (name, extra = "") => { pass++; console.log(`  PASS  ${name}${extra ? ` — ${extra}` : ""}`); };
const bad = (name, why) => { fail++; console.log(`  FAIL  ${name} — ${why}`); };

/** Expect a statement to succeed. */
async function expectOk(name, sql, params = []) {
  try {
    const r = await db.query(sql, params);
    ok(name);
    return r;
  } catch (e) {
    bad(name, e.message);
    return null;
  }
}

/** Expect a statement to be REFUSED, optionally matching the message. */
async function expectRefused(name, sql, params = [], match) {
  try {
    await db.query(sql, params);
    bad(name, "the database ACCEPTED it");
  } catch (e) {
    if (match && !new RegExp(match, "i").test(e.message)) {
      bad(name, `refused, but for the wrong reason: ${e.message}`);
    } else {
      ok(name, e.message.split("\n")[0].slice(0, 90));
    }
  }
}

console.log("Migration 0009 — executed against PostgreSQL 18 (PGlite)\n");
console.log(`Stripped for this harness (Supabase-only): ${stripped.split("\n").filter((l) => l.trim().startsWith("create policy") || l.trim().startsWith("alter table") || l.trim().startsWith("grant")).length} RLS/grant statements.\n`);

// Stub the one foreign-key parent the migration references.
await db.exec(`create table cases (id uuid primary key);`);
const CASE_ID = "11111111-1111-4111-8111-111111111111";
await db.exec(`insert into cases (id) values ('${CASE_ID}');`);

console.log("═".repeat(76));
console.log("0 · THE MIGRATION RUNS");
console.log("═".repeat(76));
try {
  await db.exec(head);
  ok("migration 0009 executes without error");
} catch (e) {
  bad("migration 0009 executes", e.message);
  console.log("\nCannot continue.");
  process.exit(1);
}

const gen = async (over = {}) => {
  const base = {
    case_id: CASE_ID,
    section_key: "assessment-results",
    mode: "DESCRIPTIVE_RESULTS",
    content: "Word reading was an area of difficulty.",
    attempt: 1,
    supersedes_generation_id: null,
    generated_by: JSON.stringify({ servingModel: "claude-opus-5" }),
    prompt_version: "psychreport-drafting-prompts-v2.2",
    spec_version: "operational-spec-v1",
    evidence_snapshot: JSON.stringify({ caseData: "…" }),
    source_ids: JSON.stringify(["src-1"]),
    gate_mode: "enforce",
    gate_spec: "session-fidelity-adjudicator-v1",
    gate_outcome: "passed",
    would_enforce: "passed",
    adjudicator: JSON.stringify({ requestedModel: "claude-opus-5" }),
    adjudication: JSON.stringify({ verdict: "passed", unsupportedStatements: [], reason: "clean" }),
    rejection_reason: null,
    ...over,
  };
  const cols = Object.keys(base);
  const vals = cols.map((_, i) => `$${i + 1}`);
  const r = await db.query(
    `insert into report_section_generations (${cols.join(",")}) values (${vals.join(",")}) returning id`,
    Object.values(base)
  );
  return r.rows[0].id;
};

const section = async (over = {}) => {
  const base = {
    case_id: CASE_ID,
    section_key: "assessment-results",
    mode: "DESCRIPTIVE_RESULTS",
    blocks: JSON.stringify([{ kind: "prose", text: "Word reading was an area of difficulty." }]),
    generation_id: null,
    status: "proposed",
    version: 1,
    supersedes_id: null,
    ...over,
  };
  const cols = Object.keys(base);
  const vals = cols.map((_, i) => `$${i + 1}`);
  const r = await db.query(
    `insert into report_sections (${cols.join(",")}) values (${vals.join(",")}) returning id`,
    Object.values(base)
  );
  return r.rows[0].id;
};

/* ------------------------------------------------------------------ */
console.log("\n" + "═".repeat(76));
console.log("7a · A CLINICIAN-AUTHORED SECTION WITH NO GENERATION INSERTS CLEANLY");
console.log("═".repeat(76));

await expectOk(
  "human-authored section, generation_id null",
  `insert into report_sections (case_id, section_key, mode, blocks, generation_id, status)
   values ($1, 'background', 'SOURCE_FAITHFUL',
           '[{"kind":"prose","text":"The clinician wrote this from scratch."}]'::jsonb, null, 'accepted')`,
  [CASE_ID]
);
{
  const r = await db.query(
    `select count(*)::int n from report_sections where generation_id is null and section_key='background'`
  );
  r.rows[0].n === 1
    ? ok("it is stored, and carries no machine provenance to fabricate")
    : bad("human row stored", `found ${r.rows[0].n}`);
}

/* ------------------------------------------------------------------ */
console.log("\n" + "═".repeat(76));
console.log("7d · THE DISCRIMINATOR IS STRUCTURAL — A GENERATION IMPLIES A VERDICT");
console.log("═".repeat(76));

await expectRefused(
  "a generation cannot be inserted without a gate outcome",
  `insert into report_section_generations
     (case_id, section_key, mode, content, generated_by, prompt_version, spec_version,
      evidence_snapshot, gate_mode, gate_spec, would_enforce, adjudicator, adjudication)
   values ($1,'assessment-results','DESCRIPTIVE_RESULTS','x','{}','p','s','{}','enforce','g','passed','{}','{}')`,
  [CASE_ID],
  "gate_outcome"
);
await expectRefused(
  "a generation cannot be inserted without an adjudication",
  `insert into report_section_generations
     (case_id, section_key, mode, content, generated_by, prompt_version, spec_version,
      evidence_snapshot, gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator)
   values ($1,'assessment-results','DESCRIPTIVE_RESULTS','x','{}','p','s','{}','enforce','g','passed','passed','{}')`,
  [CASE_ID],
  "adjudication"
);
await expectRefused(
  "a generation cannot be inserted without the gate mode",
  `insert into report_section_generations
     (case_id, section_key, mode, content, generated_by, prompt_version, spec_version,
      evidence_snapshot, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication)
   values ($1,'assessment-results','DESCRIPTIVE_RESULTS','x','{}','p','s','{}','g','passed','passed','{}','{}')`,
  [CASE_ID],
  "gate_mode"
);
{
  const r = await db.query(`
    select count(*)::int n from information_schema.columns
     where table_name='report_sections'
       and column_name in ('origin','is_generated','machine_written','generated_by','adjudication')`);
  r.rows[0].n === 0
    ? ok("report_sections carries NO settable machine flag", "no origin/is_generated/provenance columns exist")
    : bad("no machine flag on report_sections", `${r.rows[0].n} such column(s) exist`);
}

const passedGen = await gen();
await expectOk("a section may reference a verdict-carrying generation", `select 1`);
const generatedSectionId = await section({ generation_id: passedGen });
ok("generated section row created", generatedSectionId.slice(0, 8));

await expectRefused(
  "a section cannot present text that differs from what was adjudicated",
  `insert into report_sections (case_id, section_key, mode, blocks, generation_id)
   values ($1,'assessment-results','DESCRIPTIVE_RESULTS',
           '[{"kind":"prose","text":"Something the gate never saw."}]'::jsonb, $2)`,
  [CASE_ID, passedGen],
  "differs from its adjudicated generation"
);

/* ------------------------------------------------------------------ */
console.log("\n" + "═".repeat(76));
console.log("7b · A CLINICIAN EDIT PRESERVES THE ADJUDICATED TEXT, DISTINCT FROM CURRENT");
console.log("═".repeat(76));

const EDITED = "Word reading was an area of difficulty, and decoding was weaker still.";
await expectOk(
  "the edit inserts a NEW human version superseding the generated one",
  `insert into report_sections (case_id, section_key, mode, blocks, generation_id, status, version, supersedes_id)
   values ($1,'assessment-results','DESCRIPTIVE_RESULTS',
           jsonb_build_array(jsonb_build_object('kind','prose','text',$2::text)),
           null, 'accepted', 2, $3)`,
  [CASE_ID, EDITED, generatedSectionId]
);
await expectRefused(
  "the generated version is now frozen — the edit cannot overwrite it",
  `update report_sections set blocks = jsonb_build_array(jsonb_build_object('kind','prose','text',$1::text)) where id = $2`,
  ["overwritten", generatedSectionId],
  "superseded and immutable"
);
{
  const r = await db.query(
    `select g.content as adjudicated, report_section_prose(l.blocks) as current
       from report_section_generations g
       join report_sections_latest l on l.section_key = g.section_key and l.case_id = g.case_id
      where g.id = $1`,
    [passedGen]
  );
  const row = r.rows[0];
  row.adjudicated !== row.current && row.adjudicated === "Word reading was an area of difficulty."
    ? ok("adjudicated text and current text are both retrievable and distinct")
    : bad("adjudicated vs current", JSON.stringify(row));
}
await expectRefused(
  "the generation record itself is insert-only",
  `update report_section_generations set content = 'rewritten' where id = $1`,
  [passedGen],
  "insert-only"
);
await expectRefused(
  "a generation cannot be deleted",
  `delete from report_section_generations where id = $1`,
  [passedGen],
  "insert-only"
);

/* ------------------------------------------------------------------ */
console.log("\n" + "═".repeat(76));
console.log("7c · REJECTED AND UNUSABLE GENERATIONS PERSIST WITHOUT BECOMING CURRENT");
console.log("═".repeat(76));

const BAD_TEXT =
  "Across both tasks, Avery read a limited number of items correctly before reaching the discontinue criterion.";
const rejected = await gen({
  section_key: "interpretation",
  content: BAD_TEXT,
  gate_outcome: "rejected",
  would_enforce: "rejected",
  rejection_reason: "Asserts administration mechanics the evidence does not document.",
  adjudication: JSON.stringify({ verdict: "failed", unsupportedStatements: [BAD_TEXT], reason: "…" }),
});
ok("the refused draft is stored in full", `${BAD_TEXT.slice(0, 42)}…`);

await expectRefused(
  "a refused draft can never acquire a presented section row",
  `insert into report_sections (case_id, section_key, mode, blocks, generation_id)
   values ($1,'interpretation','INTEGRATED_INTERPRETATION',
           jsonb_build_array(jsonb_build_object('kind','prose','text',$2::text)),$3)`,
  [CASE_ID, BAD_TEXT, rejected],
  "gate-rejected generation"
);

const retry = await gen({
  section_key: "interpretation",
  content: "Reading comprehension was constrained by word-level difficulty.",
  attempt: 2,
  supersedes_generation_id: rejected,
  gate_outcome: "passed_after_retry",
  would_enforce: "passed_after_retry",
});
const retrySection = await section({
  section_key: "interpretation",
  mode: "INTEGRATED_INTERPRETATION",
  blocks: JSON.stringify([
    { kind: "prose", text: "Reading comprehension was constrained by word-level difficulty." },
  ]),
  generation_id: retry,
});
ok("the retry is presented instead", retrySection.slice(0, 8));

// Unusable generation, enforce mode → needs_review → surfaced as a proposal.
const unusable = await gen({
  section_key: "recommendations",
  mode: "RECOMMENDATION",
  content: "Provide explicit decoding instruction in a small group.",
  gate_outcome: "needs_review",
  would_enforce: "needs_review",
  rejection_reason: "The session-fidelity check could not be completed (503).",
  adjudication: JSON.stringify({ verdict: "unusable", unsupportedStatements: [], reason: "503" }),
});
const unusableSection = await section({
  section_key: "recommendations",
  mode: "RECOMMENDATION",
  blocks: JSON.stringify([
    { kind: "prose", text: "Provide explicit decoding instruction in a small group." },
  ]),
  generation_id: unusable,
});

{
  const latest = await db.query(`select section_key from report_sections_latest order by section_key`);
  const current = await db.query(`select section_key from report_sections_current order by section_key`);
  const latestKeys = latest.rows.map((r) => r.section_key);
  const currentKeys = current.rows.map((r) => r.section_key);

  !latestKeys.includes("__never__") && latestKeys.length === 4
    ? ok("report_sections_latest shows one version per section", latestKeys.join(", "))
    : bad("latest view", latestKeys.join(","));

  !currentKeys.includes("recommendations")
    ? ok("an unusable-gate generation is NOT the current section", `current = [${currentKeys.join(", ")}]`)
    : bad("current view", "an unusable generation became current");

  const rejectedPresent = await db.query(
    `select count(*)::int n from report_sections where generation_id = $1`, [rejected]
  );
  rejectedPresent.rows[0].n === 0
    ? ok("the rejected generation has no section row at all — it cannot be current by construction")
    : bad("rejected isolation", `${rejectedPresent.rows[0].n} section rows`);

  const stillThere = await db.query(
    `select count(*)::int n from report_section_generations where gate_outcome in ('rejected','needs_review')`
  );
  stillThere.rows[0].n === 2
    ? ok("both remain in history", "1 rejected + 1 needs_review")
    : bad("history", `${stillThere.rows[0].n} rows`);
}

await expectOk(
  "accepting the flagged section is what makes it current — an explicit act",
  `update report_sections set status='accepted', accepted_at=now() where id=$1`,
  [unusableSection]
);
{
  const r = await db.query(`select count(*)::int n from report_sections_current where section_key='recommendations'`);
  r.rows[0].n === 1
    ? ok("…and only then", "acceptance is logged as accepted_over_gate_finding by the action")
    : bad("acceptance", `${r.rows[0].n}`);
}

/* ------------------------------------------------------------------ */
console.log("\n" + "═".repeat(76));
console.log("BLOCKS — a section is an ordered array, validated by the database");
console.log("═".repeat(76));

await expectOk(
  "a section may interleave a rendered table with generated prose",
  `insert into report_sections (case_id, section_key, mode, blocks, generation_id, status)
   values ($1,'assessment-results','DESCRIPTIVE_RESULTS',
     jsonb_build_array(
       jsonb_build_object('kind','table','table','score_summary',
         'columns', jsonb_build_array('Subtest','SS','95% CI','%ile'),
         'rows', jsonb_build_array(jsonb_build_array('Word Reading','71','66-76','3'))),
       jsonb_build_object('kind','prose','text','Word reading was an area of difficulty.')
     ), $2, 'proposed')`,
  [CASE_ID, passedGen]
);
{
  const r = await db.query(
    `select report_section_prose(blocks) p, jsonb_array_length(blocks) n
       from report_sections where generation_id = $1 order by created_at desc limit 1`,
    [passedGen]
  );
  r.rows[0].n === 2 && r.rows[0].p === "Word reading was an area of difficulty."
    ? ok("the table sits beside the prose, and the prose still matches the adjudicated text")
    : bad("interleaved blocks", JSON.stringify(r.rows[0]));
}

await expectRefused(
  "an unrecognized block kind is refused",
  `insert into report_sections (case_id, section_key, mode, blocks)
   values ($1,'background','SOURCE_FAITHFUL','[{"kind":"sidebar","text":"x"}]'::jsonb)`,
  [CASE_ID],
  "blocks_shape"
);
await expectRefused(
  "a prose block with no text is refused",
  `insert into report_sections (case_id, section_key, mode, blocks)
   values ($1,'background','SOURCE_FAITHFUL','[{"kind":"prose","text":""}]'::jsonb)`,
  [CASE_ID],
  "blocks_shape"
);
await expectRefused(
  "a table block with no rows is refused",
  `insert into report_sections (case_id, section_key, mode, blocks)
   values ($1,'background','SOURCE_FAITHFUL','[{"kind":"table","table":"t"}]'::jsonb)`,
  [CASE_ID],
  "blocks_shape"
);
await expectRefused(
  "an empty block array is refused",
  `insert into report_sections (case_id, section_key, mode, blocks)
   values ($1,'background','SOURCE_FAITHFUL','[]'::jsonb)`,
  [CASE_ID],
  "blocks_shape"
);
await expectRefused(
  "blocks must be an array, not an object",
  `insert into report_sections (case_id, section_key, mode, blocks)
   values ($1,'background','SOURCE_FAITHFUL','{"kind":"prose","text":"x"}'::jsonb)`,
  [CASE_ID],
  "blocks_shape"
);
// The interesting case: prose that CONCATENATES to exactly the adjudicated
// text, split across two blocks with a table wedged between them. The
// prose-match trigger is satisfied — the characters are identical — so only
// the count constraint can catch it. Splitting adjudicated prose and
// interleaving rendered content changes what the clinician reads while
// passing every character-level check, which is why the constraint is not
// redundant with the trigger.
const splitGen = await gen({
  section_key: "background",
  mode: "SOURCE_FAITHFUL",
  content: "First paragraph.\n\nSecond paragraph.",
});
await expectRefused(
  "adjudicated prose cannot be split across two blocks, even when the text matches exactly",
  `insert into report_sections (case_id, section_key, mode, blocks, generation_id)
   values ($1,'background','SOURCE_FAITHFUL',
     jsonb_build_array(
       jsonb_build_object('kind','prose','text','First paragraph.'),
       jsonb_build_object('kind','table','table','t','rows', jsonb_build_array()),
       jsonb_build_object('kind','prose','text','Second paragraph.')
     ), $2)`,
  [CASE_ID, splitGen],
  "one_generated_prose"
);
{
  // Prove the trigger really was satisfied — i.e. the CHECK did the work.
  const r = await db.query(
    `select report_section_prose(
       jsonb_build_array(
         jsonb_build_object('kind','prose','text','First paragraph.'),
         jsonb_build_object('kind','prose','text','Second paragraph.')
       )) = 'First paragraph.' || chr(10) || chr(10) || 'Second paragraph.' as matches`
  );
  r.rows[0].matches
    ? ok("…and the character-level check alone would have let it through")
    : bad("prose concatenation", "expected the split text to reassemble exactly");
}
await expectRefused(
  "a generated section cannot present a SECOND prose block the gate never judged",
  `insert into report_sections (case_id, section_key, mode, blocks, generation_id)
   values ($1,'assessment-results','DESCRIPTIVE_RESULTS',
     jsonb_build_array(
       jsonb_build_object('kind','prose','text','Word reading was an area of difficulty.'),
       jsonb_build_object('kind','prose','text','And a second block the gate never judged.')
     ), $2)`,
  [CASE_ID, passedGen],
  "one_generated_prose|differs from its adjudicated generation"
);
await expectOk(
  "a HUMAN section may carry several prose blocks",
  `insert into report_sections (case_id, section_key, mode, blocks, status)
   values ($1,'recommendations','RECOMMENDATION',
     jsonb_build_array(
       jsonb_build_object('kind','prose','text','First recommendation.'),
       jsonb_build_object('kind','prose','text','Second recommendation.')
     ), 'accepted')`,
  [CASE_ID]
);

console.log("\n" + "═".repeat(76));
console.log("MODE INTEGRITY — a shadow verdict can never read as an enforced one");
console.log("═".repeat(76));

const shadowGen = await gen({
  section_key: "reason-for-referral",
  mode: "SOURCE_FAITHFUL",
  content: "The teacher referred Avery for reading concerns.",
  gate_mode: "shadow",
  gate_outcome: "shadow_would_reject",
  would_enforce: "needs_review",
  rejection_reason: "Would have been rejected: asserts an undocumented session event.",
  adjudication: JSON.stringify({ verdict: "failed", unsupportedStatements: ["x"], reason: "…" }),
});
ok("a shadow rejection is recorded with its own outcome value", "shadow_would_reject");

await expectRefused(
  "shadow cannot record an enforcement outcome",
  `insert into report_section_generations
     (case_id, section_key, mode, content, generated_by, prompt_version, spec_version, evidence_snapshot,
      gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication, rejection_reason)
   values ($1,'x','DESCRIPTIVE_RESULTS','t','{}','p','s','{}','shadow','g','needs_review','needs_review','{}','{}','r')`,
  [CASE_ID],
  "gen_outcome_matches_mode"
);
await expectRefused(
  "enforce cannot record a shadow outcome",
  `insert into report_section_generations
     (case_id, section_key, mode, content, generated_by, prompt_version, spec_version, evidence_snapshot,
      gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication, rejection_reason)
   values ($1,'x','DESCRIPTIVE_RESULTS','t','{}','p','s','{}','enforce','g','shadow_would_reject','needs_review','{}','{}','r')`,
  [CASE_ID],
  "gen_outcome_matches_mode"
);
await expectRefused(
  "shadow never regenerates",
  `insert into report_section_generations
     (case_id, section_key, mode, content, attempt, supersedes_generation_id, generated_by, prompt_version,
      spec_version, evidence_snapshot, gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication)
   values ($1,'x','DESCRIPTIVE_RESULTS','t',2,$2,'{}','p','s','{}','shadow','g','passed','passed','{}','{}')`,
  [CASE_ID, shadowGen],
  "gen_shadow_never_retries"
);
await expectRefused(
  "shadow cannot claim the retry it never ran would have cleared",
  `insert into report_section_generations
     (case_id, section_key, mode, content, generated_by, prompt_version, spec_version, evidence_snapshot,
      gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication, rejection_reason)
   values ($1,'x','DESCRIPTIVE_RESULTS','t','{}','p','s','{}','shadow','g','shadow_would_reject','passed_after_retry','{}','{}','r')`,
  [CASE_ID],
  "gen_shadow_counterfactual"
);

/* ------------------------------------------------------------------ */
console.log("\n" + "═".repeat(76));
console.log("RETRY BOUND — exactly one regeneration, enforced by the schema");
console.log("═".repeat(76));

await expectRefused(
  "a third attempt is impossible",
  `insert into report_section_generations
     (case_id, section_key, mode, content, attempt, supersedes_generation_id, generated_by, prompt_version,
      spec_version, evidence_snapshot, gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication)
   values ($1,'interpretation','INTEGRATED_INTERPRETATION','t',3,$2,'{}','p','s','{}','enforce','g','passed','passed','{}','{}')`,
  [CASE_ID, retry],
  "gen_retry_shape|attempt"
);
await expectRefused(
  "…and the attempt range itself is bounded, independently of the retry shape",
  `insert into report_section_generations
     (case_id, section_key, mode, content, attempt, generated_by, prompt_version,
      spec_version, evidence_snapshot, gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication)
   values ($1,'interpretation','INTEGRATED_INTERPRETATION','t',3,'{}','p','s','{}','enforce','g','passed','passed','{}','{}')`,
  [CASE_ID],
  "attempt_check|gen_retry_shape"
);
await expectRefused(
  "a second retry against the same refused draft is impossible",
  `insert into report_section_generations
     (case_id, section_key, mode, content, attempt, supersedes_generation_id, generated_by, prompt_version,
      spec_version, evidence_snapshot, gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication)
   values ($1,'interpretation','INTEGRATED_INTERPRETATION','t2',2,$2,'{}','p','s','{}','enforce','g','passed','passed','{}','{}')`,
  [CASE_ID, rejected],
  "uq_gen_one_retry"
);
await expectRefused(
  "a cleared generation cannot carry an outstanding rejection reason",
  `insert into report_section_generations
     (case_id, section_key, mode, content, generated_by, prompt_version, spec_version, evidence_snapshot,
      gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication, rejection_reason)
   values ($1,'x','DESCRIPTIVE_RESULTS','t','{}','p','s','{}','enforce','g','passed','passed','{}','{}','still bad')`,
  [CASE_ID],
  "gen_rejection_reason"
);
await expectRefused(
  "a refused generation must say why",
  `insert into report_section_generations
     (case_id, section_key, mode, content, generated_by, prompt_version, spec_version, evidence_snapshot,
      gate_mode, gate_spec, gate_outcome, would_enforce, adjudicator, adjudication)
   values ($1,'x','DESCRIPTIVE_RESULTS','t','{}','p','s','{}','enforce','g','needs_review','needs_review','{}','{}')`,
  [CASE_ID],
  "gen_rejection_reason"
);
await expectOk(
  "a review row is written",
  `insert into report_section_reviews (section_id, case_id, action, actor)
   values ($1,$2,'accepted',null)`,
  [retrySection, CASE_ID]
);
await expectRefused(
  "…and the approval history is append-only",
  `update report_section_reviews set action='dismissed'`,
  [],
  "append-only"
);
await expectRefused(
  "…and cannot be deleted",
  `delete from report_section_reviews`,
  [],
  "append-only"
);

console.log("\n" + "═".repeat(76));
console.log(`${pass} passed · ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
