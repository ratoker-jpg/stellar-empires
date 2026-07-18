# Stellar Empires

Одиночная браузерная космическая стратегия с автономными бот-империями.

Игрок развивает планеты, исследует технологии, строит флоты, колонизирует галактику и конкурирует с ботами, которые действуют по тем же игровым правилам.

## Текущий статус

В работе **M1 — технический каркас**:

- Phaser 4 запускает первую галактическую сцену;
- HTML/CSS отвечает за управленческий интерфейс;
- добавлено независимое детерминированное ядро начального состояния;
- настроены lint, typecheck, тесты и production-сборка;
- добавлены GitHub Actions для CI и GitHub Pages;
- зафиксирован P0-контракт первых ассетов.

## Технологии

- Phaser 4.2.1;
- TypeScript 6.0.3;
- Vite 8.1.5;
- Vitest 4.1.10;
- ESLint 10;
- GitHub Actions;
- GitHub Pages.

Версии закреплены точно, без автоматического обновления major/minor-зависимостей.

## Локальный запуск

Требуется Node.js 22.12 или новее.

```bash
npm install
npm run dev
```

Проверка проекта:

```bash
npm run check
```

Production-сборка:

```bash
npm run build
npm run preview
```

## Архитектурное направление

- статический деплой через GitHub Pages;
- автономная симуляция в браузере;
- Web Worker для тяжёлых расчётов и ботов;
- IndexedDB для сохранений;
- детерминированные события и бои;
- три асимметричные фракции;
- оригинальные названия, код и ассеты;
- разработка через небольшие проверяемые этапы.

## Документация

Начать с [`docs/README.md`](docs/README.md).

Основные документы:

- [Product Vision](docs/01-product-vision.md)
- [Game Design](docs/02-game-design.md)
- [Technical Architecture](docs/03-technical-architecture.md)
- [Bot AI](docs/04-bot-ai.md)
- [Simulation and Data](docs/05-simulation-and-data.md)
- [Roadmap](docs/06-roadmap.md)
- [Development Rules](docs/07-development-rules.md)
- [Originality and Assets](docs/08-originality-and-assets.md)
- [Open Decisions](docs/09-open-decisions.md)
- [Faction Framework](docs/10-faction-framework.md)
- [Art Direction](docs/11-art-direction.md)
- [Asset Catalog](docs/12-asset-catalog.md)

## Первый вертикальный срез

> одна планета → добыча → здание → исследование → разведчик → разведка бот-планеты → боевой корабль → атака → отчёт → сохранение.

## Лицензия

Лицензия проекта пока не выбрана. До её появления код и материалы не распространяются как открытый проект.
