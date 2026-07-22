# Nemexia browser and user-capture audit

Read-only research package for the Stellar Empires team. It records browser observations and user-supplied capture material as evidence for original PvE design work. It is **not** a specification to reproduce Nemexia art, copy, source code, UI text or exact balance.

## Evidence policy

Every claim uses one of these evidence classes:

- `CONFIRMED_UI` — directly observed in the read-only browser audit;
- `CONFIRMED_HELP` — present in the historical public Help catalogue;
- `USER_CAPTURED_HTML` — parsed from the complete saved information-card package supplied on 2026-07-22;
- `USER_CAPTURED_SCREENSHOT` — visible in the 72 supplied building-card screenshots;
- `USER_GENERATED_ASSET` — original/generated Stellar Empires art supplied by the user;
- `INFERRED`, `UNKNOWN`, `LOCKED` or `ACTION_REQUIRED` — unresolved or constrained evidence.

Capture-time values are not canonical Stellar Empires mechanics. Each claim must preserve its source class and must not silently become production balance.

The observed browser account was already signed in by the user. No credentials, tokens, purchases, construction, missions, combat, profile changes or messages were performed. Authentication artefacts are never stored.

The 2026-07-22 user package was inspected locally. Raw saved HTML, original-game screenshots and original-game images are **not committed**. Only derived inventory, normalized statistics, paraphrased mechanics and integration guidance are stored in Git.

## Contents

- `01`–`18`: original topical browser-audit evidence and adaptation guidance;
- `19-complete-user-captured-catalog-2026-07-22.md`: complete normalized catalogue from all five newly supplied archives;
- `source-log.md`: URLs, capture scope, supplied archives, hashes and evidence boundaries;
- `data/`: machine-readable browser-observation ledger from the earlier audit;
- `screens/`: earlier capture-time browser screenshots only.

## New complete reference package

The 2026-07-22 documentation pass confirms:

- 22 ordinary and 2 galactic buildings per faction;
- 13 standard ships per faction;
- 13 shared commander/combat ships;
- 9 planetary defenses per faction;
- 22 shared sciences;
- 24 original/generated building assets per Stellar Empires faction.

The canonical normalized record is document `19`. Existing shorter topic files point to it when their earlier `UNKNOWN` or `LOCKED` state has been superseded by the user-supplied capture.

## Safe continuation

Use the captured material as reference for an original PvE adaptation. Do not copy original-game binaries, screenshots, prose or balance directly into runtime. New user-generated building assets may enter `assets/source/` only through a separate verified intake PR, then require an explicit mechanical-catalog and runtime-binding PR.
