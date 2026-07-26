import type { ResourceCost } from '../economy/types';
import type { FactionId } from '../planet/types';
import { getCompleteBuildingIds } from '../planet/completeBuildingCatalog';
import { getCompleteResearchId } from '../research/completeResearchCatalog';
import type {
  CompleteShipClass,
  ShipAbilityDefinition,
  ShipRole,
  UnitDefinition,
  UnitStats,
} from './types';

interface ShipTemplate {
  readonly shipClass: CompleteShipClass;
  readonly role: ShipRole;
  readonly baseCost: ResourceCost;
  readonly baseSeconds: number;
  readonly populationCost: number;
  readonly hangarCost: number;
  readonly shipyardLevel: number;
  readonly research: readonly { readonly slug: string; readonly level: number }[];
  readonly stats: UnitStats;
  readonly ability: Omit<ShipAbilityDefinition, 'name' | 'description'>;
  readonly stationary?: boolean;
}

interface ShipIdentity {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly abilityName: string;
  readonly abilityDescription: string;
}

interface FactionShipTuning {
  readonly costPermille: number;
  readonly speedPermille: number;
  readonly cargoPermille: number;
  readonly attackPermille: number;
  readonly armorPermille: number;
  readonly shieldPermille: number;
}

export interface CompleteShipIds {
  readonly smallTransport: string;
  readonly largeTransport: string;
  readonly lightFighter: string;
  readonly interceptor: string;
  readonly supportShip: string;
  readonly lineBattleship: string;
  readonly heavyAssault: string;
  readonly bomber: string;
  readonly planetDestroyer: string;
  readonly colonizer: string;
  readonly recycler: string;
  readonly spyProbe: string;
  readonly energySatellite: string;
}

const SHIP_CLASSES: readonly CompleteShipClass[] = [
  'small-transport',
  'large-transport',
  'light-fighter',
  'interceptor',
  'support-ship',
  'line-battleship',
  'heavy-assault',
  'bomber',
  'planet-destroyer',
  'colonizer',
  'recycler',
  'spy-probe',
  'energy-satellite',
];

const TEMPLATES: Readonly<Record<CompleteShipClass, ShipTemplate>> = {
  'small-transport': {
    shipClass: 'small-transport', role: 'transport',
    baseCost: { metal: 650, crystal: 380, gas: 120 }, baseSeconds: 210,
    populationCost: 2, hangarCost: 2, shipyardLevel: 2,
    research: [{ slug: 'mathematics', level: 2 }],
    stats: { speed: 11, cargo: 1_200, attack: 2, armor: 34, shield: 12 },
    ability: { id: 'cargo-network', valuePerUnitPermille: 0, maxPercent: 0 },
  },
  'large-transport': {
    shipClass: 'large-transport', role: 'transport',
    baseCost: { metal: 1_800, crystal: 1_400, gas: 280 }, baseSeconds: 480,
    populationCost: 5, hangarCost: 5, shipyardLevel: 4,
    research: [{ slug: 'astronomy', level: 3 }, { slug: 'computer-systems', level: 2 }],
    stats: { speed: 8, cargo: 4_800, attack: 4, armor: 105, shield: 42 },
    ability: { id: 'cargo-network', valuePerUnitPermille: 0, maxPercent: 0 },
  },
  'light-fighter': {
    shipClass: 'light-fighter', role: 'fighter',
    baseCost: { metal: 520, crystal: 420, gas: 180 }, baseSeconds: 190,
    populationCost: 1, hangarCost: 1, shipyardLevel: 1,
    research: [{ slug: 'astronomy', level: 1 }],
    stats: { speed: 15, cargo: 30, attack: 36, armor: 22, shield: 10 },
    ability: { id: 'armor-pierce', valuePerUnitPermille: 4, maxPercent: 35 },
  },
  interceptor: {
    shipClass: 'interceptor', role: 'fighter',
    baseCost: { metal: 1_250, crystal: 980, gas: 360 }, baseSeconds: 340,
    populationCost: 2, hangarCost: 2, shipyardLevel: 3,
    research: [{ slug: 'ship-armor', level: 2 }, { slug: 'fuel-cells', level: 2 }],
    stats: { speed: 14, cargo: 80, attack: 78, armor: 58, shield: 24 },
    ability: { id: 'crushing-strike', valuePerUnitPermille: 5, maxPercent: 40 },
  },
  'support-ship': {
    shipClass: 'support-ship', role: 'support',
    baseCost: { metal: 1_700, crystal: 2_200, gas: 520 }, baseSeconds: 520,
    populationCost: 4, hangarCost: 4, shipyardLevel: 5,
    research: [{ slug: 'ion-science', level: 2 }, { slug: 'fuel-cells', level: 4 }],
    stats: { speed: 9, cargo: 180, attack: 62, armor: 130, shield: 92 },
    ability: { id: 'fleet-vitality', valuePerUnitPermille: 5, maxPercent: 30 },
  },
  'line-battleship': {
    shipClass: 'line-battleship', role: 'frigate',
    baseCost: { metal: 4_600, crystal: 2_600, gas: 950 }, baseSeconds: 820,
    populationCost: 7, hangarCost: 7, shipyardLevel: 7,
    research: [{ slug: 'jet-engines', level: 4 }, { slug: 'medium-armor', level: 1 }],
    stats: { speed: 8, cargo: 220, attack: 175, armor: 280, shield: 110 },
    ability: { id: 'fleet-armor', valuePerUnitPermille: 4, maxPercent: 30 },
  },
  'heavy-assault': {
    shipClass: 'heavy-assault', role: 'capital',
    baseCost: { metal: 8_800, crystal: 7_600, gas: 2_900 }, baseSeconds: 1_280,
    populationCost: 12, hangarCost: 12, shipyardLevel: 9,
    research: [{ slug: 'jet-engines', level: 6 }, { slug: 'hyperspace', level: 5 }, { slug: 'plasma-science', level: 3 }],
    stats: { speed: 6, cargo: 320, attack: 330, armor: 520, shield: 190 },
    ability: { id: 'combat-recovery', valuePerUnitPermille: 8, maxPercent: 35 },
  },
  bomber: {
    shipClass: 'bomber', role: 'bomber',
    baseCost: { metal: 5_200, crystal: 6_200, gas: 2_400 }, baseSeconds: 900,
    populationCost: 9, hangarCost: 9, shipyardLevel: 8,
    research: [{ slug: 'laser-science', level: 5 }, { slug: 'plasma-science', level: 3 }],
    stats: { speed: 7, cargo: 90, attack: 245, armor: 250, shield: 75 },
    ability: { id: 'artillery', valuePerUnitPermille: 10, maxPercent: 50 },
  },
  'planet-destroyer': {
    shipClass: 'planet-destroyer', role: 'capital',
    baseCost: { metal: 34_000, crystal: 28_000, gas: 12_000 }, baseSeconds: 7_200,
    populationCost: 40, hangarCost: 40, shipyardLevel: 12,
    research: [{ slug: 'hyperspace', level: 8 }, { slug: 'parallel-universes', level: 1 }, { slug: 'heavy-armor', level: 1 }],
    stats: { speed: 2, cargo: 5_000, attack: 900, armor: 1_500, shield: 520 },
    ability: { id: 'planet-breaker', valuePerUnitPermille: 30, maxPercent: 30 },
  },
  colonizer: {
    shipClass: 'colonizer', role: 'colonizer',
    baseCost: { metal: 4_800, crystal: 7_200, gas: 3_200 }, baseSeconds: 1_100,
    populationCost: 8, hangarCost: 8, shipyardLevel: 4,
    research: [{ slug: 'fuel-cells', level: 3 }, { slug: 'parallel-universes', level: 1 }],
    stats: { speed: 5, cargo: 700, attack: 0, armor: 220, shield: 85 },
    ability: { id: 'colony-core', valuePerUnitPermille: 0, maxPercent: 0 },
  },
  recycler: {
    shipClass: 'recycler', role: 'recycler',
    baseCost: { metal: 1_300, crystal: 760, gas: 460 }, baseSeconds: 420,
    populationCost: 3, hangarCost: 3, shipyardLevel: 4,
    research: [{ slug: 'fuel-cells', level: 4 }, { slug: 'ship-armor', level: 2 }],
    stats: { speed: 7, cargo: 1_200, attack: 0, armor: 76, shield: 24 },
    ability: { id: 'salvage-array', valuePerUnitPermille: 0, maxPercent: 0 },
  },
  'spy-probe': {
    shipClass: 'spy-probe', role: 'scout',
    baseCost: { metal: 0, crystal: 420, gas: 40 }, baseSeconds: 70,
    populationCost: 0, hangarCost: 1, shipyardLevel: 3,
    research: [{ slug: 'espionage', level: 2 }, { slug: 'computer-systems', level: 1 }],
    stats: { speed: 30, cargo: 1, attack: 0, armor: 1, shield: 0 },
    ability: { id: 'deep-scan', valuePerUnitPermille: 10, maxPercent: 50 },
  },
  'energy-satellite': {
    shipClass: 'energy-satellite', role: 'satellite',
    baseCost: { metal: 180, crystal: 650, gas: 160 }, baseSeconds: 100,
    populationCost: 0, hangarCost: 1, shipyardLevel: 1,
    research: [{ slug: 'physics', level: 1 }],
    stats: { speed: 0, cargo: 0, attack: 0, armor: 32, shield: 54 },
    ability: { id: 'solar-array', valuePerUnitPermille: 0, maxPercent: 0 },
    stationary: true,
  },
};

const IDENTITIES: Readonly<Record<FactionId, Readonly<Record<CompleteShipClass, ShipIdentity>>>> = {
  aegis: {
    'small-transport': { slug: 'transporter', name: 'Транспорт «Тракт»', description: 'Надёжный малый транспорт для быстрых поставок между колониями.', abilityName: 'Грузовая сеть', abilityDescription: 'Оптимизирован для перевозки ресурсов и развёртывания снабжения.' },
    'large-transport': { slug: 'mega-transporter', name: 'Мегатранспорт «Артерия»', description: 'Тяжёлая грузовая платформа для стратегической логистики.', abilityName: 'Грузовая сеть', abilityDescription: 'Перевозит крупные партии ресурсов с повышенной эффективностью.' },
    'light-fighter': { slug: 'scout', name: 'Скаут «Вектор»', description: 'Лёгкий боевой разведчик для перехвата и охраны строя.', abilityName: 'Пробитие брони', abilityDescription: 'Малые группы накапливают шанс пробить защитный профиль цели.' },
    interceptor: { slug: 'cruiser', name: 'Крейсер «Копьё»', description: 'Манёвренный перехватчик для уничтожения лёгких кораблей.', abilityName: 'Сокрушение', abilityDescription: 'Концентрирует залп и повышает собственный атакующий потенциал.' },
    'support-ship': { slug: 'defender', name: 'Защитник «Эгида»', description: 'Корабль поддержки, укрепляющий живучесть соединения.', abilityName: 'Резерв живучести', abilityDescription: 'Усиливает защиту дружественного флота.' },
    'line-battleship': { slug: 'battleship', name: 'Линкор «Бастион»', description: 'Основной линейный корабль с тяжёлой бронёй и устойчивым огнём.', abilityName: 'Связка брони', abilityDescription: 'Повышает устойчивость кораблей в линейном бою.' },
    'heavy-assault': { slug: 'destroyer', name: 'Разрушитель «Цитадель»', description: 'Тяжёлый ударный корабль для прорыва укреплённых флотов.', abilityName: 'Боевая рекуперация', abilityDescription: 'Резервные системы снижают необратимые потери тяжёлой группы.' },
    bomber: { slug: 'bomber', name: 'Бомбардировщик «Молот»', description: 'Специализированный ударный корабль против планетарной обороны.', abilityName: 'Артиллерия', abilityDescription: 'Получает усиление при атаке стационарных целей.' },
    'planet-destroyer': { slug: 'death-star', name: 'Планетолом «Немезида»', description: 'Сверхтяжёлая осадная платформа поздней стадии развития.', abilityName: 'Разрушитель мира', abilityDescription: 'Подготовлен к будущим операциям повреждения инфраструктуры и планет.' },
    colonizer: { slug: 'colonizer', name: 'Колонизатор «Форпост»', description: 'Разворачивает базовую инфраструктуру новой колонии.', abilityName: 'Колониальное ядро', abilityDescription: 'Расходуется при успешном основании новой колонии.' },
    recycler: { slug: 'recycler', name: 'Переработчик «Сборщик»', description: 'Извлекает металл и минералы из полей обломков.', abilityName: 'Сборочный массив', abilityDescription: 'Открывает миссии переработки обломков.' },
    'spy-probe': { slug: 'spy-probe', name: 'Зонд «Призма»', description: 'Сверхбыстрый аппарат скрытой разведки.', abilityName: 'Глубокое сканирование', abilityDescription: 'Открывает разведывательные миссии и повышает качество наблюдения.' },
    'energy-satellite': { slug: 'solar-satellite', name: 'Спутник «Гелиос»', description: 'Стационарный орбитальный модуль энергетической поддержки.', abilityName: 'Солнечный массив', abilityDescription: 'Зарезервирован для интеграции солнечной энергетики планеты.' },
  },
  synod: {
    'small-transport': { slug: 'cargo-bot', name: 'Грузовой бот «Нить»', description: 'Сетевой транспорт для точной доставки ресурсов.', abilityName: 'Грузовая сеть', abilityDescription: 'Согласует маршруты снабжения с остальной логистической сетью.' },
    'large-transport': { slug: 'large-cargo-bot', name: 'Большой грузовой бот «Контур»', description: 'Тяжёлая автоматическая платформа стратегического снабжения.', abilityName: 'Грузовая сеть', abilityDescription: 'Перевозит крупные партии ресурсов по согласованным маршрутам.' },
    'light-fighter': { slug: 'fighter', name: 'Истребитель «Ланцет»', description: 'Лёгкий точный корабль сетевого перехвата.', abilityName: 'Пробитие брони', abilityDescription: 'Объединённая телеметрия помогает находить слабые зоны брони.' },
    interceptor: { slug: 'interceptor', name: 'Перехватчик «Фаза»', description: 'Быстрый корабль для подавления лёгких соединений.', abilityName: 'Сокрушение', abilityDescription: 'Согласованный залп усиливает атакующий потенциал группы.' },
    'support-ship': { slug: 'shield-bot', name: 'Щитовой бот «Оберег»', description: 'Поддерживает единый защитный экран соединения.', abilityName: 'Резерв живучести', abilityDescription: 'Добавляет флоту связанный щитовой резерв.' },
    'line-battleship': { slug: 'star-armada', name: 'Линкор «Армада»', description: 'Линейный корабль с тяжёлой сетевой защитой.', abilityName: 'Связка брони', abilityDescription: 'Координирует защитные контуры дружественных кораблей.' },
    'heavy-assault': { slug: 'goliath', name: 'Голиаф «Резонанс»', description: 'Тяжёлый ударный корабль синхронного наступления.', abilityName: 'Перегрузка', abilityDescription: 'Усиливает общий атакующий темп флота.' },
    bomber: { slug: 'bomberbot', name: 'Бомбербот «Дуга»', description: 'Автоматическая платформа подавления оборонных узлов.', abilityName: 'Артиллерия', abilityDescription: 'Получает усиление при атаке стационарных целей.' },
    'planet-destroyer': { slug: 'titan', name: 'Титан «Оракул»', description: 'Сверхтяжёлый координационный осадный корабль.', abilityName: 'Разрушитель мира', abilityDescription: 'Подготовлен к будущим операциям повреждения инфраструктуры и планет.' },
    colonizer: { slug: 'colonizer-bot', name: 'Бот-колонизатор «Семя»', description: 'Разворачивает согласованную инфраструктуру новой колонии.', abilityName: 'Колониальное ядро', abilityDescription: 'Расходуется при успешном основании новой колонии.' },
    recycler: { slug: 'recycler', name: 'Рекламатор «Память»', description: 'Точно извлекает материалы из полей обломков.', abilityName: 'Сборочный массив', abilityDescription: 'Открывает миссии переработки обломков.' },
    'spy-probe': { slug: 'spy-bot', name: 'Шпионский бот «Шёпот»', description: 'Миниатюрный аппарат сетевой разведки.', abilityName: 'Глубокое сканирование', abilityDescription: 'Открывает разведывательные миссии и повышает качество наблюдения.' },
    'energy-satellite': { slug: 'solar-satellite', name: 'Спутник «Резонатор»', description: 'Стационарный энергетический узел орбитальной сети.', abilityName: 'Солнечный массив', abilityDescription: 'Зарезервирован для интеграции солнечной энергетики планеты.' },
  },
  veyra: {
    'small-transport': { slug: 'transporter', name: 'Транспорт «Усик»', description: 'Живой малый транспорт с растяжимыми грузовыми полостями.', abilityName: 'Грузовая сеть', abilityDescription: 'Перераспределяет биологические грузовые камеры под текущую нагрузку.' },
    'large-transport': { slug: 'mega-transporter', name: 'Мегатранспорт «Кокон»', description: 'Крупный организм стратегического снабжения.', abilityName: 'Грузовая сеть', abilityDescription: 'Перевозит крупные партии ресурсов в адаптивных полостях.' },
    'light-fighter': { slug: 'nox-dart', name: 'Нокс Дарт «Жало»', description: 'Лёгкий хищный организм для быстрой охоты.', abilityName: 'Пробитие брони', abilityDescription: 'Рой находит слабые участки защитного панциря цели.' },
    interceptor: { slug: 'nemesis', name: 'Немезис «Стрекоза»', description: 'Манёвренный перехватчик с мгновенной реакцией стаи.', abilityName: 'Сокрушение', abilityDescription: 'Синхронный бросок усиливает атакующий потенциал группы.' },
    'support-ship': { slug: 'absorber', name: 'Абсорбатор «Завеса»', description: 'Поглощает часть входящего урона соседних организмов.', abilityName: 'Резерв живучести', abilityDescription: 'Усиливает защиту дружественной стаи.' },
    'line-battleship': { slug: 'ghost', name: 'Призрак «Манта»', description: 'Линейный организм с регенеративным панцирем.', abilityName: 'Связка брони', abilityDescription: 'Передаёт регенеративные импульсы ближайшим кораблям.' },
    'heavy-assault': { slug: 'hornet', name: 'Шмель «Левиафан»', description: 'Тяжёлый хищник для разрыва боевого строя.', abilityName: 'Замораживающий импульс', abilityDescription: 'Нейронный разряд снижает эффективность вражеского ответа.' },
    bomber: { slug: 'bomber', name: 'Бомбардировщик «Спора»', description: 'Осадный организм против планетарной обороны.', abilityName: 'Артиллерия', abilityDescription: 'Получает усиление при атаке стационарных целей.' },
    'planet-destroyer': { slug: 'nox-queen', name: 'Нокс Царица «Матка»', description: 'Сверхтяжёлая осадная форма позднего развития.', abilityName: 'Разрушитель мира', abilityDescription: 'Подготовлена к будущим операциям повреждения инфраструктуры и планет.' },
    colonizer: { slug: 'settler', name: 'Поселенец «Выводок»', description: 'Высаживает зародыши саморастущей колонии.', abilityName: 'Колониальное ядро', abilityDescription: 'Расходуется при успешном основании новой колонии.' },
    recycler: { slug: 'recycler-drone', name: 'Трутень «Поглотитель»', description: 'Перерабатывает обломки в пригодную для роя материю.', abilityName: 'Сборочный массив', abilityDescription: 'Открывает миссии переработки обломков.' },
    'spy-probe': { slug: 'nox-mind', name: 'Нокс Разум «Огонёк»', description: 'Миниатюрная разведывательная форма общего разума.', abilityName: 'Глубокое сканирование', abilityDescription: 'Открывает разведывательные миссии и повышает качество наблюдения.' },
    'energy-satellite': { slug: 'organic-satellite', name: 'Органический спутник «Мембрана»', description: 'Стационарный орбитальный организм энергетической поддержки.', abilityName: 'Солнечный массив', abilityDescription: 'Зарезервирован для интеграции солнечной энергетики планеты.' },
  },
};

const TUNING: Readonly<Record<FactionId, FactionShipTuning>> = {
  aegis: { costPermille: 1_000, speedPermille: 1_000, cargoPermille: 1_000, attackPermille: 1_000, armorPermille: 1_100, shieldPermille: 1_000 },
  synod: { costPermille: 1_050, speedPermille: 950, cargoPermille: 1_100, attackPermille: 1_050, armorPermille: 900, shieldPermille: 1_300 },
  veyra: { costPermille: 900, speedPermille: 1_150, cargoPermille: 1_200, attackPermille: 950, armorPermille: 800, shieldPermille: 950 },
};

function scale(value: number, permille: number): number {
  if (value === 0) return 0;
  return Math.max(1, Math.floor((value * permille) / 1_000));
}

export function getCompleteShipId(factionId: FactionId, shipClass: CompleteShipClass): string {
  return `ship.${factionId}.${IDENTITIES[factionId][shipClass].slug}`;
}

export function getCompleteShipIds(factionId: FactionId): CompleteShipIds {
  return {
    smallTransport: getCompleteShipId(factionId, 'small-transport'),
    largeTransport: getCompleteShipId(factionId, 'large-transport'),
    lightFighter: getCompleteShipId(factionId, 'light-fighter'),
    interceptor: getCompleteShipId(factionId, 'interceptor'),
    supportShip: getCompleteShipId(factionId, 'support-ship'),
    lineBattleship: getCompleteShipId(factionId, 'line-battleship'),
    heavyAssault: getCompleteShipId(factionId, 'heavy-assault'),
    bomber: getCompleteShipId(factionId, 'bomber'),
    planetDestroyer: getCompleteShipId(factionId, 'planet-destroyer'),
    colonizer: getCompleteShipId(factionId, 'colonizer'),
    recycler: getCompleteShipId(factionId, 'recycler'),
    spyProbe: getCompleteShipId(factionId, 'spy-probe'),
    energySatellite: getCompleteShipId(factionId, 'energy-satellite'),
  };
}

function createCatalog(factionId: FactionId): readonly UnitDefinition[] {
  const buildings = getCompleteBuildingIds(factionId);
  const tuning = TUNING[factionId];
  return SHIP_CLASSES.map((shipClass) => {
    const template = TEMPLATES[shipClass];
    const identity = IDENTITIES[factionId][shipClass];
    const heavyAbilityId = factionId === 'synod'
      ? 'overdrive'
      : factionId === 'veyra'
        ? 'freezing-strike'
        : 'combat-recovery';
    const abilityId = shipClass === 'heavy-assault' ? heavyAbilityId : template.ability.id;
    return {
      id: getCompleteShipId(factionId, shipClass),
      name: identity.name,
      factionId,
      kind: 'ship',
      role: template.role,
      shipClass,
      ability: {
        ...template.ability,
        id: abilityId,
        name: identity.abilityName,
        description: identity.abilityDescription,
      },
      stationary: template.stationary,
      description: identity.description,
      assetId: getCompleteShipId(factionId, shipClass),
      baseCost: {
        metal: scale(template.baseCost.metal, tuning.costPermille),
        crystal: scale(template.baseCost.crystal, tuning.costPermille),
        gas: scale(template.baseCost.gas, tuning.costPermille),
      },
      baseSeconds: scale(template.baseSeconds, tuning.costPermille),
      populationCost: template.populationCost,
      hangarCost: template.hangarCost,
      defenseGridCost: 0,
      buildingRequirements: [{ buildingId: buildings.shipyard, level: template.shipyardLevel }],
      researchRequirements: template.research.map((requirement) => ({
        technologyId: getCompleteResearchId(factionId, requirement.slug),
        level: requirement.level,
      })),
      stats: {
        speed: scale(template.stats.speed, tuning.speedPermille),
        cargo: scale(template.stats.cargo, tuning.cargoPermille),
        attack: scale(template.stats.attack, tuning.attackPermille),
        armor: scale(template.stats.armor, tuning.armorPermille),
        shield: scale(template.stats.shield, tuning.shieldPermille),
      },
    } satisfies UnitDefinition;
  });
}

export const COMPLETE_SHIP_CATALOGS: Readonly<Record<FactionId, readonly UnitDefinition[]>> = {
  aegis: createCatalog('aegis'),
  synod: createCatalog('synod'),
  veyra: createCatalog('veyra'),
};

const SHIP_CLASS_BY_ID = new Map<string, CompleteShipClass>(
  Object.values(COMPLETE_SHIP_CATALOGS)
    .flat()
    .map((definition) => [definition.id, definition.shipClass!] as const),
);

export function getCompleteShipClass(unitId: string): CompleteShipClass | undefined {
  return SHIP_CLASS_BY_ID.get(unitId);
}
