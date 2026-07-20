# Stellar Empires — UI Asset Manifest v1

## Принцип

Runtime-компоненты остаются CSS/data-driven. Изображения используются как декоративные слои и style anchors, а не как единственный источник состояний.

## Уже доступные anchors

Для каждой фракции:

- hero;
- emblem;
- card background;
- primary button source skin;
- active tab source skin;
- panel frame source skin;
- ship sprites;
- building sheets;
- territory background.

## Runtime-категории

### Navigation icons

Планета, флоты, галактика, исследования, командование, рейтинг.

Target master:

- `256×256 PNG RGBA`;
- одноцветный/двухцветный силуэт;
- читаемость на `28–40px`;
- без текста и рамки.

### Planet zone icons

Обзор, ресурсы, промышленность, военная зона.

Target master:

- `192×192 PNG RGBA`;
- одна общая геометрическая система;
- допускается faction-neutral presentation.

### HUD ornaments

- left/right caps;
- faction emblem socket;
- resource separator;
- navigation active marker;
- queue caps.

Target:

- masters `512–1024px` по длинной стороне;
- прозрачный фон;
- пригодность для CSS mask/nine-slice.

### Slot frames

Для Aegis, Synod и Veyra:

- default;
- active;
- locked;
- warning.

Target master:

- `256×256 PNG RGBA`;
- центральная рабочая область не менее 70%;
- без встроенного текста.

### Status icons

- success;
- warning;
- danger;
- locked;
- queued;
- time;
- population;
- energy;
- storage;
- fuel;
- cargo;
- intelligence.

Target master:

- `128×128 PNG RGBA`;
- neutral sci-fi language;
- читаемость на `16–24px`.

## Не генерировать как отдельные картинки

- hover/pressed/disabled для каждой кнопки;
- progress bars;
- input/select backgrounds;
- таблицы;
- простые borders;
- focus rings;
- базовые badges.

Эти состояния строятся CSS-токенами, mask/gradient и при необходимости nine-slice декоративным слоем.

## Правила интеграции

1. Все assets регистрируются data-driven.
2. Компонент работает без декоративного изображения.
3. Fallback остаётся визуально законченным.
4. Нельзя растягивать сложный PNG без nine-slice.
5. Текст и иконка не запекаются внутрь кнопки.
6. Asset проходит проверку на target runtime size.
