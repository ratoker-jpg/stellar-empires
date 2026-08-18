# PR #158 — FINAL-OBJECT-FOUNDATION

**Status:** implementation complete; final exact-head validation pending  
**Authorized by Audit PR:** #157 `COMPLETE-ENDGAME-02`  
**Audit squash SHA:** `7750cdb83b58e95f790351b306e9cf5b344bd780`  
**Exact branch baseline:** `7750cdb83b58e95f790351b306e9cf5b344bd780`  
**Branch:** `agent/final-object-foundation`  
**Runtime baseline on `main`:** schema v18 / save format v5  
**Delivered branch runtime:** schema v19 / save format v6

## Delivered foundation

PR #158 implements only the first bounded work item from the accepted `COMPLETE-ENDGAME-02` contract:

- schema v19/save v6 with controlled v18/v5 migration;
- persisted final-object project state and persisted campaign-result shape with default `{ status: 'ongoing' }`;
- strict malformed-current final-object/result rejection;
- positive Solar War score qualification lookup and immutable qualification snapshot;
- qualified faction Obelisk queueing through the ordinary construction command/path;
- Supreme Galactic Gates remain unavailable through ordinary direct queueing;
- one owner empire and host planet per project;
- immutable sorted solo/alliance eligible-cohort snapshot at project start;
- project start/cancel commands;
- dedicated contribution command using only existing metal/crystal/gas from contributor-owned planets;
- exact Gate funding target calculated from the existing faction Gate level-1 definition/profile;
- bounded per-empire contribution totals plus newest-64 contribution/project histories;
- exact fully-funded transition into the ordinary building queue, ordinary timing calculation and existing `BUILDING_COMPLETE` event machinery without double charging;
- ordinary `CANCEL_BUILDING` cannot refund a pooled Gate; project cancellation removes funded construction without refunding contributed resources;
- ordinary fleet transport/deploy semantics are unchanged.

## Implementation paths

```text
src/simulation/endgame/finalObjects.ts
src/simulation/endgame/types.ts
src/simulation/planet/buildingQueue.ts
src/simulation/types.ts
src/simulation/createInitialGameState.ts
src/simulation/reducer.ts
src/storage/migrateGameStateV19.ts
src/storage/types.ts
src/storage/saveFormat.ts
```

The shared `buildingQueue.ts` helper preserves the existing construction duration, research-speed and specialization-speed pipeline for both ordinary paid construction and the pre-funded Gate transition.

## Validation added/updated

New dedicated coverage:

```text
tests/simulation/finalObjectFoundation.test.ts
tests/storage/finalObjectMigration.test.ts
tests/audit/finalObjectFoundationGate.test.ts
```

The closure matrix explicitly proves all six player cases:

```text
Aegis solo
Aegis alliance
Synod solo
Synod alliance
Veyra solo
Veyra alliance
```

Each case reaches exact pre-funded ordinary Gate construction and round-trips through the current save format. Alliance cases use a real second cohort member contribution before the owner completes funding.

Existing migration/current-version tests were advanced from the previous schema v18/save v5 baseline to schema v19/save v6 without rewriting historical migration-stage assertions.

## Acceptance boundary

Before #158 leaves draft, its exact final head must pass:

- CI including lint, typecheck, full tests, build and permanent progression;
- campaign catch-up performance gates;
- Browser E2E;
- Graphify;
- review-thread/review/mergeability inspection.

Only then may #158 be squash-merged and #159 be created as a draft scaffold from the generated fresh `main`.

## Explicit non-goals preserved

Not implemented in #158:

- Gate vulnerability/stabilization window;
- Gate attack/destruction/rebuild combat integration;
- terminal victory/defeat transition;
- campaign clock freeze or global `CAMPAIGN_TERMINAL` enforcement;
- terminal autosave/runtime backlog handling;
- final-object Operations/Reports/HUD terminal UX;
- bot endgame planning/perception;
- new currency, alliance treasury, assets/catalogs, balance overhaul, multiplayer, seasons or M9 work.

Those remain sequentially reserved for:

```text
#159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

No fifth implementation PR is authorized.

## Current next action

Complete exact-head gates and review/mergeability inspection for PR #158. Do not implement #159 before the generated #158 squash is on `main`.
