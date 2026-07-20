# Stellar Empires — инвентаризация экранов

## Постоянная оболочка

- topbar: бренд, четыре ресурса, статус сохранения, версия;
- side rail: галактика, империя, планета, исследования, флот, отчёты, система;
- command panel: профиль, этап, showcase, ассеты, метрики, лента;
- status line и игровое время.

## Основные разделы

| Раздел | Текущая реализация | Целевой раздел |
|---|---|---|
| Galaxy | Phaser stage + Intel panel | Галактика |
| Empire | Empire overview | Командование |
| Planet | Planet screen + building catalog | Планета |
| Research | Modal/screen | Исследования |
| Production | Ship/defense dialogs | Планета / промышленная и военная зоны |
| Missions | Mission screen | Флоты |
| Reports | Mission reports dialog | Отчёты внутри командования |
| Market | Market panel | Экономика внутри планеты |
| Logistics | Logistics routes panel | Логистика внутри планеты |
| Saves | Save manager | Командование |
| Expeditions | Expedition panel | Флоты / PvE |
| Space objects | Space-object panel | Галактика / PvE |
| World events | World-events panel | Галактика / уведомления |

## Целевая основная навигация

1. Планета.
2. Флоты.
3. Галактика.
4. Исследования.
5. Командование.
6. Рейтинг.

## Целевая поднавигация планеты

1. Обзор.
2. Ресурсная зона.
3. Промышленная зона.
4. Военная зона.

## Компоненты, которые должны стать общими

- global navigation tab;
- page tab;
- primary, secondary, neutral, danger и icon buttons;
- resource chip;
- panel header/body;
- card;
- queue bar и queue slot;
- progress/capacity bar;
- badge/status chip;
- input/select/search/stepper;
- table/list row;
- modal/tooltip/notification;
- empty/locked/loading/error states.

## Удаляемые демонстрационные элементы

- faction showcase из постоянной command-panel;
- Aegis asset deck из игрового shell;
- служебные milestone/status cards, не являющиеся игровыми данными;
- статическая activity feed с техническими сообщениями.

Эти материалы могут остаться только в отдельном UI/asset sandbox для разработки.
