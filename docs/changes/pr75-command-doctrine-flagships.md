# PR #75 — Command doctrine progression and flagships

## Delivered

- One persistent command profile per empire.
- Five deterministic command levels with battle-earned experience.
- Three original doctrines: vanguard, sentinel and adaptive command.
- Shared commands for doctrine selection and flagship assignment.
- Flagship unlock at command level two.
- Flagships require an owned, stationed fleet with at least one armed ship.
- Doctrine, level and flagship bonuses are applied inside combat resolution.
- Both sides gain deterministic command experience after battles.
- Dedicated accessible command-profile dialog.
- Additive schema-v13 migration for older saves.

## Boundaries

- A flagship is a fleet appointment, not a new hull yet.
- Command experience is local to a round and has no account meta progression.
- Bots use the same command state and combat effects; doctrine planning remains future AI work.
