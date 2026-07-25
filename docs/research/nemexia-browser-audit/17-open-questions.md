# 17 — Remaining open questions

The complete user-supplied package from 2026-07-22 closed the earlier inventory questions for buildings, ships, defence and sciences. The canonical endgame contract in [`docs/25-solar-war-obelisks-gates-and-progression.md`](../../25-solar-war-obelisks-gates-and-progression.md) additionally resolves the project-level questions around suns, Solar Crystals, faction obelisks, Supreme Galactic Gates, solo victory, Commander Ship scaling, detonation and initial progression formulas.

The 2026-07-26 Universe capture and the canonical navigation contract in [`docs/26-universe-galaxy-solar-system-navigation-contract.md`](../../26-universe-galaxy-solar-system-navigation-contract.md) resolve the presentation hierarchy, exact recovered map geometry, procedural-first implementation boundary and future asset-swap contract.

## Resolved by canonical design

- solar brightness and its effect on solar buildings and satellites;
- adjacent-galaxy Sun Attacks and local Sun Support;
- Solar Crystal ownership and alliance storage;
- faction-obelisk function;
- seven-day Supreme Galactic Gates construction;
- alliance victory and four-interruption solo victory;
- initial building, production and research progression formulas;
- one-of-each Commander Ship ownership and one active commander ability per battle;
- Commander Ship per-level effects;
- interpretation of `1001%` as the `over 1000 demolition points` threshold;
- three-level `Universe -> Galaxy -> Solar system` navigation;
- exact 20-slot Universe layout and 24-slot Solar-system layout;
- central-map-only adaptation without copying the old source-game top and side chrome;
- deterministic procedural placeholders followed by manifest-driven original asset replacement.

## Still open

1. Which captured ship, defence and technology values should remain reference-only, and what final PvE balance should replace them after headless simulation? (`BALANCE_REQUIRED`)
2. How should government/alliance management and the bank/credit system be presented in a bot-driven single-player campaign? (`DESIGN_REQUIRED`)
3. Should the 22 shared sciences fully replace the existing faction-native technology catalogs or become a shared core with faction modifiers? (`ARCHITECTURE_REQUIRED`)
4. How should the new 24-building IDs map from the current 12-building runtime catalogs, and what deterministic save migration preserves existing games? (`MIGRATION_REQUIRED`)
5. What exact mission validation, cargo, fuel, recall, success/failure and report behavior should apply to every ordinary flight type? (`DESIGN_REQUIRED`)
6. What full-match combat, debris, recovery and target-priority rules produce stable deterministic balance under the headless harness? (`VALIDATION_REQUIRED`)
7. How are alliance endgame ownership and a solo player's stolen-crystal counter migrated when the player joins, leaves or creates an alliance? (`MIGRATION_REQUIRED`)
8. What exact planet/system content is regenerated after a destroyed sun returns: fully procedural replacement, partial preservation or scenario-specific restoration? (`DESIGN_REQUIRED`)

Future work must use the capture as evidence, not as an instruction to copy original-game binaries, prose or exact balance. Where historical reference and the canonical Stellar Empires design differ, the canonical project document wins.
