# Post-audit handoff — 2026-07-21

**Status:** Ready for a fresh implementation chat  
**Repository:** `ratoker-jpg/stellar-empires`  
**Authoritative baseline:** `main` after merged PR #78  
**Next implementation PR:** #80

## Why this handoff exists

The previous implementation chat completed PRs #75–#77, then started analysing native Synod work. It became overloaded before producing a reviewable Synod implementation. A separate chat then created and merged documentation-only PR #78 with the complete project audit.

This handoff closes that interrupted context. It does not claim unfinished Synod code as delivered.

## What is actually merged

### PR #75 — command progression and flagship framework

- persistent command state for every empire;
- command experience and levels;
- three command doctrines;
- flagship fleet appointment;
- combat effects and battle experience;
- UI, persistence compatibility and tests.

### PR #76 — faction mechanical catalog architecture

- explicit faction catalog manifest;
- `native` and `legacy-alias` modes;
- stable `kind.faction.slug` mechanical IDs;
- central registry and dependency validation;
- documented migration policy.

### PR #77 — full native Aegis catalog

- 12 Aegis buildings;
- 10 Aegis technologies;
- 10 Aegis ships;
- 5 Aegis defenses;
- explicit combat profiles;
- extended building asset registrations/fallback frames;
- updated validators and regression tests.

### PR #78 — complete project audit

- `docs/20-full-project-audit.md`;
- updated execution roadmap;
- updated machine-readable project status;
- stabilization backlog and 1.0 gates;
- no runtime changes.

## What was analysed but not delivered

The interrupted Synod work identified that switching the manifest to `native` is insufficient. Aegis assumptions remain in domain and UI paths, including:

- starting colony building IDs;
- global building, research and unit lookups;
- research speed/effect catalog selection;
- laboratory lookup;
- hangar capacity and unit population accounting;
- defense-grid capacity;
- scout, recycler and colony-ship mission checks;
- planet building cards;
- research and production screens;
- bot planners and faction discovery;
- runtime asset lookup/fallback behaviour.

No Synod runtime PR is open. No abandoned Synod branch should be used as a base. Start again from current `main`.

## Correct next scope: PR #80

**Title:** `Add the native Synod mechanical catalog`

The PR must deliver a playable Synod vertical slice through existing command paths. It must not include Veyra, diplomacy, broad screen-manager refactors, audio or endgame.

### Required mechanical content

Target comparable prototype depth to Aegis:

- 12 Synod buildings;
- 10 Synod technologies;
- 10 Synod ships;
- 5 Synod defenses.

Exact balance and names must be original. Synod should have a clear identity rather than being renamed Aegis content. Recommended identity boundary:

- research and sensor coordination;
- shield/network interaction;
- precise fleets and information advantage;
- lower raw durability than Aegis, compensated by coordination and efficiency.

This is a design direction, not permission to copy any external faction.

### Required architecture changes

- register native Synod catalogs in the central registry;
- change the manifest entry from `legacy-alias` to `native`;
- route global definition lookups through registry-backed combined maps;
- make starting buildings faction-specific;
- make laboratory, shipyard, sensor and capacity helpers faction-aware;
- make mission capability checks role/capability-based or faction-aware instead of checking Aegis IDs;
- make UI catalog selection depend on the active planet/player faction;
- use explicit Synod runtime art registrations or documented fallback frames;
- keep simulation independent from DOM and Phaser.

### Save compatibility

Existing saves may contain Synod planets that use Aegis IDs because of the previous alias mode. PR #80 must choose and document one deterministic strategy:

1. migrate legacy Synod Aegis IDs to native Synod IDs; or
2. preserve a narrowly scoped compatibility mapping while new states use native IDs.

Do not silently invalidate saves. Add fixtures for the chosen strategy.

### Required tests

At minimum:

- Synod catalog validation has zero issues;
- manifest resolves Synod as native;
- fresh Synod game starts with Synod buildings and valid economy;
- building queue accepts Synod buildings and rejects other native factions;
- research queue accepts Synod technology with Synod laboratory requirements;
- production accepts Synod ships and defenses;
- hangar and defense-grid calculations use Synod infrastructure;
- scout, recycle and colonize checks work with Synod hulls;
- representative Synod combat profiles resolve;
- old alias-era Synod save loads deterministically;
- save round-trip remains valid;
- bot planner produces at least one valid Synod progression command;
- UI/view-model tests show Synod definitions rather than Aegis cards;
- lint, typecheck, full Vitest and production build pass.

## Stabilization constraints from the audit

Do not lose these while implementing faction content:

- bot time and offline catch-up remain a P0 risk;
- save/load must not alter bot behaviour;
- command and event logs need explicit long-session budgets;
- a temporary complete victory/defeat loop is required before late endgame expansion;
- headless balance and browser E2E should be introduced earlier than the old release tail;
- source assets remain source-only until registered and tested;
- licensing/provenance remains unresolved and must be handled before 1.0.

The complete analysis is in `docs/20-full-project-audit.md`. Current code and tests override any stale counts or assumptions in prose.

## Copy-paste prompt for the next chat

```text
@GitHub Продолжай проект ratoker-jpg/stellar-empires.

Работай только с актуальным main. Сначала прочитай:
1. AGENTS.md
2. docs/17-continuation-guide.md
3. docs/project-status.json
4. docs/16-execution-roadmap.md
5. docs/20-full-project-audit.md
6. docs/19-faction-catalog-id-policy.md
7. docs/handoffs/2026-07-21-post-audit-handoff.md
8. последние merged PR #75–#79

Фактический runtime baseline: PR #77. PR #78 и #79 — documentation-only. Не используй старые или заброшенные Synod-ветки.

Задача: выполнить только PR #80 — полноценный нативный механический каталог Synod.

Обязательный результат:
- собственные Synod buildings/research/ships/defenses на глубине, сопоставимой с Aegis;
- manifest Synod = native;
- registry-backed глобальные lookup-функции без скрытой зависимости от Aegis;
- faction-aware стартовые здания, лаборатория, верфь, hangar, defense grid и research effects;
- scout/recycle/colonize проверки без Aegis hull hardcode;
- Synod работает через те же команды, очереди, бой, ботов и UI, что игрок Aegis;
- детерминированная совместимость старых save с Synod legacy-alias IDs;
- runtime asset registration или честный документированный fallback;
- тесты на catalog, initial state, building/research/production, mission capabilities, bots, UI и persistence;
- lint, typecheck, полный Vitest и build зелёные.

Не добавляй Veyra, дипломатию, endgame, audio или общий UI refactor в этот PR.

Процесс: fresh branch from main → implementation → tests/docs → PR → CI → review diff → squash merge. После merge остановись и дай сводку, не начинай PR #81 без нового запроса.
```

## Final state for this chat

- documentation handoff only;
- no runtime code changed;
- next implementation begins from fresh `main`;
- next implementation PR number is #80.