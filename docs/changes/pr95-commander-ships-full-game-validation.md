# PR #95 — Commander Ships and full-game validation

## Runtime delivery

- Added 13 shared Commander Ships under stable `commander.shared.*` mechanical IDs.
- Commander Ships use the existing ship inventory, production queue and fleet serialization model; save schema remains v13.
- Admiral progression now spans levels 1–40 while retaining the established early thresholds.
- Production validates Admiral level, faction shipyard level, quantity one and empire-wide one-per-type ownership.
- A flagship battle activates one deterministic Commander ability, selected by explicit priority when several Commander Ships are present.
- Bots can produce Commander Ships through the same `QUEUE_UNIT_BATCH` command and use abilities deterministically when no explicit flagship appointment exists.
- Combat integration covers attack, vitality, enemy suppression, armor break, demolition, recovery and planet-shield preparation.
- Mission integration covers Typhoon speed, Corsair plunder and battle-report Commander attribution.
- Admiral UI now presents level progress, flagship selection, all 13 unlocks, ownership and the active ability.

## Asset integration

All 13 canonical Commander IDs are bound to the committed files under:

```text
assets/source/New assets/comander_ship/
```

The source PNGs remain provenance inputs. Runtime presentation resolves through stable IDs and deterministic processed fallbacks until optimized production derivatives and atlases are generated.

## Validation

- Complete catalog target is now 24 buildings, 22 technologies, 13 ordinary ships, 9 defences and 13 Commander Ships.
- The headless full-game harness validates dependency closure and a real production path for every ordinary unit, defence and Commander Ship for every faction.
- Focused tests cover shared registration, asset provenance, Admiral progression, ownership limits, active ability selection and complete catalog closure.

## Deferred

- Universe/Galaxy/Solar-system navigation;
- coordinate map missions;
- alliances and diplomacy;
- solar war, planet destruction, final gates and victory;
- optimized production asset processing, balance and release polish.
