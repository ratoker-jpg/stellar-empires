# Graphify evidence — LOCAL-CAMPAIGN-TIME-PACING-01

**Workflow:** Graphify audit run `30388085969`  
**Head:** `0ccefbd3d9b852111bf67a8c4ad9e5daafbd49df`  
**Graphify:** `0.8.38`  
**Corpus:** 334 code files  
**Graph:** 2,372 nodes · 7,703 edges · 109 communities  
**Extraction:** 100% extracted

## Measured architecture hubs

Graphify reports:

| Node | Connections / observed fanout |
|---|---:|
| `GameState` | 215 edges |
| `createInitialGameState()` | 120 report edges; 106 direct incoming references in focused query |
| `executeCommand()` | 89 report edges; 62 direct incoming references in focused query |
| `GameCommand` | 65 edges |
| `PlanetState` | 61 edges |

Focused query confirms:

- `src/main.ts` imports and calls `createInitialGameState()`;
- a large cross-section of simulation, storage, UI and test modules references `GameState`;
- `GameApplicationController` and bot scheduler both call `executeCommand()`;
- `replayCommands()` calls both `createInitialGameState()` and `executeCommand()`;
- `AutoSaveController.flush()` calls `createSaveEnvelope()`;
- `SaveManager.import()` recreates envelopes through `createSaveEnvelope()`;
- `loadAutosave()` is called directly by bootstrap;
- `mountPlanetScreen()` is called directly by bootstrap;
- `main.ts` has 96 outgoing graph relationships and `bootstrap()` has 37 calls/references.

## Audit implications

### VERIFIED

1. Adding immutable settings to `GameState` has broad type, fixture, migration and checksum impact.
2. Changing `createInitialGameState()` affects more than one hundred direct consumers, especially tests and replay.
3. `executeCommand()` is shared by UI/application and bot scheduling, so the campaign-time engine must preserve this common command boundary.
4. Save creation/import/autosave are connected through `createSaveEnvelope()`, making envelope v3 a coherent #131 boundary.
5. Bootstrap is already a high-fanout integration point; offline catch-up must be introduced behind focused runtime APIs rather than implemented inline in `main.ts`.

### DECISION SUPPORT

Graph fanout supports the heavy two-PR split:

```text
#131: settings + schema + envelope + migration + setup/replay
#132: chronological orchestrator + runtime/bootstrap + bot ownership + summary/gates
```

Combining both would make one PR simultaneously modify the three largest core abstractions and the highest-fanout bootstrap path.

## Existing import-cycle warning

Graphify reports existing simulation cycles through `src/simulation/types.ts`, unit catalogs and combat/fleet types. Audit #131 must avoid adding campaign settings imports from UI/storage back into simulation types. Campaign setting types belong in a low-level simulation module that `types.ts` may reference without importing storage or presentation code.

## Limitation

Graphify identifies static relationships, not chronological semantics. The post-jump bot snapshot defect and save timestamp semantics were verified directly from source/tests and remain authoritative over graph topology.
