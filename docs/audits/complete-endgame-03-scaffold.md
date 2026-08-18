# COMPLETE-ENDGAME-03 — bot endgame closure Audit

**Status:** Audit recon complete; implementation remains unauthorized until this Audit squash-merges  
**Updated:** 2026-08-19  
**Audit PR:** #162  
**Exact baseline / PR #161 squash:** `8f05d22b3475ee99e9af8652d385c956e0acd7c7`  
**Runtime target:** schema v19 / save format v6 unchanged  
**Complexity:** medium  
**Critical unknowns:** 0

## Outcome

Recon found no missing player-facing endgame mechanic. Current bots already run through a deterministic cadence scheduler and emit ordinary `GameCommand`s, while alliance, Solar War, final-project funding/construction, vulnerable-Gate combat and terminal behavior already exist from M8.1/M8.2.

The remaining release gap is a bounded bot perception/planning layer plus composed deterministic closure.

Authoritative evidence:

- `docs/audits/evidence/complete-endgame-03.md`

Accepted contract:

- `docs/audits/contracts/complete-endgame-03.md`

## Accepted information boundary

Bots may consume explicit canonical:

- public alliance/Solar-War/final-project/terminal facts;
- own empire/participation detail;
- own or immutable-allied-project funding/eligibility detail;
- existing intelligence observations and redacted public contacts.

Bots may not consume hidden foreign resources, inventories, fleets, queues, logistics, private intelligence or private contribution-source state merely because an endgame object exists.

Hidden-state mutations remain decision-inert unless a canonical public/owned/intelligence fact changes.

## Accepted command parity

Bots use the same existing commands and reducers:

- alliance create/join/leave;
- `ENTER_SOLAR_WAR`;
- `START_FINAL_OBJECT_PROJECT`;
- `CONTRIBUTE_FINAL_OBJECT`;
- ordinary build/event progression;
- ordinary `ATTACK` against a publicly visible vulnerable Gate.

No bot-only qualification, resources, Gate mutation, combat result or terminal shortcut is authorized.

## Persistence decision

No schema/save migration is required. Planner output is derived from persisted simulation state plus existing persisted bot cadence.

```text
state schema v19
save format v6
```

## Exactly authorized sequence after Audit merge

```text
#163 ENDGAME-BOT-PERCEPTION
→ #164 ENDGAME-BOT-PARTICIPATION
→ #165 ENDGAME-BOT-FINAL-OBJECTS
→ #166 ENDGAME-BOT-CLOSURE-GATE
```

No fifth M8.3 implementation PR is authorized.

### #163 — perception

Pure endgame public/owned/allied/hidden projection; hidden-state invariance; no behavior shortcut.

### #164 — participation

Deterministic alliance/Solar-War planning through ordinary commands and scheduler cadence.

### #165 — final objects

Qualified host/project/funding planning and public vulnerable-Gate ordinary ATTACK response; recovery remains existing Stage-2 behavior.

### #166 — closure gate

Three-faction composed acceptance, save/load/offline/direct/chunk equality, terminal/no-leak regressions, exact-head CI/Browser/Graphify/progression/performance and Stage-3 source-of-truth archive.

## Hard boundary

`implementationAuthorized: false` while #162 is open.

Do not start #163 until #162 is exact-head green, marked Ready, squash-merged with expected-head protection, and the generated squash is verified as fresh `main`.

Not included:

- M9 release candidate work;
- new gameplay mechanics/currencies/catalogs/assets/routes;
- new alliance diplomacy or treasury;
- new combat engine;
- global rebalance;
- multiplayer/seasons;
- post-victory sandbox.
