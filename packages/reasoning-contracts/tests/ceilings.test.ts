/**
 * Guard tests for @suite/reasoning-contracts.
 *
 * These test the two named guards in the contracts file plus the structural
 * invariants other packages rely on. Run: npx tsx tests/ceilings.test.ts
 *
 * Rewritten 2026-07-21 against the real API. The previous version of this file
 * tested a reconstructed API that never shipped and is not a record of anything.
 */

import {
  effectiveCeiling,
  isScopeUnestablished,
  requiresReviewBeforeIntegration,
  MODE_CONTRACTS,
  CONFIDENCE_POLICY,
  CONTRACTS_VERSION,
  mayPhraseAsRequirement,
  satisfiesDomainAddressed,
  tierAssignmentLegal,
  isAffirmativeTier,
  PARSER_CONFIDENCES,
  type SourceInterpretationPolicy,
  type SourceScope,
  type SectionMode,
  type RuleMetadata,
  type Tier,
  type ParserConfidence,
} from "../src/index.js";

let failures = 0;
const ok = (name: string, cond: boolean) => {
  if (cond) console.log("pass:", name);
  else {
    console.log("FAIL:", name);
    failures++;
  }
};

const scope = (over: Partial<SourceScope> = {}): SourceScope => ({
  informant: "TEACHER",
  settings: ["SCHOOL"],
  constructs: ["attention"],
  ...over,
});

const policy = (
  over: Partial<SourceInterpretationPolicy> = {},
): SourceInterpretationPolicy => ({
  sourceId: "src-1",
  validityStatus: "ACCEPTABLE",
  interpretiveCeiling: "FULL_INTERPRETATION",
  scope: scope(),
  establishedBy: "INSTRUMENT_DEFAULT",
  professionalReviewRequired: false,
  ...over,
});

// ── GUARD 1 · validity never resolves upward ────────────────────────────────

ok(
  "1. INVALID collapses to DO_NOT_INTERPRET",
  effectiveCeiling(policy({ validityStatus: "INVALID" })) === "DO_NOT_INTERPRET",
);

ok(
  "2. NOT_ESTABLISHED never reaches FULL_INTERPRETATION",
  effectiveCeiling(policy({ validityStatus: "NOT_ESTABLISHED" })) === "DESCRIBE_ONLY",
);

ok(
  "3. INVALID outranks a permissive declared ceiling",
  effectiveCeiling(
    policy({ validityStatus: "INVALID", interpretiveCeiling: "FULL_INTERPRETATION" }),
  ) === "DO_NOT_INTERPRET",
);

ok(
  "4. ACCEPTABLE_WITH_LIMITATIONS passes the declared ceiling through",
  effectiveCeiling(
    policy({
      validityStatus: "ACCEPTABLE_WITH_LIMITATIONS",
      interpretiveCeiling: "INTEGRATE_WITH_QUALIFICATION",
    }),
  ) === "INTEGRATE_WITH_QUALIFICATION",
);

ok(
  "5. a clean policy is not silently downgraded",
  effectiveCeiling(policy()) === "FULL_INTERPRETATION",
);

// ── GUARD 2 · absent scope is UNKNOWN, never UNRESTRICTED ───────────────────

ok("6. undefined scope is unestablished", isScopeUnestablished(undefined) === true);

ok(
  "7. empty settings is unestablished (not 'all settings')",
  isScopeUnestablished(scope({ settings: [] })) === true,
);

ok(
  "8. empty constructs is unestablished (not 'all constructs')",
  isScopeUnestablished(scope({ constructs: [] })) === true,
);

ok("9. a populated scope is established", isScopeUnestablished(scope()) === false);

ok(
  "10. unestablished scope caps an otherwise-valid source at DESCRIBE_ONLY",
  effectiveCeiling(policy({ scope: scope({ settings: [] }) })) === "DESCRIBE_ONLY",
);

ok(
  "11. unestablished scope forces review before integration",
  requiresReviewBeforeIntegration(policy({ scope: scope({ constructs: [] }) })) === true,
);

ok(
  "12. explicit review flag is honoured even with a clean scope",
  requiresReviewBeforeIntegration(policy({ professionalReviewRequired: true })) === true,
);

ok(
  "13. a clean source that requires no review needs none",
  requiresReviewBeforeIntegration(policy()) === false,
);

// ── Structural invariants other packages depend on ──────────────────────────

ok(
  "14. every SectionMode has a contract keyed to itself",
  (Object.keys(MODE_CONTRACTS) as SectionMode[]).every(
    (m) => MODE_CONTRACTS[m].mode === m,
  ),
);

ok(
  "15. no mode permits cross-source synthesis without CROSS_SOURCE synthesis",
  (Object.keys(MODE_CONTRACTS) as SectionMode[]).every((m) => {
    const c = MODE_CONTRACTS[m];
    return !(c.permitted.includes("SYNTHESIZE_CROSS_SOURCE") && c.synthesis !== "CROSS_SOURCE");
  }),
);

ok(
  "16. CONFIDENCE_POLICY ranks are unique and strictly descending",
  CONFIDENCE_POLICY.every((e, i) => i === 0 || CONFIDENCE_POLICY[i - 1]!.rank > e.rank),
);

// ── Regressions for the 2026-07-21 removals ─────────────────────────────────

const contracts: Record<string, unknown> = await import("../src/index.js");

ok(
  "17. PRECEDENCE is gone (sole-sourced in the parameter block §1)",
  !("PRECEDENCE" in contracts),
);

ok(
  "18. length-governance defaults are gone (sole-sourced in §7)",
  !("DEFAULT_LENGTH_GOVERNANCE" in contracts),
);

ok(
  "19. PILOT_METRICS is retained as shared instrumentation",
  "PILOT_METRICS" in contracts,
);

ok(
  "20. rank 0 is the missing-evidence floor and maps to UNSUPPORTED",
  CONFIDENCE_POLICY.find((e) => e.rank === 0)?.evidenceStatus === "UNSUPPORTED",
);

// ── Authority axis · must not collapse back into SourceStatus ───────────────

const rule = (over: Partial<RuleMetadata> = {}): RuleMetadata => ({
  ruleId: "R-1",
  rule: "example",
  sourceStatus: "LEGAL_OR_REGULATORY_RULE",
  authority: "mandated",
  scope: ["INTEGRATED_INTERPRETATION"],
  severity: "REVISION_REQUIRED",
  ...over,
});

ok(
  "21. only mandated rules may be phrased as requirements",
  mayPhraseAsRequirement(rule()) === true &&
    mayPhraseAsRequirement(rule({ authority: "defensibility" })) === false &&
    mayPhraseAsRequirement(rule({ authority: "craft" })) === false,
);

// (former test 22 — attorney-review scope — ported to the QA package:
//  packages/core/review-routing.test.ts, redefined as mandated-or-flagged.)

ok(
  "22. authority is NOT derivable from sourceStatus — a derived operationalization can still be mandated",
  mayPhraseAsRequirement(
    rule({ sourceStatus: "SOURCE_DERIVED_OPERATIONALIZATION", authority: "mandated" }),
  ) === true,
);

ok(
  "23. a house convention is never phrased as a requirement, whatever its severity",
  mayPhraseAsRequirement(
    rule({
      sourceStatus: "HOUSE_CONVENTION",
      authority: "craft",
      severity: "REVISION_REQUIRED",
    }),
  ) === false,
);

// ── Evidence-tier ladder (D-048) ────────────────────────────────────────────

ok(
  "24. domain-addressed is satisfied by T1 and the affirmative tiers",
  satisfiesDomainAddressed("T1") &&
    satisfiesDomainAddressed("T2") &&
    satisfiesDomainAddressed("T3"),
);

ok(
  "25. domain-addressed is NOT satisfied by T1-obs (absence of evidence) or T0",
  satisfiesDomainAddressed("T1-obs") === false &&
    satisfiesDomainAddressed("T0") === false,
);

ok(
  "26. T1 and T1-obs are distinct for the domain-addressed contract",
  satisfiesDomainAddressed("T1") === true &&
    satisfiesDomainAddressed("T1-obs") === false,
);

ok(
  "27. affirmative tiers require instrument-supplied affirmative data (no inferential upgrade)",
  tierAssignmentLegal("T2", true) === true &&
    tierAssignmentLegal("T2", false) === false &&
    tierAssignmentLegal("T3", false) === false,
);

ok(
  "28. non-affirmative tiers never require affirmative data",
  tierAssignmentLegal("T0", false) &&
    tierAssignmentLegal("T1", false) &&
    tierAssignmentLegal("T1-obs", false),
);

ok(
  "29. only T2/T3 are affirmative tiers",
  isAffirmativeTier("T2") &&
    isAffirmativeTier("T3") &&
    !isAffirmativeTier("T1") &&
    !isAffirmativeTier("T1-obs") &&
    !isAffirmativeTier("T0"),
);

const _tierExhaustive: Tier[] = ["T0", "T1", "T1-obs", "T2", "T3"];
void _tierExhaustive;

ok(
  "30. parse-trust vocabulary is exactly the three QA ceiling inputs (D-046)",
  PARSER_CONFIDENCES.length === 3 &&
    PARSER_CONFIDENCES.includes("parsed_ok") &&
    PARSER_CONFIDENCES.includes("parsed_low_confidence") &&
    PARSER_CONFIDENCES.includes("failed"),
);

const _confidenceExhaustive: ParserConfidence[] = [
  "parsed_ok",
  "parsed_low_confidence",
  "failed",
];
void _confidenceExhaustive;

console.log(
  failures === 0
    ? `\nALL PASS (30/30) · contracts ${CONTRACTS_VERSION}`
    : `\n${failures} FAILED`,
);
declare const process: { exitCode?: number };
process.exitCode = failures === 0 ? 0 : 1;
