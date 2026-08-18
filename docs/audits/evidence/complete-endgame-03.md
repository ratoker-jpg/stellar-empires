# Recon evidence — COMPLETE-ENDGAME-03

**Audit PR:** #162  
**Baseline:** `8f05d22b3475ee99e9af8652d385c956e0acd7c7`  
**Roadmap milestone:** M8.3 — bot endgame closure  
**Runtime baseline:** schema v19 / save format v6

## 1. Baseline and prior closure

PR #161 `ENDGAME-TERMINAL-GATE` squash-merged as `8f05d22b3475ee99e9af8652d385c956e0acd7c7`. `COMPLETE-ENDGAME-02` therefore delivered and acceptance-closed the player/system final-object and terminal runtime path before this Audit begins.

The Stage-2 runtime already supplies ordinary commands and deterministic mechanics for:

- public/open alliances and solo eligibility;
- Solar War participation and persisted public/owner results;
- Obelisk eligibility and construction;
- final-project start and existing-resource contribution;
- ordinary Gate construction and the exact 86,400-second vulnerability window;
- ordinary `ATTACK` Gate destruction with the existing planet-destroyer role;
- Gate rebuild and host-planet loss recovery;
- immutable terminal result and exact terminal simulation freeze.

No new player-facing endgame mechanic is missing from the M8.3 bot domain.

## 2. Bot scheduler architecture

`src/simulation/bots/scheduler.ts` is already a deterministic cadence-driven command scheduler. Bot decisions are reduced through the same ordinary `GameCommand` path as player/system commands and scheduler catch-up is bounded.

Current planner sources cover logistics, economy, research, production, fleet/threat and PvE/meta behavior. There is no endgame-specific planner source and no direct final-object/Solar-War planning branch.

This means M8.3 should add a thin planner layer, not a parallel simulation engine.

Permanent tests already prove:

- due decisions run in canonical game-time order;
- large bot catch-up drains deterministically under a per-run budget;
- next bot decision times persist through save/load;
- the worker request/response is serializable;
- hidden player resource mutations do not change bot decisions.

## 3. Information boundary

`src/simulation/bots/perception.ts` already separates:

- full owned state;
- stored intelligence observations with explicit freshness;
- redacted public contacts;
- no direct unobserved foreign resource/fleet/defence access.

`tests/simulation/botPerception.test.ts` permanently proves that changing hidden foreign resources/inventory does not alter bot perception and that public contacts stay redacted.

The missing surface is explicit endgame perception. It must be derived from canonical public/owned endgame views rather than exposing raw `GameState` to a bot planner.

`src/simulation/endgame/solarWarView.ts` already supplies canonical public/owner Solar War presentation semantics. Stage-2 final-project selectors already identify the public vulnerable Gate state. These are the correct sources for bot-visible endgame facts.

Accepted information classes for M8.3:

### Public

A bot may know facts that the player can learn without private ownership/intelligence:

- alliance IDs/names/public membership needed by the existing open-alliance model;
- current Solar War public cycle/result data exposed by canonical public views;
- public active final-project identity, faction, host planet, phase and vulnerable/stabilization timing;
- terminal campaign result after it exists.

### Owned/allied

A bot may additionally know facts already legal to its own empire or immutable project cohort:

- its own current alliance membership;
- its own Solar War participation/result detail;
- its own qualification status;
- a final project it owns or is an eligible immutable cohort member of;
- that project's funding remainder/contribution state required to issue a legal contribution.

### Hidden

M8.3 must not expose merely because a foreign empire has an endgame object:

- hidden foreign resource stockpiles;
- hidden ship/defence inventories or fleet composition;
- private build/research/logistics queues;
- private intelligence observations belonging to another empire;
- private contribution-source resources;
- any foreign combat detail that the ordinary intelligence/public-contact layer would not reveal.

A hidden-state mutation must remain decision-inert unless it changes a canonical public/owned/intelligence fact.

## 4. Ordinary-command parity

Existing reducers already provide the command boundaries needed by bots:

- `CREATE_ALLIANCE` / `JOIN_ALLIANCE` / existing leave semantics;
- `ENTER_SOLAR_WAR`;
- `START_FINAL_OBJECT_PROJECT`;
- `CONTRIBUTE_FINAL_OBJECT`;
- ordinary building/event processing after funding;
- ordinary `ATTACK` for a vulnerable enemy Gate.

Bots must issue those same commands. No bot-only alliance membership, qualification, contribution, Gate completion, battle or terminal shortcut is authorized.

## 5. Final-project planning boundary

`src/simulation/endgame/finalObjects.ts` already owns eligibility, qualification, participation snapshot, contribution validation, build-queue transition, vulnerability, rebuild and host-loss semantics.

The bot layer needs only deterministic choices among already-legal actions:

1. participate solo or use an existing/open alliance according to a stable faction/profile rule;
2. enter the relevant Solar War when eligible;
3. after positive qualification, choose an owned legal host deterministically;
4. start one legal final project;
5. contribute affordable existing metal/crystal/gas from owned legal sources toward exact remaining requirements;
6. let ordinary construction/events progress the Gate;
7. when a public enemy Gate is vulnerable, prefer an ordinary legal `ATTACK` only if the bot already has a suitable owned fleet and ordinary mission requirements are met;
8. after Gate destruction or host loss, re-enter the same ordinary legal recovery path.

Planner policy must not manufacture fleets/resources or modify Stage-2 balance.

## 6. Determinism and persistence

No new persistent bot memory is required for M8.3. Decisions can be derived from:

- persisted simulation state;
- existing `botAutomation.nextDecisionAtByEmpire` cadence state;
- deterministic profile/empire ordering;
- canonical public/owned perception.

Therefore the accepted target remains **schema v19 / save format v6**, with no migration.

Required equivalence evidence:

- direct versus chunked time progression;
- save/load before and during bot endgame participation;
- save/load during final-project funding/building/vulnerability;
- offline catch-up crossing bot endgame decisions;
- terminal result equality and no post-terminal bot mutation.

## 7. Three-faction closure

Release 1.0 requires Aegis, Synod and Veyra autonomous bot empires to be capable of reaching/contesting the existing endgame with ordinary commands and allowed information.

The closure gate must prove representative deterministic campaigns rather than scripting a bot victory directly. It must cover:

- all three bot factions can participate in the endgame path;
- at least one autonomous bot final project can reach terminal victory in a deterministic fixture;
- rival bots can observe a public vulnerable Gate and attempt ordinary legal response when they possess a suitable fleet;
- player victory/defeat semantics remain persisted-cohort based;
- whole-state/checksum equality holds for the accepted direct/chunk/save-load partitions;
- permanent campaign performance budgets remain `<15 s` for one campaign day and `<30 s` for seven campaign days.

## 8. Complexity result

Complexity is **medium**.

Exactly four implementation PRs are justified because the risk boundaries are independent but use existing mechanics:

```text
#163 ENDGAME-BOT-PERCEPTION
→ #164 ENDGAME-BOT-PARTICIPATION
→ #165 ENDGAME-BOT-FINAL-OBJECTS
→ #166 ENDGAME-BOT-CLOSURE-GATE
```

No fifth M8.3 implementation PR is authorized by this Audit.

## 9. Critical unknowns

Resolved during recon:

1. **Need a new bot-specific endgame simulation engine?** No; scheduler already emits ordinary commands.
2. **Need new alliance/Solar-War/final-object commands?** No; ordinary commands exist.
3. **Need a schema/save migration?** No; planner decisions are derived and existing scheduler cadence already persists.
4. **May bots read raw foreign final-project host state?** No; use explicit public/owned endgame perception.
5. **Need a bot-specific Gate combat path?** No; use ordinary `ATTACK` and current combat/Gate destruction hooks.
6. **Need new assets/catalogs/currency/balance?** No.
7. **Does terminal runtime need bot-specific continuation?** No; terminal freeze/rejection already makes later bot mutation inert.
8. **Can this be safely bounded?** Yes; four sequential implementation PRs.

**Critical unknowns remaining: 0.**
