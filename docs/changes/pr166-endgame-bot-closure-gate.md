# PR #166 — ENDGAME-BOT-CLOSURE-GATE

**Batch:** `COMPLETE-ENDGAME-03` / Audit #162  
**Exact baseline / PR #165 squash:** `d2d9f62b9367b2f12a23571fd8ffebdaee86fdd7`  
**Branch:** `agent/endgame-bot-closure-gate`  
**Runtime:** schema v19 / save format v6 unchanged

## Scope

Final composed acceptance for the already-implemented M8.3 bot endgame path. No new mechanic is intended in this PR.

The closure gate composes existing authoritative behavior to prove:

- Aegis and Synod reach the same public alliance while Veyra remains solo;
- all three use ordinary bot participation commands to enter one real Solar War cycle;
- the real Solar War resolver produces positive qualification used by later final-object planning;
- scheduler output after qualification is deterministic across save/load and direct/chunk campaign-time partitions;
- a real-qualified alliance project starts and is funded by its immutable eligible cohort;
- a real-qualified Veyra solo project reaches ordinary construction, vulnerable Gate and exact terminal stabilization;
- building/vulnerable/terminal state round-trips through the current save format;
- vulnerable-to-terminal behavior is identical across direct, chunked, loaded and offline catch-up paths;
- terminal time and bot planning remain frozen after the persisted result.

Existing focused suites remain authoritative for qualified Obelisk queueing, public vulnerable-Gate attacks, hidden-state invariance, Gate destruction/rebuild, host loss, same-second attack/stabilization order and terminal command rejection.

## Closure rule

If composed tests expose a real blocker, fix only that blocker through existing mechanics and rerun all exact-head gates. Otherwise this PR remains tests/docs-only.

After one exact head passes CI, Browser E2E, Graphify, compressed progression/performance, reviews/threads and mergeability, the Stage-3 audit/status/roadmap archive is updated on the same PR and the final exact head is rerun before squash merge.
