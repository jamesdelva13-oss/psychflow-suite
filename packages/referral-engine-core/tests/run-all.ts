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
const teacher14 = JSON.parse(fs.readFileSync(path.join(here, "../../content/banks/teacher-form.v1.4.0.json"), "utf8"));
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

/* ---------- v1.4.0: conditional-depth (D-089) ---------- */
{
  // Visibility is never concern-gated: every domain module is active from the start.
  const empty: ResponseMap = {};
  const mods = activeModules(teacher14, empty);
  const domains = ["reading", "writing", "math", "self_regulation", "behavior",
                   "social_comm", "cognitive", "emotional", "adaptive"];
  check("teacher14: all domain modules active with zero answers",
    domains.every(d => mods.has(d)), domains.filter(d => !mods.has(d)).join(", "));
  check("teacher14: cog_adaptive_screen module retired (folded into domains)",
    !teacher14.modules.some((m: { id: string }) => m.id === "cog_adaptive_screen"));

  const vis0 = visibleQuestions(teacher14, empty).map(v => v.key);
  check("teacher14: baseline checklists visible before any answers",
    vis0.includes("TCH-RDG-008") && vis0.includes("TCH-RDG-001") &&
    vis0.includes("TCH-WRT-004") && vis0.includes("TCH-COG-000") && vis0.includes("TCH-ADP-000"));
  check("teacher14: safety screens always asked (BEH-002, EMO-004)",
    vis0.includes("TCH-BEH-002") && vis0.includes("TCH-EMO-004"));

  // Depth appears only when the domain checklist reports difficulty.
  let vis = visibleQuestions(teacher14, { "TCH-RDG-001": ["none"] }).map(v => v.key);
  check("teacher14: reading depth hidden when checklist reports none",
    !vis.includes("TCH-RDG-005") && !vis.includes("TCH-RDG-002"));
  vis = visibleQuestions(teacher14, { "TCH-RDG-001": ["decoding"] }).map(v => v.key);
  check("teacher14: reading depth opens on a difficulty selection",
    vis.includes("TCH-RDG-005") && vis.includes("TCH-RDG-002"));

  // 'none' on the behavior checklist spawns no ABC repeat instances (no topography).
  let inst = visibleQuestions(teacher14, { "TCH-BEH-001": ["none"] }).filter(v => v.repeatOf);
  check("teacher14: behavior 'none' spawns no repeat instances", inst.length === 0, `got ${inst.length}`);
  inst = visibleQuestions(teacher14, { "TCH-BEH-001": ["none", "aggression"] }).filter(v => v.repeatOf);
  check("teacher14: mixed selection spawns instances only for topography options",
    inst.length === 5 && inst.every(v => v.repeatOf?.optionValue === "aggression"), `got ${inst.length}`);

  // Gated-required depth is not demanded while hidden.
  const v0 = validateSubmission(teacher14, empty);
  check("teacher14: baselines required from the start",
    v0.missingRequired.includes("TCH-RDG-001") && v0.missingRequired.includes("TCH-WRT-004") &&
    v0.missingRequired.includes("TCH-EMO-004"));
  check("teacher14: hidden depth questions never required",
    !v0.missingRequired.includes("TCH-WRT-001") && !v0.missingRequired.includes("TCH-BEH-003"));

  // A complete submission with one flagged domain and clean baselines validates.
  const clean: ResponseMap = {
    "TCH-CORE-001": "gen_ed", "TCH-CORE-002": "3rd grade, all subjects", "TCH-CORE-003": "6to12m",
    "TCH-CORE-005": "Core reading block with Tier 2 phonics group", "TCH-CORE-006": "no",
    "TCH-CORE-007": "Curious, kind, strong at science", "TCH-CORE-008": ["reading"],
    "TCH-CORE-010": "start_year", "TCH-CORE-011": "no", "TCH-CORE-012": "no",
    "TCH-RDG-008": ["listens_comp"], "TCH-RDG-001": ["decoding"], "TCH-RDG-006": "somewhat_below",
    "TCH-RDG-005": ["independent"],
    "TCH-WRT-005": ["ideas_oral"], "TCH-WRT-004": ["none"], "TCH-WRT-002": "typical",
    "TCH-MTH-005": ["facts_grade"], "TCH-MTH-004": ["none"], "TCH-MTH-002": "typical",
    "TCH-SR-007": ["starts_tasks"], "TCH-SR-001": ["none"],
    "TCH-BEH-005": ["follows_expectations"], "TCH-BEH-001": ["none"], "TCH-BEH-002": "no",
    "TCH-SOC-006": ["has_friends"], "TCH-SOC-004": ["none"], "TCH-SOC-002": "initiates",
    "TCH-COG-000": "within", "TCH-COG-001": ["none"],
    "TCH-EMO-005": ["content"], "TCH-EMO-001": ["none"], "TCH-EMO-004": "no",
    "TCH-ADP-000": "within", "TCH-ADP-001": ["none"],
    "TCH-INT-001": "Tier 2 phonics group since September", "TCH-INT-004": "some_improve",
    "TCH-IMP-001": "Falls behind in independent reading tasks", "TCH-IMP-002": "Below expectations in ELA only",
  };
  const vc = validateSubmission(teacher14, clean);
  check("teacher14: complete conditional-depth submission validates",
    vc.ok, `missing=[${vc.missingRequired.join(", ")}] unknown=[${vc.unknownKeys.join(", ")}]`);

  // Reconciliation: concern flagged on CORE-008 while the domain checklist says none.
  const contradictory: ResponseMap = { ...clean, "TCH-RDG-001": ["none"] };
  const fus = pendingFollowUps(teacher14, contradictory);
  check("teacher14: CR-010 queues FU-GEN-005 when a flagged domain's checklist reports none",
    fus.some(f => f.ruleId === "CR-010" && f.followUpId === "FU-GEN-005"));
  check("teacher14: no reconciliation follow-up when checklist agrees with the flag",
    !pendingFollowUps(teacher14, clean).some(f => f.followUpId === "FU-GEN-005"));

  // Screener reconciliation + concern-set derivation still works on relocated screeners.
  const below: ResponseMap = { ...clean, "TCH-COG-000": "below" };
  check("teacher14: relocated screener still adds cognitive via=screener",
    computeConcernSet(teacher14, below).some(e => e.domain === "cognitive" && e.via === "screener"));
  check("teacher14: CR-020 queues reconciliation when 'below' but checklist reports none",
    pendingFollowUps(teacher14, below).some(f => f.ruleId === "CR-020"));

  // BEH-001 'answered' conditions were de-vacuoused: a none-only behavior baseline
  // must not trigger the behavior/social completeness rules.
  const behFus = pendingFollowUps(teacher14, clean);
  check("teacher14: CR-003/CR-007 stay silent on a none-only behavior baseline",
    !behFus.some(f => f.ruleId === "CR-003" || f.ruleId === "CR-007"));
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
