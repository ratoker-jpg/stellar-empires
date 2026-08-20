# Continuation guide

## Current handoff

PR #170 `RELEASE-PACKAGING-METADATA` is merged. Generated fresh `main`:

`1221bfe19cc11f836db7fe7e5720f778419c2dd9`

The only active M9 work item is final closure PR #171 on branch:

`agent/release-1.0-closure`

Runtime remains schema v19 / save format v6. Package-authoritative final version in #171 is 1.0.0.

## Read before continuation

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/completed/m9-release-candidate.md`
6. `docs/audits/contracts/m9-release-candidate.md`
7. `docs/project-status.json`
8. `docs/roadmap-pr-index.json`
9. `docs/27-playable-game-roadmap-v5.md`
10. actual GitHub `main`, PR #171 and workflow state

Actual GitHub state overrides older prose when they differ.

## Completed product baseline

M1–M8 gameplay delivery is mechanically complete for the local browser campaign, and the first three M9 release-hardening items are merged:

- deterministic multi-colony economy and logistics;
- research, production, fleets and ordinary missions;
- combat, demolition/destruction/recovery, PvE and meta systems;
- three mechanical factions and autonomous bot empires;
- optional alliance participation and solo play;
- Solar War qualification;
- final Gate projects, vulnerability/destruction/recovery;
- persisted victory/defeat and exact terminal freeze;
- bot endgame perception/participation/final-project parity;
- save/load/offline/direct/chunk deterministic closure;
- truthful first-run release orientation;
- dedicated production-build Browser proof under `/stellar-empires/`;
- package-authoritative release version, Node 24 automation baseline and current README metadata.

## M9 final closure

Accepted Audit #167 authorized exactly four implementation work items. #168, #169 and #170 are merged. #171 is the fourth and final item.

#171 may only:

- advance the version from `1.0.0-rc.1` to `1.0.0` and synchronize root lock metadata;
- archive M9 and update canonical release-state documentation;
- run the combined exact-head release gates.

It must not introduce a new mechanic, schema/save migration, balance change or fifth implementation PR.

## Merge discipline for #171

1. freeze one exact final head;
2. require CI including asset audit/lint/typecheck/tests/build, compressed progression and permanent one-day/seven-day performance gates;
3. require existing Browser E2E and dedicated production-base Browser smoke green on the same head;
4. require Graphify, unresolved review threads = 0, reviews/blockers = 0, expected base unchanged and mergeable = true;
5. mark Ready only after all gates pass;
6. squash-merge with expected-head protection;
7. verify generated fresh `main` and post-merge Pages deployment.

If the generated #171 squash SHA or Pages evidence must be recorded in canonical docs, create only the explicitly permitted tiny docs-only release record. It may not add implementation.

## After Release 1.0

There is no authorized fifth M9 implementation PR. Any further product work must begin with a new Audit from the then-current fresh `main` and a new owner-approved scope. Repository license selection remains owner-controlled.
