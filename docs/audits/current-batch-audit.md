# Current audit boundary

**Status:** `COMPLETE-ENDGAME-03` Audit #162 — recon complete, implementation unauthorized until Audit squash merge  
**Updated:** 2026-08-19  
**Fresh main / #162 baseline:** `8f05d22b3475ee99e9af8652d385c956e0acd7c7`  
**Previous closure:** #161 `ENDGAME-TERMINAL-GATE` → `8f05d22b3475ee99e9af8652d385c956e0acd7c7`  
**Runtime target:** schema v19 / save format v6 unchanged  
**Critical unknowns:** 0  
**Complexity:** medium

## Binding authority

While #162 is open:

- `docs/audits/complete-endgame-03-scaffold.md`;
- `docs/audits/evidence/complete-endgame-03.md`;
- `docs/audits/contracts/complete-endgame-03.md`;
- `docs/audits/current-execution-state.md`.

`implementationAuthorized: false` until #162 is exact-head green and squash-merged.

## Recon result

M8.3 is not a new gameplay system. Current scheduler/planners already operate by deterministic cadence and ordinary reducer commands; M8.1/M8.2 already supply alliances, Solar War, final-project funding/building, vulnerable Gate combat/recovery and terminal freeze.

The missing closure is:

1. explicit public/owned/allied/hidden endgame bot perception;
2. ordinary-command alliance/Solar-War bot participation planning;
3. ordinary-command final-project funding plus public vulnerable-Gate ATTACK response;
4. composed three-faction/save-load/offline/performance closure.

No new schema/save migration, catalog, currency, asset, route, mission family, combat engine, alliance treasury or global balance change is required.

## Accepted sequence after Audit merge

```text
#163 ENDGAME-BOT-PERCEPTION
→ #164 ENDGAME-BOT-PARTICIPATION
→ #165 ENDGAME-BOT-FINAL-OBJECTS
→ #166 ENDGAME-BOT-CLOSURE-GATE
```

No fifth M8.3 implementation PR is authorized.

## Information boundary

Bots may use canonical public endgame facts, own participation data, immutable allied-project data they are entitled to, existing owned state and existing intelligence/public contacts.

Bots must not gain hidden foreign resources, fleets, defences, build/research/logistics queues, private intelligence or private contribution-source data from endgame planning.

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

M9 release-candidate work remains outside this batch.
