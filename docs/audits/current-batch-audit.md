# Current audit boundary

**Status:** `COMPLETE-ENDGAME-03` Audit #162 accepted and squash-merged  
**Updated:** 2026-08-19  
**Audit baseline / #161 squash:** `8f05d22b3475ee99e9af8652d385c956e0acd7c7`  
**Audit squash:** `b7de24f52c02480f6db244c00b1282407d5743cc`  
**Current fresh main / #164 squash:** `5be7b44eb51cf389e8006f0a0201ab61c0ee0df5`  
**Runtime target:** schema v19 / save format v6 unchanged  
**Critical unknowns:** 0  
**Complexity:** medium  
**Implementation authorized:** yes, exactly #163–#166 sequentially

## Binding authority

The accepted M8.3 implementation is governed by:

- `docs/audits/evidence/complete-endgame-03.md`;
- `docs/audits/contracts/complete-endgame-03.md`;
- `docs/audits/current-execution-state.md`.

Actual merged GitHub state overrides older scaffold/status prose.

## Accepted sequence and current position

```text
#162 COMPLETE-ENDGAME-03 Audit    → b7de24f52c02480f6db244c00b1282407d5743cc
#163 ENDGAME-BOT-PERCEPTION       → 46e0966c2843424d6e098e363327ffe5cf74d352
#164 ENDGAME-BOT-PARTICIPATION    → 5be7b44eb51cf389e8006f0a0201ab61c0ee0df5
#165 ENDGAME-BOT-FINAL-OBJECTS    → active
#166 ENDGAME-BOT-CLOSURE-GATE     → next and final implementation PR
```

No fifth M8.3 implementation PR is authorized.

## Information boundary

Bots may use canonical public endgame facts, own participation data, immutable allied-project data they are entitled to, existing owned state and existing intelligence/public contacts.

Bots must not gain hidden foreign resources, fleets, defences, build/research/logistics queues, private intelligence or private contribution-source data from endgame planning.

## #165 accepted boundary

- require a real positive Solar War qualification for the current participation identity;
- use ordinary qualification-gated Obelisk construction when a legal host still needs it;
- start the final project only through `START_FINAL_OBJECT_PROJECT`;
- contribute only existing resources from owned planets through `CONTRIBUTE_FINAL_OBJECT_PROJECT`, never above the exact remainder;
- let ordinary build/events own Gate construction and vulnerability;
- respond to a public enemy vulnerable Gate only with current legal intelligence, an already-owned suitable fleet and ordinary `SEND_FLEET` attack legality;
- never inspect hidden foreign economy/fleet/defence state to score the target;
- existing combat, Gate destruction/rebuild and host-loss semantics remain authoritative;
- no schema/save, asset, catalog, currency, route, mission-family, balance or combat-engine change.

## Closure gates

Every downstream PR remains sequential from fresh `main`. Final heads require:

- asset/lint/typecheck/test/build CI;
- Browser E2E;
- Graphify;
- compressed progression;
- `<15 s` one-day and `<30 s` seven-day campaign performance;
- review threads/reviews clean;
- mergeability true;
- expected-head squash merge.

#166 owns composed three-faction/save-load/offline/direct-chunk/terminal acceptance plus Stage-3 archive/status/roadmap closure. M9 remains outside this batch.
