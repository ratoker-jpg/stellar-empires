# Accepted contract — PVE-META-FOUNDATION-01

**Status:** accepted by Audit PR #147  
**Audit squash:** `50835aeb2864b96e026a7202ad419368e934e47b`  
**Roadmap milestone:** M6b — bounded PvE meta foundation  
**Complexity:** medium  
**Baseline:** PR #147 squash `50835aeb2864b96e026a7202ad419368e934e47b`  
**Planned implementation PRs:** #148–#151  
**Target schema/save:** v17 / v4 through #148 only

## Product decision

The batch adds one bounded persistent PvE progression axis and a local deterministic Arena loop.

It does **not** copy every Nemexia meta feature. The accepted product slice is:

```text
ordinary sustainable PvE
→ deterministic reputation awards
→ public local Arena challenges
→ existing-resource costs and rewards
→ routed Operations presentation
→ honest bot participation and closure gate
```

A separate PvE currency and Admiral services are rejected for this batch because they add overlapping economy, migration and balance surfaces without solving a current player problem.

## Ordered implementation

```text
#148 PVE-REPUTATION-FOUNDATION
→ #149 ARENA-PVE-CHALLENGES
→ #150 PVE-META-OPERATIONS-UX
→ #151 BOT-PVE-META-GATE
```

Exactly four implementation PRs are authorized. No fifth implementation PR may be added to this batch.

## #148 — PVE-REPUTATION-FOUNDATION

### Persistence

- bump simulation schema from v16 to v17;
- bump save format from v3 to v4;
- migrate every valid v16/v3 campaign deterministically with zero PvE reputation and no active Arena entry;
- preserve campaign seed, faction, progression profile, elapsed time, fleets, reports, targets and histories exactly;
- reject malformed future schema/save versions rather than guessing;
- direct, chunked, save-loaded and offline continuation must remain equivalent.

### Reputation model

Each empire receives one persisted non-negative safe-integer reputation score and one derived tier:

| Tier | Minimum reputation |
|---|---:|
| Recruit | 0 |
| Ranger | 100 |
| Vanguard | 300 |
| Warden | 700 |

Ordinary resolved PvE awards are deterministic:

| Resolution | Reputation |
|---|---:|
| successful expedition | +10 |
| successful space-object mission with positive recovered yield | +15 |
| pirate base destroyed | +30 |
| pirate base destroyed while it is the active `pirate-hunt` target | additional +20 |

Rules:

- failed, cancelled, recalled or passive recovery transitions award zero;
- one resolution can award at most once;
- save/load, replay and offline catch-up cannot duplicate awards;
- reputation never decays and cannot be purchased;
- existing resource rewards remain unchanged in #148;
- no separate PvE token, currency or premium balance is introduced.

### Architecture boundary

Create a dedicated PvE-meta domain consuming stable mission/combat resolution data. Do not extend the existing `spaceObjects` → `worldEvents` → `targetRecovery` import cycle.

## #149 — ARENA-PVE-CHALLENGES

### Arena definition

Arena is local deterministic PvE, not multiplayer or asynchronous PvP.

- three public challenges are available per six-hour campaign cycle;
- challenge identity and enemy composition derive only from campaign seed, cycle index and challenge slot;
- challenge difficulty is `patrol`, `assault` or `elite`;
- enemy fleets use existing faction unit definitions and the existing deterministic combat resolver;
- challenge data is globally public and contains no hidden empire state;
- occupied galaxy coordinates, pirate bases, world events and ordinary map missions are not mutated by Arena generation.

### Entry and resolution

- an empire may have at most one active Arena entry;
- entry requires one owned idle fleet and an existing-resource cost represented by canonical `ResourceCost`;
- no ships, fuel or resources may be fabricated;
- the entered fleet is unavailable until deterministic resolution;
- combat losses and survivors persist exactly as ordinary combat outcomes;
- losing or withdrawing grants no resource reward and no Arena reputation;
- winning grants existing resources plus reputation: `patrol +10`, `assault +20`, `elite +35`;
- challenge completion and reward application are atomic and idempotent;
- challenge/entry history is bounded by the same repository history policy used by other reports.

### Explicit non-goals

- no matchmaking, accounts, network authority or leaderboards;
- no PvP fleet snapshots;
- no season pass, shop, loot box or premium currency;
- no Admiral service catalogue;
- no new ship/building/research catalogue entries;
- no global economy or progression-profile rebalance.

## #150 — PVE-META-OPERATIONS-UX

Extend the existing canonical Operations workspace rather than adding another primary navigation family.

The routed UI must expose:

- current reputation, tier and next-tier progress;
- exact award explanations in reports/history;
- three current Arena challenges with cycle timing, difficulty and public enemy summary;
- eligible owned fleets, entry cost, duration and deterministic validation failures;
- active entry state and completed result;
- ordinary mission, Arena and reputation history without duplicate surfaces;
- release viewport, mobile viewport, keyboard, browser history, reload and reduced-motion equivalence.

Presentation may estimate difficulty only from public challenge data and owned fleet state. It must not expose hidden bot state or future random outcomes.

## #151 — BOT-PVE-META-GATE

### Honest bot participation

- bots read the same public Arena challenge model as the player;
- bots use owned state only and submit the same Arena entry command;
- no fabricated fleets, resources, reputation or intelligence;
- existing recovery, high-threat defense, progression and logistics priorities remain ahead of Arena;
- routine Arena planning unlocks no earlier than `planet-destruction` capability;
- at most one Arena command is emitted per bot decision;
- a 40% gas reserve and ordinary fleet readiness rules remain mandatory;
- hidden player resources, fleets or future outcomes cannot change a bot plan;
- Aegis, Synod and Veyra must all produce legal participation evidence.

### Closure gate

The final PR must prove:

- v16/v3 → v17/v4 migration without loss;
- all reputation sources, zero-award paths and duplicate prevention;
- Arena challenge identity across direct, six-hour chunked, save-loaded and offline partitions;
- 48-hour three-faction equality for reputation, challenges, entries, fleet outcomes and bounded histories;
- player and bot use the same command, cost, fleet and combat rules;
- no hidden-state dependency or state mutation during pure planning;
- current 15-case progression matrix remains zero-violation;
- one-day `<15 s` and seven-day `<30 s` performance gates remain unchanged;
- CI, Browser E2E and Graphify pass on the final documentation head.

## Batch-wide exclusions

- Admiral services;
- separate PvE currency;
- multiplayer/PvP Arena;
- ranking seasons or global leaderboards;
- alliances, Solar War, Obelisks, Gates, victory or defeat;
- physical logistics/convoy combat;
- continuous server authority;
- hidden-information exceptions;
- fifth implementation PR or scope absorption from M8/M9.

## Stop conditions

Stop and return to audit if implementation requires any of the following:

- a second persistent currency;
- a second schema/save bump inside the batch;
- replacing the deterministic combat resolver;
- privileged bot state;
- network services or account identity;
- weakening progression, determinism, Browser or performance gates;
- changing starting banks, global costs or progression constants to make Arena viable.
