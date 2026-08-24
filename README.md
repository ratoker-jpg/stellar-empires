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

Release 1.0 закрыт. Последний завершённый post-1.0 batch — `POST-1.0-STRATEGIC-FEEDBACK-TRUTH`, закрытый PR #185 squash `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`.

Текущая работа — только fresh docs-only Audit #186 `POST-1.0-NEXT-PRODUCT-3`. Он исследует фактический current main и не авторизует реализацию до controller review и merge. Канонический control-plane находится в:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/28-audit-first-autonomous-delivery-protocol.md`](docs/28-audit-first-autonomous-delivery-protocol.md)
3. [`docs/audits/current-batch-audit.md`](docs/audits/current-batch-audit.md)
4. [`docs/audits/current-execution-state.md`](docs/audits/current-execution-state.md)
5. [`docs/audits/batch-history.md`](docs/audits/batch-history.md)
6. [`docs/17-continuation-guide.md`](docs/17-continuation-guide.md)
7. [`docs/29-post-1.0-nemexia-reference-roadmap.md`](docs/29-post-1.0-nemexia-reference-roadmap.md)

Audit #186 предлагает один coherent successor work item — replayable campaign lifecycle — но implementation остаётся неавторизованным, пока Audit не будет controller-approved и merged.

## Research and assets

- [Nemexia mechanics reference](docs/research/nemexia-mechanics-reference.md)
- [Project gap analysis](docs/18-project-gap-analysis.md)
- [User-supplied asset intake](docs/assets/user-supplied-asset-intake.md)

Research/reference material не является лицензией или отдельной production specification. Runtime assets проходят repository asset audit и production browser verification.

## License

Отдельная лицензия проекта пока не выбрана и не предоставлена. Этот статус не следует трактовать как выдачу прав на использование, распространение или модификацию проекта.
