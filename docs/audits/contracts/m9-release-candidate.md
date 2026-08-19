# M9 Release Candidate — accepted implementation contract

**Batch ID:** `M9-RELEASE-CANDIDATE`  
**Audit PR:** #167  
**Audit baseline:** `a6b225fe38c1c320244fc54929534e49029d4026` (PR #166 squash / fresh `main`)  
**Target release:** `1.0.0`  
**Runtime target:** state schema v19 / save format v6 unchanged  
**Complexity:** medium  
**Implementation count:** 4  
**Critical unknowns:** 0

## 1. Release objective

Turn the mechanically complete local browser campaign into a technically honest Release Candidate and then 1.0 without redesigning gameplay.

The release must preserve the current deterministic campaign, three-faction bot parity, save/load/offline behavior, terminal victory/defeat semantics and accepted performance budgets while closing verified release-surface gaps in onboarding copy, production-path browser coverage, toolchain/version metadata and repository documentation.

## 2. Verified baseline

### VERIFIED — product mechanics

- `COMPLETE-ENDGAME-03` closed in PR #166 and fresh `main` is `a6b225fe38c1c320244fc54929534e49029d4026`.
- Runtime remains state schema v19 / save format v6.
- The #166 exact head passed 167 test files / 684 tests with one skipped experiment, 34/34 Browser E2E, Graphify, compressed progression and campaign performance within the permanent 15 s / 30 s budgets.
- Player and bots can reach persisted terminal victory/defeat through the existing ordinary campaign mechanics.

### VERIFIED — release gaps

1. `src/ui/newGameFactionPicker.ts` still tells players that final victory and Gates are not in the runtime. That statement is now false.
2. `playwright.config.ts` runs against a Vite dev server at `/`, while `vite.config.ts` builds production with base `/stellar-empires/`. The existing Browser suite therefore does not directly prove the deployed production base path.
3. `package.json`, `package-lock.json`, `vite.config.ts` and the initial build badge still identify the application as `0.1.0`.
4. `README.md` still describes an old PR #65/schema-v12 baseline and obsolete roadmap/feature limitations.
5. CI, Browser and Pages workflows pin Node `22.12.0`, while the current ESLint 10 dependency family emits `EBADENGINE` warnings on that version and accepts `^22.13.0` or `>=24`.
6. GitHub Pages deployment is already defined as a static `dist` deployment on every push to `main` and runs `npm run check` before upload.
7. The repository currently has no selected license. This Audit does not choose one and does not represent absence of a license as a gameplay blocker.

## 3. Decisions

### DECISION — no gameplay redesign

M9 does not add currencies, catalogs, factions, mission families, combat engines, post-victory sandbox, new save fields or new progression mechanics.

Existing balance is accepted unless a release gate demonstrates a concrete regression. M9 validates current compressed progression and performance; it does not retune merely because the roadmap used the word “balance”.

### DECISION — onboarding means release orientation, not a tutorial subsystem

The new-game surface already exposes faction, immutable world size, speed, progression profile, duration expectation and offline progression. M9 will correct stale information and add concise first-run orientation using that existing dialog/shell. No tutorial state, quest chain or persistence is introduced.

### DECISION — production browser proof is separate from dev E2E

Keep the existing fast dev-server Browser suite. Add a small production-build smoke that serves the actual production output under `/stellar-empires/`, starts a real fresh campaign through the real new-game dialog, navigates/reloads and proves production asset/base routing.

### DECISION — one version source before final release

Release metadata will stop hard-coding an independent `0.1.0` in Vite/UI. `package.json` becomes the version authority. RC packaging uses `1.0.0-rc.1`; the final closure advances only that authority to `1.0.0` after the preceding M9 work is merged and green.

### DECISION — toolchain baseline

Move repository Node requirements and CI/E2E/Pages pins to Node 24 so the declared engine and automated release environment are aligned with current dependencies and no longer rely on an engine-warning baseline.

## 4. Authorized implementation sequence

After Audit #167 squash-merges and fresh `main` is verified, exactly these four implementation work items are authorized, sequentially from each generated fresh `main`:

```text
#168 RELEASE-ONBOARDING-TRUTH
→ #169 RELEASE-PRODUCTION-BROWSER
→ #170 RELEASE-PACKAGING-METADATA
→ #171 RELEASE-1.0-CLOSURE
```

PR numbers are the expected next repository sequence; stable work-item IDs are authoritative if an unrelated PR consumes a number.

No fifth M9 implementation PR is authorized by this Audit.

A tiny docs-only release record after #171 is permitted only if needed to record the generated #171 squash SHA and post-merge Pages evidence. It must not contain implementation.

## 5. Work item: `RELEASE-ONBOARDING-TRUTH`

### Purpose / player-visible outcome

A new player sees accurate campaign capabilities and a concise “what to do first” orientation before selecting a faction.

### Expected paths

- `src/ui/newGameFactionPicker.ts`
- `src/ui/newGameFactionPicker.test.ts`
- `tests/e2e/appShellFullGate.spec.ts`
- `src/styles/newGame.css` only if the existing layout cannot fit the orientation cleanly
- `docs/changes/…`

### Required behavior

- remove all claims that final victory/Gates are unavailable;
- state that the campaign ends in persisted victory/defeat and that offline progression remains active;
- add compact non-interactive orientation for economy → research/fleet → Solar War/Gates without creating tutorial state;
- preserve immutable settings and existing faction selection behavior;
- preserve release viewport/no-horizontal-overflow behavior.

### Acceptance

- unit DOM/view-model assertions for the corrected copy;
- Browser new-game dialog at 1366×768 and 1920×1080;
- no stale pre-M8 wording anywhere in source/tests;
- standard exact-head CI, Browser, Graphify and performance gates.

## 6. Work item: `RELEASE-PRODUCTION-BROWSER`

### Purpose / player-visible outcome

Prove that the actual production build used by GitHub Pages boots and remains usable under `/stellar-empires/`, not only under the dev-server root.

### Expected paths

- `playwright.production.config.ts` or equivalent dedicated config
- `tests/e2e-production/…` or a narrowly scoped production-smoke spec
- `package.json`
- `.github/workflows/e2e.yml`
- production Vite/preview configuration only if the smoke exposes a real path defect
- `docs/changes/…`

### Required behavior

- build with normal production base `/stellar-empires/`;
- serve built `dist`, not source/dev middleware;
- start a real fresh campaign through the real new-game dialog, without `VITE_E2E` state injection;
- prove production assets load, app reaches ready state, primary navigation works and a reload under the production base remains valid;
- keep the existing 34-test dev Browser suite unchanged except where shared infrastructure is intentionally reused.

### Acceptance

- dedicated production-build Browser job/smoke green on exact head;
- existing Browser suite green;
- no 404/asset-base regression;
- standard CI/Graphify/performance green.

## 7. Work item: `RELEASE-PACKAGING-METADATA`

### Purpose / player-visible outcome

Make the RC identify itself consistently, use a supported automated runtime and describe the actual game instead of the obsolete early baseline.

### Expected paths

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `index.html`
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/pages.yml`
- `README.md`
- version-related declaration/tests as needed
- `docs/changes/…`

### Required behavior

- `package.json` becomes version authority;
- RC version is `1.0.0-rc.1` and UI build badge derives from that authority;
- Node engine/workflows use Node 24;
- README reflects schema v19/save v6, three mechanical factions, autonomous bot/endgame parity, current roadmap state and public Pages URL;
- README must not invent a license. It may state that no license has been granted/selected yet;
- no gameplay or save-format change.

### Acceptance

- no hard-coded conflicting `0.1.0` product version remains;
- CI no longer runs the project on Node 22.12;
- build UI reports the package-derived RC version;
- standard and production Browser gates green.

## 8. Work item: `RELEASE-1.0-CLOSURE`

### Purpose / player-visible outcome

Produce the first technically verified `1.0.0` build and close M9 with combined release evidence.

### Expected paths

- `package.json`
- `package-lock.json`
- release closure/audit tests only where combined proof is missing
- `README.md` only for final status wording
- `docs/audits/completed/m9-release-candidate.md`
- `docs/audits/current-batch-audit.md`
- `docs/audits/current-execution-state.md`
- `docs/audits/batch-history.md`
- `docs/project-status.json`
- `docs/roadmap-pr-index.json`
- `docs/17-continuation-guide.md`
- `docs/27-playable-game-roadmap-v5.md`
- `docs/changes/…`

### Required behavior

- advance package-authoritative version from `1.0.0-rc.1` to `1.0.0`;
- add no new gameplay mechanic unless a genuine release blocker is demonstrated;
- combined closure must retain all current progression, save/offline, bot/endgame, terminal and Browser invariants;
- standard Browser and production-base Browser both pass on the exact final head;
- archive this Audit and mark M9/Release 1.0 technically complete in source-of-truth docs.

### Final gate

One exact final #171 head must pass:

- asset audit;
- lint;
- typecheck;
- all unit/integration/audit tests;
- build;
- compressed progression;
- campaign performance `<15 s` one-day and `<30 s` seven-day;
- existing Browser E2E;
- production-base Browser smoke;
- Graphify;
- reviews = 0 and unresolved review threads = 0;
- mergeable = true.

Then mark Ready and squash-merge with expected-head protection. Verify generated fresh `main` and the post-merge Pages deployment. If canonical docs need the generated SHA/deployment run recorded, create only the permitted docs-only release record.

## 9. Persistence, determinism and performance

- State schema remains v19.
- Save format remains v6.
- No migration is expected.
- Campaign checksum semantics do not change.
- Offline/bot scheduling semantics do not change.
- The permanent performance budgets remain 15 s for one campaign day and 30 s for seven campaign days.
- The existing compressed progression scenario remains binding; M9 does not relax it.

## 10. Risks and explicit non-goals

### Risks

- a production-base smoke may reveal assumptions hidden by Vite dev-server root handling;
- version centralization can break Vite config typing/build if implemented carelessly;
- Node 24 can expose dependency/runtime assumptions hidden by Node 22.12;
- onboarding copy/layout can regress release viewport overflow if expanded excessively.

### Non-goals

- no server backend;
- no accounts/cloud saves/multiplayer;
- no new tutorial persistence or quest system;
- no new game mechanics or post-terminal sandbox;
- no broad visual redesign;
- no arbitrary balance retune;
- no license selection on behalf of the repository owner;
- no paid infrastructure.

## 11. Unknowns

Critical UNKNOWNs: **0**.

Non-critical release/legal choice: repository license remains owner-controlled and outside this batch. Technical browser release can proceed without the Audit inventing a license grant.
