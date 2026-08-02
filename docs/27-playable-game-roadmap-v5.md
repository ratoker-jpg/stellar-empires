# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-08-02  
**Last merged PR:** #146 `PVE-SUSTAINABILITY-GATE` · `392abb2bf27267fef9777ff35eb96555941a42f3`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Active work:** Audit PR #147 `PVE-META-FOUNDATION-01`  
**Implementation:** blocked until audit acceptance  
**Release target:** complete local PvE browser campaign with autonomous bot empires

## 1. Product target

```text
choose faction and immutable campaign settings
→ develop a coherent multi-colony economy
→ configure predictable logistics and market support
→ research and build fleets
→ explore, spy, transport, colonize, recycle, raid and fight
→ compete with autonomous bot empires
→ participate in alliances and Solar War
→ build or destroy final Gates
→ reach deterministic victory or defeat
```

Nemexia references define systemic depth only. Stellar Empires keeps original terminology, assets, UI and implementation.

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted current audit and contracts;
3. `docs/audits/current-execution-state.md`;
4. `docs/project-status.json` and `docs/roadmap-pr-index.json`;
5. this roadmap;
6. canonical product/endgame contracts;
7. completed audits and old handoffs as history.

## 3. Delivered baseline

The product includes deterministic schema-v16/save-v3 campaigns, immutable active/offline time, compressed finite progression, complete catalogs/runtime art, ordinary missions/intelligence/combat, destruction/recovery, coherent multi-colony economy, hardened logistics, player colony operations and honest bot colony/PvE participation.

## 4. Completed M5

```text
#137 Audit
→ #138 COLONY-PORTFOLIO-FOUNDATION
→ #139 LOGISTICS-ROUTE-LIFECYCLE
→ #140 COLONY-OPERATIONS-UX
→ #141 BOT-COLONY-LOGISTICS-GATE
```

Archive: `docs/audits/completed/multi-colony-economy-logistics-01.md`.

## 5. Completed M6a — sustainable existing PvE

```text
#142 SUSTAINABLE-PVE-OPERATIONS-01 Audit 81f1959b0bdbdd72d05dc21a2dce0a9e1470f010
→ #143 PVE-TARGET-RECOVERY              e3d2c28385abd9772a18257eeb313bd8d45e581e
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX  dbc5bdf0bce439efa5f0c61c8846bbd9960ba43a
→ #145 BOT-PVE-OPERATIONS              62aae31e2ad5e4ad04385a5cd94f77a70579d72f
→ #146 PVE-SUSTAINABILITY-GATE         392abb2bf27267fef9777ff35eb96555941a42f3
```

Archive: `docs/audits/completed/sustainable-pve-operations-01.md`.

Delivered outcome:

- deterministic six-hour recovery for depleted objects and pirate targets;
- occupied-position protection and stable target identity;
- target-only pirate-hunt reward scaling;
- one canonical opportunity model and routed Operations/report UX;
- public-only bot perception and ordinary-command participation;
- 40% gas reserve and legal intelligence/safety checks for bot missions;
- three-faction 48-hour direct/chunk/save equality;
- world-event chain preservation and bounded histories;
- permanent progression and performance protection.

Final #146 head `54914d98c071b84c668af5e16b89cb851085f7ba` passed CI `30752151413`, Browser E2E `30752151392` and Graphify `30752151378`. Performance was 5.288 seconds for one day and 23.329 seconds for seven days under unchanged `<15 s` / `<30 s` gates.

## 6. Active M6b audit — bounded PvE meta foundation

Graphify confirms that Arena, Admiral, reputation, currency, alliance, Obelisk, victory and defeat domains do not exist. Audit #147 selects a deliberately bounded slice:

```text
#147 PVE-META-FOUNDATION-01 Audit — active
→ #148 PVE-REPUTATION-FOUNDATION
→ #149 ARENA-PVE-CHALLENGES
→ #150 PVE-META-OPERATIONS-UX
→ #151 BOT-PVE-META-GATE
```

The #148–#151 sequence becomes authorized only after Audit #147 is accepted.

Accepted product decision:

- one persisted non-purchasable PvE reputation score and derived tiers;
- one controlled v16/v3 → v17/v4 migration in #148;
- local deterministic Arena challenges using existing fleets, resources and combat;
- existing-resource costs/rewards, no separate PvE currency;
- extension of Operations, not another primary route;
- public-only same-command bot participation;
- 48-hour three-faction direct/chunk/save/offline gate.

Deferred/rejected:

- Admiral services;
- multiplayer/PvP Arena, matchmaking, rankings or seasons;
- new mechanical catalogs;
- global economy/progression rebalance;
- alliances and endgame.

Contract and evidence:

```text
docs/audits/contracts/pve-meta-foundation-01.md
docs/audits/evidence/pve-meta-foundation-01.md
```

## 7. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure reliable logistics, unlock the catalog, execute sustainable missions, fight and recover colonies, interact with complete bounded PvE/meta systems, join or avoid alliances and reach victory or defeat.

Bots must use the same commands, resources, timing and intelligence limits. Save/load/offline partitions must preserve deterministic outcomes.

## 8. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets | completed | Audit #101; #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; #107–#110 |
| M3 — Coherent UI shell | technically completed | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | completed | Audit #125; #126–#129 |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Demolition/destruction/recovery | completed | Audit #121; #122–#123 |
| M4c — Local campaign time | completed | Audit #130; #131–#132 |
| M4d — Campaign progression balance | completed | Audit #133; #134–#135 |
| M5 — Multi-colony economy/logistics | completed | Audit #137; #138–#141 |
| M6a — Sustainable existing PvE | completed | Audit #142; #143–#146 |
| M6b — PvE meta foundation | audit active | Audit #147; proposed #148–#151 |
| M7 — Autonomous bot parity | partial | colony logistics and sustainable PvE parity delivered; meta parity proposed in #151 |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid runtime baseline;
- no implementation before Audit #147 acceptance;
- exactly four implementation PRs are proposed for `PVE-META-FOUNDATION-01`;
- schema v17/save v4 may be introduced only by #148;
- player and bots use ordinary commands, owned resources and public visibility rules;
- no separate PvE currency, Admiral services or multiplayer Arena;
- campaign identity and one active/offline orchestrator remain unchanged;
- progression, determinism, Browser, Graphify and performance gates remain mandatory;
- alliances/endgame require a later accepted audit.

## 10. Immediate action

Validate Audit #147 documentation head, resolve review and squash merge. Then fetch its exact merge SHA and create only #148 `PVE-REPUTATION-FOUNDATION` from fresh `main`.
