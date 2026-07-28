# PR #128 — reversible cross-domain player flows

**Work item:** `NAV-CROSS-DOMAIN-FLOWS`  
**Audit:** #125 `NAVIGATION-USABILITY-01`  
**Baseline:** `a6c19c2733754cdd078794b42ad596edb4465cfc`

## Player-visible change

- Space/intelligence target preparation is stored as typed browser-session task context;
- the Fleet composer restores the prepared target and mission after valid reload;
- the source Space route remains available through the shared return action;
- invalid prepared targets are cleared with an explicit fallback message;
- the player can cancel a prepared target;
- successful explicit fleet send clears the prepared context;
- report map backlinks preserve exact coordinates and expose a direct return to the same report route;
- existing Planet development gateways and Operations launchers remain reversible through route context.

## Command boundary

Preparing or restoring a target does not dispatch `SEND_FLEET`. The ordinary explicit `Подтвердить отправку` action remains the only send boundary.

## Storage boundary

Prepared task context lives in `sessionStorage`, outside `GameState`, save envelopes, replay, commands, events and simulation checksums. Every restored target is revalidated against the current visible Fleet composer candidates.

## Excluded

No new mission, automatic command, hidden target data, gameplay mechanic, schema migration, world speed, offline catch-up, balance, alliances or endgame.
