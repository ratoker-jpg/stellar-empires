# Audit — COMPLETE-ENDGAME-02

**Status:** audit complete; squash merge pending; implementation is **not authorized until merge**  
**Updated:** 2026-08-18  
**Previous batch:** `COMPLETE-ENDGAME-01` — closed by PR #156  
**Exact PR #156 squash / audit baseline:** `c2fcaf39402392f0ebbad297d88f9689f4165e4c`  
**Branch:** `agent/complete-endgame-02-audit`  
**Current runtime baseline:** schema v18 / save format v5  
**Target runtime:** schema v19 / save format v6  
**Complexity:** medium  
**Critical unknowns:** 0

## Result

The recon is complete. Existing final buildings, assets, construction, combat, destruction, persistence, campaign-time/runtime and UI boundaries are concrete enough to authorize one bounded Stage-2 sequence **after this Audit is squash-merged**.

Authoritative audit artifacts:

- evidence: `docs/audits/evidence/complete-endgame-02.md`;
- contract: `docs/audits/contracts/complete-endgame-02.md`.

No gameplay/runtime code is changed by Audit #157.

## Accepted architectural decisions

- canonical final objects are the existing faction Obelisk + Supreme Galactic Gates definitions;
- no new mechanical catalog or asset is needed;
- Solar War remains the late-game qualification layer: a positive scored result is snapshotted into the project;
- solo completion remains first-class;
- final project has one owner empire/planet plus immutable solo/alliance cohort snapshot;
- alliance/solo contributions spend only existing metal/crystal/gas through a dedicated endgame command;
- ordinary transport stays own-colony-only;
- Gate funding target uses the existing calculated level-1 Gate cost;
- Gate construction reuses ordinary building queue/timing and `BUILDING_COMPLETE` machinery;
- Gate completion starts a public **86,400 campaign-second** vulnerability/stabilization window and does not immediately win;
- ordinary `ATTACK` remains the battle engine;
- attacker victory plus a surviving existing planet-destroyer role destroys a vulnerable Gate deterministically;
- final objects remain outside ordinary random demolition;
- host-planet destruction uses existing `reconcileDestroyedPlanet` and loses the project;
- no Gate HP/new repair queue: recovery is deterministic rebuild;
- persisted final-project and campaign-result state require schema v19/save v6;
- terminal result freezes game time at the exact campaign second;
- existing `executeAt` + `sequence` ordering remains authoritative at same-second races;
- after terminal, future events, logistics, world events, bots, queues and fleets remain inert as the exact snapshot;
- all gameplay mutation commands reject one `CAMPAIGN_TERMINAL` code;
- active/offline runtime consumes remaining real-time backlog without advancing terminal game state;
- terminal result is shown through existing Operations/Reports/HUD/catch-up shell; no new primary route;
- bot final-object planning/perception remains deferred to `COMPLETE-ENDGAME-03`.

## Accepted implementation sequence

Exactly four implementation PRs belong to `COMPLETE-ENDGAME-02`:

```text
#158 FINAL-OBJECT-FOUNDATION
→ #159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

No fifth implementation PR is authorized.

The complete file maps, command/state contracts, persistence model, event ordering and acceptance gates are in `docs/audits/contracts/complete-endgame-02.md`.

## Permanent closure requirements

The final closure PR #161 must prove, for all three player factions and both solo/alliance project identities:

- v18/v5 → v19/v6 migration and strict malformed-current rejection;
- Solar War qualification → Obelisk → contribution → Gate construction;
- public vulnerability and deterministic destruction/rebuild;
- exact terminal winner cohort and terminal timestamp;
- direct/chunk/save-load/resumable-offline equality at the terminal boundary;
- inert post-terminal state despite later requested time;
- bounded endgame histories;
- permanent compressed progression;
- Browser victory/defeat, reload, back/forward, responsive/mobile and reduced-motion behavior;
- one campaign day `<15 s` and seven days `<30 s`;
- CI, Browser E2E and Graphify green on the exact final head.

## Explicit exclusions

- no new meta-resource/currency;
- no alliance treasury/roles/invitations/diplomacy expansion;
- no allied ordinary fleet transport;
- no new final-object HP/repair queue;
- no random Gate demolition or separate combat engine;
- no new final-object assets/catalogs;
- no post-terminal continue/sandbox mode;
- no bot Gate planning or hidden-information changes;
- no multiplayer/seasons/M9/release work.

## Authorization boundary

`implementationAuthorized: false` while Audit PR #157 is open.

After #157 is squash-merged, fresh `main` must be fetched and the exact generated Audit squash SHA must be recorded in the first implementation scaffold. Only then may **#158 `FINAL-OBJECT-FOUNDATION`** exist, initially as a scaffold from fresh main. No implementation code belongs in Audit #157.
