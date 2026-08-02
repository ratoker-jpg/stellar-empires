# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-08-02  
**Last merged PR:** #145 `BOT-PVE-OPERATIONS` · `62aae31e2ad5e4ad04385a5cd94f77a70579d72f`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Closing batch:** `SUSTAINABLE-PVE-OPERATIONS-01` through PR #146  
**Next authorized work:** Audit PR #147 only  
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

## 5. Closing M6a — sustainable existing PvE

```text
#142 SUSTAINABLE-PVE-OPERATIONS-01 — Audit merged
→ #143 PVE-TARGET-RECOVERY — merged
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX — merged
→ #145 BOT-PVE-OPERATIONS — merged
→ #146 PVE-SUSTAINABILITY-GATE — closure active
```

Archive: `docs/audits/completed/sustainable-pve-operations-01.md`.

The batch makes existing PvE repeatable, understandable and honestly contested without adding Arena, Admiral services, reputation or endgame.

## 6. M6a delivered outcome

- deterministic six-hour recovery for depleted objects and pirate targets;
- occupied-position protection and stable target identity;
- target-only pirate-hunt reward scaling;
- one canonical opportunity model and routed Operations/report UX;
- public-only bot perception and ordinary-command participation;
- 40% gas reserve and legal intelligence/safety checks for bot missions;
- three-faction 48-hour direct/chunk/save equality;
- world-event chain preservation and bounded histories;
- permanent progression and performance protection.

PR #146 code head `a2e466bfffa3494ae9a08e2c4250e6fc78c89290` passed CI `30747647153` and Graphify `30747647145`. Browser E2E must pass on the final documentation head before merge. CI contains 106 test files / 557 tests, 15 progression cases with zero violations, one-day catch-up in 6.22 seconds and seven-day catch-up in 29.56 seconds.

## 7. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure reliable logistics, unlock the catalog, execute sustainable missions, fight and recover colonies, interact with complete PvE/meta systems, join or avoid alliances and reach victory or defeat.

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
| M6a — Sustainable existing PvE | closure active | Audit #142; #143–#145 merged; #146 closure |
| M6b — PvE meta systems | not audited | Arena, Admiral meta/services/reputation only if later justified |
| M7 — Autonomous bot parity | partial | colony logistics and sustainable PvE parity delivered |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid baseline;
- #146 is the fourth and final M6a implementation/closure PR;
- no fifth M6a implementation PR is authorized;
- player and bots use ordinary commands and visibility rules;
- campaign identity, schema v16/save v3 and one active/offline orchestrator remain unchanged;
- progression, determinism, Browser and performance gates remain mandatory;
- the next implementation batch requires a new accepted audit.

## 10. Immediate action

Validate final #146 documentation head, resolve review and squash merge. Then create Audit PR #147 only, synchronize the exact #146 merge SHA and select the next batch from actual `main` and this roadmap.
