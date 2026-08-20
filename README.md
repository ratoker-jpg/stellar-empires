# Stellar Empires

Одиночная браузерная космическая стратегия с автономными бот-империями.

**Публичная версия:** https://ratoker-jpg.github.io/stellar-empires/

## Текущий статус

Release: **1.0.0**.

Текущий runtime использует **GameState schema v19** и **save format v6**. Кампания полностью проходит от старта до терминального результата: развитие империи → Solar War → финальный проект/Врата → сохранённая победа или поражение.

В игре доступны:

- три самостоятельные механические фракции: Aegis, Synod и Veyra;
- экономика, энергия, здания, исследования и производство;
- колонии, специализации, логистика и рынок;
- флоты, разведка, бои, переработка обломков, колонизация и уничтожение планет;
- PvE, пираты, экспедиции, космические объекты, Arena и мировые события;
- альянсы, Solar War и финальные объекты;
- автономные бот-империи с progression/endgame parity и ограничениями восприятия;
- IndexedDB autosave, ручные слоты, import/export, recovery и offline catch-up;
- терминальное состояние кампании, сохраняемое и восстанавливаемое через save/load.

Release gates включают unit/integration/audit tests, deterministic compressed progression, performance budgets, полный Browser E2E и отдельный production Pages smoke на реальном base `/stellar-empires/`.

## Technology

- Phaser 4.2.1
- TypeScript 6.0.3
- Vite 8.1.5
- Vitest 4.1.10
- Playwright 1.62
- ESLint 10
- GitHub Actions + GitHub Pages
- Node.js 24+

```bash
npm install
npm run dev
npm run check
npm run e2e
npm run e2e:production
```

`package.json` — авторитетный источник версии приложения. Production badge получает версию из него через Vite build define.

## Roadmap и продолжение работы

Канонический release-state находится в:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/audits/current-execution-state.md`](docs/audits/current-execution-state.md)
3. [`docs/audits/current-batch-audit.md`](docs/audits/current-batch-audit.md)
4. [`docs/audits/completed/m9-release-candidate.md`](docs/audits/completed/m9-release-candidate.md)
5. [`docs/17-continuation-guide.md`](docs/17-continuation-guide.md)
6. [`docs/27-playable-game-roadmap-v5.md`](docs/27-playable-game-roadmap-v5.md)

M9 закрывается PR #171 `RELEASE-1.0-CLOSURE`: финальный exact-head должен пройти стандартный Browser E2E, production-base Browser smoke, CI, progression/performance и Graphify, после чего squash-merge фиксирует технический Release 1.0. Новая M9-реализация после #171 не разрешена.

## Research and assets

- [Nemexia mechanics reference](docs/research/nemexia-mechanics-reference.md)
- [Project gap analysis](docs/18-project-gap-analysis.md)
- [User-supplied asset intake](docs/assets/user-supplied-asset-intake.md)

Research/reference material не является лицензией или отдельной production specification. Runtime assets проходят repository asset audit и production browser verification.

## License

Отдельная лицензия проекта пока не выбрана и не предоставлена. Этот статус не следует трактовать как выдачу прав на использование, распространение или модификацию проекта.
