# Каталог 2026-07-22 — здания и building assets

[Назад к сводному документу](../19-complete-user-captured-catalog-2026-07-22.md)

## 5. Полный каталог зданий: 22 обычных + 2 галактических

| # | Функциональный слот | Зона | Сводка механики |
|---:|---|---|---|
| 1 | `metal-bot-1` — Добыча металла I | `resource` | Основной источник металла. Первый из трёх параллельных металлических добывающих объектов; не требует другого месторождения. |
| 2 | `metal-bot-2` — Добыча металла II | `resource` | Второй параллельный источник металла. Карточка указывает требование: основной металлический объект уровня 10. |
| 3 | `metal-bot-3` — Добыча металла III | `resource` | Третий параллельный источник металла. Карточка указывает требование: основной металлический объект уровня 15. |
| 4 | `mineral-bot-1` — Добыча минералов I | `resource` | Основной источник минералов. Производство растёт с уровнем. |
| 5 | `mineral-bot-2` — Добыча минералов II | `resource` | Второй параллельный источник минералов. Требует основной минералодобывающий объект уровня 10. |
| 6 | `gas-probe-1` — Добыча газа I | `resource` | Основной источник газа, используемого как ресурс и топливо флота. |
| 7 | `gas-probe-2` — Добыча газа II | `resource` | Второй параллельный источник газа. Требует основной газодобывающий объект уровня 10. |
| 8 | `infrared-bot` — Базовая энергетика | `resource` | Базовый чистый источник энергии. Выработка растёт с площадью/уровнем; предназначен для ранней экономики. |
| 9 | `uranium-bot` — Продвинутая энергетика | `resource` | Более мощный энергетический источник. На планете допускается один; требует базовую энергетику уровня 10. |
| 10 | `bunker` — Ангар/хранилище флота | `resource` | Увеличивает доступную вместимость для кораблей; разные корабли занимают разный объём ангара. |
| 11 | `construction` — Строительный комплекс | `industry` | Даёт строительных рабочих/роботов и сокращает время возведения зданий. Один на планету; открывает продвинутую фабрику. |
| 12 | `teret-factory` — Продвинутая производственная фабрика | `industry` | Сокращает время производства кораблей и планетарной обороны в верфи. |
| 13 | `metal-vault` — Склад металла | `industry` | Один на планету; уровень увеличивает максимальный запас металла. |
| 14 | `mineral-treasury` — Склад минералов | `industry` | Один на планету; уровень увеличивает максимальный запас минералов. |
| 15 | `gas-chamber` — Склад газа | `industry` | Один на планету; уровень увеличивает максимальный запас газа. |
| 16 | `scrapyard` — Переработка обломков | `industry` | Один на планету; перерабатывает космические обломки, уровень повышает скорость и эффективность. |
| 17 | `trade-center` — Торговый центр | `industry` | Один на планету; обменивает ресурсы, уровень улучшает обменный курс. |
| 18 | `shipyard` — Верфь | `military` | Один на планету; производит корабли и оборону, уровни сокращают время и открывают более сильные единицы. |
| 19 | `experimental-center` — Научный центр | `military` | Один на планету; размещает учёных и открывает доступ к более сложным исследованиям. |
| 20 | `spaceport` — Космодром/центр модернизации | `military` | Открывает усовершенствование кораблей; карточка также связывает уровни с сокращением производственного времени. |
| 21 | `control-chamber` — Планетарное управление | `military` | Административное управление планетой. В оригинальной онлайн-логике уровень 10 позволял лидеру союза назначать командную планету. |
| 22 | `bank` — Банк | `military` | Кредитно-залоговая механика. Эффективность ссуды растёт от 50% на старте до 100% на уровне 10. |
| 23 | `aksum-obelisk` — Галактический обелиск | `galactic` | Галактическое сооружение. В сохранённых карточках есть имя и несколько требований уровня 1, но нет раскрытого эффекта. |
| 24 | `supreme-galactic-gates` — Верховные Галактические Врата | `galactic` | Финальный галактический портал. Карточка показывает четыре требования уровня 1; текст эффекта не раскрыт. |

### Aegis — 24 подготовленных ассета

Capture mapping: **синяя кибернетическая подборка**.

| # | Оригинальное имя на карточке | Новый ID ассета Stellar Empires | Новое рабочее имя | Зона |
|---:|---|---|---|---|
| 1 | Рудник для металла #1 | `building.aegis.metal-bot-1` | Kestrel Bore I | `resource` |
| 2 | Рудник для металла #2 | `building.aegis.metal-bot-2` | Kestrel Bore II | `resource` |
| 3 | Рудник для металла #3 | `building.aegis.metal-bot-3` | Kestrel Bore III | `resource` |
| 4 | Экстрактор минералов #1 | `building.aegis.mineral-bot-1` | Prism Prospect I | `resource` |
| 5 | Экстрактор минералов #2 | `building.aegis.mineral-bot-2` | Prism Prospect II | `resource` |
| 6 | Газовая скважина #1 | `building.aegis.gas-probe-1` | Vapor Well I | `resource` |
| 7 | Газовая скважина #2 | `building.aegis.gas-probe-2` | Vapor Well II | `resource` |
| 8 | Солнечные панели | `building.aegis.infrared-bot` | Helios Array | `resource` |
| 9 | Атомная электростанция | `building.aegis.uranium-bot` | Aegis Fission Core | `resource` |
| 10 | Ангар | `building.aegis.bunker` | Bulwark Hangar | `resource` |
| 11 | Фабрика | `building.aegis.construction` | Civic Fabricator | `industry` |
| 12 | Фабрика для тертетов | `building.aegis.teret-factory` | Vanguard Works | `industry` |
| 13 | Склад для металла | `building.aegis.metal-vault` | Ironhold Vault | `industry` |
| 14 | Склад для минералов | `building.aegis.mineral-treasury` | Prism Cache | `industry` |
| 15 | Резервуар для газа | `building.aegis.gas-chamber` | Vapor Reserve | `industry` |
| 16 | Завод по переработке | `building.aegis.scrapyard` | Reclaim Works | `industry` |
| 17 | Торговый центр | `building.aegis.trade-center` | Transit Exchange | `industry` |
| 18 | Верфь | `building.aegis.shipyard` | Fleet Forge | `military` |
| 19 | Лаборатория | `building.aegis.experimental-center` | Cognition Laboratory | `military` |
| 20 | Космодром | `building.aegis.spaceport` | Orbital Marshalling Yard | `military` |
| 21 | Парламент | `building.aegis.control-chamber` | Planetary Directorate | `military` |
| 22 | Банк | `building.aegis.bank` | Credit Citadel | `military` |
| 23 | Обелиск Рамсеса II | `building.aegis.aksum-obelisk` | Pharos Obelisk | `galactic` |
| 24 | Верховные Галактические Врата | `building.aegis.supreme-galactic-gates` | Sovereign Gate | `galactic` |

### Synod — 24 подготовленных ассета

Capture mapping: **зелёная машинная подборка**.

| # | Оригинальное имя на карточке | Новый ID ассета Stellar Empires | Новое рабочее имя | Зона |
|---:|---|---|---|---|
| 1 | Металл бот #1 | `building.synod.metal-bot-1` | Ferric Lattice I | `resource` |
| 2 | Металл бот #2 | `building.synod.metal-bot-2` | Ferric Lattice II | `resource` |
| 3 | Металл бот #3 | `building.synod.metal-bot-3` | Ferric Lattice III | `resource` |
| 4 | Минерал бот #1 | `building.synod.mineral-bot-1` | Prism Sifter I | `resource` |
| 5 | Минерал бот #2 | `building.synod.mineral-bot-2` | Prism Sifter II | `resource` |
| 6 | Газодобывающий зонд #1 | `building.synod.gas-probe-1` | Flux Collector I | `resource` |
| 7 | Газодобывающий зонд #2 | `building.synod.gas-probe-2` | Flux Collector II | `resource` |
| 8 | Инфракрасный бот | `building.synod.infrared-bot` | Radiant Receiver | `resource` |
| 9 | Урановый бот | `building.synod.uranium-bot` | Resonance Core | `resource` |
| 10 | Бункер | `building.synod.bunker` | Fleet Archive | `resource` |
| 11 | Конструкцион | `building.synod.construction` | Assembly Node | `industry` |
| 12 | Фабрика для тертетов | `building.synod.teret-factory` | Precision Forge | `industry` |
| 13 | Трезор для металла | `building.synod.metal-vault` | Ferric Archive | `industry` |
| 14 | Сокровищница минералов | `building.synod.mineral-treasury` | Mineral Archive | `industry` |
| 15 | Газовая палата | `building.synod.gas-chamber` | Flux Reservoir | `industry` |
| 16 | Свалка | `building.synod.scrapyard` | Matter Reclaimer | `industry` |
| 17 | Торговый центр | `building.synod.trade-center` | Concord Exchange | `industry` |
| 18 | Верфь | `building.synod.shipyard` | Lattice Yard | `military` |
| 19 | Экспериментальный центр | `building.synod.experimental-center` | Pattern Crucible | `military` |
| 20 | Космодром | `building.synod.spaceport` | Relay Launch Array | `military` |
| 21 | Палата управления | `building.synod.control-chamber` | Concord Chamber | `military` |
| 22 | Банк | `building.synod.bank` | Ledger Nexus | `military` |
| 23 | Обелиск Аксума | `building.synod.aksum-obelisk` | Axis Monolith | `galactic` |
| 24 | Верховные Галактические Врата | `building.synod.supreme-galactic-gates` | Concord Gate | `galactic` |

### Veyra — 24 подготовленных ассета

Capture mapping: **красная биомеханическая подборка**.

| # | Оригинальное имя на карточке | Новый ID ассета Stellar Empires | Новое рабочее имя | Зона |
|---:|---|---|---|---|
| 1 | Экстрактор для металла #1 | `building.veyra.metal-bot-1` | Carapace Maw I | `resource` |
| 2 | Экстрактор для металла #2 | `building.veyra.metal-bot-2` | Carapace Maw II | `resource` |
| 3 | Экстрактор для металла #3 | `building.veyra.metal-bot-3` | Carapace Maw III | `resource` |
| 4 | Экстрактор минералов #1 | `building.veyra.mineral-bot-1` | Ember Siphon I | `resource` |
| 5 | Экстрактор минералов #2 | `building.veyra.mineral-bot-2` | Ember Siphon II | `resource` |
| 6 | Газовый инкубатор #1 | `building.veyra.gas-probe-1` | Breather Incubator I | `resource` |
| 7 | Газовый инкубатор #2 | `building.veyra.gas-probe-2` | Breather Incubator II | `resource` |
| 8 | Солнечный абсорбер | `building.veyra.infrared-bot` | Solar Membrane | `resource` |
| 9 | Урановый абсорбер | `building.veyra.uranium-bot` | Ember Reactor | `resource` |
| 10 | Гнезда | `building.veyra.bunker` | Brood Vault | `resource` |
| 11 | Мутационный кокон | `building.veyra.construction` | Spawning Foundry | `industry` |
| 12 | Гипермутационный Кокон | `building.veyra.teret-factory` | War-Growth Cocoon | `industry` |
| 13 | Хранилище для металла | `building.veyra.metal-vault` | Carapace Cache | `industry` |
| 14 | Хранилище для минералов | `building.veyra.mineral-treasury` | Crystal Broodstore | `industry` |
| 15 | Газовая сфера | `building.veyra.gas-chamber` | Breathing Cyst | `industry` |
| 16 | Трансформатор обломков | `building.veyra.scrapyard` | Bone Reclaimer | `industry` |
| 17 | Торговый центр | `building.veyra.trade-center` | Tendril Exchange | `industry` |
| 18 | Верфь | `building.veyra.shipyard` | Living Dock | `military` |
| 19 | Сверхразум | `building.veyra.experimental-center` | Overmind Sanctum | `military` |
| 20 | Космический канал | `building.veyra.spaceport` | Void Channel | `military` |
| 21 | Улей | `building.veyra.control-chamber` | Hive Crown | `military` |
| 22 | Банк | `building.veyra.bank` | Tribute Spire | `military` |
| 23 | Обелиск Луксора | `building.veyra.aksum-obelisk` | Bloodstone Obelisk | `galactic` |
| 24 | Верховные Галактические Врата | `building.veyra.supreme-galactic-gates` | Maw Gate | `galactic` |

### Неполностью раскрытые галактические карточки

- у каждой фракции есть собственный обелиск и Верховные Галактические Врата;
- карточка обелиска показывает три визуальных требования уровня 1, но подписи требований не были раскрыты;
- карточка Врат показывает четыре визуальных требования уровня 1 и подпись «Верховный Галактический Портал», но не раскрывает формулу/эффект;
- эти две механики нельзя реализовывать по догадке: нужен отдельный endgame contract.
