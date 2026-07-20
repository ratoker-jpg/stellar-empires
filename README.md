# Stellar Empires

Одиночная браузерная космическая стратегия с автономными бот-империями.

## Текущий статус

Baseline после merged PR #65:

- Phaser 4.2.1 + TypeScript 6 + Vite 8;
- детерминированная schema-v12 simulation core;
- IndexedDB autosave, слоты, import/export и recovery;
- seeded galaxy, fog-aware intelligence и несколько колоний;
- три планетарные зоны, экономика, здания, исследования и производство;
- флоты, transport/deploy/scout/attack/recycle/colonize/expedition/space-object;
- combat v2, plunder, debris, unified reports и defense repair;
- logistics routes, deterministic market, pirates, world events and PvE;
- honest autonomous bot planners in a Web Worker;
- три faction identities, runtime atlases and faction selection;
- Design System v1, structured HUD and rebuilt planet workspace.

Три фракции пока используют общий Aegis mechanical catalog. Новые пользовательские source packs зарегистрированы отдельно и должны интегрироваться screen-by-screen.

## Current roadmap

Канонический порядок: [`docs/16-execution-roadmap.md`](docs/16-execution-roadmap.md).

Активный mechanics-informed visual/content batch:

1. #66 knowledge/audit/source asset intake;
2. #67 fleets and galaxy;
3. #68 research/production/defense;
4. #69 operations and reports;
5. #70 command/ranking/faction polish;
6. #71 responsive/accessibility/performance QA.

## Technology

- Phaser 4.2.1
- TypeScript 6.0.3
- Vite 8.1.5
- Vitest 4.1.10
- ESLint 10
- GitHub Actions and GitHub Pages

Node.js 22.12+:

```bash
npm install
npm run dev
npm run check
```

## Continue in a new AI session

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/17-continuation-guide.md`](docs/17-continuation-guide.md)
3. [`docs/project-status.json`](docs/project-status.json)
4. [`docs/16-execution-roadmap.md`](docs/16-execution-roadmap.md)
5. [`docs/18-project-gap-analysis.md`](docs/18-project-gap-analysis.md)
6. latest merged GitHub PRs.

## Research and assets

- [Nemexia mechanics reference](docs/research/nemexia-mechanics-reference.md)
- [Project gap analysis](docs/18-project-gap-analysis.md)
- [User-supplied asset intake](docs/assets/user-supplied-asset-intake.md)

Research is not a license or a production specification. Captured third-party HTML/screens/assets are excluded.

## License

The project license is not selected yet.
