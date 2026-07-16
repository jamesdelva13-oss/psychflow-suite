import { redirect } from "next/navigation";
import { getRespondentInvitationId } from "@/lib/respondent-session";
import {
  loadInvitationById,
  invitationUsable,
  bankForInvitation,
  loadDrafts,
} from "@/lib/respondent-data";
import { buildFormView } from "@/lib/form-view";
import { FormRunner } from "@/components/form-runner";

export default async function RespondPage() {
  const invitationId = await getRespondentInvitationId();
  if (!invitationId) redirect("/respond/unavailable?reason=no_session");

  const inv = await loadInvitationById(invitationId);
  if (!inv) redirect("/respond/unavailable?reason=not_found");

  const usable = invitationUsable(inv);
  if (!usable.ok) redirect(`/respond/unavailable?reason=${usable.reason}`);

  const bank = bankForInvitation(inv);
  const responses = await loadDrafts(inv.id);
  const view = buildFormView(bank, responses);

  return (
    <FormRunner
      invitationId={inv.id}
      title={bank.title}
      intro={bank.intro}
      estimatedMinutes={bank.estimatedMinutes}
      initialView={view}
      initialAnswers={responses}
    />
  );
}
