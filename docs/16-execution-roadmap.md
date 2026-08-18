# Execution Roadmap Stellar Empires — current entrypoint

**Status:** M8.2 closed through #161; `COMPLETE-ENDGAME-03` Audit #162 active  
**Updated:** 2026-08-19  
**Verified main:** `8f05d22b3475ee99e9af8652d385c956e0acd7c7`  
**Last merged PR:** #161 `ENDGAME-TERMINAL-GATE`  
**Runtime:** schema v19 / save format v6

## Authoritative files

```text
AGENTS.md
docs/28-audit-first-autonomous-delivery-protocol.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
docs/audits/complete-endgame-03-scaffold.md
docs/audits/evidence/complete-endgame-03.md
docs/audits/contracts/complete-endgame-03.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/27-playable-game-roadmap-v5.md
```

## Closed M8.1

```text
#152 COMPLETE-ENDGAME-01 Audit
→ #153 ALLIANCE-SOLO-FOUNDATION
→ #154 SOLAR-WAR-PARTICIPATION
→ #155 ENDGAME-OPERATIONS-UX
→ #156 ENDGAME-PARTICIPATION-GATE
```

M8.1 is complete.

## Closed M8.2 — COMPLETE-ENDGAME-02

```text
#157 Audit 7750cdb83b58e95f790351b306e9cf5b344bd780
→ #158 a66a05fd433893f4a6f15cd8d9fd53ea31d793f9
→ #159 466e5ea161a005eeb792d5440dc27d960b37b2f2
→ #160 8ad44509426e4bb9555a8a6133e1dbdb899dccae
→ #161 8f05d22b3475ee99e9af8652d385c956e0acd7c7
```

M8.2 delivered existing final objects, Solar War qualification, Gate funding/construction/vulnerability/destruction/recovery, immutable persisted terminal victory/defeat, exact terminal freeze, runtime backlog consumption, durable terminal checkpoint and existing-shell terminal UX. Stage 2 is closed.

## Active M8.3 — COMPLETE-ENDGAME-03

Audit #162 starts exactly from fresh `main = 8f05d22b3475ee99e9af8652d385c956e0acd7c7`.

Recon result:

- current bot scheduler is deterministic and ordinary-command based;
- endgame mechanics/commands already exist;
- missing work is explicit allowed-information perception plus planner parity;
- no schema/save bump or new mechanic is required;
- complexity medium; critical unknowns 0.

After Audit #162 squash merge, exactly four sequential implementation PRs are authorized:

```text
#163 ENDGAME-BOT-PERCEPTION
→ #164 ENDGAME-BOT-PARTICIPATION
→ #165 ENDGAME-BOT-FINAL-OBJECTS
→ #166 ENDGAME-BOT-CLOSURE-GATE
```

No fifth M8.3 implementation PR is authorized.

## Permanent boundary

- bots use ordinary commands/resources/timing/combat;
- public/owned/allied information only; hidden foreign state remains hidden;
- no new final-building catalogs/assets/meta currency;
- no alliance treasury/diplomacy matrix;
- no new combat engine;
- no post-victory sandbox;
- no M9 work inside M8.3;
- progression, deterministic partition equality, Browser E2E, Graphify and `<15 s` / `<30 s` performance gates remain mandatory.

## Next action

```text
finish #162 Audit exact-head gates
→ squash-merge #162 and verify fresh main
→ #163 perception
→ #164 participation
→ #165 final objects
→ #166 closure gate
→ only then begin a separate M9 release-candidate Audit
```
