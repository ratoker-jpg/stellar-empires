# Nemexia browser audit

Read-only research package for the Stellar Empires team. It records a browser observation of Nemexia on 2026-07-18, not a specification to reproduce its art, copy, source code, or exact balance.

## Evidence policy

Every claim has one of these statuses: `CONFIRMED_UI`, `CONFIRMED_HELP`, `USER_CONFIRMED`, `INFERRED`, `UNKNOWN`, `LOCKED`, or `ACTION_REQUIRED`. Values are time-bound and are not canonical mechanics. Each evidence record should preserve its server, URL, capture time, account-progress context, screenshot path when safe, and notes. Screenshots are original UI evidence kept only in `screens/`; no runtime assets were extracted.

The observed account was already signed in by the user. No credentials, tokens, purchases, construction, missions, combat, profile changes, or messages were performed. The user explicitly approved preserving the visible in-game names and coordinates in capture-time screenshots; authentication artefacts are never stored. The technology/building route subsequently returned the login page, so remaining discovery is explicitly incomplete.

## Contents

- `01`–`18`: topical evidence notes and adaptation guidance.
- `source-log.md`: URLs, capture scope, and failures.
- `data/`: machine-readable observation ledger.
- `screens/`: capture-time screenshots; `06-technologies.png` documents the authentication boundary, not technology content.

## Safe continuation

After the user re-authenticates, revisit the locked categories one at a time and add evidence rather than replacing `UNKNOWN` with guesses. Do not submit forms or start missions/battles.
