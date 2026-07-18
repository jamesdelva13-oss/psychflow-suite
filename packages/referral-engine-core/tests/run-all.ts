/**
 * run-all.ts — tests for @suite/referral-engine-core, run against the REAL
 * published banks from @suite/content (not fixtures), so the engine and the
 * content are proven compatible on every run.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  visibleQuestions, activeModules, validateSubmission, pendingFollowUps,
  lockSubmission, instanceKey, computeConcernSet, type ResponseMap,
} from "../src/form-runtime";
import { generateToken, hashToken, checkInvitation, invitationUrl, type InvitationRecord } from "../src/invitations";
import { qrDataUrl, qrSvg } from "../src/qr";
import { Source } from "../../case-model/src/entities";

const here = path.dirname(fileURLToPath(import.meta.url));
const teacher = JSON.parse(fs.readFileSync(path.join(here, "../../content/banks/teacher-form.v1.3.0.json"), "utf8"));
const parent = JSON.parse(fs.readFileSync(path.join(here, "../../content/banks/parent-form.v1.json"), "utf8"));

let failures = 0;
const check = (name: string, ok: boolean, detail?: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? " — " + detail : ""}`);
  if (!ok) failures++;
};

/* ---------- module branching on the real teacher bank ---------- */
{
  const r: ResponseMap = {};
  let mods = activeModules(teacher, r);
  check("teacher: only always-shown modules before any answers",
    mods.has("core") && mods.has("impact") && !mods.has("reading") && !mods.has("interventions"));

  r["TCH-CORE-008"] = ["reading", "behavior"];
  mods = activeModules(teacher, r);
  check("teacher: reading+behavior selection loads reading, behavior, social_comm, interventions",
    mods.has("reading") && mods.has("behavior") && mods.has("social_comm") && mods.has("interventions") &&
    !mods.has("self_regulation") && !mods.has("writing") && !mods.has("math"));
}

/* ---------- includes_any visibility (the v1.1.2 fix) ---------- */
{
  const base: ResponseMap = { "TCH-CORE-008": ["reading"] };
  let vis = visibleQuestions(teacher, base).map(v => v.key);
  check("teacher: catch-all hidden when only reading selected", !vis.includes("TCH-CORE-009"));

  vis = visibleQuestions(teacher, { "TCH-CORE-008": ["fine_motor"] }).map(v => v.key);
  check("teacher: catch-all visible when fine_motor selected", vis.includes("TCH-CORE-009"));

  let r: ResponseMap = { "TCH-CORE-008": ["reading"], "TCH-RDG-001": ["word_recognition"] };
  vis = visibleQuestions(teacher, r).map(v => v.key);
  check("teacher: RDG-002 fires on word_recognition alone (includes_any)", vis.includes("TCH-RDG-002"));
  r = { "TCH-CORE-008": ["reading"], "TCH-RDG-001": ["fluency"] };
  vis = visibleQuestions(teacher, r).map(v => v.key);
  check("teacher: RDG-002 hidden for fluency-only; RDG-003 shown",
    !vis.includes("TCH-RDG-002") && vis.includes("TCH-RDG-003"));
}

/* ---------- repeat-group expansion with inherited topography ---------- */
{
  const r: ResponseMap = { "TCH-CORE-008": ["behavior"], "TCH-BEH-001": ["avoidance", "aggression"] };
  const inst = visibleQuestions(teacher, r).filter(v => v.repeatOf);
  check("teacher: 5 ABC questions x 2 topographies = 10 repeat instances", inst.length === 10,
    `got ${inst.length}`);
  const avoid = inst.find(v => v.key === instanceKey("TCH-BEH-G01", "avoidance"));
  check("teacher: repeat instance inherits topography tag", avoid?.repeatOf?.topography === "avoidance");
}

/* ---------- yes/no conditional visibility ---------- */
{
  let vis = visibleQuestions(teacher, { "TCH-CORE-006": "no" }).map(v => v.key);
  check("teacher: attendance describe hidden on no", !vis.includes("TCH-CORE-006a"));
  vis = visibleQuestions(teacher, { "TCH-CORE-006": "yes" }).map(v => v.key);
  check("teacher: attendance describe shown on yes", vis.includes("TCH-CORE-006a"));
}

/* ---------- required validation over visible instances only ---------- */
{
  const r: ResponseMap = { "TCH-CORE-008": ["behavior"], "TCH-BEH-001": ["avoidance"] };
  const v = validateSubmission(teacher, r);
  check("teacher: repeat-group required instance reported missing",
    v.missingRequired.includes(instanceKey("TCH-BEH-G01", "avoidance")));
  check("teacher: hidden module questions never required",
    !v.missingRequired.includes("TCH-RDG-001"));
  const v2 = validateSubmission(teacher, { bogus_key: "x" });
  check("teacher: unknown response keys rejected", v2.unknownKeys.includes("bogus_key"));
}

/* ---------- completeness rules (Layer 2) ---------- */
{
  const r: ResponseMap = {
    "TCH-CORE-008": ["behavior"],
    "TCH-BEH-001": ["avoidance"],
    // TCH-BEH-G04::avoidance deliberately unanswered
  };
  const fus = pendingFollowUps(teacher, r);
  check("teacher: CR-003 fires when antecedent missing for a topography",
    fus.some(f => f.ruleId === "CR-003" && f.followUpId === "FU-BEH-001"));
  check("teacher: CR-007 fires when unstructured-time observation missing",
    fus.some(f => f.ruleId === "CR-007"));

  const r2: ResponseMap = { ...r, [instanceKey("TCH-BEH-G04", "avoidance")]: "Task is assigned", "TCH-SOC-001": "Plays basketball with two friends" };
  const fus2 = pendingFollowUps(teacher, r2);
  check("teacher: CR-003 and CR-007 clear once answered",
    !fus2.some(f => f.ruleId === "CR-003") && !fus2.some(f => f.ruleId === "CR-007"));
}

/* ---------- derived concern set: screener adds a domain without mutating CORE-008 (D-028) ---------- */
{
  // affirmative screeners visible when the domain is NOT flagged on CORE-008
  const base: ResponseMap = { "TCH-CORE-008": ["reading"] };
  let vis = visibleQuestions(teacher, base).map(v => v.key);
  check("teacher: TCH-COG-000 / TCH-ADP-000 screeners visible when domain not flagged",
    vis.includes("TCH-COG-000") && vis.includes("TCH-ADP-000"));
  check("teacher: cognitive/adaptive modules inactive on a bare no-concern screen",
    !activeModules(teacher, base).has("cognitive") && !activeModules(teacher, base).has("adaptive"));

  // screener 'below' adds the domain to concernSet (via screener) and loads the module,
  // WITHOUT writing to CORE-008's stored answer
  const below: ResponseMap = { "TCH-CORE-008": ["reading"], "TCH-COG-000": "below" };
  const cs = computeConcernSet(teacher, below);
  check("teacher: screener 'below' adds cognitive with via=screener",
    cs.some(e => e.domain === "cognitive" && e.via === "screener"));
  check("teacher: base CORE-008 answer is not mutated by the screener",
    JSON.stringify(below["TCH-CORE-008"]) === JSON.stringify(["reading"]));
  check("teacher: 'below' loads the cognitive concern module via $concernSet",
    activeModules(teacher, below).has("cognitive"));

  // domain flagged on CORE-008 -> screener suppressed (excludes), module via core-008
  const flagged: ResponseMap = { "TCH-CORE-008": ["cognitive"] };
  vis = visibleQuestions(teacher, flagged).map(v => v.key);
  check("teacher: TCH-COG-000 suppressed once cognitive is flagged on CORE-008",
    !vis.includes("TCH-COG-000") && activeModules(teacher, flagged).has("cognitive"));
  check("teacher: flagged domain carries via=core-008",
    computeConcernSet(teacher, flagged).some(e => e.domain === "cognitive" && e.via === "core-008"));

  // within/above is affirmative (T2/T3): no concern module, detail item appears (equals_any)
  const above: ResponseMap = { "TCH-CORE-008": ["reading"], "TCH-COG-000": "above" };
  check("teacher: affirmative screener does NOT load the concern module",
    !activeModules(teacher, above).has("cognitive"));
  check("teacher: T3 detail (TCH-COG-000d) appears on within/above (equals_any)",
    visibleQuestions(teacher, above).map(v => v.key).includes("TCH-COG-000d"));
}

/* ---------- parent bank: ASD deep-dive triggering ---------- */
{
  let mods = activeModules(parent, { "PAR-CORE-006": ["reading"] });
  check("parent: no ASD deep-dive for reading-only referral", !mods.has("asd_deep_dive"));
  mods = activeModules(parent, { "PAR-CORE-006": ["reading"], "PAR-SCR-001": ["intense_interests"] });
  check("parent: SCR endorsement triggers ASD deep-dive", mods.has("asd_deep_dive"));
  mods = activeModules(parent, { "PAR-CORE-006": ["social"] });
  check("parent: social concern triggers ASD deep-dive", mods.has("asd_deep_dive"));
}

/* ---------- full submission lock → canonical Source ---------- */
{
  // build a minimal complete teacher submission: answer all required visible
  const r: ResponseMap = { "TCH-CORE-008": ["reading"] };
  // iterate until stable (answers can reveal new required questions)
  for (let pass = 0; pass < 6; pass++) {
    for (const v of visibleQuestions(teacher, r)) {
      if (!v.question.required || r[v.key]) continue;
      const q = v.question;
      if (q.responseType === "open_text") r[v.key] = "Sample narrative answer.";
      else if (q.responseType === "yes_no") r[v.key] = "no";
      else if (q.responseType === "single_select") r[v.key] = q.options![0].value;
      else if (q.responseType === "multi_select") r[v.key] = [q.options![0].value];
    }
    if (validateSubmission(teacher, r).ok) break;
  }
  // note: TCH-CORE-008 answered with reading keeps reading module active; its
  // first multi_select (RDG-001) answered with first option (phon_awareness)
  const locked = lockSubmission({
    bank: teacher, responses: r,
    caseId: "case_t1", sourceId: "src_t1", informantId: "inf_t1",
    collectedOn: "2026-09-10", payloadRef: "responses/src_t1.json",
  });
  check("lock: produces schema-valid Source", Source.safeParse(locked.source).success);
  check("lock: source bound to bank version", locked.source.bank?.bankVersion === teacher.version);
  check("lock: checksum present and deterministic",
    typeof locked.source.checksum === "string" && locked.source.checksum!.length === 64);

  let threw = false;
  try {
    lockSubmission({
      bank: teacher, responses: { "TCH-CORE-008": ["reading"] },
      caseId: "c", sourceId: "s", informantId: "i", collectedOn: "2026-09-10", payloadRef: "x",
    });
  } catch { threw = true; }
  check("lock: REFUSES incomplete submission", threw);
}

/* ---------- invitations ---------- */
{
  const t1 = generateToken(), t2 = generateToken();
  check("tokens: unique and url-safe", t1 !== t2 && /^[A-Za-z0-9_-]+$/.test(t1) && t1.length >= 40);

  const mk = (over: Partial<InvitationRecord> = {}): InvitationRecord => ({
    invitationId: "inv_1", caseId: "case_1", respondentRole: "teacher",
    tokenHash: hashToken(t1), expiresAt: new Date(Date.now() + 86400e3).toISOString(),
    status: "pending", maxUses: 1, uses: 0, ...over,
  });

  check("invitation: valid token accepted", checkInvitation(mk(), t1).ok);
  check("invitation: wrong token -> not_found",
    !checkInvitation(mk(), t2).ok && (checkInvitation(mk(), t2) as any).reason === "not_found");
  check("invitation: expired rejected",
    (checkInvitation(mk({ expiresAt: new Date(Date.now() - 1000).toISOString() }), t1) as any).reason === "expired");
  check("invitation: revoked rejected",
    (checkInvitation(mk({ status: "revoked" }), t1) as any).reason === "revoked");
  check("invitation: completed/used rejected",
    (checkInvitation(mk({ uses: 1 }), t1) as any).reason === "already_completed");
  check("invitation: deleted (retention) rejected",
    (checkInvitation(mk({ deletedAt: new Date().toISOString() }), t1) as any).reason === "deleted");
  check("invitation: null record -> not_found", (checkInvitation(null, t1) as any).reason === "not_found");
  check("invitation: url shape", invitationUrl("https://intake.example.com/", t1) === `https://intake.example.com/r/${t1}`);
}

/* ---------- QR ---------- */
{
  const url = invitationUrl("https://intake.example.com", generateToken());
  const png = await qrDataUrl(url);
  const svg = await qrSvg(url);
  check("qr: PNG data URL generated", png.startsWith("data:image/png;base64,") && png.length > 1000);
  check("qr: SVG generated for print", svg.includes("<svg") && svg.includes("path"));
}

console.log(failures === 0 ? "\nALL ENGINE CHECKS PASSED ✓" : `\n${failures} CHECK(S) FAILED ✗`);
process.exit(failures === 0 ? 0 : 1);
