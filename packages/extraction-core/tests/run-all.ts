/**
 * run-all.ts — fixture validation for @suite/extraction-core.
 *
 * The extractor itself is deliberately unimplemented until fixture #1 is
 * hand-annotated (golden set is authored first, blind — see src/index.ts).
 * What CAN be proven now, and must stay true as banks evolve, is the claim
 * every fixture README makes: each source.json is a valid, complete
 * submission against its pinned bank that locks to a checksummed Source.
 *
 * When a fixture gains a hand-annotated expected-evidence.json, it is
 * schema-checked here too (the .template.json placeholder is ignored).
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { QuestionBank } from "../../case-model/src/question-bank.schema";
import { Evidence } from "../../case-model/src/entities";
import { validateSubmission, lockSubmission } from "../../referral-engine-core/src/form-runtime";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));

let failures = 0;
const check = (name: string, ok: boolean, detail?: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? " — " + detail : ""}`);
  if (!ok) failures++;
};

/* Load every authored bank so fixtures resolve their pin by (bankId, version). */
const banksDir = path.join(here, "../../content/banks");
const banks = fs
  .readdirSync(banksDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => read(path.join(banksDir, f)));

const fixturesDir = path.join(here, "../fixtures");
const fixtureDirs = fs
  .readdirSync(fixturesDir)
  .filter((d) => fs.statSync(path.join(fixturesDir, d)).isDirectory());

check("fixtures: at least one fixture present", fixtureDirs.length > 0);

for (const dir of fixtureDirs) {
  const fx = read(path.join(fixturesDir, dir, "source.json"));
  check(`${dir}: fixtureId matches directory name`, fx.fixtureId === dir, String(fx.fixtureId));

  const raw = banks.find((b) => b.bankId === fx.bank.bankId && b.version === fx.bank.bankVersion);
  check(
    `${dir}: pinned bank ${fx.bank.bankId}@${fx.bank.bankVersion} exists in @suite/content`,
    raw !== undefined
  );
  if (!raw) continue;

  check(
    `${dir}: taxonomy pin matches bank`,
    raw.taxonomyVersion === fx.bank.taxonomyVersion,
    `bank=${raw.taxonomyVersion} fixture=${fx.bank.taxonomyVersion}`
  );

  const bank = QuestionBank.parse(raw);
  const v = validateSubmission(bank, fx.responses);
  check(
    `${dir}: complete, valid submission against pinned bank`,
    v.ok,
    v.ok ? "" : `missingRequired=[${v.missingRequired.join(", ")}] unknownKeys=[${v.unknownKeys.join(", ")}]`
  );

  if (v.ok) {
    const locked = lockSubmission({
      bank: raw,
      responses: fx.responses,
      caseId: "case-fixture",
      sourceId: `src-${dir}`,
      informantId: "informant-fixture",
      collectedOn: "2026-01-15",
      payloadRef: `fixtures/${dir}/source.json`,
      now: new Date("2026-01-15T12:00:00Z"),
    });
    check(`${dir}: locks to a checksummed Source`, /^[0-9a-f]{64}$/.test(locked.source.checksum));
  }

  const goldenPath = path.join(fixturesDir, dir, "expected-evidence.json");
  if (fs.existsSync(goldenPath)) {
    const golden = read(goldenPath);
    const records: unknown[] = Array.isArray(golden) ? golden : golden.evidence;
    const bad = (records ?? []).map((r) => Evidence.safeParse(r)).filter((r) => !r.success);
    check(`${dir}: hand-annotated expected-evidence.json is schema-valid`, Array.isArray(records) && bad.length === 0);
  } else {
    console.log(`SKIP  ${dir}: expected-evidence.json not yet hand-annotated (template only)`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} CHECK(S) FAILED ✗`);
  process.exit(1);
}
console.log("\nALL EXTRACTION-CORE FIXTURE CHECKS PASSED ✓");
