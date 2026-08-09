/**
 * draft-section.ts — draft one report section against the Avery fixture and
 * print it. The generation half of VS-3 end to end, without the writer UI.
 *
 *   npm run draft --workspace @suite/psychreport -- <section-key>
 *
 * Section keys: reason-for-referral · background · observations ·
 * assessment-results · interpretation · recommendations
 *
 * Read-only: resolves the case, builds the policed inputs, calls the model,
 * prints the prose and its provenance. Writes nothing.
 */

import { createClient } from "@supabase/supabase-js";
import { resolveCaseContext } from "../apps/psychreport/lib/case-context";
import { buildGenerationInputs } from "../apps/psychreport/lib/source-policy";
import { listScoreVerifications } from "../apps/psychreport/lib/verifications";
import { planFor, REPORT_PLAN } from "../apps/psychreport/lib/report-plan";
import { generateSection } from "../apps/psychreport/lib/generate";

const FIXTURE_STUDENT_REF = "avery-williams-canonical-fixture";

async function main() {
  const key = process.argv[2] ?? "reason-for-referral";
  const plan = planFor(key);
  if (!plan) {
    console.error(`Unknown section "${key}". One of: ${REPORT_PLAN.map((p) => p.key).join(", ")}`);
    process.exit(2);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing Supabase env — run with --env-file=apps/psychreport/.env.local");
    process.exit(2);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    process.exit(2);
  }

  const svc = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: caseRow, error } = await svc
    .from("cases")
    .select("id")
    .eq("student_ref", FIXTURE_STUDENT_REF)
    .maybeSingle();
  if (error) throw error;
  if (!caseRow) {
    console.error("Avery fixture not found. Run tools/seed-avery.ts first.");
    process.exit(2);
  }

  const ctx = await resolveCaseContext(svc, caseRow.id as string);
  if (!ctx) {
    console.error("Case did not resolve.");
    process.exit(1);
  }
  const verifications = await listScoreVerifications(svc, ctx.caseId);
  const inputs = buildGenerationInputs(ctx, verifications);

  console.log(`Section: ${plan.title}  (mode ${plan.mode})`);
  console.log("Source ceilings on this case:");
  for (const s of inputs.sources) {
    console.log(`  ${s.label.padEnd(30)} ${s.ceiling}`);
  }
  console.log("\nDrafting…\n");

  const result = await generateSection({ inputs, plan, verifications });

  if (result.status === "refused") {
    console.log(`REFUSED — ${result.reason}`);
    return;
  }

  console.log("─".repeat(72));
  console.log(result.section.content);
  console.log("─".repeat(72));

  // The session-fidelity gate (D-140). `needs_review` means prose exists but
  // did not clear the gate after its one permitted regeneration — it is shown,
  // never silently deleted, with the unsupported statements named.
  const f = result.section.fidelity;
  if (result.status === "needs_review") {
    console.log(`NEEDS REVIEW — session-fidelity gate (${f.gate})`);
    console.log(`  ${result.reason}`);
    for (const s of result.unsupportedStatements) console.log(`  · "${s}"`);
  } else {
    console.log(
      `session-fidelity gate: ${f.outcome} (${f.attempts.length} attempt${f.attempts.length === 1 ? "" : "s"})`
    );
  }
  for (const a of f.attempts) {
    console.log(`  attempt ${a.attempt}: ${a.adjudication.verdict} — ${a.adjudication.reason}`);
  }

  const g = result.section.generatedBy;
  console.log(
    `served by ${g.servingModel} (requested ${g.requestedModel}) · effort ${g.effort} · ` +
      `${g.inputTokens} in / ${g.outputTokens} out · stop ${g.stopReason}`
  );
  console.log(`sources drawn on: ${result.section.sourceIds.length}`);
}

main().catch((e) => {
  console.error("DRAFT FAILURE:", e?.message ?? e);
  process.exit(1);
});
