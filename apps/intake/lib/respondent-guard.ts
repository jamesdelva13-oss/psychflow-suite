/**
 * The autosave and submit routes are authorized solely by the respondent
 * session cookie, which is bound to exactly one invitation. A cookie for
 * invitation A must never be able to write invitation B.
 */
export function authorizeRespondent(
  sessionInvitationId: string | null,
  targetInvitationId: string
): boolean {
  return (
    !!sessionInvitationId &&
    !!targetInvitationId &&
    sessionInvitationId === targetInvitationId
  );
}
