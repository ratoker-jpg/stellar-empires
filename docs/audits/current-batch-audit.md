# Current audit boundary

**Status:** Audit PR #157 `COMPLETE-ENDGAME-02` squash-merged; bounded implementation sequence active; only PR #158 is currently allowed  
**Updated:** 2026-08-18  
**Audit squash / fresh `main`:** `7750cdb83b58e95f790351b306e9cf5b344bd780`  
**Current runtime on `main`:** schema v18 / save format v5  
**Accepted Stage-2 target:** schema v19 / save format v6  
**Critical unknowns:** 0

## Audit closeout

Audit #157 completed with no gameplay/runtime implementation and passed exact-head gates on `d45f97b50d8f518ea01ad160e6e9a34500f8fa6d`:

- CI `32156043266` — success; 621 tests passed, 1 skipped; build/progression green;
- one campaign day `4.316 s < 15 s`;
- seven campaign days `21.087 s < 30 s`;
- Browser E2E `32156043231` — success, 33/33;
- Graphify `32156043235` — success;
- unresolved review threads 0; submitted reviews 0; mergeable true;
- squash/new `main`: `7750cdb83b58e95f790351b306e9cf5b344bd780`.

Authoritative evidence and contract:

- `docs/audits/evidence/complete-endgame-02.md`;
- `docs/audits/contracts/complete-endgame-02.md`.

## Accepted Stage-2 contract

- use existing faction Obelisk and Supreme Galactic Gates definitions, costs, prerequisites, timings and assets;
- positive scored Solar War result is the qualification snapshot; no new meta-currency;
- solo completion remains first-class;
- alliance project has one owner empire/planet and immutable eligible-cohort snapshot;
- contributions spend existing metal/crystal/gas through a dedicated endgame command; ordinary transport stays own-colony-only;
- Gate funding target and construction reuse existing catalog calculations and building queue;
- Gate completion later starts a public `86,400` campaign-second vulnerability window;
- ordinary `ATTACK` remains canonical combat; vulnerable Gate destruction later reuses the existing planet-destroyer role;
- final objects remain outside random demolition;
- host-planet destruction reuses existing reconciliation;
- no Gate HP/new repair queue; recovery is rebuild;
- final-project/result persistence target is schema v19/save v6 with controlled v18/v5 migration;
- existing `executeAt` then `sequence` event order remains authoritative;
- terminal campaign freezes at the exact result second and later gameplay mutations reject `CAMPAIGN_TERMINAL`;
- existing Operations/Reports/HUD/catch-up shell is reused;
- bot final-object/Solar-War perception and planning remain deferred to `COMPLETE-ENDGAME-03`.

## Bounded implementation sequence

Exactly four implementation PRs belong to `COMPLETE-ENDGAME-02`:

```text
#158 FINAL-OBJECT-FOUNDATION
→ #159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

No fifth implementation PR is authorized.

## Current authorization boundary

`implementationAuthorized: true`

Authorization is **sequential**, not parallel. The only current implementation item is:

```text
#158 FINAL-OBJECT-FOUNDATION
```

#158 may implement only:

- schema v19/save v6 foundation and strict v18/v5 migration;
- persisted final-object/result foundation;
- positive Solar War qualification snapshot;
- qualified ordinary Obelisk queueing;
- immutable solo/alliance project cohort;
- project start/cancel;
- existing metal/crystal/gas contribution ledger;
- exact calculated Gate funding target;
- pre-funded transition into existing Gate construction timing/queue;
- one active project per participation/host planet;
- bounded histories and save/load validation.

Not authorized in #158:

- Gate vulnerability/stabilization;
- Gate attack/destruction/rebuild combat integration;
- terminal victory/defeat/freeze;
- terminal runtime/autosave/UI;
- bot endgame planning/perception;
- new currency/assets/catalogs or wider transport behavior.

## Exact next action

PR #158 starts as a draft scaffold from fresh `main` `7750cdb83b58e95f790351b306e9cf5b344bd780`. Do not create or implement #159 until #158 is fully validated and squash-merged.