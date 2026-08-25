# Continuation guide

## Current handoff

Release 1.0 remains closed. Runtime baseline remains schema v19 / save format v6.

Current exact `main` / starting main for Audit #186:

`e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`

Previous batch `POST-1.0-STRATEGIC-FEEDBACK-TRUTH` is complete through PR #185. There is no PR4.

## Only active work

```text
POST-1.0-NEXT-PRODUCT-3
Audit PR #186
branch audit/post-1.0-next-product-3
kind docs-only Audit
implementationAuthorized = false
```

Binding authority is `docs/audits/current-batch-audit.md`.

## Proposed successor — one PR, not authorized

```text
POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE
POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE
implementation count = 1
```

The coherent lifecycle problem now includes:

1. repeated hard-coded fresh-game seed;
2. unsafe/missing New Campaign switch;
3. unsafe manual save activation;
4. reserved-slot Import authority bypass.

## Safe campaign switches

Every actual campaign switch first makes the old writer inert:

```text
validate target
→ block old-page autosave producers
→ drain/quiesce/dispose old AutoSaveController
→ authoritative persistence switch
→ reload/bootstrap
```

### New Campaign

```text
quiesce A
→ delete autosave.snapshot
→ delete autosave
→ reload
→ loadAutosave() missing
```

### Manual `Загрузить`

```text
validate/load B
→ quiesce A
→ delete stale autosave.snapshot(A)
→ write B primary
→ preserve manual B
→ reload
→ loadAutosave() resolves B
```

Valid primary is recovery authority; snapshot is fallback only for missing/invalid primary.

## Import is STORAGE ONLY

Current P2 root cause:

- UI maps blank or reserved target to `undefined`;
- `SaveManager.import()` falls back to payload `slotId`;
- payload can therefore write `autosave` or `autosave.snapshot`.

Direct caller audit is closed:

- production `SaveManager` importers: `main.ts`, `campaignBootstrap.ts`, `AutoSaveController.ts`, `loadAutosave.ts`, `ui/saveManager.ts`;
- only `src/ui/saveManager.ts#onImport()` calls `.import(...)` in production.

Binding Import behavior:

```text
select JSON
→ require explicit manual target
→ reject blank
→ reject autosave
→ reject autosave.snapshot
→ rewrite payload into chosen manual target
→ primary/snapshot unchanged
→ current campaign unchanged
→ no quiesce
→ no reload
```

Payload's original `slotId` never grants player-facing authority.

To activate an imported campaign:

```text
Import → manual slot
→ later Загрузить
→ safe quiesced manual activation
```

## Import failure semantics

- blank target: explicit error, no import;
- reserved target: explicit error, no import;
- malformed JSON: existing validation error, no mutation;
- valid target: exactly that manual slot is written;
- failure: primary/snapshot/current campaign unchanged;
- Import never silently activates campaign.

## Regression-first contract

Required RED includes:

1. default hard-coded seed;
2. New Campaign resurrection;
3. manual activation A-over-B resurrection;
4. reserved Import authority bypass;
5. current E2E picker bypass.

Import cases:

```text
payload autosave + blank target
→ reject

payload autosave.snapshot + target autosave.snapshot
→ reject

payload autosave + target manual-import
→ store only manual-import
→ authority unchanged
→ no reload

then Загрузить manual-import
→ safe quiesced activation
```

## Browser acceptance

Focused Browser lifecycle scenario must cover:

- New Campaign cancel/confirm, real reload, no resurrection, real picker, fixed seed;
- manual B activation, stale A snapshot removal, real reload into B;
- Import payload whose original ID is `autosave`;
- blank/reserved targets rejected;
- A primary/snapshot unchanged and no reload;
- explicit `manual-import` appears while A stays active;
- only subsequent `Загрузить manual-import` switches campaign through safe activation.

Share assertions/helpers rather than duplicate the whole manual-load scenario.

## Deterministic E2E / seed

```text
VITE_E2E=1
interactiveNewGame=1
campaignSeed=<explicit fixed uint32>
```

- tests use fixed seeds;
- real UI may use Web Crypto only for pre-state suggestion;
- explicit uint32 is exact persisted `GameState.seed`;
- legacy string seed compatible;
- no `Date.now()` / wallclock / `Math.random()` seed;
- schema v19 / save v6 / migration none.

## Authorized implementation paths after controller-approved Audit merge only

Primary:

- `src/main.ts`;
- `src/ui/saveManager.ts`;
- `src/storage/SaveManager.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/seed.ts` only if narrow helper needed;
- `src/ui/newGameFactionPicker.ts`;
- `src/runtime/e2eScenario.ts`.

Read/verify unless direct regression proves minimal change necessary:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `src/storage/IndexedDbSaveRepository.ts`;
- `playwright.config.ts`.

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

## Required continuation reading

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-batch-audit.md`;
4. `docs/audits/current-execution-state.md`;
5. `docs/audits/batch-history.md`;
6. `docs/audits/completed/post-1.0-strategic-feedback-truth.md`;
7. `docs/project-status.json`;
8. `docs/roadmap-pr-index.json`;
9. `docs/16-execution-roadmap.md`;
10. actual GitHub main / Audit #186 / workflows / threads / reviews / comments.

## Current stop rule

Finish only Audit #186: final docs commit, fresh exact-head gates, reply+resolve P2 thread, final review/main/head checks, Ready, post-Ready recheck, STOP.

**Do not merge #186. Do not create implementation branch. Do not start PR1.**
