/**
 * evidence-shape.conformance.ts — the D-134 MANDATORY conformance test.
 *
 * D-134 (B1): the structural shape of an evidence object lives as pure types
 * in @suite/reasoning-contracts (`EvidenceShape`); this package's zod
 * `Evidence` implements it. This test is what keeps the two from drifting:
 *
 *   1. COMPILE TIME — `TEvidence` must be assignable to `EvidenceShape`
 *      (checked by `tsc --noEmit`, which the test script runs; tsx alone
 *      strips types without checking them).
 *   2. RUNTIME — the shared vocabulary constants must match the zod enums
 *      exactly (a value added or removed on either side fails here).
 *
 * Removing or skipping this test is itself a violation of D-134.
 */

import {
  type EvidenceShape,
  type EvidenceConstructTag,
  EVIDENCE_EXTRACTION_METHODS,
  CONSTRUCT_TAG_STATUSES,
} from "@suite/reasoning-contracts";
import { Evidence, ConstructTag, type TEvidence } from "../src/entities";

/* 1 ── compile-time conformance (fails under `tsc --noEmit`, not at runtime) */

type MustExtend<A extends B, B> = A;
type _EvidenceImplementsShape = MustExtend<TEvidence, EvidenceShape>;
type _ConstructTagImplementsShape = MustExtend<
  TEvidence["constructTags"][number],
  EvidenceConstructTag
>;

let failures = 0;
const check = (name: string, ok: boolean, detail?: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? " — " + detail : ""}`);
  if (!ok) failures++;
};

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

/* 2 ── runtime vocabulary conformance */

const zodMethods = Evidence.innerType().shape.extractionMethod.options;
check(
  "D-134: extractionMethod vocabulary matches EVIDENCE_EXTRACTION_METHODS exactly",
  sameSet(zodMethods, EVIDENCE_EXTRACTION_METHODS),
  `zod: [${zodMethods}] vs shared: [${EVIDENCE_EXTRACTION_METHODS}]`,
);

const zodStatuses = ConstructTag.shape.status.removeDefault().options;
check(
  "D-134: construct-tag status vocabulary matches CONSTRUCT_TAG_STATUSES exactly",
  sameSet(zodStatuses, CONSTRUCT_TAG_STATUSES),
  `zod: [${zodStatuses}] vs shared: [${CONSTRUCT_TAG_STATUSES}]`,
);

/* 3 ── a canonical parsed Evidence record carries every shape field */

const now = new Date().toISOString();
const parsed = Evidence.parse({
  evidenceId: "ev_shape_1",
  caseId: "case_0001",
  sourceId: "src_001",
  responseIds: ["TCH-RDG-002"],
  constructTags: [{ id: "ACAD.READ.DECODING", status: "reported" }],
  polarity: "concern",
  statement: "Guesses at unfamiliar words from first-letter cues.",
  verbatim: "He usually looks at the first letter and guesses",
  extractionMethod: "llm",
  generation: {
    modelId: "claude-fable-5",
    promptVersion: "extract-v1",
    schemaVersion: "0.1",
    generatedAt: now,
  },
  createdAt: now,
});
// The assignment below is itself part of the conformance claim: a parsed
// Evidence IS an EvidenceShape with no mapping layer.
const asShape: EvidenceShape = parsed;
check(
  "D-134: parsed Evidence is an EvidenceShape with no mapping layer",
  asShape.evidenceId === "ev_shape_1" &&
    asShape.sourceId === "src_001" &&
    (asShape.responseIds ?? []).length === 1 &&
    (asShape.constructTags ?? [])[0]?.id === "ACAD.READ.DECODING" &&
    asShape.verbatim !== undefined &&
    asShape.extractionMethod === "llm" &&
    asShape.generation?.modelId === "claude-fable-5",
);

console.log(
  failures === 0
    ? "\nEVIDENCE-SHAPE CONFORMANCE PASSED ✓ (D-134)"
    : `\n${failures} CONFORMANCE CHECK(S) FAILED ✗ (D-134 violation)`,
);
process.exit(failures === 0 ? 0 : 1);
