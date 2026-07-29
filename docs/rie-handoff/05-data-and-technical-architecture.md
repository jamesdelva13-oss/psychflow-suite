# 05 — Data and Technical Architecture

## Architecture posture

Use a TypeScript monorepo shared across the Psych Suite. RIE imports—not duplicates—`@suite/case-model`, taxonomy, and reasoning contracts. AI calls are server-side through a provider adapter with schema-constrained JSON.

## Canonical entities

- **Case:** evaluation container; minimal student identifier; state framework; retention fields.
- **Informant:** contributor identity/role, separate from content.
- **Source:** immutable artifact such as a form submission, upload, interview, or observation.
- **Evidence:** atomic source-linked statement with construct tags, polarity, verbatim and normalized forms, extraction method, and optional severity/score.
- **Claim:** generated output statement with type, status, section, and supporting Evidence IDs.

Claim types:

- Reported fact.
- Respondent opinion.
- Cross-source synthesis.
- System inference.
- Missing information.
- Recommended follow-up.

## Additional aggregates

- QuestionBankVersion.
- Question/Module/Option.
- RoutingRule and CompletenessRule.
- ApprovedFollowUp.
- Invitation.
- RespondentSession.
- Response.
- GenerationRun.
- ReviewDecision.
- AuditEvent.
- ExportArtifact.

## Question schema example

```json
{
  "id": "TCH-COG-001",
  "bankVersion": "1.5.0",
  "respondent": "teacher",
  "module": "learning_cognitive",
  "constructIds": ["COG.GF"],
  "gradeBands": ["elementary"],
  "tier": "baseline",
  "prompt": "Compared with classmates, how readily does the student understand a new concept after typical instruction?",
  "response": {
    "type": "comparison_scale",
    "options": ["more_readily", "similarly", "less_readily", "not_observed"]
  },
  "required": true,
  "followUpRuleIds": [],
  "safetyCritical": false,
  "status": "active"
}
```

## Security and privacy

- Single-psychologist tenancy in MVP; nullable `organizationId` for later migration.
- Minimal identifiers and pseudonymous model payloads.
- TLS in transit and encryption at rest.
- Random invitation token; store SHA-256 hash, expiry, and single-use/revocation state.
- Exchange invitation token for signed HTTP-only session cookie.
- No secrets or PII in URLs, analytics, or ordinary logs.
- Retained encrypted store, per-case deletion, configurable auto-purge, and relay-and-purge configuration.
- No model training on user data.
- Audit access, generation, approval, export, and deletion.

## Reliability controls

- Validate all model output against schema.
- Every extracted concern cites at least one response ID.
- Verify quoted/verbatim text against the Source.
- Delete, relabel, or move no-source output to follow-up.
- Surface contradictions.
- Compute numbers deterministically.
- Store bank, taxonomy, prompt, schema, provider/model, and code versions with every generation.

## Suggested repository structure

```text
apps/
  rie-web/
  rie-worker/
packages/
  case-model/
  reasoning-contracts/
  taxonomy/
  question-bank-schema/
  content-teacher/
  content-parent/
  provenance/
  llm-provider/
  ui/
docs/
  decisions.md
  data-posture.md
  threat-model.md
  operations/
```

## Delivery order per feature

Database/schema → API → backend/domain logic → frontend → AI adapter → tests → documentation.

## Environments

- Local development with synthetic data.
- Automated test/preview environment with no real student data.
- Controlled pilot environment.
- Production.

Environment promotion requires migrations, rollback plan, seeded synthetic smoke tests, and audit/monitoring verification.

