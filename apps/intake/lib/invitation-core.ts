import type { TQuestionBank } from "@suite/case-model";
import { hashToken } from "./engine";

/**
 * Build the invitations-table row. Only the token HASH is stored; the raw
 * token exists solely in the returned URL/QR (shown once). Pure + testable.
 */
export function buildInvitationRow(args: {
  caseId: string;
  informantId: string;
  role: string;
  bank: TQuestionBank;
  rawToken: string;
  expiresAt: string;
}) {
  return {
    case_id: args.caseId,
    informant_id: args.informantId,
    respondent_role: args.role,
    bank_id: args.bank.bankId, // pinned at creation (D-013)
    bank_version: args.bank.version,
    token_hash: hashToken(args.rawToken), // hash only — raw token never persisted
    expires_at: args.expiresAt,
  };
}
