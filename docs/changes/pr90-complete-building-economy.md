# PR #90 — Complete 24-building economy

## Scope

- replaces each faction’s 12-building prototype catalog with 24 functional buildings;
- adds three metal tiers, two crystal tiers, two gas tiers, solar and independent energy, hangar, construction complex, advanced factory, three storages, scrapyard, trade center, shipyard, research center, spaceport, government, bank, Galactic Obelisk and Supreme Galactic Gates;
- keeps the Obelisk and Gates visible but explicitly locked until alliance endgame is implemented;
- adds deterministic faction tuning for cost, time, production and energy identity;
- makes construction, ship/defence production, research, hangar, salvage, market, upgrades and bank effects operational;
- migrates legacy building IDs through canonical aliases without changing save schema;
- updates starting colonies, colonization, bot economy planning and all building UI cards;
- adds manifest-backed fallback presentation for every new building card.

## Compatibility

Old saves and current unit/research requirements remain valid through legacy-to-canonical building aliases. Completing a legacy building upgrade writes the canonical target ID.

## Deferred

- 22 shared technologies — PR #91;
- 13 ordinary ships per faction — PR #92;
- 9 defences per faction — PR #93;
- 13 Commander Ships — PR #94;
- alliances and endgame remain deferred.

## Validation

- exactly 24 unique buildings for each faction;
- 10 resource, 7 industry and 7 military buildings per faction;
- prerequisite closure and namespace validation;
- operational effect tests;
- legacy alias tests;
- asset fallback tests;
- lint, typecheck, 266 tests and production build.
