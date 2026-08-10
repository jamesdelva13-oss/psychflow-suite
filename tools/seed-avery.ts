/**
 * seed-avery.ts — the Avery Williams canonical fixture (directive §6; VS-0
 * map §4 item 5; D-136).
 *
 *   node --env-file=apps/intake/.env.local --conditions=react-server \
 *     --import tsx tools/seed-avery.ts
 *
 * RE-RUNNABLE BY DESIGN. Per the D-136 attached condition the fixture is
 * disposable implementation data: every run deletes the previous fixture
 * case (audit rows included — disposability outranks audit accumulation for
 * this one synthetic case) and regenerates it from scratch. The planned
 * v1.6.1 bank migration is a re-run of this script against the new bank —
 * never an ad hoc edit of seeded rows.
 *
 * Bank pin: teacher-intake v1.3.0 (D-136 — the bank the app actually
 * serves). The teacher Source is produced by the SAME lockSubmission the
 * intake app uses, so payload shape and checksum are authentic, not
 * hand-rolled. The capture Source mirrors apps/intake/lib/capture-core.ts
 * finalizeCapture exactly (payload shape + deep canonical checksum).
 *
 * Capture summary is CLINICIAN-AUTHORED (summary_proposal null): the seed
 * fabricates no model-generation provenance for a summary no model wrote.
 * When the writer stages need a model-proposed summary on the fixture, the
 * re-seed runs the real summarize path instead of inventing its record.
 *
 * Contributor attribution (map item 4): a school_psychology profile bridged
 * to the owner's auth identity, plus a synthetic speech_language contributor
 * (no auth identity) assigned to the case, whose one activity is written
 * through apps/psychreport recordAttributedActivity — the real guarded code
 * path, not a raw insert.
 *
 * Synthetic data only. No real student data (directive §6).
 */

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { assertDevInstance } from "./assert-dev-instance.mjs";
import {
  AVERY_CASE,
  AVERY_INFORMANT,
  CAPTURE_NOTES,
  CAPTURE_PAYLOAD,
  CAPTURE_SUMMARY,
  COLLECTED_ON,
  FIXTURE_STUDENT_REF,
  TEACHER_RESPONSES,
  WIAT4_SCORE_SET,
} from "./fixtures/avery";
import { QuestionBank } from "@suite/case-model";
import { lockSubmission, canonicalChecksum as checksumOf } from "@suite/referral-engine-core";
import bank13raw from "@suite/content/banks/teacher-form.v1.3.0.json" with { type: "json" };
import { recordAttributedActivity } from "../apps/psychreport/lib/attribution";

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "jamesdelva13@gmail.com";

/* Checksums use the shared deep canonical algorithm from
 * @suite/referral-engine-core — the same code path the intake app's
 * lockSubmission and capture finalize use, so seeded Sources hash exactly as
 * app-produced ones do. */

/* THE FIXTURE ITSELF LIVES IN tools/fixtures/avery.ts and is imported above.
 * Nothing here defines case content. That is the process rule (JD,
 * 2026-08-09): eval harnesses read the canonical fixture and never construct
 * their own payloads — and the seed is held to the same standard, because a
 * fixture the seed defines privately is one a harness can only copy. */

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing Supabase env — run with --env-file=apps/intake/.env.local");
    process.exit(2);
  }
  // D-138 hard guard: the teardown below deletes rows. The student_ref scope
  // protects Avery's rows on the right instance; this protects the instance.
  const target = assertDevInstance(url, "seed-avery.ts (deletes the previous fixture case)");
  console.log(`Target instance verified: ${target}`);
  const svc = createClient(url, serviceKey, { auth: { persistSession: false } });

  // ---- Owner ---------------------------------------------------------------
  const { data: owner, error: ownerErr } = await svc
    .from("psychologists")
    .select("id, email")
    .eq("email", OWNER_EMAIL)
    .maybeSingle();
  if (ownerErr) throw ownerErr;
  if (!owner) {
    console.error(
      `No psychologists row for ${OWNER_EMAIL}. Sign in to intake once (or set SEED_OWNER_EMAIL).`
    );
    process.exit(2);
  }

  // ---- Tear down any previous fixture run (D-136 disposability) -----------
  const { data: oldCases, error: oldErr } = await svc
    .from("cases")
    .select("id")
    .eq("student_ref", FIXTURE_STUDENT_REF);
  if (oldErr) throw oldErr;
  for (const c of oldCases ?? []) {
    const { data: oldInvs } = await svc.from("invitations").select("id").eq("case_id", c.id);
    const invIds = (oldInvs ?? []).map((r: { id: string }) => r.id);
    if (invIds.length) await svc.from("draft_responses").delete().in("invitation_id", invIds);
    for (const table of [
      "claims",
      "evidence",
      "capture_sessions",
      "sources",
      "invitations",
      "informants",
      "case_assignments",
      "audit_events", // fixture-only: disposable data, audit rows included
    ]) {
      const { error } = await svc.from(table).delete().eq("case_id", c.id);
      if (error) throw new Error(`teardown ${table}: ${error.message}`);
    }
    const { error } = await svc.from("cases").delete().eq("id", c.id);
    if (error) throw new Error(`teardown cases: ${error.message}`);
  }

  // ---- Profiles (reused across runs; profiles are people, not fixtures) ---
  async function ensureProfile(match: Record<string, string>, insert: Record<string, unknown>) {
    let q = svc.from("professional_profiles").select("id").is("deleted_at", null);
    for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
    const { data: found, error: fErr } = await q.maybeSingle();
    if (fErr) throw fErr;
    if (found) return found.id as string;
    const { data: created, error: cErr } = await svc
      .from("professional_profiles")
      .insert(insert)
      .select("id")
      .single();
    if (cErr) throw cErr;
    return created.id as string;
  }

  const psychProfileId = await ensureProfile(
    { auth_user_id: owner.id },
    {
      auth_user_id: owner.id, // the bridge: profile ↔ authenticated identity
      discipline: "school_psychology",
      display_name: "James Delva",
      credentials: "NCSP",
    }
  );
  const slpProfileId = await ensureProfile(
    { discipline: "speech_language", display_name: "Jordan Lee (fixture)" },
    {
      auth_user_id: null, // synthetic contributor — data layer only, no login
      discipline: "speech_language",
      display_name: "Jordan Lee (fixture)",
      credentials: "CCC-SLP",
    }
  );

  // ---- Case + informant ----------------------------------------------------
  const { data: caseRow, error: caseErr } = await svc
    .from("cases")
    .insert({ psychologist_id: owner.id, ...AVERY_CASE })
    .select("id")
    .single();
  if (caseErr) throw caseErr;
  const caseId = caseRow.id as string;

  const { data: informant, error: infErr } = await svc
    .from("informants")
    .insert({
      case_id: caseId,
      ...AVERY_INFORMANT,
    })
    .select("id")
    .single();
  if (infErr) throw infErr;
  const informantId = informant.id as string;

  const audit = async (actor: string, eventType: string, metadata: Record<string, unknown>) => {
    const { error } = await svc
      .from("audit_events")
      .insert({ case_id: caseId, actor, event_type: eventType, metadata });
    if (error) throw error;
  };
  await audit(owner.id, "case_created", { fixture: true });

  // ---- Finalized teacher-intake Source (bank v1.3.0, via lockSubmission) --
  const invitationId = randomUUID();
  const { error: invErr } = await svc.from("invitations").insert({
    id: invitationId,
    case_id: caseId,
    informant_id: informantId,
    respondent_role: "teacher",
    bank_id: "teacher-intake",
    bank_version: "1.3.0",
    token_hash: randomUUID(), // spent fixture invitation; raw token never existed
    expires_at: "2026-05-20T00:00:00Z",
    status: "completed",
    max_uses: 1,
    uses: 1,
    completed_at: "2026-04-28T14:30:00Z",
  });
  if (invErr) throw invErr;
  await audit(owner.id, "invitation_created", { invitationId, role: "teacher" });

  const bank = QuestionBank.parse(bank13raw);
  const teacherSourceId = randomUUID();
  const locked = lockSubmission({
    bank,
    responses: TEACHER_RESPONSES,
    caseId,
    sourceId: teacherSourceId,
    informantId,
    collectedOn: "2026-04-28",
    payloadRef: teacherSourceId,
    now: new Date("2026-04-28T14:30:00Z"),
  });
  const { error: tSrcErr } = await svc.from("sources").insert({
    id: teacherSourceId,
    case_id: caseId,
    informant_id: informantId,
    kind: "referral_form",
    collected_on: COLLECTED_ON.teacher,
    bank_id: locked.source.bank!.bankId,
    bank_version: locked.source.bank!.bankVersion,
    payload: locked.payload,
    locked: true,
    checksum: locked.source.checksum,
  });
  if (tSrcErr) throw tSrcErr;
  await audit(`respondent:${invitationId}`, "response_submitted", {
    invitationId,
    sourceId: teacherSourceId,
    checksumLength: (locked.source.checksum ?? "").length,
    priorityFlagged: false,
  });

  // ---- Finalized RIE Capture Source (teacher interview) -------------------
  const { data: capRow, error: capErr } = await svc
    .from("capture_sessions")
    .insert({
      case_id: caseId,
      psychologist_id: owner.id,
      informant_id: informantId,
      kind: "interview",
      setting: "Union Elementary — teacher interview",
      occurred_on: "2026-05-05",
      notes: CAPTURE_NOTES,
      status: "open",
    })
    .select("id")
    .single();
  if (capErr) throw capErr;
  const captureSessionId = capRow.id as string;
  await audit(owner.id, "capture_session_created", { captureSessionId, kind: "interview" });

  // Payload shape mirrors apps/intake/lib/capture-core.ts finalizeCapture.
  const capturePayload = { captureSessionId, ...CAPTURE_PAYLOAD };
  const captureSourceId = randomUUID();
  const { error: cSrcErr } = await svc.from("sources").insert({
    id: captureSourceId,
    case_id: caseId,
    informant_id: informantId,
    kind: "interview",
    collected_on: COLLECTED_ON.capture,
    instrument: "capture",
    payload: capturePayload,
    locked: true,
    checksum: checksumOf(capturePayload),
  });
  if (cSrcErr) throw cSrcErr;
  const { error: capUpdErr } = await svc
    .from("capture_sessions")
    .update({
      status: "finalized",
      summary_final: CAPTURE_SUMMARY,
      source_id: captureSourceId,
      updated_at: "2026-05-05T19:00:00.000Z",
    })
    .eq("id", captureSessionId);
  if (capUpdErr) throw capUpdErr;
  await audit(owner.id, "capture_finalized", { captureSessionId, sourceId: captureSourceId, hasSummary: true });

  // ---- Evaluation materials: WIAT-4 score set (VS-3) ----------------------
  const scoreSourceId = randomUUID();
  const { error: sSrcErr } = await svc.from("sources").insert({
    id: scoreSourceId,
    case_id: caseId,
    informant_id: null, // examiner-administered; not an informant report
    kind: "score_set",
    collected_on: WIAT4_SCORE_SET.administeredOn,
    instrument: WIAT4_SCORE_SET.instrument,
    payload: WIAT4_SCORE_SET,
    locked: true,
    checksum: checksumOf(WIAT4_SCORE_SET),
  });
  if (sSrcErr) throw sSrcErr;
  await audit(owner.id, "score_set_added", {
    sourceId: scoreSourceId,
    instrument: WIAT4_SCORE_SET.instrument,
    scoreCount: WIAT4_SCORE_SET.scores.length,
    needsVerification: WIAT4_SCORE_SET.scores.filter((s) => s.extraction !== "parsed_ok").length,
  });

  // The case has moved past collecting information now that results are in.
  const { error: statusErr } = await svc
    .from("cases")
    .update({ status: "assessment" })
    .eq("id", caseId);
  if (statusErr) throw statusErr;

  // ---- Assignments + one attributed contributor activity (D-131) ----------
  const insertAssignment = async (profileId: string, role: string) => {
    const { data, error } = await svc
      .from("case_assignments")
      .insert({ case_id: caseId, profile_id: profileId, role, started_at: "2026-04-20T12:00:00Z" })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  };
  await insertAssignment(psychProfileId, "lead_evaluator");
  const slpAssignmentId = await insertAssignment(slpProfileId, "contributor");

  // Through the real guarded path (mayActOnCase → attributed audit write).
  const attributed = await recordAttributedActivity({
    svc,
    caseId,
    profileId: slpProfileId,
    eventType: "contributor_source_reviewed",
    metadata: { sourceId: captureSourceId, discipline: "speech_language" },
  });
  if (!attributed.ok) throw new Error(`attributed activity refused: ${JSON.stringify(attributed.body)}`);

  // ---- Summary (ids and counts only — no student narrative in logs) -------
  console.log("Avery Williams fixture seeded:");
  console.log(`  case                ${caseId}`);
  console.log(`  owner               ${owner.id} (${OWNER_EMAIL})`);
  console.log(`  teacher source      ${teacherSourceId} (teacher-intake v1.3.0, checksum ${String(locked.source.checksum).slice(0, 12)}…)`);
  console.log(`  capture source      ${captureSourceId} (interview, checksum ${checksumOf(capturePayload).slice(0, 12)}…)`);
  console.log(`  score source        ${scoreSourceId} (WIAT-4, 3 scores, 1 awaiting verification)`);
  console.log(`  psych profile       ${psychProfileId} (school_psychology, bridged)`);
  console.log(`  slp profile         ${slpProfileId} (speech_language, synthetic)`);
  console.log(`  slp assignment      ${slpAssignmentId} (contributor)`);
  console.log("  attributed activity contributor_source_reviewed → profile:" + slpProfileId);
}

main().catch((e) => {
  console.error("SEED FAILURE:", e.message ?? e);
  process.exit(1);
});
