# PR #166 — ENDGAME-BOT-CLOSURE-GATE

**Batch:** `COMPLETE-ENDGAME-03` / Audit #162  
**Exact baseline / PR #165 squash:** `d2d9f62b9367b2f12a23571fd8ffebdaee86fdd7`  
**Branch:** `agent/endgame-bot-closure-gate`  
**Runtime:** schema v19 / save format v6 unchanged

## Scope

Final composed acceptance for the already-implemented M8.3 bot endgame path. #166 adds no production mechanic.

The closure gate proves:

- Aegis and Synod reach the same public alliance while Veyra remains solo;
- all three use ordinary bot participation commands to enter one real Solar War cycle;
- the real Solar War resolver produces positive qualification used by later final-object planning;
- scheduler output after qualification is deterministic across save/load and direct/chunk campaign-time partitions;
- a real-qualified alliance project starts and is funded by its immutable eligible cohort;
- a real-qualified Veyra solo project reaches ordinary construction, vulnerable Gate and exact terminal stabilization;
- building/vulnerable/terminal state round-trips through save format v6;
- vulnerable-to-terminal behavior is identical across direct, chunked, loaded and offline catch-up paths;
- terminal time and bot planning remain frozen after the persisted result.

Existing focused suites remain authoritative for qualified Obelisk queueing, public vulnerable-Gate attacks, hidden-state invariance, Gate destruction/rebuild, host loss, same-second attack/stabilization order and terminal command rejection.

## Fixture acceleration

Canonical compressed storage cannot hold the full multi-million Gate target at once, so real gameplay normally funds over repeated contributions. The closure fixture keeps real qualification and ordinary project creation, then makes the exact remaining resources available immediately before an ordinary contribution command to keep acceptance runtime bounded. The command still validates cohort/ownership/overfunding, spends the resources and queues the normal Gate build. All save/load assertions occur after spend on canonical state.

## Evidence

The two composed closure tests passed on pre-archive head `a888221f7dba4fab44690a9419275b88ba9a7368`. Earlier red closure runs were typecheck/fixture corrections only; no production change was needed.

This Stage-3 docs commit intentionally creates a new final candidate head. Earlier green checks are superseded; the docs-inclusive head must pass all CI, Browser E2E, Graphify, progression/performance, review/thread and mergeability gates before Ready/squash.

## Hard boundary

No new mechanics, schema/save migration, balance, assets/catalogs/currencies/routes/mission families/combat engine, or M9 implementation.

After #166 squash and generated fresh-main verification, the next valid work is a separate M9 Release Candidate Audit.
