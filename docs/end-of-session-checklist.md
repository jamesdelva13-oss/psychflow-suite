# End-of-session checklist

Run before closing any session that touched a governed document.
Governed = anything in `/docs`, `/rulepacks`, `/suite`, or `decisions.md`.

---

## 0. Confirm the working directory at session start  ⟵ *learned the hard way*

Before doing anything, confirm where the session is actually running
(`pwd`) — not just the project name the tool registered. The July 18 v0.6
session was registered by Claude Code under the **PsychReport QA Engine** project
name while every `bash` actually ran in **`~/psychflow-suite-build/psychflow-suite`**.
That mismatch is why the v0.6 commit hunt kept failing across multiple sessions:
forensics ran against the registered repo, but the work lived elsewhere. Confirm
`pwd` (and `git remote -v`) match the repo you think you're in.

## 0b. Did you log a decision inside a product repo?  (D-058)

If a decision was logged in a product repo's own `decisions.md`
(RIE/psychflow-suite, PsychReport, any future product repo), **merge it into the
canonical `suite/decisions.md` trunk and re-sync all copies before ending** —
renumber into the trunk sequence with a `[scope]` tag and a fork-reconciliation
provenance note (per D-038). This is structural: a Claude Code session in a
product repo can only see that repo's files, so it logs locally because the trunk
isn't in view. That has already forked the log twice (D-042–045, D-049–057). Do
not close the session on a locally-logged decision.

## 1. Did anything governed change?

If no — stop here.

## 2. Reconcile against `decisions.md`

- Does the change contradict an accepted decision? If so it is rejected
  unless a superseding entry is written (D-014).
- Did the session *make* a decision without logging one? Scope changes are
  decisions, not momentum (D-014). Log it, including as "OPEN" when
  undecided — an unlogged open question is carried in someone's head and
  lost at the end of the session.
- Are new entries numbered continuing the existing sequence, with no
  collisions and no renumbering of ratified entries?

## 3. Refresh Project Context  ⟵ *the one that fails silently*

Per **D-029**, any copy of a governed document in a Claude Project Context is
a **snapshot**, not a link. It does not update when the repo updates.

- [ ] Re-upload every amended document to the QA Engine Project Context.
- [ ] Confirm the version line in the uploaded copy matches the repo.

A stale grounding document is worse than a missing one: sessions cite it with
confidence and produce work that reconciles against nothing. This is the
failure mode with no error message — nothing breaks, the answers are just
quietly wrong.

## 4. Check for copies that shouldn't exist

- [ ] No edited copy in `~/Downloads` or a loose `~/Documents` folder. Those
      are delivery exports and are never sources (D-029).
- [ ] If a duplicate is found: **diff before deleting.** If identical,
      archive. If divergent, the divergence is a finding to report — someone
      edited a non-source, and what they intended is not yet in the repo.

## 5. Verify, don't assert

- [ ] TypeScript typechecks under `--strict`.
- [ ] Guard tests pass, with the count stated.
- [ ] JSON rulepacks parse.
- [ ] Any claim of the form "X is absent / X is present" was actually
      searched for, not recalled.

## 6. Update the manifest

`~/Documents/Psych Suite Projects/Psych Suite Manifest` is the map. Update
it whenever a session creates, moves, or renames a file — and correct any
earlier entry this session proved wrong, rather than leaving both versions
in the record.

---

## Standing reminder

Two failures recurred in July 2026 and are worth naming:

1. **Reasoning from a reconstruction as though it were the source.** A file
   rebuilt from a spec is evidence of the spec, not of the file. Label it,
   and do not audit it as though it were real.
2. **Withdrawing a requirement along with a bad implementation of it.** When
   retracting, retract the mechanism that was wrong — check separately
   whether the need that motivated it still stands.
