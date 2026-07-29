# 02 — Decision Reconciliation

## Status vocabulary

- **Adopted:** production requirement.
- **Adopted with modification:** principle retained; implementation changed.
- **Superseded:** replaced by a later decision.
- **Prototype-only:** demonstrated, not ratified.
- **Open:** requires a ruling.
- **Phased:** accepted direction but outside the initial vertical slice/MVP.

## Reconciliation table

| Topic | Status | Production disposition |
|---|---|---|
| Shared `@suite/case-model` | Adopted | Use Case, Informant, Source, Evidence, Claim and Source → Evidence → Claim. |
| Taxonomy | Adopted | Use permanent construct IDs and current canonical version; never infer current version from stale prose. |
| Question-bank immutability (D-013/D-055) | Adopted | New wording or routing creates a new bank version; historical sessions retain their exact pin. |
| T1 vs. T1-obs (D-049) | Adopted | No concern is evidence of absence; insufficient opportunity is absence of evidence and prompts collect-elsewhere consideration. |
| Per-domain functional capture (D-089) | Adopted with modification | Preserve universal consideration and strengths/difficulties, but do not require paired checklists in every domain. Use domain-appropriate response formats. |
| Coverage placement (D-090/D-091) | Adopted | Case-file QA reconciles suspected areas against evaluation coverage. Do not pad PsychReport or overload respondents to satisfy the downstream check. |
| Grade/developmental banding | Adopted | Relevance routing, not a numeric burden cap. Central mapping; support ungraded/developmental placement. |
| Per-hidden-item `not_applicable_by_band` records | Superseded | Store bank version, session band, and routing configuration; reconstruct hidden status. |
| Not-observed option | Adopted | Required whenever a respondent may lack an observation window. |
| Hard numeric item ceiling | Rejected | Govern measured completion outcomes instead. |
| Checklists for all baseline items | Superseded | Hybrid response model chosen item by item. |
| Separate Configure Domains navigation | Superseded | Configuration lives under each form and optional case setup. |
| Upload completed forms | Adopted | First-class entry point, not secondary fallback. |
| Four-step respondent pattern | Adopted provisionally | Detailed in the interaction specification; validate in usability testing. |
| One-year aspirational outcome | Adopted | Optional teacher and parent item; render only if answered. |
| System-led follow-up in one completion session | Adopted | Deterministic first; approved-bank model selection later. |
| Parent form | Adopted in principle | Parent perspective is required; exact bank remains open and must not be treated as settled. |
| Test Selection | Adopted with modification, phased | Rename Assessment Planning; evidence-linked advisory support, not battery automation. |
| Persistent LLM chat | Phased | Shared suite assistant, case-aware and evidence-bound. Not parent conversational AI. |
| Apple-inspired visual direction | Adopted as design direction | Use restraint, hierarchy, whitespace, motion, and polish; do not copy Apple branding. |
| Prototype source code | Prototype-only | May inform interaction tests; do not harden it into production. |
| Current prototype questions/scales | Prototype-only | Clinical review and versioned authoring required. |

## Supersession required in canonical log

Before implementation merge, create a new `[RIE]` decision entry that:

1. Amends D-089’s prescribed per-domain checklist mechanism while preserving universal domain consideration.
2. Establishes domain-appropriate structured response formats.
3. Requires explicit observation escape for always-shown items.
4. Names grade/developmental banding as the preferred relevance mechanism.
5. Places instrument-burden release gates on measured completion outcomes.
6. Locates form configuration under Forms, not global navigation.

Do not silently edit D-089. Preserve original wording and append an amendment or later superseding decision under the canonical amendment rule.

## Scope reconciliation

The July 14 canon excludes parent conversational AI and assessment-battery automation from MVP. The later prototype does not automatically reopen that scope:

- The suite assistant is a psychologist-facing phased capability.
- Assessment Planning may suggest evidence-linked options but may not prescribe or automatically finalize a battery.
- Moving either into MVP requires a new decision entry with security, evaluation, and delivery consequences.

