# PR #93 — Complete ordinary ship roster contract

## Scope

Deliver exactly 13 ordinary ships for each of Aegis, Synod and Veyra:

1. small transport;
2. large transport;
3. light fighter;
4. interceptor;
5. support ship;
6. line battleship;
7. heavy assault ship;
8. bomber;
9. planet destroyer;
10. colonizer;
11. recycler;
12. spy probe;
13. energy satellite.

## Required integration

- stable faction-aware IDs matching committed source assets;
- valid shipyard and technology prerequisites;
- deterministic legacy-ID resolution;
- mission role coverage for scouting, transport, colonization and recycling;
- combat profiles and deterministic class/faction ability bonuses;
- bot production priorities across service and military roles;
- source provenance and processed runtime fallback resolution;
- catalog, compatibility, asset and ability regression tests.

## Deferred boundaries

- no new planetary defences;
- no Commander Ships;
- no planet destruction command or solar-system lifecycle;
- no final sun-brightness energy formula for satellites;
- no Universe, alliance or endgame runtime.
