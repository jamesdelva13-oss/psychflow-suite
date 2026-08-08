#!/usr/bin/env bash
# regen-manifest.sh — rebuild MANIFEST.sha256 over the governance-grade set.
#
# Coverage is the CF-9 full list (VS-0 map §3; proposed VS-1A, approved by JD
# 2026-08-07): the governance spine, Design System files, all migrations, the
# v6 package, current draft artifacts, all packages source/tests/fixtures,
# and apps/intake source. The list is derived mechanically from the globs
# below so coverage cannot silently rot; widening or narrowing it is a
# governance change and belongs in its own commit.
#
# Run from the repo root (end-of-session checklist §5), then verify:
#   tools/regen-manifest.sh && ./verify-suite.sh
set -euo pipefail
[ -f verify-suite.sh ] || { echo "Run from the repo root."; exit 1; }

{
  # Governance spine + Design System
  echo "CLAUDE.md"   # the onramp every session reads first — integrity-checked
  echo "decisions.md"
  # tokens.css moved into @suite/ui in VS-2; the packages/ find covers it.
  echo "docs/DESIGN-SYSTEM.md"
  echo "docs/preview.html"
  echo "docs/Psych_Suite_Vertical_Slice_Build_Directive.md"
  echo "docs/VS0-IMPLEMENTATION-MAP.md"
  echo "docs/contamination-audit.md"
  echo "docs/data-posture.md"
  echo "docs/drafting-spec.md"
  echo "docs/end-of-session-checklist.md"
  echo "docs/phase1-session1-brief.md"
  echo "docs/phase1-session1-outcome.md"
  echo "docs/psychreport-parameter-block.md"
  echo "docs/drafts/teacher-v1.6.0-clinical-review-draft.json"
  echo "docs/drafts/teacher-v1.6.1-clinical-review-draft.json"
  find docs/psych-suite-v6 governance migrations -type f ! -name ".DS_Store"
  # All packages: source, tests, fixtures, package manifests
  find packages -type f ! -path "*/node_modules/*" ! -name ".DS_Store"
  # App source: routes, components, lib, tests, the RLS + VS-1 harnesses
  find apps/intake apps/psychreport -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.css" \) \
    ! -path "*/node_modules/*" ! -path "*/.next/*"
  # Governance-adjacent tooling: the canonical fixture seed (D-136 re-seed
  # instrument) and the manifest/render tools themselves
  find tools -type f \( -name "*.ts" -o -name "*.mjs" -o -name "*.sh" \)
} | sort -u | while IFS= read -r p; do shasum -a 256 "$p"; done | sort > MANIFEST.sha256

echo "MANIFEST.sha256 regenerated over $(wc -l < MANIFEST.sha256 | tr -d ' ') files."
