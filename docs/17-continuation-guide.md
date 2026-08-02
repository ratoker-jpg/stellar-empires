# AI Continuation Guide

**Status:** Audit PR #152 `COMPLETE-ENDGAME-01` complete; merge pending  
**Updated:** 2026-08-02  
**Last merged PR:** #151 `BOT-PVE-META-GATE`  
**Verified main:** `73ed5536cb994a78fe7cdd45a41e0240901d7fe1`  
**Active branch:** `agent/audit-complete-endgame`  
**Next implementation:** #153 only, after Audit #152 merges

## Repository

`ratoker-jpg/stellar-empires` · default branch `main`.

Actual `main` and merged GitHub history override stale prose, abandoned branches and chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/complete-endgame-01.md`
6. `docs/audits/evidence/complete-endgame-01.md`
7. `docs/project-status.json`
8. `docs/roadmap-pr-index.json`
9. `docs/16-execution-roadmap.md`
10. `docs/27-playable-game-roadmap-v5.md`
11. PR #152 and actual `main`

## Completed product baseline

- deterministic schema-v17/save-v4 campaign;
- active/offline chronological time;
- finite compressed progression and permanent 15-case matrix;
- complete three-faction catalogs/assets;
- ordinary missions, intelligence, combat, demolition and planet destruction;
- multi-colony economy, specialization, market and logistics;
- sustainable PvE;
- persistent reputation and local Arena;
- honest Aegis/Synod/Veyra bot participation;
- exact 48-hour direct/chunk/save/offline equality.

## Audit #152 findings

- no alliance, Solar War or terminal domain exists;
- Obelisk/Gate catalog definitions and assets exist for all factions but ordinary construction intentionally blocks them;
- campaign time/runtime/autosave have no terminal boundary;
- bot perception has no allied visibility;
- Operations/Reports/HUD have no endgame consumer;
- all of M8 in one batch is unsafe.

## Accepted sequence

```text
#152 COMPLETE-ENDGAME-01 Audit
→ #153 ALLIANCE-SOLO-FOUNDATION
→ #154 SOLAR-WAR-PARTICIPATION
→ #155 ENDGAME-OPERATIONS-UX
→ #156 ENDGAME-PARTICIPATION-GATE
```

Exactly four implementation PRs are authorized. #153 performs one controlled schema v18/save v5 migration. Alliance membership is optional and solo participation remains fully valid.

## Deferred sequential audits

```text
COMPLETE-ENDGAME-02
  existing Obelisks/Gates, contributions, attacks, destruction,
  persisted victory/defeat and exact terminal boundary

COMPLETE-ENDGAME-03
  public/allied/owned/hidden bot perception,
  same-command endgame behavior and final closure
```

Neither is authorized by Audit #152.

## Exact recovery action

While #152 is open:

1. change documentation only;
2. run final CI, Browser E2E and Graphify;
3. resolve every review finding;
4. squash merge when clean.

After #152 merges:

1. fetch exact Audit #152 squash SHA and fresh `main`;
2. create branch `agent/alliance-solo-foundation` from that SHA;
3. create only PR #153 `ALLIANCE-SOLO-FOUNDATION`;
4. record the Audit #152 squash SHA in #153 documentation;
5. follow the exact file map and non-goals in the accepted contract.

## Hard stops

- no fifth PR in `COMPLETE-ENDGAME-01`;
- no Obelisk/Gate mechanics, victory/defeat or terminal state in #153–#156;
- no bot endgame behavior or allied-information exception;
- no hidden resources, privileged commands, new currency or multiplayer;
- no weakening progression, determinism, performance, Browser or Graphify gates.
