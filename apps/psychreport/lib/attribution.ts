import "server-only";
import {
  CaseAssignment,
  mayActOnCase,
  type TCaseAssignment,
  type TProfessionalProfile,
} from "@suite/case-model";

/**
 * attribution.ts — contributor attribution for case activity (VS-0 map §4
 * item 4; D-131).
 *
 * Attribution is by stable `profileId`, bridged from the authenticated
 * identity via professional_profiles.auth_user_id. It is ADDED, not
 * rewritten: the audit_events.actor column stays a string, existing rows
 * (`<psychologist auth-id>` and `respondent:<invitationId>`) remain valid
 * and untouched, and profile-attributed activity introduces a third actor
 * form — `profile:<profileId>` — alongside them. No schema change, no
 * migration: the actor vocabulary widens, the table does not.
 *
 * Authorization vs. attribution (D-131): whether the contributor MAY act is
 * defined by the canonical `mayActOnCase` over their assignments — never by
 * the profile record itself. Ending an assignment removes authorization; the
 * attributed history keeps its profileId forever.
 *
 * Enforcement boundary (D-137): `mayActOnCase` here is the PREFLIGHT — it
 * controls UX and produces useful refusals, evaluated at database-
 * authoritative time (db_now()). The final security boundary is the
 * database itself: migration 0008's trigger re-checks the assignment at the
 * mutation, serialized against concurrent revocation, so a stale or skipped
 * preflight cannot let a write through. A boundary refusal surfaces as the
 * same 403 the preflight produces.
 */

export interface SupabaseLike {
  from(table: string): any;
  rpc(fn: string, args?: Record<string, unknown>): any;
}

/* ---------- actor strings (additive vocabulary) ---------- */

export const PROFILE_ACTOR_PREFIX = "profile:";

export function actorForProfile(profileId: string): string {
  return `${PROFILE_ACTOR_PREFIX}${profileId}`;
}

export type ParsedActor =
  | { kind: "profile"; profileId: string }
  | { kind: "respondent"; invitationId: string }
  | { kind: "auth_user"; authUserId: string };

/** Existing string-actor rows keep parsing exactly as before — the two
 *  legacy forms are recognized first; `profile:` is the addition. */
export function parseActor(actor: string): ParsedActor {
  if (actor.startsWith(PROFILE_ACTOR_PREFIX)) {
    return { kind: "profile", profileId: actor.slice(PROFILE_ACTOR_PREFIX.length) };
  }
  if (actor.startsWith("respondent:")) {
    return { kind: "respondent", invitationId: actor.slice("respondent:".length) };
  }
  return { kind: "auth_user", authUserId: actor };
}

/* ---------- structural-metadata guard (same rule as intake) ---------- */

/**
 * Audit metadata carries structural facts (ids, counts, short enum-ish
 * strings), never narrative content (directive §13: audit metadata must not
 * become an uncontrolled narrative store). Any string long enough to smuggle
 * prose fails loudly.
 */
export function assertStructuralMetadata(value: unknown, path = "metadata"): void {
  if (typeof value === "string") {
    if (value.length > 160) {
      throw new Error(
        `audit ${path} looks like narrative content (${value.length} chars); audit metadata must stay structural`
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertStructuralMetadata(v, `${path}[${i}]`));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      assertStructuralMetadata(v, `${path}.${k}`);
    }
  }
}

/* ---------- profile bridge ---------- */

interface ProfileRow {
  id: string;
  organization_id: string | null;
  auth_user_id: string | null;
  discipline: string;
  display_name: string;
  credentials: string | null;
  created_at: string;
}

/** auth identity → stable profile. Null when no profile exists for the
 *  authenticated user (profiles are provisioned, never self-inserted —
 *  professional_profiles has no authenticated write policy). */
export async function profileForAuthUser(
  svc: SupabaseLike,
  authUserId: string
): Promise<TProfessionalProfile | null> {
  const { data, error } = await svc
    .from("professional_profiles")
    .select("id, organization_id, auth_user_id, discipline, display_name, credentials, created_at")
    .eq("auth_user_id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as ProfileRow;
  return {
    profileId: row.id,
    organizationId: row.organization_id,
    authUserId: row.auth_user_id,
    discipline: row.discipline as TProfessionalProfile["discipline"],
    displayName: row.display_name,
    credentials: row.credentials ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/* ---------- attributed activity writes ---------- */

interface AssignmentRow {
  id: string;
  case_id: string;
  profile_id: string;
  role: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

const assignmentFromRow = (r: AssignmentRow): TCaseAssignment =>
  CaseAssignment.parse({
    assignmentId: r.id,
    caseId: r.case_id,
    profileId: r.profile_id,
    role: r.role,
    startedAt: new Date(r.started_at).toISOString(),
    endedAt: r.ended_at ? new Date(r.ended_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(),
  });

export interface AttributedWriteResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

/** Postgres errcode raised by migration 0008's mutation-boundary trigger. */
const DB_AUTHZ_REFUSED = "42501";

/**
 * Record one case activity attributed to a contributor's stable profileId.
 * Preflight: refuses unless the profile holds an ACTIVE assignment on the
 * case — the canonical mayActOnCase answer over the live assignment rows,
 * evaluated at database-authoritative time (db_now(), never the local
 * clock — D-137). The write itself goes through the caller-supplied client
 * (service role in app routes); the database trigger re-enforces the same
 * rule atomically at the insert, and its refusal maps to the same 403.
 */
export async function recordAttributedActivity(deps: {
  svc: SupabaseLike;
  caseId: string;
  profileId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<AttributedWriteResult> {
  const { svc, caseId, profileId, eventType } = deps;
  assertStructuralMetadata(deps.metadata ?? {});

  const { data: dbNow, error: nowErr } = await svc.rpc("db_now");
  if (nowErr) throw nowErr;

  const { data: asgRows, error: asgErr } = await svc
    .from("case_assignments")
    .select("id, case_id, profile_id, role, started_at, ended_at, created_at")
    .eq("case_id", caseId)
    .eq("profile_id", profileId);
  if (asgErr) throw asgErr;

  const assignments = ((asgRows ?? []) as AssignmentRow[]).map(assignmentFromRow);
  const at = new Date(dbNow as string).toISOString();
  if (!mayActOnCase(profileId, caseId, assignments, at)) {
    return {
      ok: false,
      status: 403,
      body: { error: "no_active_assignment", boundary: "preflight" },
    };
  }

  const { error: insErr } = await svc.from("audit_events").insert({
    case_id: caseId,
    actor: actorForProfile(profileId),
    event_type: eventType,
    metadata: deps.metadata ?? {},
  });
  if (insErr) {
    if ((insErr as { code?: string }).code === DB_AUTHZ_REFUSED) {
      return {
        ok: false,
        status: 403,
        body: { error: "no_active_assignment", boundary: "database" },
      };
    }
    throw insErr;
  }

  return { ok: true, status: 200, body: { attributedTo: profileId } };
}
