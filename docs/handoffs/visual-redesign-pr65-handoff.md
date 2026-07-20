# Stellar Empires — handoff перед PR #65

## 1. Репозиторий и ветки

- Репозиторий: `ratoker-jpg/stellar-empires`
- Основная ветка: `main`
- Текущая рабочая ветка: `agent/pr65-planet-zones`
- Текущий активный PR ещё **не открыт**.
- Ветка создана от `main` после merge PR #64.

### Последние merge

- PR #63 — `Establish visual redesign foundation`
  - merge SHA: `4f658664bff4c1f93aae42caeaa804e4f508f23e`
- PR #64 — `Replace prototype shell with structured global HUD`
  - merge SHA: `4389ce886401a330a42a9f98aaa20702cdfafcd4`

GitHub history является источником истины, даже если `docs/project-status.json` временно отстаёт на один PR.

## 2. Почему работа была остановлена

Пользователь остановил дальнейшее развитие механик, потому что текущий интерфейс ощущался как функциональный web-прототип, а не как цельная sci-fi браузерная стратегия.

Был проведён полный read-only аудит Nemexia. Его используют только как структурный референс:

- постоянный верхний HUD;
- крупная основная навигация;
- контекстная панель;
- верхняя очередь;
- центральная игровая сцена;
- циан/цвет фракции для навигации;
- золото для главного подтверждающего действия.

Конкретные изображения, рамки, кнопки и композиции Nemexia не копируются.

## 3. Жёсткие продуктовые решения

1. Новые механики заморожены до завершения visual redesign batch #63–#70.
2. Ветка `agent/pr63-ship-upgrades` не мержится и не продолжается до окончания редизайна.
3. Codex используется только для генерации недостающих ассетов, не для кода, документации, GitHub и аудитов.
4. Код, интеграцию, тесты, PR, CI и merge выполняет основной исполнитель.
5. Редизайн должен сохранять структуру классической браузерной космической стратегии, но оставаться оригинальным.
6. UX трёх фракций одинаков; различаются палитра, материалы и декоративный язык.
7. Каждый PR проходит lint, typecheck, полный Vitest-набор и production build.
8. Merge выполняется только после зелёного CI.

## 4. Целевая основная навигация

1. Планета
2. Флоты
3. Галактика
4. Наука
5. Командование
6. Рейтинг

Utility-разделы:

- Отчёты
- Система

Раздел «Союз» пока не нужен, потому что игра одиночная. Онлайн-альянсы и дипломатия будут отдельным будущим модулем.

## 5. Что уже сделано

### PR #63 — визуальный фундамент

Добавлены:

- `docs/ui/visual-audit.md`
- `docs/ui/ui-screen-inventory.md`
- `docs/ui/design-system-v1.md`
- `docs/ui/ui-asset-manifest-v1.md`
- `src/styles/designTokens.css`
- `src/styles/uiPrimitives.css`
- `src/styles/uiSandbox.css`
- `src/ui/designSystemSandbox.ts`
- `ui-sandbox.html`

Design System v1 включает:

- панели;
- карточки;
- primary/secondary/neutral/danger buttons;
- icon buttons;
- tabs;
- inputs/selects;
- badges;
- progress bars;
- queues/slots;
- tooltips;
- modal shell;
- фракционные темы Aegis/Synod/Veyra.

Vite собирает:

- основной клиент;
- отдельный `ui-sandbox.html`.

### PR #64 — глобальная оболочка

Сделано:

- вертикальная боковая rail-навигация заменена горизонтальной;
- верхний HUD объединяет бренд, ресурсы, статус сохранения, версию и фракционную эмблему;
- command panel перенесена в левую контекстную колонку;
- центральная игровая сцена получила приоритет по ширине;
- демонстрационные asset/showcase-блоки скрыты из основного игрового shell;
- старые ID и aria-контракты сохранены;
- добавлен `src/styles/globalHud.css`;
- основные разделы расположены в целевом порядке.

## 6. Текущий PR #65 — точный scope

Название:

> `Rebuild planet overview and three zone screens`

Нужно сделать четыре состояния планетарного экрана:

1. Обзор планеты
2. Ресурсная зона
3. Промышленная зона
4. Военная зона

### 6.1. Общая структура экрана планеты

Постоянная композиция:

- верхний planet header;
- переключатель активной колонии;
- вкладки «Обзор / Ресурсная / Промышленная / Военная»;
- верхняя очередь из 4–6 слотов;
- левая контекстная панель;
- центральная игровая сцена;
- выбранное здание/действие открывает detail panel или modal;
- одна золотая CTA для главного действия.

### 6.2. Обзор планеты

Должен содержать:

- крупную планету по центру;
- карточку планеты слева;
- название, координаты, роль и специализацию;
- ресурсы, очки и состояние;
- население;
- стабильность;
- энергию;
- заполнение зон;
- переход к развитию колонии.

Нельзя превращать обзор в таблицу из множества карточек.

### 6.3. Ресурсная зона

Должна содержать:

- фракционную территорию или процедурный фон как stage;
- размещённые resource buildings;
- верхнюю очередь;
- показатели населения, энергии, стабильности и добычи;
- каталог или инструменты строительства слева;
- выбор здания;
- карточку текущего уровня, стоимости, времени и требований;
- золотую кнопку построить/улучшить.

### 6.4. Промышленная зона

Должна содержать:

- industrial buildings;
- research gateway;
- shipyard/production gateway;
- storage/logistics gateway;
- общую визуальную структуру ресурсной зоны;
- собственный фон и акценты.

### 6.5. Военная зона

Должна содержать:

- defense buildings;
- sensor/fleet gateways;
- активные и повреждённые установки;
- ремонт;
- заполнение defense network;
- угрозы и боеготовность;
- общую структуру остальных зон.

## 7. Что важно сохранить технически

### Текущие игровые контракты

`src/ui/planetScreen.ts` сейчас:

- хранит `activeZone: PlanetZoneId`;
- поддерживает `resource`, `industry`, `military`;
- рендерит карточки зданий;
- использует существующие команды `QUEUE_BUILDING`, `CANCEL_BUILDING`, `ADVANCE_TIME`;
- обновляет resource HUD;
- использует существующие ID из `index.html`;
- вызывает `setActiveView('planet')`;
- связан с autosave и bot scheduler через общий command bridge.

Нельзя ломать:

- `#planet-selector`
- `#planet-name`
- `#world-time`
- `#planet-building-grid`
- `#planet-build-queue`
- `#advance-next-event`
- resource HUD IDs
- `mountPlanetScreen`
- `applyPlanetScreenCommand`
- `getPlanetScreenActivePlanetId`
- `selectPlanetScreenPlanet`

Их можно переносить внутри DOM, но нельзя удалять без одновременной миграции всех потребителей и тестов.

### Building artwork

`planetScreen.ts` получает `AegisVerticalSliceAsset`, но runtime atlas URL уже переключается по фракции через:

- `bindFactionRuntimeAssets`
- `getFactionAtlasUrl`

Поэтому новый UI должен продолжить использовать существующий atlas contract, а не создавать отдельную систему загрузки зданий.

### Отдельный overview-mode

Сейчас `activeZone` не содержит `overview`.

Рекомендуемая реализация:

```ts
type PlanetWorkspaceMode = 'overview' | PlanetZoneId;
```

Нужно отделить:

- глобальный view: `galaxy | planet`;
- внутренний planet mode: `overview | resource | industry | military`.

### Очередь

Сейчас build queue визуально показывает только первый элемент. В PR #65 можно отрисовать полосу из нескольких slot-состояний, но нельзя выдумывать новую механику многослотовой очереди.

Допустимо:

- слот 1 — фактическое активное строительство;
- остальные — empty/locked визуальные состояния;
- отдельная кнопка «до следующего события».

## 8. Основные файлы для чтения перед изменениями

Обязательно:

- `AGENTS.md`
- `docs/17-continuation-guide.md`
- `docs/project-status.json`
- `docs/ui/visual-audit.md`
- `docs/ui/ui-screen-inventory.md`
- `docs/ui/design-system-v1.md`
- `docs/ui/ui-asset-manifest-v1.md`
- `index.html`
- `src/main.ts`
- `src/ui/planetScreen.ts`
- `src/ui/resourceZoneViewModel.ts`
- `src/ui/industryZoneViewModel.ts`
- `src/ui/militaryZoneViewModel.ts`
- `src/ui/planetViewModel.ts`
- `src/styles/designTokens.css`
- `src/styles/uiPrimitives.css`
- `src/styles/globalHud.css`
- `src/styles/planet.css`
- `src/styles/planetWorkspace.css`
- `src/styles/planetDevelopment.css`

## 9. Предпочтительный порядок реализации PR #65

1. Перечитать текущий `index.html` после PR #64.
2. Добавить planet-mode tabs с сохранением существующих zone IDs.
3. Создать overview DOM-контейнер.
4. Разделить текущий planet content на:
   - context rail;
   - queue bar;
   - stage;
   - details/actions.
5. Переписать `planetScreen.ts` на `PlanetWorkspaceMode`.
6. Создать отдельные render-функции:
   - `renderPlanetOverview`
   - `renderPlanetZoneStage`
   - `renderPlanetQueue`
   - `renderPlanetContext`
   - `renderPlanetDetails`
7. Перенести существующие команды без изменения домена.
8. Сделать оригинальный CSS в `planet.css` и при необходимости новом `planetZones.css`.
9. Проверить три фракции.
10. Прогнать lint/typecheck/tests/build.
11. Открыть PR #65.
12. Merge только после зелёного CI.

## 10. Acceptance criteria PR #65

- Есть четыре planet modes: обзор + три зоны.
- Между режимами можно переключаться мышью и клавиатурой.
- Ресурсная, промышленная и военная зоны имеют общую структуру, но разные контекст и визуальные акценты.
- Центральная stage занимает основную площадь экрана.
- Очередь отображается сверху.
- Основное действие выделено золотом.
- Все существующие planet commands продолжают работать.
- Autosave и bot scheduler не ломаются.
- Aegis/Synod/Veyra используют соответствующие runtime atlases.
- Нет горизонтального скролла на 1366×768 и 1920×1080.
- Lint, typecheck, tests и production build зелёные.

## 11. Следующие PR после #65

- #66 — флоты и галактика
- #67 — исследования, производство и оборона
- #68 — рынок, логистика, PvE и отчёты
- #69 — командование, рейтинг и фракционная полировка
- #70 — responsive, accessibility, performance и visual QA

## 12. Стиль коммуникации с пользователем

- Русский язык.
- Обращение на «ты».
- Писать прямо и кратко.
- Не спрашивать разрешение на каждый технический шаг.
- Пользователь ожидает исполнение, а не предложения «могу сделать».
- Сообщать:
  - что сейчас делается;
  - что завершено;
  - что сломалось, если сломалось;
  - конкретный следующий шаг.
