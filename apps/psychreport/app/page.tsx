/**
 * VS-1 placeholder. The PsychReport shell and case workspace arrive in VS-2
 * (directive §19); until then this app is its data layer (lib/) over the
 * shared case model. No controls are rendered — a dead control would violate
 * directive §14.5.
 */
export default function Home() {
  return (
    <main>
      <h1>PsychReport</h1>
      <p>
        The PsychReport workspace is under construction. Case data flows
        through the shared case record — nothing to configure here yet.
      </p>
    </main>
  );
}
