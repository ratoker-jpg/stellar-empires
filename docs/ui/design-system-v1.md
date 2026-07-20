# Stellar Empires — Design System v1

## Цель

Создать оригинальный плотный sci-fi интерфейс, сохраняющий структурные преимущества классических браузерных стратегий без копирования конкретной графики Nemexia.

## Layout

- minimum desktop canvas: `1180px`;
- preferred: `1360–1440px`;
- maximum content width: `1600px`;
- global HUD: `150–180px`;
- context rail: `260–320px`;
- central stage: всё оставшееся пространство;
- queue bar: `64–88px`.

## Цветовая семантика

- faction accent / cyan: навигация, выбранное состояние, focus;
- gold: основное подтверждающее действие;
- red: опасность и разрушение;
- green: готовность и успех;
- neutral steel: вторичные действия;
- muted gray: disabled, locked, unknown.

## Типографика

- body: системный sans-serif/Inter-compatible;
- display: uppercase/condensed treatment через letter-spacing и font-weight;
- цифры: tabular-nums;
- заголовок экрана: `24–30px`;
- заголовок панели: `16–20px`;
- карточка: `14–17px`;
- label/meta: `10–12px` uppercase;
- плотность не достигается уменьшением основного текста ниже `12px`.

## Поверхности

1. `canvas` — фон мира.
2. `hud` — постоянная оболочка.
3. `panel` — основной контейнер.
4. `card` — интерактивная сущность.
5. `slot` — компактный элемент очереди/инвентаря.
6. `overlay` — modal/tooltip/notification.

## Кнопки

Общие состояния:

- default;
- hover;
- pressed;
- focus-visible;
- disabled;
- loading.

Семейства:

- `primary`: золотой CTA;
- `secondary`: цвет фракции;
- `neutral`: служебное действие;
- `danger`: отмена/разрушение;
- `icon`: квадратная кнопка;
- `compact`: действие в таблице/слоте.

## Вкладки

- global navigation;
- page navigation;
- compact segmented tabs;
- icon tabs.

Active-state должен менять не только цвет текста, но и фон, рамку, свечение и позиционный маркер.

## Панели

Каждая панель состоит из:

- frame;
- header;
- title/meta;
- optional actions;
- body;
- optional footer/status.

Фракционная тема меняет материалы и accent, но не layout.

## Очереди

- единая queue bar для строительства, исследований, производства и ремонта;
- 4–6 слотов;
- статус: empty, queued, active, completed, blocked;
- слот показывает иконку, название, уровень/количество, время и progress.

## Accessibility

- focus-visible обязателен;
- не полагаться только на цвет;
- disabled и locked различаются;
- контраст текста минимум WCAG AA там, где не используется крупный display text;
- все icon buttons имеют aria-label;
- motion учитывает `prefers-reduced-motion`.

## Фракционные темы

### Aegis

- navy steel;
- angular armour;
- cyan signal light;
- restrained amber accents.

### Synod

- ivory ceramic;
- dark emerald glass;
- teal/green energy;
- thin gold structure.

### Veyra

- crimson-black chitin;
- internal red light;
- organic curvature;
- restrained asymmetry without reducing readability.
