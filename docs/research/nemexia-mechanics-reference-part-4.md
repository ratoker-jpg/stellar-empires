# 18. Альянсы

## 18.1 Создание и дипломатия

Нужен Government / Regulator Palace / Hive.

### Military Alliance

- требует принятия;
- отмена после 168 часов;
- запрещает враждебные действия;
- количество не ограничено как войны.

### Non-Aggression Pact

- может быть односторонним;
- отмена с задержкой 72 часа.

### War

- начинается через 12 часов;
- отменяется не ранее 168 часов;
- одновременно до трёх;
- Motivation в войне 70% вместо 50%.

## 18.2 Alliance Points

- 10 000 перевезённых ресурсов = 1 point;
- 1 000 Alliance Battle Points = 1;
- 10 Population stationed = 1.

| Level | Требуется Alliance Points |
|---:|---:|
| 1 | 5 000 |
| 2 | 6 750 |
| 3 | 8 500 |
| 4 | 10 250 |
| 5 | 12 000 |
| 6 | 13 750 |
| 7 | 15 500 |
| 8 | 17 250 |
| 9 | 19 000 |
| 10 | 20 750 |
| 11 | 22 500 |
| 12 | 24 250 |
| 13 | 26 000 |
| 14 | 27 750 |
| 15 | 29 500 |
| 16 | 31 250 |
| 17 | 33 000 |
| 18 | 34 750 |
| 19 | 36 500 |
| 20 | 38 250 |
| 21 | 40 000 |
| 22 | 41 750 |
| 23 | 43 500 |
| 24 | 45 250 |
| 25 | 47 000 |

## 18.3 Alliance Abilities

За уровень альянса — очко. Пять уровней. Исследования могут идти параллельно и занимают около 24 часов.

| Бонус | Уровни 1–5 |
|---|---|
| Mining | 1 / 5 / 10 / 15 / 20% |
| Units | 1 / 3 / 7 / 10 / 15% |
| Science | 1 / 3 / 7 / 10 / 15% |
| Building | 1 / 3 / 7 / 10 / 15% |

## 18.4 Team Planet

- Лидер преобразует собственную планету.
- Минимум 6 участников: по 2 каждой расы.
- Лидеру нужна вторая планета.
- Government 10.
- Старые личные активы заменяются командными.
- Старая статья: 5 млн Total Points топ-5.
- Release 5.2: 2 млн Classic; 4 млн Speed; 8 млн Ultra.

---

# 19. Боевая система

## 19.1 Раунды

- 1–12.
- Атакующий выбирает максимум 5, 8 или 12.
- Юниты группируются по типу.
- Группа бьёт priority target.
- При отсутствии — другую группу.
- Гражданские, сервисные и Commander Ships атакуются последними.

## 19.2 Результаты

- Победа атакующего: грабёж.
- Поражение: без грабежа.
- Ничья: без грабежа.
- Demolition/Destruction могут проверяться независимо по навыкам.

## 19.3 Формула атаки

```text
damage = base attack + base attack × сумма бонусов
```

Бонусы: Laser/Ion/Plasma Science, Ship Upgrades, Admiral Ships Attack, оружейные Skills, Attack Forcer и Executor.

## 19.4 Броня

```text
armor = base armor + бонусы
```

Armor Science, Armor Boost и Shield Master уменьшают входящий урон.

## 19.5 Приоритеты

| Группа | Приоритетный корабль |
|---|---|
| Scout / Rogue / Nox Darth | Cruiser / Interceptor / Nemesis |
| Cruiser-class | Battlecruiser / Armada / Ghost |
| Guardian-class | Scout-class |
| Battlecruiser-class | Master units |
| Destroyer-class | Master units |
| Bomber-class | Destroyer / Goliath / Hornet |
| Master unit | Bomber-class |

| Корабль | Приоритетная оборона |
|---|---|
| Scout | Laser |
| Cruiser | Plasma |
| Guardian | Ballistic |
| Battlecruiser | Ion |
| Destroyer | Plasma-Laser |
| Bomber | Laser-Ion |
| Master | Ion-Plasma |

Статья описывает до +70% против приоритетной цели и штраф до 30%.

## 19.6 Sun Battles

- До 12 раундов.
- Солнце участвует при 1+ дне жизни.
- Без Support: Life = days × 1 000 000; Attack = days × 3 000.
- С Support: coefficient = Support Population / 25 112; Suns amount = days / coefficient; Life = `(days / coefficient) × 1 000 000`; Attack = `(days / coefficient) × 3 000`.
- Используются лучшие Science supporters.
- Sun: Laser + Light Armor.
- Supporters: ×3 BP и до 50% погибших обратно, отдельно по каждому полёту.

---

# 20. Профиль и настройки

## 20.1 Profile

Показывает данные игрока, очки, альянс, достижения, активность и планеты в пределах прав/сервисов.

## 20.2 Account Settings

Личные настройки, рестарт/удаление, смена ника, визуальные настройки, платные функции и cooldown.

## 20.3 Sitters

Назначаются штатно, имеют ограниченные права, владелец отвечает за действия, транспорт третьим лицам ограничен.

---

# 21. Рейтинги

## 21.1 Типы

- Players: Total, Resource, Battle.
- Alliances: Alliance, Alliance Resource, Alliance Battle.
- Hall of Fame: топ-10 прошлых раундов.
- Hardcore: Achievement Points.

## 21.2 Resource Points

- 1 RP за 1 000 потраченных ресурсов.
- За здания, оборону, корабли, науки и улучшения.
- Теряются при уничтожении актива.
- Аукционные юниты дают эквивалентные RP.
- Commander Ships и Admiral Stats RP не дают.

## 21.3 Battle Points

- Зависят от RP, потерянных врагом.
- Получают обе стороны.
- Не выдаются против своего альянса и неактивных.
- Solar Satellites не дают обычные BP.
- Sun Support: ×3.
- Две точные формулы BP встроены изображениями без текстового слоя и не выдуманы здесь.

## 21.4 Round Rewards

- Победный пул рассчитан максимум на 20 долей; при >20 участников делится между всеми.
- Не получают banned до конца раунда, слишком новые участники, вышедшие во время SSG, аккаунты <15 000 RP и рестартовавшие.
- Статья конфликтует: 10 дней членства против 7 дней до старта SSG.
- Топ-3 Total получают сертификаты.

---

# 22. Достижения

8 категорий: Points, Social, Expand, Development, Premium, Admiral, Legendary, War.

Есть однораундовые и многораундовые цели. Награды: Premium days, Capsules, изображения планет и пакеты. Achievement Points формируют Hardcore.

| Завершено | Награда |
|---:|---|
| 10 | 5 Premium days |
| 20 | 5 Premium days |
| 30 | 5 Premium days |
| 40 | 5 Premium days |
| 50 | Legendary Package |

---

# 23. Сервисы

## 23.1 Валюты

Credits, Stars, Elements, капсулы/токены.

## 23.2 Premium

Более долгое хранение сообщений, пагинация, сведения об активности, торговые фильтры, поиск Scrap, обзор игроков/планет, очередь 5 вместо 3, 3 Space Adventures вместо 2, дополнительные Specialties, подробные отчёты и повышенные лимиты сообщений. Часть таблицы — только изображение.

## 23.3 Special Offers

Временные пакеты валют, сервисов и предметов; Credits могут учитываться Loyalty.

## 23.4 Capsules

Тематические пакеты наград; release 5.2 добавил пять; могут содержать ресурсы, Premium/Platinum и Equipment.

## 23.5 Loyalty Program

Текущая страница не отдалась. Старый официальный Platinum Program:

| Куплено Credits за месяц | Награда |
|---:|---:|
| 1 000 | 30 Stars |
| 2 000 | ещё 30 |
| 5 000 | 90 |
| 8 000 | 90 |
| 11 000 | 90 |
| 14 000 | 90 |
| далее каждые +3 000 | 90 |

Сброс первого числа; максимального уровня нет.

## 23.6 Space Adventures

2 в день; Premium 3; Platinum 4; открываются по RP; большинство имеет шанс провала; Mine Examination — исключение; переполнение складов обрабатывается отдельно.

## 23.7 Subscriptions

Specialties: 50 Credits или 9 Stars, 7 дней, автообновление, личные планеты. Galactic Insurance: ночная проверка, шанс около 3%, положительные/отрицательные события. Consumables: около 15 Credits на 6 часов против Renegades, не Team planet.

## 23.8 Instant / Speed Up

Старая статья описывает покупку 10 часов добычи, cooldown 24 часа, Instant Building/Research, Ozone, Protection и Vacation. Release 4.1 заменяет Instant Building/Research на Speed Up.

## 23.9 Customization

Старая статья: ник первая смена бесплатно, затем 100 Credits / 7 дней; 5 бесплатных изображений планет; relocation 300 Credits / 30 дней; логотип 10 Stars / 7 дней. Release 5.2: ник 20 Credits / 72 часа; relocation cooldown 10 дней.

## 23.10 Platinum

Старая статья: 7 дней за 20 Stars, очередь 6, 4 Space Adventures и расширенные лимиты. Instant-преимущества частично устарели после 4.1.
