/**
 * VS-1 exit tests — the full 11-test list from docs/VS0-IMPLEMENTATION-MAP.md
 * §4 (directive §17.2 VS-1 slice + D-131), verbatim, against the live dev
 * Supabase instance; plus the D-137 enforcement-boundary contract block
 * (database-authoritative time, mutation-boundary refusal) between tests
 * 10 and 11. Requires migration 0008 applied.
 *
 *   npm run test:vs1        (from apps/psychreport; needs .env.local)
 *
 * Prerequisite: the Avery Williams fixture is seeded
 * (node --env-file=apps/intake/.env.local --conditions=react-server \
 *    --import tsx tools/seed-avery.ts).
 *
 * Posture notes:
 *   - Tests 1/2/4 and the fixture half of 10 run the resolver over the
 *     seeded canonical fixture. They use the service client, standing in for
 *     server code whose authorization was already established — the RLS-path
 *     answer is proven separately (tests 6–8) with two throwaway accounts,
 *     exactly like the intake RLS harness.
 *   - Test 11 spawns the intake 32-check RLS suite unchanged. VS-1 adds no
 *     new tables; its new read paths (the resolver) get their per-path
 *     isolation checks in tests 6–8 here.
 *   - Synthetic data only; output carries ids and counts, never narrative.
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveCaseContext } from "../lib/case-context";
import { recordAttributedActivity, actorForProfile } from "../lib/attribution";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase env — run with --env-file=.env.local");
  process.exit(2);
}

const svc = createClient(url, serviceKey, { auth: { persistSession: false } });
const FIXTURE_STUDENT_REF = "avery-williams-canonical-fixture";

let pass = 0,
  fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) {
    pass++;
    console.log(`  ✔ ${name}`);
  } else {
    fail++;
    console.log(`  ✖ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

async function makeUser(tag: string) {
  const email = `vs1-test-${tag}-${randomUUID().slice(0, 8)}@example.com`;
  const password = `T!${randomUUID()}`;
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser ${tag}: ${error.message}`);
  const id = data.user.id;
  const { error: pErr } = await svc.from("psychologists").insert({
    id,
    email,
    display_name: `VS1 Test ${tag.toUpperCase()}`,
  });
  if (pErr) throw new Error(`psychologists ${tag}: ${pErr.message}`);
  const client = createClient(url!, anonKey!, { auth: { persistSession: false } });
  const { error: sErr } = await client.auth.signInWithPassword({ email, password });
  if (sErr) throw new Error(`signIn ${tag}: ${sErr.message}`);
  return { id, email, client };
}

const caseRow = (psychId: string) => ({
  psychologist_id: psychId,
  state: "SC",
  eval_type: "initial",
  referral_date: "2026-08-05",
  first_name: "Harness",
  last_initial: "Q",
  display_initials: "H.Q.",
  grade: "4",
  student_ref: `vs1-harness-${randomUUID()}`,
});

const lockedSourceRow = (caseId: string, over: Record<string, unknown> = {}) => ({
  case_id: caseId,
  kind: "interview",
  collected_on: "2026-08-05",
  instrument: "capture",
  payload: { captureSessionId: randomUUID(), kind: "interview", notes: "harness", summaryFinal: null },
  locked: true,
  checksum: randomUUID().replace(/-/g, ""),
  ...over,
});

async function sourceCount(caseId: string): Promise<number> {
  const { count, error } = await svc
    .from("sources")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  console.log("VS-1 exit tests — live dev instance\n");

  // ---- Fixture presence gate ----------------------------------------------
  const { data: fixtureCases, error: fxErr } = await svc
    .from("cases")
    .select("id, first_name, last_initial, grade")
    .eq("student_ref", FIXTURE_STUDENT_REF)
    .is("deleted_at", null);
  if (fxErr) throw fxErr;
  if (!fixtureCases || fixtureCases.length === 0) {
    console.error(
      "Avery fixture not found — run tools/seed-avery.ts first (see file header)."
    );
    process.exit(2);
  }
  const avery = fixtureCases[0];

  const a = await makeUser("a");
  const b = await makeUser("b");
  const cleanup = {
    caseIds: [] as string[],
    profileIds: [] as string[],
    captureSessionIds: [] as string[],
  };

  try {
    // ---- Harness case for A, seeded through A's RLS session --------------
    const { data: caseA, error: cErr } = await a.client
      .from("cases")
      .insert(caseRow(a.id))
      .select("id")
      .single();
    if (cErr) throw new Error(`seed case as A: ${cErr.message}`);
    cleanup.caseIds.push(caseA.id);

    // =======================================================================
    console.log("Test 1 — finalized Teacher Intake Source resolves into case context:");
    const averyCtx = await resolveCaseContext(svc, avery.id);
    check("fixture case resolves", Boolean(averyCtx));
    const teacher = averyCtx?.currentSources.find(
      (s) => s.source.bank?.bankId === "teacher-intake"
    );
    check("teacher-intake Source present among current sources", Boolean(teacher));
    check(
      "teacher Source is finalized and canonical (locked, kind referral_form)",
      teacher?.source.locked === true && teacher?.source.kind === "referral_form"
    );
    check(
      "teacher responses travel in the payload",
      Boolean((teacher?.payload as any)?.responses?.["TCH-CORE-008"])
    );

    // =======================================================================
    console.log("\nTest 2 — finalized RIE Capture Source resolves into case context:");
    const capture = averyCtx?.currentSources.find(
      (s) => s.source.instrument === "capture"
    );
    check("capture Source present among current sources", Boolean(capture));
    check(
      "capture Source is finalized with a clinician-confirmed summary",
      capture?.source.locked === true &&
        typeof (capture?.payload as any)?.summaryFinal === "string"
    );
    {
      const { data: sess } = await svc
        .from("capture_sessions")
        .select("status, source_id")
        .eq("case_id", avery.id)
        .eq("status", "finalized")
        .maybeSingle();
      check(
        "its capture session is finalized and points at the Source",
        sess?.source_id === capture?.source.sourceId
      );
    }

    // =======================================================================
    console.log("\nTest 3 — unfinalized/unconfirmed Capture proposal does NOT resolve:");
    {
      // A model-proposed, unconfirmed summary on the fixture case…
      const { data: prop, error } = await svc
        .from("capture_sessions")
        .insert({
          case_id: avery.id,
          psychologist_id: (await svc.from("cases").select("psychologist_id").eq("id", avery.id).single()).data!.psychologist_id,
          kind: "interview",
          occurred_on: "2026-08-06",
          notes: "harness proposal-state session",
          status: "proposal_ready",
          summary_proposal: {
            text: "UNCONFIRMED PROPOSAL — must never resolve",
            generation: {
              requestedModel: "test",
              servedModel: "test",
              promptVersion: "0",
              schemaVersion: "0",
              pseudonymized: true,
              createdAt: new Date().toISOString(),
            },
          },
        })
        .select("id")
        .single();
      if (error) throw new Error(`proposal seed: ${error.message}`);
      cleanup.captureSessionIds.push(prop.id);

      const before = averyCtx?.sources.length ?? 0;
      const ctxAfter = await resolveCaseContext(svc, avery.id);
      check(
        "proposal-state capture session contributes nothing to the context",
        (ctxAfter?.sources.length ?? -1) === before
      );
      check(
        "no context payload carries the unconfirmed proposal text",
        !JSON.stringify(ctxAfter?.sources ?? []).includes("UNCONFIRMED PROPOSAL")
      );
      // …and an unlocked sources row on the harness case is refused too.
      const { error: unlockedErr } = await a.client
        .from("sources")
        .insert(lockedSourceRow(caseA.id, { locked: false, checksum: null }));
      if (unlockedErr) throw new Error(`unlocked source seed: ${unlockedErr.message}`);
      const ctxA = await resolveCaseContext(a.client, caseA.id);
      check(
        "unlocked sources row is structurally excluded from the context",
        ctxA !== null && ctxA.sources.length === 0
      );
    }

    // =======================================================================
    console.log("\nTest 4 — Source identity and provenance survive the handoff:");
    {
      const { data: row } = await svc
        .from("sources")
        .select("id, checksum, bank_id, bank_version, informant_id")
        .eq("id", teacher!.source.sourceId)
        .single();
      check(
        "sourceId is stable across the boundary",
        row?.id === teacher!.source.sourceId
      );
      check(
        "checksum survives verbatim",
        Boolean(row?.checksum) && row!.checksum === teacher!.source.checksum
      );
      check(
        "bank pin survives (teacher-intake v1.3.0 per D-136)",
        teacher!.source.bank?.bankId === "teacher-intake" &&
          teacher!.source.bank?.bankVersion === "1.3.0" &&
          row?.bank_id === "teacher-intake" &&
          row?.bank_version === "1.3.0"
      );
      check(
        "informant linkage and collection date readable on the consumed context",
        teacher!.source.informantId === row?.informant_id &&
          /^\d{4}-\d{2}-\d{2}$/.test(teacher!.source.collectedOn)
      );
    }

    // =======================================================================
    console.log("\nTest 5 — duplicate ingestion does not duplicate a Source:");
    {
      const before = await sourceCount(avery.id);
      await resolveCaseContext(svc, avery.id);
      await resolveCaseContext(svc, avery.id);
      const after = await sourceCount(avery.id);
      check("resolving twice creates no rows (consumption copies nothing)", before === after);
      check(
        "re-run seed left exactly one Avery case (idempotent re-seed, D-136)",
        fixtureCases.length === 1
      );
    }

    // =======================================================================
    console.log("\nTest 6 — cross-account access denied through every new read path:");
    {
      const viaB = await resolveCaseContext(b.client, caseA.id);
      check("B resolving A's case: null (indistinguishable from absent)", viaB === null);
      const bOnAvery = await resolveCaseContext(b.client, avery.id);
      check("B resolving the fixture case: null", bOnAvery === null);
      const { data: bSources } = await b.client
        .from("sources")
        .select("id")
        .eq("case_id", avery.id);
      check("B's direct source read on the fixture: 0 rows", (bSources ?? []).length === 0);
    }

    // =======================================================================
    console.log("\nTest 7 — cross-case object IDs cannot retrieve another case's material:");
    {
      const { data: caseB, error } = await b.client
        .from("cases")
        .insert(caseRow(b.id))
        .select("id")
        .single();
      if (error) throw new Error(`seed case as B: ${error.message}`);
      cleanup.caseIds.push(caseB.id);

      const ctxB = await resolveCaseContext(b.client, caseB.id);
      check(
        "B's own context never carries another case's sources",
        ctxB !== null &&
          ctxB.sources.every((s) => s.source.caseId === caseB.id)
      );
      const { data: probe } = await b.client
        .from("sources")
        .select("id")
        .eq("id", teacher!.source.sourceId);
      check("known fixture source id probed from B: 0 rows", (probe ?? []).length === 0);
      const aOnB = await resolveCaseContext(a.client, caseB.id);
      check("A resolving B's case: null", aOnB === null);
    }

    // =======================================================================
    console.log("\nTest 8 — deleted case material is not reachable through PsychReport:");
    {
      const { data: src, error } = await a.client
        .from("sources")
        .insert(lockedSourceRow(caseA.id))
        .select("id")
        .single();
      if (error) throw new Error(`seed deletable source: ${error.message}`);
      const ctx1 = await resolveCaseContext(a.client, caseA.id);
      check("finalized source visible before deletion", ctx1?.sources.length === 1);

      await svc.from("sources").update({ deleted_at: new Date().toISOString() }).eq("id", src.id);
      const ctx2 = await resolveCaseContext(a.client, caseA.id);
      check("retention-deleted source no longer resolves", ctx2?.sources.length === 0);

      await svc.from("cases").update({ deleted_at: new Date().toISOString() }).eq("id", caseA.id);
      const ctx3 = await resolveCaseContext(a.client, caseA.id);
      check("deleted case no longer resolves at all", ctx3 === null);
      await svc.from("cases").update({ deleted_at: null }).eq("id", caseA.id); // restore for later tests
      await svc.from("sources").delete().eq("id", src.id);
    }

    // =======================================================================
    console.log("\nTest 9 — superseding Source resolves as current; predecessor derived-superseded:");
    {
      const { data: v1, error: e1 } = await a.client
        .from("sources")
        .insert(lockedSourceRow(caseA.id))
        .select("id")
        .single();
      if (e1) throw new Error(`seed v1: ${e1.message}`);
      const { data: v2, error: e2 } = await a.client
        .from("sources")
        .insert(
          lockedSourceRow(caseA.id, {
            version: 2,
            supersedes_source_id: v1.id,
          })
        )
        .select("id")
        .single();
      if (e2) throw new Error(`seed v2: ${e2.message}`);

      const ctx = await resolveCaseContext(a.client, caseA.id);
      const s1 = ctx?.sources.find((s) => s.source.sourceId === v1.id);
      const s2 = ctx?.sources.find((s) => s.source.sourceId === v2.id);
      check("both versions visible in the full source list", Boolean(s1 && s2));
      check("predecessor reads as superseded (derived)", s1?.superseded === true);
      check("superseding Source reads as current", s2?.superseded === false);
      check(
        "currentSources resolves the chain to the current Source only",
        ctx?.currentSources.some((s) => s.source.sourceId === v2.id) === true &&
          ctx?.currentSources.every((s) => s.source.sourceId !== v1.id) === true
      );
      const { data: v1After } = await svc
        .from("sources")
        .select("locked, version, supersedes_source_id")
        .eq("id", v1.id)
        .single();
      check(
        "predecessor row is untouched — superseded is derived, not mutated",
        v1After?.locked === true && v1After?.version === 1 && v1After?.supersedes_source_id === null
      );
    }

    // =======================================================================
    console.log("\nTest 10 — D-131 non-Psychology contributor attribution, zero multidisciplinary UI:");
    {
      // Fixture half: the seeded speech_language contributor on Avery's case.
      const { data: slp } = await svc
        .from("professional_profiles")
        .select("id")
        .eq("discipline", "speech_language")
        .eq("display_name", "Jordan Lee (fixture)")
        .is("deleted_at", null)
        .maybeSingle();
      check("synthetic speech_language profile exists", Boolean(slp?.id));
      const { data: asg } = await svc
        .from("case_assignments")
        .select("id, ended_at")
        .eq("case_id", avery.id)
        .eq("profile_id", slp?.id ?? "")
        .maybeSingle();
      check("assigned to Avery's case at the data layer", Boolean(asg?.id) && asg?.ended_at === null);
      const { data: attributed } = await svc
        .from("audit_events")
        .select("id, actor, event_type")
        .eq("case_id", avery.id)
        .eq("actor", actorForProfile(slp?.id ?? ""));
      check(
        "an activity is attributed to their stable profileId",
        (attributed ?? []).some((r) => r.event_type === "contributor_source_reviewed")
      );
      check(
        "case identity and Source semantics unchanged by the contributor",
        averyCtx?.caseId === avery.id &&
          (averyCtx?.currentSources.length ?? 0) >= 2
      );

      // Lifecycle half, on the harness case: ending the assignment removes
      // authorization but never the attributed history.
      const { data: slp2, error: pErr } = await svc
        .from("professional_profiles")
        .insert({
          discipline: "speech_language",
          display_name: "VS1 Harness SLP",
        })
        .select("id")
        .single();
      if (pErr) throw new Error(`harness SLP: ${pErr.message}`);
      cleanup.profileIds.push(slp2.id);
      // Explicit timestamps from the harness clock, not the server's now()
      // default: recordAttributedActivity evaluates activity against the
      // LOCAL clock, so a server-ahead skew would make a default-now()
      // assignment "not yet started" and flake the accept check.
      const asgStartedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: asg2, error: aErr } = await svc
        .from("case_assignments")
        .insert({
          case_id: caseA.id,
          profile_id: slp2.id,
          role: "contributor",
          started_at: asgStartedAt,
        })
        .select("id")
        .single();
      if (aErr) throw new Error(`harness assignment: ${aErr.message}`);

      const write1 = await recordAttributedActivity({
        svc,
        caseId: caseA.id,
        profileId: slp2.id,
        eventType: "contributor_source_reviewed",
        metadata: { harness: true },
      });
      check("active contributor's activity write is attributed and accepted", write1.ok);

      // ended_at is after started_at (satisfies the DB check and the
      // case-model zod refine) but firmly in the local past, so the refusal
      // below is deterministic under any clock skew. Check the update error:
      // a silently failed update would leave the assignment active and flake
      // the refusal check.
      const asgEndedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { error: endErr } = await svc
        .from("case_assignments")
        .update({ ended_at: asgEndedAt })
        .eq("id", asg2.id);
      if (endErr) throw new Error(`end harness assignment: ${endErr.message}`);
      const write2 = await recordAttributedActivity({
        svc,
        caseId: caseA.id,
        profileId: slp2.id,
        eventType: "contributor_source_reviewed",
      });
      check(
        "ended assignment removes authorization (write refused)",
        !write2.ok && write2.status === 403
      );
      const { data: history } = await svc
        .from("audit_events")
        .select("id")
        .eq("case_id", caseA.id)
        .eq("actor", actorForProfile(slp2.id));
      check("attributed history survives the ended assignment", (history ?? []).length === 1);

      // Zero multidisciplinary UI: nothing under app/ or components/ renders
      // contributors, assignments, or disciplines.
      const appRoot = path.resolve(fileURLToPath(import.meta.url), "..", "..");
      const uiDirs = ["app", "components"].map((d) => path.join(appRoot, d));
      const uiFiles: string[] = [];
      const walk = (dir: string) => {
        let entries: string[];
        try {
          entries = readdirSync(dir);
        } catch {
          return;
        }
        for (const e of entries) {
          const p = path.join(dir, e);
          if (statSync(p).isDirectory()) walk(p);
          else uiFiles.push(p);
        }
      };
      uiDirs.forEach(walk);
      const offenders = uiFiles.filter((f) =>
        /professional_profiles|case_assignments|discipline|contributor/i.test(
          readFileSync(f, "utf8")
        )
      );
      check(
        "zero multidisciplinary UI exists (no UI file touches contributor concepts)",
        offenders.length === 0,
        offenders.join(", ")
      );
    }

    // =======================================================================
    console.log(
      "\nD-137 contract — authorization enforced at the database mutation boundary:"
    );
    {
      // Contract tests (1) and (2) — started assignment → write accepted,
      // ended assignment → write refused — are write1/write2 above. Here the
      // boundary is proven independent of the app-layer preflight.

      // (3) The TOCTOU shape: a write reaching the database after revocation
      // with no (equivalently: a stale) preflight. Direct insert, bypassing
      // recordAttributedActivity entirely — the trigger must refuse it.
      const { error: toctouErr } = await svc.from("audit_events").insert({
        case_id: caseA.id,
        actor: actorForProfile(slp2.id),
        event_type: "contributor_source_reviewed",
        metadata: { harness: true },
      });
      check(
        "database boundary refuses a stale-preflight write on an ended assignment",
        (toctouErr as { code?: string } | null)?.code === "42501"
      );

      // (4) Clock independence: assignment activity follows the DATABASE
      // clock at both layers. A profile whose assignment starts 2 minutes in
      // the DB future must be refused everywhere, whatever the local clock
      // thinks; backdated past the DB now, the boundary accepts.
      const { data: dbNowRaw, error: nowErr } = await svc.rpc("db_now");
      check(
        "db_now() serves database-authoritative time",
        !nowErr && Number.isFinite(Date.parse(dbNowRaw))
      );
      const dbNowMs = Date.parse(dbNowRaw);
      const { data: slp3, error: p3Err } = await svc
        .from("professional_profiles")
        .insert({ discipline: "speech_language", display_name: "VS1 Harness SLP (D-137)" })
        .select("id")
        .single();
      if (p3Err) throw new Error(`harness SLP3: ${p3Err.message}`);
      cleanup.profileIds.push(slp3.id);
      const { data: asg3, error: a3Err } = await svc
        .from("case_assignments")
        .insert({
          case_id: caseA.id,
          profile_id: slp3.id,
          role: "contributor",
          started_at: new Date(dbNowMs + 120_000).toISOString(),
        })
        .select("id")
        .single();
      if (a3Err) throw new Error(`harness assignment (future start): ${a3Err.message}`);

      const writeFuture = await recordAttributedActivity({
        svc,
        caseId: caseA.id,
        profileId: slp3.id,
        eventType: "contributor_source_reviewed",
      });
      check(
        "not-yet-started assignment (per DB clock): preflight refuses",
        !writeFuture.ok && writeFuture.status === 403
      );
      const { error: futureDirectErr } = await svc.from("audit_events").insert({
        case_id: caseA.id,
        actor: actorForProfile(slp3.id),
        event_type: "contributor_source_reviewed",
        metadata: { harness: true },
      });
      check(
        "…and the database boundary refuses it independently",
        (futureDirectErr as { code?: string } | null)?.code === "42501"
      );

      const { error: backErr } = await svc
        .from("case_assignments")
        .update({ started_at: new Date(dbNowMs - 120_000).toISOString() })
        .eq("id", asg3.id);
      if (backErr) throw new Error(`backdate assignment: ${backErr.message}`);
      const { error: startedDirectErr } = await svc.from("audit_events").insert({
        case_id: caseA.id,
        actor: actorForProfile(slp3.id),
        event_type: "contributor_source_reviewed",
        metadata: { harness: true },
      });
      check(
        "once started per the DB clock, the boundary accepts the attributed write",
        startedDirectErr === null
      );
      // A true two-transaction lock-ordering test of the FOR UPDATE
      // serialization needs direct Postgres access; PostgREST holds no open
      // transactions. Mandatory when direct DB access lands (see D-137).
    }

    // =======================================================================
    console.log("\nTest 11 — intake RLS suite stays green (spawned unchanged):");
    {
      const intakeDir = path.resolve(
        fileURLToPath(import.meta.url),
        "..",
        "..",
        "..",
        "intake"
      );
      const res = spawnSync(
        process.execPath,
        ["--env-file=.env.local", "tests-integration/rls.integration.mjs"],
        { cwd: intakeDir, encoding: "utf8", timeout: 180_000 }
      );
      const tail = (res.stdout ?? "").trim().split("\n").pop() ?? "";
      check(
        `intake RLS suite exits green (${tail})`,
        res.status === 0,
        res.status === 2 ? "seed-abort (exit 2)" : (res.stderr ?? "").slice(0, 200)
      );
      console.log(
        "  (VS-1 adds no new tables; resolver read paths are isolation-checked in tests 6–8.)"
      );
    }
  } finally {
    for (const id of cleanup.captureSessionIds) {
      await svc.from("capture_sessions").delete().eq("id", id);
    }
    for (const id of cleanup.caseIds) {
      await svc.from("case_assignments").delete().eq("case_id", id);
      await svc.from("capture_sessions").delete().eq("case_id", id);
      await svc.from("invitations").delete().eq("case_id", id);
      await svc.from("informants").delete().eq("case_id", id);
      await svc.from("sources").delete().eq("case_id", id);
      await svc.from("audit_events").delete().eq("case_id", id); // harness rows only
      await svc.from("cases").delete().eq("id", id);
    }
    for (const id of cleanup.profileIds) {
      await svc.from("case_assignments").delete().eq("profile_id", id);
      await svc.from("professional_profiles").delete().eq("id", id);
    }
    for (const u of [a, b]) {
      await svc.from("psychologists").delete().eq("id", u.id);
      await svc.auth.admin.deleteUser(u.id);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("SETUP FAILURE:", e.message ?? e);
  process.exit(2);
});
