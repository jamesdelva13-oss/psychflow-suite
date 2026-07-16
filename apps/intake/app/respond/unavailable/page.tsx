const MESSAGES: Record<string, { title: string; body: string }> = {
  not_found: {
    title: "Link not recognized",
    body: "This invitation link isn't valid. Please check the link or ask the school psychologist to resend it.",
  },
  expired: {
    title: "Link expired",
    body: "This invitation has expired. Please ask the school psychologist for a new link.",
  },
  revoked: {
    title: "Link no longer active",
    body: "This invitation was withdrawn. Please contact the school psychologist if you believe this is a mistake.",
  },
  already_completed: {
    title: "Already submitted",
    body: "This questionnaire has already been completed. Thank you.",
  },
  deleted: {
    title: "No longer available",
    body: "This invitation is no longer available.",
  },
  no_session: {
    title: "Please reopen your link",
    body: "Your session wasn't found. Please open the invitation link again.",
  },
};

export default async function UnavailablePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const msg = MESSAGES[reason ?? ""] ?? MESSAGES.not_found;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-brand">{msg.title}</h1>
        <p className="mt-3 text-slate-600">{msg.body}</p>
      </div>
    </main>
  );
}
