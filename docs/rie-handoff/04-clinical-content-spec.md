# 04 — Clinical Content Specification

## Governing clinical principles

1. Good clinical content is not removed merely to shorten the form.
2. Content is shown only when relevant to the student and observable by the respondent.
3. Respondent burden is justified by expected clinical yield.
4. Omission, not observed, not applicable, and no concern are distinct.
5. Universal consideration does not require identical depth or response format across domains.
6. The case-file layer, not one informant form, determines whether evaluation planning addressed all suspected areas.

## Teacher domain candidates

- Core context and strengths.
- Reading.
- Written expression.
- Mathematics.
- Learning/cognitive functioning.
- Attention/self-management.
- Behavior/emotional functioning.
- Social interaction.
- Communication/language.
- Independence/adaptive functioning.
- Motor/sensory functioning.
- Health/context.
- Interventions, impact, supports, and desired outcome.

The exact module count must be reconciled against the frozen v1.4.0 bank and later superseding bank. Do not infer a new canonical count from the prototype.

## Response-format decision rule

Use:

- **Comparison/ability scale** for skill statements where every level matters.
- **Frequency scale** only for events the respondent can reliably observe.
- **Support scale** for degree of prompting or independence.
- **Check-all-that-apply** for examples, contexts, topographies, interventions, or sensory characteristics.
- **Single select** for global status, onset category, or observation opportunity.
- **Open text** for strengths, examples, impact, response to intervention, and aspirations.

Each scale must match its construct. Do not use one universal “usually/sometimes/rarely” scale across ability, difficulty, frequency, and support.

## Grade/developmental routing

- Central mapping from grade to a small developmental band set.
- Support a direct developmental/ungraded band selection.
- Store the resolved band and mapping version on the session.
- Use routing to remove categorically irrelevant items.
- Do not use routing to remove an applicable domain merely because the respondent has not observed it.

## Evidence-tier rendering

- T0, not asked: no clinical statement unless routing context is needed outside prose.
- T1, explicitly no concern: bare attributed negative bounded to what was screened.
- T1-obs, insufficient opportunity: do not render as no concern; create collect-elsewhere flag when material.
- T2, affirmative within/above or identified characteristic: one attributed statement licensed by the actual response.
- T3, T2 plus detail: attributed domain paragraph with reported examples/context.

Never reconstruct specifics that the form did not screen. A high-level clearance licenses only a high-level “no concerns reported.”

## Summary rules

- Placement-agnostic, one cohesive professional voice.
- One paragraph per clinically relevant domain.
- Attribute uniformly to the respondent without repetitive disclaimers.
- Preserve hedges, uncertainty, and observation/opinion distinctions.
- Do not escalate frequency, severity, causation, or certainty.
- Report contradictory answers together; do not reconcile.
- Retain strengths.
- Keep attention/executive functioning explicit.
- Do not add diagnostic, eligibility, or adverse-impact conclusions.
- Do not expose internal tiers, item IDs, rule names, or routing commentary in report prose.

## Safety

- Safety items require visible help text and expedited-review flagging.
- The form instructs respondents not to use it for emergencies.
- A positive safety response must not depend on ordinary summary review timing.
- Exact escalation operations require district/legal review before live deployment.

## Content governance

- Permanent item IDs.
- Published versions immutable.
- Summary constraints travel with the bank.
- Deprecate rather than delete.
- Each item records respondent, domain/construct tags, polarity elicited, response type/options, applicability, required status, follow-up eligibility, safety status, and rationale.
- Clinical bank review includes a school psychologist, district design partner, and appropriate legal/privacy review for sensitive items.

