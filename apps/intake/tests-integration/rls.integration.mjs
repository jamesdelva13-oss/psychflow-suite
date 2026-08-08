// RLS integration tests (data-posture §5/§9): prove AT THE DATABASE that one
// psychologist's account cannot read or write another's records, and that the
// anon key sees nothing at all. Runs against the live (dev) Supabase project
// in .env.local, with two throwaway synthetic accounts it creates and deletes.
//
//   node --env-file=.env.local tests-integration/rls.integration.mjs
//
// NOT part of `npm test` (unit tests stay network-free). Synthetic data only.

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { assertDevInstance } from "../../../tools/assert-dev-instance.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase env — run with --env-file=.env.local");
  process.exit(2);
}
// D-138 hard guard: the cleanup phase deletes accounts/cases it created —
// never allowed to point at anything but localhost or the known dev instance.
console.log(
  `Target instance verified: ${assertDevInstance(url, "the RLS integration harness (creates and deletes synthetic accounts)")}`
);

const svc = createClient(url, serviceKey, { auth: { persistSession: false } });

let pass = 0,
  fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) {
    pass++;
    console.log(`  ✔ ${name}`);
  } else {
    fail++;
    console.log(`  ✖ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

async function makeUser(tag) {
  const email = `rls-test-${tag}-${randomUUID().slice(0, 8)}@example.com`;
  const password = `T!${randomUUID()}`;
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser ${tag}: ${error.message}`);
  const id = data.user.id;
  // Provision the psychologists row the app normally creates at first login.
  const { error: pErr } = await svc.from("psychologists").insert({
    id,
    email,
    display_name: `RLS Test ${tag.toUpperCase()}`,
  });
  if (pErr) throw new Error(`psychologists ${tag}: ${pErr.message}`);
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: sErr } = await client.auth.signInWithPassword({ email, password });
  if (sErr) throw new Error(`signIn ${tag}: ${sErr.message}`);
  return { id, email, client };
}

const caseRow = (psychId) => ({
  psychologist_id: psychId,
  state: "SC",
  eval_type: "initial",
  referral_date: "2026-08-05",
  first_name: "Testy",
  last_initial: "Q",
  display_initials: "T.Q.",
  grade: "4",
  student_ref: randomUUID(),
});

async function main() {
  console.log("RLS integration — two synthetic accounts, live policies\n");
  const a = await makeUser("a");
  const b = await makeUser("b");
  const cleanupCaseIds = [];
  const cleanupOrgIds = [];
  const cleanupProfileIds = [];

  try {
    // ---- Seed as A (through A's RLS session, like the app does) ----------
    const { data: caseA, error: cErr } = await a.client
      .from("cases")
      .insert(caseRow(a.id))
      .select("id")
      .single();
    if (cErr) throw new Error(`seed case as A: ${cErr.message}`);
    cleanupCaseIds.push(caseA.id);

    const { data: infA, error: infErr } = await a.client
      .from("informants")
      .insert({ case_id: caseA.id, role: "teacher" })
      .select("id")
      .single();
    if (infErr) throw new Error(`seed informants as A: ${infErr.message}`);
    const { data: invA, error: invErr } = await a.client
      .from("invitations")
      .insert({
        case_id: caseA.id,
        informant_id: infA?.id ?? null,
        respondent_role: "teacher",
        bank_id: "teacher-intake",
        bank_version: "1.3.0",
        token_hash: randomUUID(),
        expires_at: new Date(Date.now() + 864e5).toISOString(),
      })
      .select("id")
      .single();
    if (invErr) throw new Error(`seed invitations as A: ${invErr.message}`);
    const { data: capA, error: capErr } = await a.client
      .from("capture_sessions")
      .insert({ case_id: caseA.id, psychologist_id: a.id, kind: "interview" })
      .select("id")
      .single();
    if (capErr) throw new Error(`seed capture_sessions as A: ${capErr.message}`);

    console.log("Owner visibility (A sees A):");
    check("A sees own case", Boolean(caseA?.id));
    check("A sees own invitation", Boolean(invA?.id));
    check("A sees own capture session", Boolean(capA?.id));

    // ---- B must be blind to all of it ------------------------------------
    console.log("\nCross-account reads (B must see nothing of A's):");
    for (const [table, col, val] of [
      ["cases", "id", caseA.id],
      ["informants", "case_id", caseA.id],
      ["invitations", "case_id", caseA.id],
      ["capture_sessions", "case_id", caseA.id],
      ["sources", "case_id", caseA.id],
    ]) {
      const { data } = await b.client.from(table).select("id").eq(col, val);
      check(`B reads A's ${table}: 0 rows`, (data ?? []).length === 0);
    }

    // ---- B must not be able to write into A's case -----------------------
    console.log("\nCross-account writes (the database must refuse):");
    {
      const { error } = await b.client
        .from("cases")
        .update({ grade: "5" })
        .eq("id", caseA.id)
        .select("id");
      // RLS update on invisible row: no error, zero rows affected — verify A's data unchanged.
      const { data: after } = await svc
        .from("cases")
        .select("grade")
        .eq("id", caseA.id)
        .single();
      check("B cannot update A's case", !error && after.grade === "4");
    }
    {
      const { error } = await b.client
        .from("informants")
        .insert({ case_id: caseA.id, role: "teacher" });
      check("B cannot attach an informant to A's case", Boolean(error));
    }
    {
      const { error } = await b.client
        .from("capture_sessions")
        .insert({ case_id: caseA.id, psychologist_id: b.id, kind: "interview" });
      check(
        "B cannot attach a capture session to A's case",
        Boolean(error),
        "policy checks only psychologist_id — needs case-ownership too"
      );
    }
    {
      const { error } = await b.client
        .from("cases")
        .insert(caseRow(a.id)) // B forging a case owned by A
        .select("id");
      check("B cannot create a case owned by A", Boolean(error));
    }

    // ---- Respondent-only + audit tables stay closed to authenticated -----
    console.log("\nTables with no authenticated access at all:");
    {
      const { data, error } = await a.client.from("draft_responses").select("invitation_id");
      check(
        "draft_responses closed even to the owner (service-role only)",
        Boolean(error) || (data ?? []).length === 0
      );
    }
    {
      const { data, error } = await a.client.from("audit_events").select("id").limit(1);
      check(
        "audit_events closed to authenticated (service-role only)",
        Boolean(error) || (data ?? []).length === 0
      );
    }

    // ---- Anon key sees nothing ------------------------------------------
    console.log("\nAnon (no session) sees nothing:");
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    for (const table of ["cases", "invitations", "sources", "capture_sessions", "psychologists"]) {
      const { data } = await anon.from(table).select("id").limit(1);
      check(`anon reads ${table}: 0 rows`, (data ?? []).length === 0);
    }

    // ---- D-131 contributor tables (0006: deny-by-default) ----------------
    // organizations has RLS on and NO policies (nothing until the district
    // tier); professional_profiles is self-select only; case_assignments is
    // reachable only via case ownership — the DB substrate under the app's
    // canonical mayActOnCase guard (@suite/case-model contributors.ts).
    console.log("\nD-131 contributor tables (0006: deny-by-default):");
    const { data: org1, error: o1Err } = await svc
      .from("organizations")
      .insert({ name: "RLS Test Org 1" })
      .select("id")
      .single();
    if (o1Err) throw new Error(`seed org1: ${o1Err.message}`);
    cleanupOrgIds.push(org1.id);
    const { data: org2, error: o2Err } = await svc
      .from("organizations")
      .insert({ name: "RLS Test Org 2" })
      .select("id")
      .single();
    if (o2Err) throw new Error(`seed org2: ${o2Err.message}`);
    cleanupOrgIds.push(org2.id);
    const { data: profA, error: pAErr } = await svc
      .from("professional_profiles")
      .insert({
        organization_id: org1.id,
        auth_user_id: a.id,
        discipline: "school_psychology",
        display_name: "RLS Test Profile A",
      })
      .select("id")
      .single();
    if (pAErr) throw new Error(`seed profile A: ${pAErr.message}`);
    cleanupProfileIds.push(profA.id);
    const { data: profB, error: pBErr } = await svc
      .from("professional_profiles")
      .insert({
        organization_id: org2.id,
        auth_user_id: b.id,
        discipline: "speech_language",
        display_name: "RLS Test Profile B",
      })
      .select("id")
      .single();
    if (pBErr) throw new Error(`seed profile B: ${pBErr.message}`);
    cleanupProfileIds.push(profB.id);

    {
      const { data: asgA, error } = await a.client
        .from("case_assignments")
        .insert({ case_id: caseA.id, profile_id: profA.id, role: "lead_evaluator" })
        .select("id")
        .single();
      check("A creates an assignment on own case (case-ownership path)", !error && Boolean(asgA?.id));
      const { data: seen } = await a.client
        .from("case_assignments")
        .select("id")
        .eq("case_id", caseA.id);
      check("A sees the assignment on own case", (seen ?? []).length === 1);
    }
    {
      const { data } = await b.client
        .from("case_assignments")
        .select("id")
        .eq("case_id", caseA.id);
      check("B reads assignments on A's case: 0 rows", (data ?? []).length === 0);
    }
    {
      const { error } = await b.client
        .from("case_assignments")
        .insert({ case_id: caseA.id, profile_id: profB.id, role: "contributor" });
      check("B cannot attach an assignment to A's case", Boolean(error));
    }
    {
      const { data } = await a.client.from("organizations").select("id");
      check("organizations closed to authenticated (no policy until district tier)", (data ?? []).length === 0);
    }
    {
      const { data } = await b.client.from("organizations").select("id").eq("id", org1.id);
      check("B reads A's organization: 0 rows (cross-org)", (data ?? []).length === 0);
    }
    {
      const { data } = await a.client
        .from("professional_profiles")
        .select("id")
        .eq("auth_user_id", a.id);
      check("A sees own professional profile (self-select)", (data ?? []).length === 1);
    }
    {
      const { data } = await a.client
        .from("professional_profiles")
        .select("id")
        .eq("id", profB.id);
      check("A reads B's profile: 0 rows (cross-org)", (data ?? []).length === 0);
    }
    {
      const { error } = await a.client.from("professional_profiles").insert({
        auth_user_id: a.id,
        discipline: "school_psychology",
        display_name: "Self-Inserted",
      });
      check("A cannot insert a professional profile (no write policy)", Boolean(error));
    }
    {
      await a.client
        .from("professional_profiles")
        .update({ display_name: "Changed" })
        .eq("id", profA.id);
      const { data: after } = await svc
        .from("professional_profiles")
        .select("display_name")
        .eq("id", profA.id)
        .single();
      check("A cannot update own profile (no write policy)", after.display_name === "RLS Test Profile A");
    }
    for (const table of ["organizations", "professional_profiles", "case_assignments"]) {
      const { data } = await anon.from(table).select("id").limit(1);
      check(`anon reads ${table}: 0 rows`, (data ?? []).length === 0);
    }
  } finally {
    // ---- Cleanup: rows first (service role), then the auth users ---------
    for (const id of cleanupCaseIds) {
      await svc.from("case_assignments").delete().eq("case_id", id);
      await svc.from("capture_sessions").delete().eq("case_id", id);
      await svc.from("invitations").delete().eq("case_id", id);
      await svc.from("informants").delete().eq("case_id", id);
      await svc.from("audit_events").update({ case_id: null }).eq("case_id", id);
      await svc.from("cases").delete().eq("id", id);
    }
    // B may have slipped a capture session onto A's case if the gap exists.
    for (const id of cleanupProfileIds) {
      await svc.from("case_assignments").delete().eq("profile_id", id);
      await svc.from("professional_profiles").delete().eq("id", id);
    }
    for (const id of cleanupOrgIds) {
      await svc.from("organizations").delete().eq("id", id);
    }
    for (const u of [a, b]) {
      await svc.from("capture_sessions").delete().eq("psychologist_id", u.id);
      await svc.from("psychologists").delete().eq("id", u.id);
      await svc.auth.admin.deleteUser(u.id);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("SETUP FAILURE:", e.message);
  process.exit(2);
});
