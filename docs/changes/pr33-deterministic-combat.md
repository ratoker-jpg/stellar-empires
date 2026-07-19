# PR #33 — First deterministic combat

Attack missions may target enemy planets and require at least one armed ship. Arrival combines the defending planet's installed defenses with all stationed defender fleets, applies both empires' weapon and armor research, then resolves up to twelve simultaneous deterministic rounds.

Every round records damage and losses by unit type. Surviving ships and defenses are written back exactly once; destroyed fleets are removed. A serialized `BATTLE_REPORT` event preserves the seed, participants, initial forces, round log, remaining forces and winner in the event log. The Fleet command screen exposes attack missions and the latest reports.
