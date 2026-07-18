# PR #25 — Research catalog and dependency tree

The game-state schema advances to v3 and stores per-empire research levels plus a serialized queue contract. Legacy schema v1/v2 saves receive empty research progress for every empire during migration.

The first Aegis tree contains six original technologies tied to the P1 atlas. Catalog validation rejects duplicate IDs, unknown requirements and dependency cycles. A real Research screen shows levels, laboratory requirements and unmet technology links; starting and completing research is delivered by PR #26.
