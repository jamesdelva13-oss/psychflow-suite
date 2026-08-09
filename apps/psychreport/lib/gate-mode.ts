/**
 * gate-mode.ts — the session-fidelity gate's deployment mode.
 *
 * CONFIGURATION, NOT A CODE PATH FORK. The adjudicator runs identically in
 * both modes: same model, same prompt version, same evidence set, same
 * fail-closed validation. What differs is only what the orchestration does
 * with the verdict.
 *
 *   enforce  A failing verdict rejects the draft: one targeted regeneration
 *            through the identical gate, then needs-review. Current behavior
 *            (D-140). The default.
 *   shadow   The verdict is recorded and the section proceeds regardless. No
 *            regeneration — regeneration changes the output, which is
 *            enforcement. The clinician sees nothing from the gate.
 *
 * Shadow exists to measure, not to soften: it produces the unaided rate at
 * which the drafting prompt alone satisfies D-140, which is the number a
 * deployment decision needs and which enforcement destroys by construction
 * (an enforced run never shows you what would have shipped).
 *
 * The mode is PERSISTED on the generation record. A shadow rejection and an
 * enforced rejection must never be indistinguishable later — a past verdict
 * has to stay interpretable when the mode has since changed.
 */

export type GateMode = "shadow" | "enforce";

/** Fail safe: anything unrecognized, absent, or malformed enforces. */
export const DEFAULT_GATE_MODE: GateMode = "enforce";

export const GATE_MODE_ENV = "PSYCHREPORT_FIDELITY_GATE_MODE";

/**
 * Resolve a mode from raw configuration. Unknown values do NOT throw — a
 * typo in an environment variable must not take generation down — but they
 * do fall back to `enforce`, so a misconfiguration can only ever be stricter
 * than intended, never quieter.
 */
export function resolveGateMode(raw?: string | null): GateMode {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "shadow" ? "shadow" : DEFAULT_GATE_MODE;
}

/** The configured mode for this process. */
export const configuredGateMode = (): GateMode =>
  resolveGateMode(process.env[GATE_MODE_ENV]);
