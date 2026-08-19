# Continuation guide

## Current handoff

`COMPLETE-ENDGAME-03` is closed. PR #166 squash / fresh `main`:

`a6b225fe38c1c320244fc54929534e49029d4026`

M9 Release Candidate begins with mandatory Audit #167 on branch:

`agent/m9-release-candidate-audit`

Runtime remains schema v19 / save format v6. Target release is 1.0.0.

## Read before continuation

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/evidence/m9-release-candidate.md`
6. `docs/audits/contracts/m9-release-candidate.md`
7. `docs/project-status.json`
8. `docs/roadmap-pr-index.json`
9. `docs/27-playable-game-roadmap-v5.md`
10. actual GitHub `main`, Audit #167 and workflow state

Actual GitHub state overrides older prose when they differ.

## Completed gameplay baseline

M1–M8 gameplay delivery is mechanically complete for the local browser campaign:

- deterministic multi-colony economy and logistics;
- research, production, fleets and ordinary missions;
- combat, demolition/destruction/recovery, PvE and meta systems;
- three mechanical factions and autonomous bot empires;
- optional alliance participation and solo play;
- Solar War qualification;
- final Gate projects, vulnerability/destruction/recovery;
- persisted victory/defeat and exact terminal freeze;
- bot endgame perception/participation/final-project parity;
- save/load/offline/direct/chunk deterministic closure.

PR #166 required no new production mechanic and closed M8.3 with composed acceptance evidence.

## M9 recon result

Critical unknowns: **0**.

Verified release-hardening gaps are limited to:

- stale new-game release copy/orientation;
- lack of direct Browser proof for the production `/stellar-empires/` base path;
- `0.1.0` version drift and stale repository metadata;
- Node 22.12 workflow pins that sit below current dependency engine requirements;
- final 1.0 combined release closure and post-merge Pages verification.

No current evidence authorizes gameplay retuning or schema/save migration.

## Authorized implementation after Audit merge

Do not begin implementation while #167 is open.

After #167 squash-merges and its generated fresh main is verified, execute exactly:

```text
#168 RELEASE-ONBOARDING-TRUTH
→ #169 RELEASE-PRODUCTION-BROWSER
→ #170 RELEASE-PACKAGING-METADATA
→ #171 RELEASE-1.0-CLOSURE
```

Stable work-item IDs are authoritative if numbering changes.

No fifth M9 implementation PR is authorized.

A docs-only post-release record may be created after #171 solely to record the generated squash SHA and successful Pages deployment evidence. It may not add implementation.

## Merge discipline

For Audit #167 and every M9 implementation PR:

1. freeze one exact final head;
2. require Main CI, Browser E2E, Graphify, compressed progression and permanent one-day/seven-day performance gates green on that same head;
3. for #169 onward also require the dedicated production-base Browser smoke once introduced;
4. require unresolved review threads = 0, reviews/blockers = 0, expected base unchanged and mergeable = true;
5. mark Ready only after all gates pass;
6. squash-merge with expected-head protection;
7. verify generated fresh `main` before creating the next branch.

## Hard boundary

Do not add backend/accounts/cloud saves/multiplayer, new mechanics, post-victory sandbox, new currencies/catalogs, broad redesign, tutorial persistence or license terms during M9 unless a new separate owner decision and audit explicitly authorizes them.
