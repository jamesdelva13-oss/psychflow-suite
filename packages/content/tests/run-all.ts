/**
 * run-all.ts — validation for @suite/content.
 * Proves every authored file agrees with the contracts in @suite/case-model:
 * schema validity, taxonomy agreement, topography vocabulary, and full
 * referential integrity (branch targets, showIf refs, follow-up refs,
 * repeat-group sources).
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { Taxonomy, isKnownConstruct } from "../../case-model/src/taxonomy.schema";
import { Crosswalk } from "../../case-model/src/crosswalk.schema";
import { QuestionBank } from "../../case-model/src/question-bank.schema";
import { Topography } from "../../case-model/src/entities";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(here, p), "utf8"));

let failures = 0;
const check = (name: string, ok: boolean, detail?: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? " — " + detail : ""}`);
  if (!ok) failures++;
};

const tax = Taxonomy.parse(read("../../case-model/src/taxonomy.v0-3.json"));

/* crosswalk data */
const cwParsed = Crosswalk.safeParse(read("../crosswalk/crosswalk.v0-1.json"));
check("crosswalk: schema-valid", cwParsed.success);
if (cwParsed.success) {
  const bad = cwParsed.data.entries.flatMap(e => e.constructIds.filter(c => !isKnownConstruct(tax, c)));
  check("crosswalk: all construct IDs exist in taxonomy", bad.length === 0, bad.join(", "));
}

/* question banks */
const bankFiles = fs.readdirSync(path.join(here, "../banks")).filter(f => f.endsWith(".json"));
for (const bf of bankFiles) {
  const bankParsed = QuestionBank.safeParse(read(`../banks/${bf}`));
  check(`${bf}: schema-valid`, bankParsed.success, bankParsed.success ? "" : JSON.stringify(bankParsed.error.issues[0]));
  if (!bankParsed.success) continue;
  const bank = bankParsed.data;
  check(`${bf}: declares taxonomy ${tax.version}`, bank.taxonomyVersion === tax.version);

  const usedConstructs = new Set<string>();
  const usedTopos = new Set<string>();
  const qids = new Set<string>();
  const idList: string[] = [];
  const allQs = bank.modules.flatMap(m => [
    ...m.questions,
    ...(m.repeatGroups ?? []).flatMap(rg => rg.questions),
  ]);
  for (const q of allQs) {
    idList.push(q.id);
    qids.add(q.id);
    q.constructIds.forEach(c => usedConstructs.add(c));
    (q.options ?? []).forEach(o => {
      (o.constructIds ?? []).forEach(c => usedConstructs.add(c));
      if (o.topography) usedTopos.add(o.topography);
    });
  }
  bank.followUps.forEach(f => f.constructIds.forEach(c => usedConstructs.add(c)));

  check(`${bf}: question IDs unique (${idList.length} questions)`, idList.length === qids.size,
    idList.filter((v, i) => idList.indexOf(v) !== i).join(", "));
  const unknownC = [...usedConstructs].filter(c => !isKnownConstruct(tax, c));
  check(`${bf}: all ${usedConstructs.size} referenced constructs exist in taxonomy`, unknownC.length === 0, unknownC.join(", "));
  const unknownT = [...usedTopos].filter(t => !Topography.options.includes(t as never));
  check(`${bf}: all ${usedTopos.size} topographies exist in vocabulary`, unknownT.length === 0, unknownT.join(", "));

  const fuids = new Set(bank.followUps.map(f => f.id));
  const modids = new Set(bank.modules.map(m => m.id));
  const refErrors: string[] = [];
  for (const br of bank.branchRules) {
    if (!modids.has(br.target)) refErrors.push(`${br.id} -> unknown module ${br.target}`);
    br.when.forEach(c => { if (!qids.has(c.questionId)) refErrors.push(`${br.id} refs unknown ${c.questionId}`); });
  }
  for (const cr of bank.completenessRules) {
    if (!fuids.has(cr.askFollowUpId)) refErrors.push(`${cr.id} -> unknown follow-up ${cr.askFollowUpId}`);
    cr.when.forEach(c => { if (!qids.has(c.questionId)) refErrors.push(`${cr.id} refs unknown ${c.questionId}`); });
  }
  for (const m of bank.modules) {
    for (const q of m.questions) {
      (q.showIf ?? []).forEach(c => { if (!qids.has(c.questionId)) refErrors.push(`${q.id} showIf refs unknown ${c.questionId}`); });
      if ((q.responseType === "single_select" || q.responseType === "multi_select" || q.responseType === "likert") && !q.options?.length)
        refErrors.push(`${q.id} is ${q.responseType} with no options`);
    }
    (m.repeatGroups ?? []).forEach(rg => { if (!qids.has(rg.sourceQuestionId)) refErrors.push(`repeatGroup in ${m.id} refs unknown ${rg.sourceQuestionId}`); });
  }
  check(`${bf}: referential integrity`, refErrors.length === 0, refErrors.slice(0, 4).join("; "));
}

console.log(failures === 0 ? "\nALL CONTENT CHECKS PASSED ✓" : `\n${failures} CHECK(S) FAILED ✗`);
process.exit(failures === 0 ? 0 : 1);
