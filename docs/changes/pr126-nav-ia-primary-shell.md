# PR #126 — primary navigation hierarchy

**Work item:** `NAV-IA-PRIMARY-SHELL`  
**Audit:** #125 `NAVIGATION-USABILITY-01`  
**Baseline:** `7ef156160321104cfbcebc803a9b811a04890f02`

## Player-visible change

The flat nine-item technical rail is replaced by four explicit groups:

```text
Игра
  Планета · Вселенная · Флоты · Операции
Развитие
  Наука · Командование
Данные
  Отчёты · Рейтинг
Система
  Настройки
```

Operations is now core gameplay rather than utility. The Space route is labeled `Вселенная` because it owns Universe, Galaxy and Solar-system navigation. Reports, Ranking and System no longer receive the same visual weight as turn-to-turn gameplay.

## Technical contract

- all existing route-family IDs and hashes remain unchanged;
- grouped navigation is generated from `SHELL_NAVIGATION_GROUPS` and `SHELL_SCREEN_REGISTRY`;
- the active route and active navigation group are exposed through DOM data and accessible labels;
- keyboard roving follows rendered group order;
- HUD activity chips are explicitly informational and route badges remain attached to their destinations;
- navigation actions remain checksum-neutral and dispatch no gameplay commands.

## Excluded

No route memory, shared return context, cross-domain flow rewrite, save migration, campaign settings, world speed, offline catch-up, progression balance, alliances or endgame.
