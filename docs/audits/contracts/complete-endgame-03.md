# Accepted contract — COMPLETE-ENDGAME-03

**Status:** Audit #162; implementation begins only after Audit squash merge  
**Audit PR:** #162  
**Baseline:** `8f05d22b3475ee99e9af8652d385c956e0acd7c7`  
**Roadmap milestone:** M8.3 — bot endgame closure  
**Complexity:** medium  
**Implementation count:** exactly 4  
**Runtime target:** schema v19 / save format v6 (unchanged)

## 1. Audit conclusion

M8.3 is a bounded bot-planning/perception closure over already-delivered gameplay. Bots must use the same public/owned information classes, ordinary commands, resources, timing, combat and terminal boundary as every other empire.

Exactly four implementation PRs belong to this batch:

```text
#163 ENDGAME-BOT-PERCEPTION
→ #164 ENDGAME-BOT-PARTICIPATION
→ #165 ENDGAME-BOT-FINAL-OBJECTS
→ #166 ENDGAME-BOT-CLOSURE-GATE
```

No fifth M8.3 implementation PR is authorized.

## 2. Permanent invariants

- no bot-only endgame simulation state machine;
- no hidden foreign state access;
- no bot-only resources, fleets, qualification, construction, combat or terminal shortcut;
- no new gameplay command family unless a genuine reducer blocker is proven, and none is known at Audit close;
- no schema/save migration: remain v19/v6;
- no final-object catalog, asset, currency, balance, primary-route or combat-engine change;
- solo remains legal and alliances remain optional;
- existing Solar War and final-object contracts remain authoritative;
- existing exact terminal freeze remains authoritative;
- deterministic partition equality and permanent performance gates remain mandatory.

## 3. #163 ENDGAME-BOT-PERCEPTION

Add a pure endgame perception surface consumed by bot planners.

It must classify data as:

- `public`: canonical public alliance/Solar-War/final-project/terminal facts;
- `ownedOrAllied`: current empire/alliance/project-cohort facts legal to this bot;
- hidden data omitted entirely.

Rules:

- derive public Solar War information from canonical public view/selector semantics;
- derive own Solar War detail only for the bot empire/current participation;
- expose public final-project identity/host/phase/vulnerability timing but not hidden host resources, fleet inventories, queues or foreign contribution sources;
- expose funding remainder/contribution eligibility only when the bot owns or belongs to the immutable eligible project cohort;
- public vulnerable Gate location is legal target identity, but ordinary fleet/combat details still come only from existing owned/intelligence/public-contact perception;
- perception must be JSON-serializable/read-only and deterministic;
- changing hidden foreign state without changing a legal information class must not change endgame perception or downstream endgame decisions.

No scheduler behavior change beyond wiring the new read-only perception is required in #163.

## 4. #164 ENDGAME-BOT-PARTICIPATION

Add deterministic alliance/Solar-War bot planning through existing commands.

Rules:

- stable profile/empire rules choose solo versus an already-legal public/open alliance path; no diplomacy matrix or hidden scoring model;
- alliance create/join/leave operations, when selected, use existing ordinary commands and reducer validation;
- bots enter Solar War only through `ENTER_SOLAR_WAR` and only when that command is legal;
- bots never receive score/qualification directly;
- Solar War resolution remains the existing deterministic cycle/combat system;
- planner must be bounded to the existing scheduler command budget and cadence;
- failed ordinary commands remain ordinary scheduler diagnostics/rejections; planner may not patch state around them;
- save/load and hidden-state invariance must remain deterministic.

## 5. #165 ENDGAME-BOT-FINAL-OBJECTS

Add final-project and vulnerable-Gate response planning through existing mechanics.

Project path:

- require real positive Solar War qualification;
- choose a legal owned host deterministically from owned perception;
- `START_FINAL_OBJECT_PROJECT` through reducer;
- fund only via legal `CONTRIBUTE_FINAL_OBJECT` commands from currently owned source planets and currently available existing metal/crystal/gas;
- never synthesize resources or bypass exact remaining funding;
- ordinary build queue/events complete the Gate;
- after Gate destruction, ordinary project rebuild rules remain authoritative;
- after host loss, choose a new legal host later through a fresh ordinary project.

Enemy vulnerable Gate response:

- target only a Gate present in public endgame perception;
- only issue ordinary `ATTACK` when an already-owned suitable fleet and normal mission requirements make the command legal;
- do not inspect hidden target ships/defences/resources to decide whether the Gate is worth attacking;
- existing combat and surviving planet-destroyer role decide Gate destruction;
- no special attack success boost or direct Gate mutation.

## 6. #166 ENDGAME-BOT-CLOSURE-GATE

No new gameplay mechanics are intended in #166. It is the M8.3 composed acceptance/closure PR unless a genuine contract blocker discovered by #163–#165 requires the narrowest possible fix.

Required evidence:

- Aegis/Synod/Veyra bot endgame participation;
- representative solo/alliance paths where legal;
- real Solar War qualification → final-project start → funding → construction → vulnerability → stabilization/terminal path;
- public enemy Gate response through ordinary ATTACK when a legal capable fleet exists;
- Gate destruction/rebuild and host-loss recovery remain compatible with autonomous planning;
- direct/chunk equality across bot endgame decisions;
- save/load before/after participation, during funding/building/vulnerability and terminal;
- offline catch-up equality across the same boundaries;
- hidden-state mutation remains decision-inert;
- no post-terminal bot/time/world/logistics mutation beyond the already-authoritative terminal contracts;
- Browser release shell remains green; no new primary route is required;
- exact-head CI, Browser E2E, Graphify, permanent compressed progression and performance gates all green;
- review threads/reviews/mergeability clean;
- Stage-3 archive/status/roadmap synchronization.

## 7. Persistence

No new persisted bot field is authorized or required. Existing state/checksum/save coverage is sufficient because the planner derives decisions from persisted simulation state plus existing bot cadence state.

Target remains:

```text
state schema v19
save format v6
```

## 8. Performance

M8.3 may add planner work only at existing bot decision cadence. It must not introduce per-frame scanning or unbounded history.

Permanent gates remain:

```text
1 campaign day < 15 s
7 campaign days < 30 s
```

## 9. Hard exclusions

Not part of COMPLETE-ENDGAME-03:

- M9 release-candidate work;
- multiplayer/seasons;
- new alliance diplomacy/treasury;
- new missions or combat engine;
- new final buildings/assets/currency;
- global rebalance;
- post-victory sandbox;
- server requirement for the local browser campaign.

## 10. Authorization

While Audit #162 is open: `implementationAuthorized: false`.

After #162 itself is exact-head green, Ready, squash-merged and its generated squash is verified as fresh `main`, exactly #163–#166 become sequentially authorized. Each must branch from the immediately preceding generated squash main.

**Critical unknowns: 0.**
