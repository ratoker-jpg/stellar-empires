# Current audit boundary

**Batch:** `M9-RELEASE-CANDIDATE` / Audit #167  
**Audit status:** recon complete; implementation unauthorized until Audit merge  
**Updated:** 2026-08-19  
**Audit baseline / #166 squash:** `a6b225fe38c1c320244fc54929534e49029d4026`  
**Runtime target:** schema v19 / save format v6 unchanged  
**Release target:** `1.0.0`  
**Critical unknowns:** 0  
**Complexity:** medium

## Binding authority

This Audit is governed by:

- `docs/audits/evidence/m9-release-candidate.md`;
- `docs/audits/contracts/m9-release-candidate.md`;
- `docs/audits/current-execution-state.md`;
- actual GitHub `main`, PR and workflow state when newer than prose.

## Fresh baseline

PR #166 `ENDGAME-BOT-CLOSURE-GATE` is merged. Generated fresh `main`:

`a6b225fe38c1c320244fc54929534e49029d4026`

M8.3 is closed. No additional M8 implementation is authorized.

## Verified M9 gaps

- new-game dialog contains obsolete copy claiming final victory/Gates are unavailable;
- normal Browser E2E tests the Vite dev root while production uses `/stellar-empires/`;
- release version metadata is still independently hard-coded as `0.1.0`;
- CI/E2E/Pages pin Node 22.12.0 despite current dependency engine warnings;
- README describes a materially obsolete early project state;
- no current evidence requires gameplay rebalancing, schema/save migration or a new mechanic.

## Proposed implementation sequence

If and only if Audit #167 exact-head gates pass and the Audit squash merges, authorize exactly:

```text
#168 RELEASE-ONBOARDING-TRUTH
→ #169 RELEASE-PRODUCTION-BROWSER
→ #170 RELEASE-PACKAGING-METADATA
→ #171 RELEASE-1.0-CLOSURE
```

Stable work-item IDs are authoritative if GitHub numbering changes.

No fifth M9 implementation PR is authorized by this Audit.

A post-#171 docs-only release record is permitted solely to record the generated closure SHA and post-merge Pages evidence if canonical status cannot self-record it.

## Hard boundaries

M9 does not authorize:

- new gameplay mechanics;
- new currencies/catalogs/factions/missions/combat engines;
- post-victory continuation mode;
- schema/save migration;
- arbitrary balance retuning without measured release evidence;
- tutorial persistence/quest systems;
- broad visual redesign;
- license selection on behalf of the owner;
- backend/cloud/multiplayer work.

## Audit acceptance

Before implementation begins, one exact #167 docs-only head must pass:

- asset audit, lint, typecheck, all tests and build;
- compressed progression;
- campaign performance budgets;
- Browser E2E;
- Graphify;
- reviews/unresolved threads clean;
- mergeability true.

Then mark #167 Ready, squash-merge with expected-head protection and verify the generated fresh `main` before creating `RELEASE-ONBOARDING-TRUTH`.
