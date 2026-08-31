# STRICT-REFERENCE-VISUAL-PARITY-V3 — corrective visual audit

**State:** docs-only Audit PR #203; implementation is blocked until this Audit merges  
**Baseline:** `main` at `466ec55f1751d36fd4a30175f7669f89ebe9a6a6` (PR #202 squash)  
**Reference:** owner-supplied `stellar_references_and_html.zip` and supplied comparison screenshots  
**Complexity:** heavy; two implementation PRs maximum

## Why this audit exists

The structural navigation batch delivered routing, shell and responsive foundations, but controller visual review found that the produced Planet screen is still materially different from the supplied reference. The gap is not a gameplay bug; it is a visual-parity failure.

The next implementation must therefore optimize for screenshot-level visual parity, not generic structural similarity.

## Verified baseline evidence

- `index.html` owns the stable shell/route DOM and currently includes Metal / Minerals / Gas / Energy / Population / Hangar in the top resource strip.
- `src/ui/globalHud.ts` writes both Population and Hangar into that strip; removing the Hangar **presentation** does not require removing hangar capacity from simulation/view-model authority.
- `src/ui/globalHudViewModel.ts` derives population/hangar values from existing simulation inventory functions. It remains gameplay authority and should only be changed if the presentation contract requires a type cleanup; no formula change is authorized.
- `src/ui/factionShellIdentity.ts::applyFactionShellIdentity()` already writes `html[data-faction]` from the active player faction.
- `src/styles/factionTheme.css` already defines canonical faction accents: Aegis blue/cyan, Synod emerald/green, Veyra red/orange. V3 extends this existing source rather than creating a second faction-theme state.
- `src/ui/planetScreen.ts` already owns Planet overview, zone switching, build queue rendering, planet selector, passport/context, hero sphere and details. V3 can therefore recompose the screen without introducing new gameplay commands or route modes.
- PR #202 left schema v20 / save v6 unchanged and all current route workspaces are already mounted/reachable; this Audit does not require new persistence/state authority.

## Graphify / dependency evidence

The branch is docs-only, so the runtime dependency graph is identical to `main` `466ec55f...`. Graphify on the #203 Audit branch is required to remain green and is used to confirm that no code graph has changed while this contract is being accepted.

Relevant existing dependency ownership:

```text
main.ts
├─ AppShellController / appShellRoute           global route authority
├─ applyFactionShellIdentity                    html[data-faction] theme authority
├─ mountGlobalHud                               top resource/status presentation
├─ mountPlanetScreen                            Planet overview + zones + queue/details
├─ mountSpaceMapNavigation                      Universe/Galaxy/Solar presentation
├─ mountFleetOperationsWorkspace                Fleet modes/composer
├─ mountOperationsWorkspace                     Operations local modes
├─ mountResearchScreen                          Science
├─ mountCommandWorkspace                        Command
├─ mountReportsWorkspace                        Reports
├─ mountCommandRankingScreen                    Ranking
├─ mountSystemWorkspace / mountSaveManager      Settings/Campaign & Saves
├─ mountProductionScreens                       Shipyard/Defense
└─ mountShipUpgradesScreen                      Ship upgrades
```

Presentation CSS is imported centrally by `src/main.ts`. The V3 implementation must extend existing route-owned style layers and `factionTheme.css`; it must not add a parallel router, state store or faction authority.

## Locked product decisions

- target is as close to 1:1 as practical against each named reference screen;
- `01_planet_main.png` is the first corrective baseline and defines the shared shell language;
- remove **Hangar** from the default top resource strip;
- keep **Population** visible in the top resource strip;
- use procedural CSS/SVG/canvas/generated visuals whenever final art is missing;
- every missing final visual must be recorded with size/format/theme in `docs/ui/missing-visual-assets.md`;
- support three distinct race themes tied to existing factions `Aegis`, `Synod`, `Veyra`;
- race themes are not simple recolors: frame language, ornament, background treatment, active navigation and planet framing may differ;
- canonical faction color direction remains Aegis blue/cyan, Synod emerald/green, Veyra red/orange;
- layout/information hierarchy remains shared across races;
- no simulation, formula, bot, schema, save or route-semantic changes.

## Long-lived contracts

- `docs/ui/reference-visual-parity-spec.md`
- `docs/ui/missing-visual-assets.md`
- `docs/ui/race-theme-token-spec.md`
- `docs/ui/reference-visual-parity-checklist.md`

# Work item 1 — VISUAL-V3-01-PLANET-STRICT-PARITY

Goal: make Planet overview + Resource / Industry / Military zones visually match refs `01`, `14`, `15`, `16` closely enough that controller comparison reads as the same interface family and composition.

## Required implementation

1. rebuild top resource strip density; remove Hangar and keep Population;
2. recompose Planet left rail to match reference ordering/proportions;
3. make the central planet a true hero composition instead of a dashboard card;
4. make construction queue the dominant right-side block;
5. remove/hide legacy bulky overview panels absent from reference while preserving their underlying gameplay data where still needed locally;
6. apply procedural planet/frame/background treatment where final art is unavailable;
7. extend existing `html[data-faction]` / `factionTheme.css` theme authority for Aegis/Synod/Veyra;
8. update missing asset ledger for every unresolved final image;
9. add intentional 1672×941 visual comparison gate for the Planet target.

## Exact expected path envelope

Runtime/UI:

- `index.html`
- `src/ui/planetScreen.ts`
- `src/ui/globalHud.ts`
- `src/ui/globalHudViewModel.ts` only if presentation typing requires cleanup; no formula changes
- `src/ui/factionShellIdentity.ts` only if additional presentation attributes are required
- `src/ui/shellContextPanel.ts` only if shell duplication must be removed

Styles:

- `src/styles/factionTheme.css`
- `src/styles/main.css`
- `src/styles/globalHud.css`
- `src/styles/planet.css`
- `src/styles/planetWorkspace.css`
- `src/styles/uiParityShellPlanet.css`
- `src/styles/uiParityPlanetCommandArt.css`
- `src/styles/uiParitySurfaceArt.css`
- `src/styles/uiParityPolish.css`
- optionally one new presentation-only race-theme CSS module imported by `src/main.ts` if extending `factionTheme.css` becomes less maintainable

Tests/docs:

- `tests/e2e/planetCommandCentre.spec.ts`
- `tests/e2e/navigationUsability.spec.ts`
- `tests/e2e/appShellFullGate.spec.ts`
- `tests/e2e/workspaceResponsiveGate.spec.ts`
- `tests/e2e/qualityGates.spec.ts`
- `docs/ui/missing-visual-assets.md`

No other runtime path is pre-authorized. A need for a new command, GameState field, route mode or persistence behavior requires an Audit amendment before implementation.

## Acceptance

- Hangar absent from default top strip;
- Population visible;
- reference block order/proportions reproduced;
- active player faction drives the correct Aegis/Synod/Veyra theme through existing faction authority;
- all three themes render the same layout with visibly distinct frame/background/ornament treatment;
- no horizontal/page overflow at 1672×941 and release viewports;
- navigation/game checksum unchanged by visual actions;
- missing final art is deterministic/procedural and ledgered;
- screenshot comparison is controller-acceptable against refs `01/14/15/16`.

## Primary risks

- moving existing DOM can break selectors/focus/E2E even when gameplay is unchanged;
- hiding legacy overview blocks can accidentally hide essential player actions;
- race-specific styling can reduce contrast if semantic colors are overwritten;
- large procedural hero effects can become expensive if implemented as continuous canvas animation.

Mitigation: retain existing IDs/actions, use CSS/SVG/static procedural layers first, preserve semantic error/focus colors and keep reduced-motion support.

# Work item 2 — VISUAL-V3-02-ALL-ROUTES-STRICT-PARITY

Goal: propagate the accepted Planet visual language and three faction themes across refs `02–13` and `17–20` without rediscovering route architecture inside the implementation PR.

## Verified surface / dependency map

| Reference | Route/state owner | Primary UI owner | Primary styles | Acceptance coverage |
| --- | --- | --- | --- | --- |
| `02_universe.png` | `space` / Universe→Galaxy→Solar | `src/ui/spaceMapNavigation.ts` | `spaceMap.css`, `galaxyIntel.css`, `uiParityMapsFleetOps.css`, `uiParitySurfaceArt.css` | `universeNavigation.spec.ts`, `workspaceResponsiveGate.spec.ts`, `qualityGates.spec.ts` |
| `03–06` Fleets | `fleets/{overview,compose,active,battles}` | `src/ui/fleetOperationsWorkspace.ts` | `missions.css`, `uiParityMapsFleetOps.css`, `uiParitySurfaceArt.css` | `navigationUsability.spec.ts`, `appShellFullGate.spec.ts`, `workspaceResponsiveGate.spec.ts` |
| `07_operations.png` | `operations/overview` | `src/ui/operationsWorkspace.ts` | `operationsRoutes.css`, `uiParityMapsFleetOps.css`, `uiParitySurfaceArt.css` | `appShellFullGate.spec.ts`, `workspaceResponsiveGate.spec.ts` |
| `13_market.png` | `operations/market` | `src/ui/operationsWorkspace.ts` | `market.css`, `operationsRoutes.css`, `uiParitySurfaceArt.css` | `workspaceResponsiveGate.spec.ts` |
| `17_solar_war.png` | `operations/solar-war` | `src/ui/operationsWorkspace.ts` + existing endgame presenters | `endgameOperations.css`, `operationsRoutes.css`, `uiParitySurfaceArt.css` | route matrix + existing Solar War Browser/unit gates |
| `18_events.png` | `operations/events` | `src/ui/operationsWorkspace.ts` | `worldEvents.css`, `operationsRoutes.css`, `uiParitySurfaceArt.css` | route matrix / event Browser gates |
| `19_arena.png` | `operations/arena` | `src/ui/operationsWorkspace.ts` | `arenaOperations.css`, `operationsRoutes.css`, `uiParitySurfaceArt.css` | route matrix / arena Browser gates |
| `08_science.png` | `research` | `src/ui/researchScreen.ts` | `research.css`, `uiParityDevelopmentData.css`, `uiParitySurfaceArt.css` | `workspaceResponsiveGate.spec.ts`, `qualityGates.spec.ts` |
| `09_command.png` | `command/{overview,doctrine,fleet-doctrine,upgrades}` | `src/ui/commandWorkspace.ts` | `commandSystemRoutes.css`, `commandDoctrine.css`, `fleetDoctrine.css`, `uiParitySurfaceArt.css` | `appShellFullGate.spec.ts`, `workspaceResponsiveGate.spec.ts`, `qualityGates.spec.ts` |
| `10_reports.png` | `reports/{all,combat,expedition,object,event}` | `src/ui/reportsWorkspace.ts` | `missionReports.css`, `uiParityDevelopmentData.css`, `uiParitySurfaceArt.css` | `workspaceResponsiveGate.spec.ts`, `qualityGates.spec.ts` |
| `11_settings.png` | `system/settings` + local categories | `src/ui/systemWorkspace.ts`, `src/ui/saveManager.ts` | `commandSystemRoutes.css`, `saveManager.css`, `uiParitySurfaceArt.css` | `appShellFullGate.spec.ts`, `workspaceResponsiveGate.spec.ts` |
| `12_rating.png` | `ranking` | `src/ui/commandRankingScreen.ts` | `commandRanking.css`, `uiParityDevelopmentData.css`, `uiParitySurfaceArt.css` | `appShellFullGate.spec.ts`, `workspaceResponsiveGate.spec.ts` |
| `20_ship_upgrades.png` | Planet development `surface=upgrades` / command upgrades context | `src/ui/shipUpgradesScreen.ts`, `src/ui/developmentWorkspaceRouter.ts` | `shipUpgrades.css`, `production.css`, `developmentWorkspace.css`, `uiParitySurfaceArt.css` | `planetCommandCentre.spec.ts`, `workspaceResponsiveGate.spec.ts` |

## Shared PR2 theme/shell paths

- `src/styles/factionTheme.css`
- `src/ui/factionShellIdentity.ts` only for presentation identity attributes
- `src/styles/uiParityNavigationArt.css`
- `src/styles/uiParitySurfaceArt.css`
- `src/styles/uiParityPolish.css`
- `docs/ui/missing-visual-assets.md`

## Exact PR2 runtime path envelope

UI owners:

- `src/ui/spaceMapNavigation.ts`
- `src/ui/fleetOperationsWorkspace.ts`
- `src/ui/operationsWorkspace.ts`
- `src/ui/researchScreen.ts`
- `src/ui/commandWorkspace.ts`
- `src/ui/reportsWorkspace.ts`
- `src/ui/commandRankingScreen.ts`
- `src/ui/systemWorkspace.ts`
- `src/ui/saveManager.ts`
- `src/ui/productionScreen.ts`
- `src/ui/shipUpgradesScreen.ts`
- `src/ui/developmentWorkspaceRouter.ts`
- `src/ui/factionShellIdentity.ts` only for presentation identity

Style owners:

- `src/styles/factionTheme.css`
- `src/styles/spaceMap.css`
- `src/styles/galaxyIntel.css`
- `src/styles/missions.css`
- `src/styles/uiParityMapsFleetOps.css`
- `src/styles/operationsRoutes.css`
- `src/styles/market.css`
- `src/styles/worldEvents.css`
- `src/styles/arenaOperations.css`
- `src/styles/endgameOperations.css`
- `src/styles/research.css`
- `src/styles/commandSystemRoutes.css`
- `src/styles/commandDoctrine.css`
- `src/styles/fleetDoctrine.css`
- `src/styles/missionReports.css`
- `src/styles/commandRanking.css`
- `src/styles/saveManager.css`
- `src/styles/production.css`
- `src/styles/shipUpgrades.css`
- `src/styles/developmentWorkspace.css`
- `src/styles/uiParityDevelopmentData.css`
- `src/styles/uiParityNavigationArt.css`
- `src/styles/uiParitySurfaceArt.css`
- `src/styles/uiParityPolish.css`

Tests:

- `tests/e2e/navigationUsability.spec.ts`
- `tests/e2e/appShellFullGate.spec.ts`
- `tests/e2e/planetCommandCentre.spec.ts`
- `tests/e2e/universeNavigation.spec.ts`
- `tests/e2e/workspaceResponsiveGate.spec.ts`
- `tests/e2e/qualityGates.spec.ts`
- existing route-specific unit tests only when a presentation view-model contract is intentionally changed

Any additional runtime path requires explicit scope-divergence review. A new gameplay route, command, state field, migration or simulation dependency requires a new Audit amendment.

## PR2 ordered implementation

1. Universe;
2. Fleet left rail + compose step 1/2 + catalog/active/battles;
3. Operations overview;
4. Market / Solar War / Events / Arena;
5. Science;
6. Command;
7. Reports;
8. Ranking;
9. Settings / Campaign & Saves;
10. Ship Upgrades + final route-wide visual/responsive/accessibility/asset QA.

## PR2 persistence / determinism / performance analysis

- schema remains v20; save format remains v6; no migration;
- route hashes and route-memory authority remain existing `appShellRoute` / `AppShellController` contracts;
- theme identity comes from existing active-faction state through `applyFactionShellIdentity()` and is not persisted separately;
- visual selection may not call `executeCommand()` unless that action already exists on the surface;
- procedural backgrounds/frames must be CSS/SVG/static deterministic canvas; no `Math.random()` or wall-clock-driven layout state;
- navigation-only checksum gates remain unchanged;
- continuous animation is optional and must be bounded/reduced-motion aware; static procedural layers are preferred.

## PR2 risks

- route-specific CSS can fight shared race-theme tokens;
- dense Fleets/Reports/Science layouts can overflow compact viewports;
- visual reduction can accidentally remove actionable controls;
- final art availability varies across surfaces;
- screenshot parity can regress after shared-theme changes.

Mitigation: one surface at a time inside PR2, exact reference ID in each acceptance check, existing actions/IDs retained, asset ledger updated immediately, full Browser matrix after each coherent slice.

## Critical unknowns

No critical UNKNOWN blocks implementation. Missing final art is explicitly non-blocking because procedural fallbacks are authorized and dimensioned in the ledger. Exact final illustrations are production-art follow-up items, not architecture questions.

## PR2 acceptance

- every reference ID has a named reachable Stellar state from the table above;
- visual composition is compared against that exact reference, not a generic style target;
- no legacy extra blocks remain by default unless explicitly justified;
- every unresolved art gap is ledgered with dimensions/theme;
- Aegis/Synod/Veyra theme binding covers shell, panels, nav active state, hero framing and contextual rails;
- no route/state/persistence/simulation authority changes;
- assets/lint/typecheck/unit/build/Graphify/Browser/production smoke/accessibility/visual gates all pass.

## Non-goals

- gameplay/simulation changes;
- bot scheduler work;
- NEM-02 implementation;
- new save schema/migration;
- new route families;
- copied reference/Nemexia pixels/code;
- premium/monetization/social mechanics.

## Batch decision

Heavy, strictly sequential:

1. `VISUAL-V3-01-PLANET-STRICT-PARITY`
2. `VISUAL-V3-02-ALL-ROUTES-STRICT-PARITY`

Implementation begins only after this Audit merges. PR2 starts only from fresh `main` after PR1 merges and passes controller visual review.
