# 17 — Remaining open questions

The complete user-supplied package from 2026-07-22 closes the earlier inventory questions for current building roles, ship cards, defense cards and science prerequisites. The unresolved questions are now adaptation and hidden-formula questions rather than missing-card questions.

1. Which captured values should be retained only as reference, and what original balance should Stellar Empires use for its PvE pacing? (`DESIGN_REQUIRED`)
2. What are the exact per-level building cost, production, storage and time curves where the screenshots expose only qualitative descriptions? (`UNKNOWN`)
3. What are the complete effects and valid prerequisites of each faction obelisk and the Supreme Galactic Gates? (`UNKNOWN`)
4. How should online-only government/union, bank/credit and planet-destruction mechanics be adapted for a single-player PvE game? (`DESIGN_REQUIRED`)
5. Should the 22 shared sciences replace the current faction-native technology catalogs, become a shared core with faction modifiers, or remain research reference only? (`ARCHITECTURE_REQUIRED`)
6. How should 13 shared commander ships integrate with the existing doctrine, experience and flagship systems without duplicating roles? (`ARCHITECTURE_REQUIRED`)
7. How should 24 new building IDs map from the current 12-building native catalogs, and what deterministic save migration preserves existing games? (`MIGRATION_REQUIRED`)
8. What mission validation, cargo, fuel, recall, success/failure and report behavior should the original PvE implementation use? No live fleet must be dispatched merely to copy the source game. (`DESIGN_REQUIRED`)
9. What full-match combat, debris, recovery and target-priority rules provide stable deterministic balance under headless simulation? (`VALIDATION_REQUIRED`)

Future work must use the capture as evidence, not as an instruction to copy original-game binaries, prose or exact balance.
