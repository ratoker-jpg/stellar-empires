# AI Continuation Guide

**Status:** PR #153 `ALLIANCE-SOLO-FOUNDATION` active; final validation pending  
**Updated:** 2026-08-02  
**Last merged PR:** #152 `COMPLETE-ENDGAME-01` Audit  
**Verified main:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**Active branch:** `agent/alliance-solo-foundation`  
**Next implementation:** #154 only after #153 merges

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
7. `docs/changes/pr153-alliance-solo-foundation.md`
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/16-execution-roadmap.md`
11. `docs/27-playable-game-roadmap-v5.md`
12. PR #153 and actual `main`

## Accepted sequence

```text
#152 COMPLETE-ENDGAME-01 Audit d777a619109d4a9bfc8e5129bf4c525f3327b9b6
→ #153 ALLIANCE-SOLO-FOUNDATION — active
→ #154 SOLAR-WAR-PARTICIPATION
→ #155 ENDGAME-OPERATIONS-UX
→ #156 ENDGAME-PARTICIPATION-GATE
```

Exactly four implementation PRs are authorized. Alliance membership is optional and solo participation remains valid.

## Current PR #153 result

- current initial state and saves use schema v18/save v5;
- valid v17/v4 saves migrate with every empire independent;
- each empire has exactly one explicit solo-eligible participant record;
- public/open alliances have stable `alliance-N` IDs and normalized unique names;
- every legal empire uses the same ordinary create/join/leave commands;
- one membership per empire is enforced;
- empty alliances dissolve deterministically;
- membership history is bounded to 64 entries and checksum-covered;
- malformed participation fails save parsing;
- active/offline runtime metadata remains compatible.

## Exact recovery action

While #153 is open:

1. work only on `agent/alliance-solo-foundation`;
2. keep Solar War, UI, bots and final objects out of scope;
3. run final CI, Browser E2E and Graphify on the exact code+docs head;
4. resolve real failures and every review finding;
5. squash merge only when mergeable and green.

After #153 merges:

1. fetch exact #153 squash SHA and fresh `main`;
2. create branch `agent/solar-war-participation`;
3. create only draft PR #154 `SOLAR-WAR-PARTICIPATION`;
4. record exact #153 squash SHA in #154;
5. follow the accepted file map without adding UI or bot planning.

## Deferred audits

- `COMPLETE-ENDGAME-02`: Obelisks, Gates, contributions, attacks, destruction and terminal victory/defeat;
- `COMPLETE-ENDGAME-03`: public/allied/owned/hidden bot perception and final endgame closure.

## Hard stops

- no fifth PR in `COMPLETE-ENDGAME-01`;
- no Solar War inside #153;
- no Obelisk/Gate mechanics, victory/defeat or terminal state in #153–#156;
- no bot alliance planning or allied-information exception;
- no hidden resources, privileged commands, new currency or multiplayer;
- no weakening progression, determinism, performance, Browser or Graphify gates.
