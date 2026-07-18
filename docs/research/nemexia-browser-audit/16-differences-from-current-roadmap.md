# 16 — Differences from current roadmap

## Required 17-step migration sequence (future work; not implemented)

1. Freeze existing prototype behaviour with tests/screenshots.
2. Define original domain vocabulary, avoiding Nemexia names and assets.
3. Create a versioned `Cost` contract with named fields.
4. Create entity IDs and a data registry for original buildings/units/research.
5. Add explicit Resource, Industry, and Military domain tags.
6. Move existing planet progression data behind those tags without changing balance.
7. Add an unlock/prerequisite graph with validation.
8. Model build/research queues as serializable state.
9. Add capacity/production state as independent, testable services.
10. Make route/view state derive from domain data rather than copied screens.
11. Add deterministic simulation hooks for future combat/fleet work.
12. Introduce read-only inspection panels before write actions.
13. Add save migration for existing local progress.
14. Add fixture-based tests for each zone and locked/unlocked state.
15. Add accessibility and responsive checks for original UI.
16. Balance only with original tuning data and playtests.
17. Stage rollout behind a feature flag and retain rollback/export support.

This is a design migration checklist only. It neither authorizes nor contains game-code changes in this PR.

Stellar Empires currently exposes an original Galaxy scene and a Planet screen, while Science, Fleet, Reports, and System navigation are disabled. The browser evidence supports future original work on progression information architecture, zone categories, locks, and a deterministic exploration/fleet loop—but does not justify copying Nemexia layouts, balance, assets, or terminology.

Exact gaps in technologies, units, defenses, missions, galaxy entity types, combat, and social systems remain `UNKNOWN` because the captured session did not expose their content.

## Required architecture migration (documentation only)

The current Stellar Empires prototype is not organized around Nemexia’s three-zone model. Any future original implementation should explicitly migrate planet progression into **Resource**, **Industry**, and **Military** domain groups before adding their dependent systems. That migration must define stable internal data contracts for named costs, build time, prerequisites, queue state, unlock state, and original UI routes; it must not copy Nemexia screens, art, terms, values, or code. This audit makes no product-code changes.
