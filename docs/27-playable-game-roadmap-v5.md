# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-08-02  
**Last merged PR:** #150 `PVE-META-OPERATIONS-UX` · `39b85fe057d2cbf1fcff6b949a14bc62c7dbde63`  
**Merged runtime baseline:** schema v17 / save format v4  
**Active work:** #151 `BOT-PVE-META-GATE` · final M6b closure  
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

The merged product includes deterministic schema-v17/save-v4 campaigns, immutable active/offline time, compressed finite progression, complete catalogs/runtime art, ordinary missions/intelligence/combat, destruction/recovery, coherent multi-colony economy, hardened logistics, player colony operations, sustainable PvE, persistent reputation, local deterministic Arena mechanics and routed Arena Operations UX.

## 4. Completed M5 — multi-colony economy/logistics

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

## 6. Final M6b — bounded PvE meta foundation

Audit #147 was accepted as:

```text
50835aeb2864b96e026a7202ad419368e934e47b
```

Authorized sequence:

```text
#148 PVE-REPUTATION-FOUNDATION 430265b061764145e4e3ea1470d545f2ef82d0fa
→ #149 ARENA-PVE-CHALLENGES 42c484426e850b84263d4eecab63ebbb3eaafb05
→ #150 PVE-META-OPERATIONS-UX 39b85fe057d2cbf1fcff6b949a14bc62c7dbde63
→ #151 BOT-PVE-META-GATE — active final closure
```

Exactly four implementation PRs are authorized. No fifth implementation PR may be added.

### Delivered M6b outcome

- one persisted non-purchasable PvE reputation score per empire;
- Recruit/Ranger/Vanguard/Warden tiers;
- deterministic ordinary-PvE and Arena awards;
- one controlled schema v17/save v4 migration;
- three public local deterministic Arena challenges every six hours;
- existing faction ships, resources and combat;
- active entry, withdrawal, losses, survivors, rewards and bounded history;
- routed Operations reputation/Arena UX;
- public-only bot planning through the same Arena command;
- planet-destruction capability gate and 40% gas reserve;
- ordinary PvE and higher scheduler priorities ahead of Arena;
- legal Aegis, Synod and Veyra participation;
- 48-hour direct/chunk/save/offline exact full-state equality.

Accepted product decision:

- local deterministic Arena, not multiplayer or asynchronous PvP;
- existing-resource costs/rewards, no separate PvE currency;
- extension of Operations, not another primary route;
- public-only same-command bot participation.

Deferred/rejected:

- Admiral services;
- multiplayer/PvP Arena, matchmaking, rankings or seasons;
- new mechanical catalogs;
- global economy/progression rebalance;
- alliances and endgame.

Archive: `docs/audits/completed/pve-meta-foundation-01.md`.

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
| M6b — PvE meta foundation | final implementation active | Audit #147; #148–#150 merged; #151 closure |
| M7 — Autonomous bot parity | substantially delivered | economy, logistics, sustainable PvE and meta parity delivered; endgame parity remains |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid merged runtime baseline;
- exactly four implementation PRs are authorized for `PVE-META-FOUNDATION-01`;
- schema v17/save v4 was introduced only by #148 and remains unchanged;
- player and bots use ordinary commands, owned resources and public visibility rules;
- no separate PvE currency, Admiral services or multiplayer Arena;
- campaign identity and one active/offline orchestrator remain unchanged;
- progression, determinism, Browser, Graphify and performance gates remain mandatory;
- alliances/endgame require a later accepted audit.

## 10. Immediate action

Validate final #151 code+docs head, resolve review and squash merge. The immediately following PR must be Audit-only, record exact #151 squash SHA and authorize no implementation until accepted.
