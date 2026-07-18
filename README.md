# Stellar Empires

Одиночная браузерная космическая стратегия с автономными бот-империями.

Игрок развивает планеты, исследует технологии, строит флоты, колонизирует галактику и конкурирует с ботами, которые действуют по тем же игровым правилам.

## Текущий статус

Проект прошёл технический каркас и трёхзонный планетарно-экономический прототип:

- Phaser 4 запускает seeded-галактику;
- HTML/CSS отвечает за управленческий интерфейс;
- детерминированный симулятор обрабатывает команды, события и время;
- добавлены persistence core и IndexedDB repository;
- работает модель галактики с домашними системами;
- поставлены общая визуальная оболочка и P1-ассеты «Эгиды»;
- реализованы ресурсы, энергия, население, стабильность и очередь строительства;
- планета использует три домена: Resource, Industry и Military;
- Research, Shipyard, Defense и Fleet имеют отдельные маршруты;
- проведён структурированный аудит Nemexia и официальной справки;
- GitHub Actions проверяет lint, typecheck, tests и production build;
- merge в `main` публикует GitHub Pages.

Канонический план фиксирует **100 PR до Release 1.0**. После документационного PR #22 остаётся 78 implementation PR — от autosave и исследований до трёх фракций, автономных ботов, коалиций, эндгейма, Beta и релиза.

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
- три планетарных домена: Resource, Industry и Military;
- Research, Shipyard и Defense — отдельные рабочие экраны, связанные с доменами;
- оригинальные названия, код, баланс и ассеты;
- разработка delivery batches минимум по четыре последовательных PR.

## Документация

Начать с [`docs/README.md`](docs/README.md).

Основные документы:

- [Product Vision](docs/01-product-vision.md)
- [Game Design](docs/02-game-design.md)
- [Technical Architecture](docs/03-technical-architecture.md)
- [Bot AI](docs/04-bot-ai.md)
- [Simulation and Data](docs/05-simulation-and-data.md)
- [Canonical PR #1–#100 Execution Roadmap](docs/16-execution-roadmap.md)
- [Machine-readable Roadmap Index](docs/roadmap-pr-index.json)
- [Full System Backlog](docs/06-roadmap.md)
- [Development Rules](docs/07-development-rules.md)
- [Originality and Assets](docs/08-originality-and-assets.md)
- [Open Decisions](docs/09-open-decisions.md)
- [Faction Framework](docs/10-faction-framework.md)
- [Art Direction](docs/11-art-direction.md)
- [Asset Catalog](docs/12-asset-catalog.md)

## Первый вертикальный срез

> новая партия → выбор фракции → одна планета → три зоны → добыча → энергия → здание → исследование → верфь → разведчик → разведка бот-планеты → транспорт → боевой корабль → атака → отчёт → обломки → возврат → autosave.

## Лицензия

Лицензия проекта пока не выбрана. До её появления код и материалы не распространяются как открытый проект.
