# PR #124 — local campaign world-speed contract

## Purpose

Record the project owner's campaign-runtime decision before the next implementation audit.

## Canonical decision

Stellar Empires remains a local offline-capable PvE browser campaign rather than requiring a continuously running game server.

The new-game flow will eventually expose an immutable world-speed preset. The selected speed accelerates canonical simulation time uniformly for the player, bots, economy, production, missions, diplomacy and endgame. It is not a runtime fast-forward control and cannot be changed after campaign creation.

Offline continuation uses the same selected world speed. When the campaign is reopened, the deterministic simulation catches up the elapsed game time through the ordinary event queue and bot scheduler. Bots may legally develop, scout, attack, form alliances and progress the endgame while the browser is closed.

The intended product is a compressed strategic campaign that can reach its complete victory/defeat cycle in roughly one day of active play. Exact level caps, costs, durations and progression compression remain subject to a later dedicated audit; this PR changes no runtime or balance values.

## Files

- canonical addendum: `docs/25a-local-campaign-world-speed-and-offline-progression.md`;
- execution/status handoff updated for the next Audit PR.

## Boundaries

- documentation only;
- no runtime, schema, command, balance or UI implementation;
- no changes to existing Gates, crystals, solar-war, demolition or planet-destruction rules;
- no server infrastructure;
- no implementation PR authorized by this change alone.
