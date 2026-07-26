import type { ResourceCost } from '../economy/types';
import type { FactionId } from '../planet/types';
import { getCompleteBuildingIds } from '../planet/completeBuildingCatalog';
import { getCompleteResearchId } from '../research/completeResearchCatalog';
import type {
  CompleteDefenseClass,
  DefenseAbilityDefinition,
  DefenseRole,
  UnitDefinition,
  UnitStats,
} from './types';

interface DefenseTemplate {
  readonly defenseClass: CompleteDefenseClass;
  readonly role: DefenseRole;
  readonly baseCost: ResourceCost;
  readonly baseSeconds: number;
  readonly populationCost: number;
  readonly defenseGridCost: number;
  readonly factoryLevel: number;
  readonly research: readonly { readonly slug: string; readonly level: number }[];
  readonly stats: UnitStats;
  readonly ability: Omit<DefenseAbilityDefinition, 'name' | 'description'>;
}

interface DefenseIdentity {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly abilityName: string;
  readonly abilityDescription: string;
}

interface FactionDefenseTuning {
  readonly costPermille: number;
  readonly attackPermille: number;
  readonly armorPermille: number;
  readonly shieldPermille: number;
  readonly recoveryPermille: number;
}

export interface CompleteDefenseIds {
  readonly basicTurret: string;
  readonly laserTurret: string;
  readonly ionTurret: string;
  readonly plasmaTurret: string;
  readonly secondaryShield: string;
  readonly planetaryShield: string;
  readonly laserIonBattery: string;
  readonly plasmaLaserBattery: string;
  readonly ionPlasmaBattery: string;
}

const DEFENSE_CLASSES: readonly CompleteDefenseClass[] = [
  'basic-turret',
  'laser-turret',
  'ion-turret',
  'plasma-turret',
  'secondary-shield',
  'planetary-shield',
  'laser-ion-battery',
  'plasma-laser-battery',
  'ion-plasma-battery',
];

const TEMPLATES: Readonly<Record<CompleteDefenseClass, DefenseTemplate>> = {
  'basic-turret': {
    defenseClass: 'basic-turret', role: 'kinetic',
    baseCost: { metal: 360, crystal: 140, gas: 40 }, baseSeconds: 110,
    populationCost: 1, defenseGridCost: 1, factoryLevel: 1,
    research: [{ slug: 'laser-science', level: 1 }],
    stats: { speed: 0, cargo: 0, attack: 34, armor: 48, shield: 0 },
    ability: {
      id: 'interceptor-grid', valuePerUnitPermille: 3, maxPercent: 20,
      recoveryBonusPermille: 0, repairCostPermille: 1_000, repairTimePermille: 1_000,
    },
  },
  'laser-turret': {
    defenseClass: 'laser-turret', role: 'laser',
    baseCost: { metal: 520, crystal: 360, gas: 90 }, baseSeconds: 160,
    populationCost: 1, defenseGridCost: 1, factoryLevel: 2,
    research: [{ slug: 'laser-science', level: 2 }],
    stats: { speed: 0, cargo: 0, attack: 58, armor: 52, shield: 8 },
    ability: {
      id: 'laser-focus', valuePerUnitPermille: 4, maxPercent: 25,
      recoveryBonusPermille: 0, repairCostPermille: 1_000, repairTimePermille: 1_000,
    },
  },
  'ion-turret': {
    defenseClass: 'ion-turret', role: 'ion',
    baseCost: { metal: 760, crystal: 620, gas: 180 }, baseSeconds: 230,
    populationCost: 1, defenseGridCost: 2, factoryLevel: 3,
    research: [{ slug: 'ion-science', level: 2 }],
    stats: { speed: 0, cargo: 0, attack: 92, armor: 68, shield: 18 },
    ability: {
      id: 'ion-suppression', valuePerUnitPermille: 5, maxPercent: 30,
      recoveryBonusPermille: 0, repairCostPermille: 1_000, repairTimePermille: 1_000,
    },
  },
  'plasma-turret': {
    defenseClass: 'plasma-turret', role: 'plasma',
    baseCost: { metal: 1_150, crystal: 980, gas: 420 }, baseSeconds: 340,
    populationCost: 2, defenseGridCost: 3, factoryLevel: 4,
    research: [{ slug: 'plasma-science', level: 2 }],
    stats: { speed: 0, cargo: 0, attack: 148, armor: 92, shield: 24 },
    ability: {
      id: 'plasma-overload', valuePerUnitPermille: 6, maxPercent: 35,
      recoveryBonusPermille: 0, repairCostPermille: 1_000, repairTimePermille: 1_000,
    },
  },
  'secondary-shield': {
    defenseClass: 'secondary-shield', role: 'shield',
    baseCost: { metal: 920, crystal: 1_350, gas: 520 }, baseSeconds: 390,
    populationCost: 2, defenseGridCost: 3, factoryLevel: 4,
    research: [{ slug: 'ship-armor', level: 3 }, { slug: 'light-armor', level: 1 }],
    stats: { speed: 0, cargo: 0, attack: 0, armor: 64, shield: 210 },
    ability: {
      id: 'secondary-barrier', valuePerUnitPermille: 4, maxPercent: 24,
      recoveryBonusPermille: 50, repairCostPermille: 900, repairTimePermille: 900,
    },
  },
  'planetary-shield': {
    defenseClass: 'planetary-shield', role: 'shield',
    baseCost: { metal: 3_200, crystal: 5_600, gas: 2_200 }, baseSeconds: 1_100,
    populationCost: 5, defenseGridCost: 7, factoryLevel: 8,
    research: [{ slug: 'ship-armor', level: 5 }, { slug: 'heavy-armor', level: 1 }],
    stats: { speed: 0, cargo: 0, attack: 0, armor: 180, shield: 620 },
    ability: {
      id: 'planetary-barrier', valuePerUnitPermille: 8, maxPercent: 40,
      recoveryBonusPermille: 120, repairCostPermille: 850, repairTimePermille: 850,
    },
  },
  'laser-ion-battery': {
    defenseClass: 'laser-ion-battery', role: 'hybrid',
    baseCost: { metal: 1_900, crystal: 2_200, gas: 780 }, baseSeconds: 620,
    populationCost: 3, defenseGridCost: 5, factoryLevel: 6,
    research: [{ slug: 'laser-science', level: 3 }, { slug: 'ion-science', level: 3 }],
    stats: { speed: 0, cargo: 0, attack: 218, armor: 150, shield: 54 },
    ability: {
      id: 'laser-ion-link', valuePerUnitPermille: 7, maxPercent: 38,
      recoveryBonusPermille: 20, repairCostPermille: 980, repairTimePermille: 980,
    },
  },
  'plasma-laser-battery': {
    defenseClass: 'plasma-laser-battery', role: 'hybrid',
    baseCost: { metal: 3_100, crystal: 3_600, gas: 1_500 }, baseSeconds: 900,
    populationCost: 5, defenseGridCost: 7, factoryLevel: 8,
    research: [{ slug: 'plasma-science', level: 3 }, { slug: 'laser-science', level: 4 }],
    stats: { speed: 0, cargo: 0, attack: 315, armor: 220, shield: 82 },
    ability: {
      id: 'plasma-laser-link', valuePerUnitPermille: 8, maxPercent: 44,
      recoveryBonusPermille: 25, repairCostPermille: 970, repairTimePermille: 970,
    },
  },
  'ion-plasma-battery': {
    defenseClass: 'ion-plasma-battery', role: 'hybrid',
    baseCost: { metal: 4_800, crystal: 5_200, gas: 2_400 }, baseSeconds: 1_300,
    populationCost: 7, defenseGridCost: 9, factoryLevel: 10,
    research: [{ slug: 'ion-science', level: 4 }, { slug: 'plasma-science', level: 4 }],
    stats: { speed: 0, cargo: 0, attack: 410, armor: 320, shield: 120 },
    ability: {
      id: 'ion-plasma-link', valuePerUnitPermille: 9, maxPercent: 50,
      recoveryBonusPermille: 30, repairCostPermille: 960, repairTimePermille: 960,
    },
  },
};

const IDENTITIES: Readonly<Record<FactionId, Readonly<Record<CompleteDefenseClass, DefenseIdentity>>>> = {
  aegis: {
    'basic-turret': { slug: 'ballistic-turret', name: 'Баллистическая турель «Рубеж»', description: 'Надёжная базовая установка для отсечения лёгких атакующих групп.', abilityName: 'Сетка перехвата', abilityDescription: 'Концентрирует огонь по малым целям и усиливает собственный залп.' },
    'laser-turret': { slug: 'laser-turret', name: 'Лазерная турель «Гелиос»', description: 'Точная лучевая установка для устойчивого огня по манёвренным целям.', abilityName: 'Лазерный фокус', abilityDescription: 'Синхронизирует излучатели и повышает точность батареи.' },
    'ion-turret': { slug: 'ion-turret', name: 'Ионная турель «Разряд»', description: 'Ионный узел подавляет защищённые корабли и их силовые контуры.', abilityName: 'Ионное подавление', abilityDescription: 'Усиливает разряд против крупных и экранированных целей.' },
    'plasma-turret': { slug: 'plasma-turret', name: 'Плазменная турель «Факел»', description: 'Тяжёлая плазменная установка для разрушения бронированных корпусов.', abilityName: 'Плазменная перегрузка', abilityDescription: 'Повышает мощность собственного залпа ценой сложного обслуживания.' },
    'secondary-shield': { slug: 'tower-shield', name: 'Башенный щит «Эгида»', description: 'Локальный щитовой узел прикрывает оборонительные позиции.', abilityName: 'Вторичный барьер', abilityDescription: 'Повышает живучесть всех дружественных установок и кораблей на орбите.' },
    'planetary-shield': { slug: 'planetary-shield', name: 'Планетарный щит «Цитадель»', description: 'Тяжёлый генератор формирует стратегический защитный купол.', abilityName: 'Планетарный барьер', abilityDescription: 'Даёт максимальный общий бонус защиты и повышает шанс восстановления.' },
    'laser-ion-battery': { slug: 'laser-ion-battery', name: 'Лазерно-ионная батарея «Вектор»', description: 'Связанный комплекс точного и подавляющего огня.', abilityName: 'Лазерно-ионная связка', abilityDescription: 'Сочетает точность лучевого оружия с ионным подавлением.' },
    'plasma-laser-battery': { slug: 'plasma-laser-battery', name: 'Плазменно-лазерная батарея «Молот»', description: 'Тяжёлый комплекс для последовательного прожига защиты и корпуса.', abilityName: 'Плазменно-лазерная связка', abilityDescription: 'Усиливает собственную атаку и защиту соседних установок.' },
    'ion-plasma-battery': { slug: 'ion-plasma-battery', name: 'Ионно-плазменная батарея «Гром»', description: 'Предельный оборонительный комплекс против тяжёлых флотов.', abilityName: 'Ионно-плазменная связка', abilityDescription: 'Максимально усиливает тяжёлый залп и устойчивость оборонной сети.' },
  },
  synod: {
    'basic-turret': { slug: 'defense-matrix', name: 'Матрица обороны', description: 'Базовый узел Конкорда распределяет цели между огневыми каналами.', abilityName: 'Предиктивная сетка', abilityDescription: 'Коллективная логика ускоряет перехват малых кораблей.' },
    'laser-turret': { slug: 'laser-matrix', name: 'Лазерная матрица', description: 'Когерентная решётка ведёт точный непрерывный огонь.', abilityName: 'Когерентный фокус', abilityDescription: 'Согласует излучатели в один стабильный канал поражения.' },
    'ion-turret': { slug: 'ion-matrix', name: 'Ионная матрица', description: 'Резонансный узел нарушает работу щитов и систем управления.', abilityName: 'Резонансное подавление', abilityDescription: 'Повышает эффективность против крупных и защищённых целей.' },
    'plasma-turret': { slug: 'plasma-matrix', name: 'Плазменная матрица', description: 'Высокоэнергетическая решётка разрушает тяжёлую броню.', abilityName: 'Каскад плазмы', abilityDescription: 'Наращивает мощность залпа при совместной работе узлов.' },
    'secondary-shield': { slug: 'matrix-shield', name: 'Матричный щит', description: 'Распределённый экран связывает защитные позиции в общую сеть.', abilityName: 'Когерентный барьер', abilityDescription: 'Усиливает общую защиту и снижает стоимость восстановления.' },
    'planetary-shield': { slug: 'planetary-matrix', name: 'Планетарная матрица', description: 'Глобальная решётка формирует многослойную защиту планеты.', abilityName: 'Планетарный консенсус', abilityDescription: 'Максимально усиливает защиту и восстановление оборонной сети.' },
    'laser-ion-battery': { slug: 'laser-ion-matrix', name: 'Лазерно-ионная матрица', description: 'Согласованный комплекс точного и подавляющего огня.', abilityName: 'Двойная когерентность', abilityDescription: 'Связывает лазерные и ионные каналы в единый расчёт.' },
    'plasma-laser-battery': { slug: 'plasma-laser-matrix', name: 'Плазменно-лазерная матрица', description: 'Тяжёлая решётка поэтапно вскрывает щиты и броню.', abilityName: 'Каскад прожига', abilityDescription: 'Усиливает атаку узла и устойчивость соседних матриц.' },
    'ion-plasma-battery': { slug: 'ion-plasma-matrix', name: 'Ионно-плазменная матрица', description: 'Высший оборонный контур Конкорда против капитальных флотов.', abilityName: 'Резонансный каскад', abilityDescription: 'Объединяет подавление и разрушительный тяжёлый залп.' },
  },
  veyra: {
    'basic-turret': { slug: 'nox-archer', name: 'Стрелок Нокса', description: 'Живой метатель шипов перехватывает лёгкие цели.', abilityName: 'Охотничья сетка', abilityDescription: 'Колония координирует залпы по быстрым целям.' },
    'laser-turret': { slug: 'laser-matter', name: 'Лазерная материя', description: 'Биолюминесцентный орган фокусирует разрушительный луч.', abilityName: 'Живой фокус', abilityDescription: 'Ростовые линзы повышают точность и мощность излучения.' },
    'ion-turret': { slug: 'ion-weave', name: 'Ионное плетение', description: 'Нервная сеть испускает импульсы, нарушающие работу щитов.', abilityName: 'Нервное подавление', abilityDescription: 'Синхронный разряд ослабляет крупные цели.' },
    'plasma-turret': { slug: 'plasma-weave', name: 'Плазменное плетение', description: 'Живой реактор выбрасывает сгустки перегретой материи.', abilityName: 'Кровавый перегрев', abilityDescription: 'Организм наращивает мощность плазменного залпа.' },
    'secondary-shield': { slug: 'chitin-shield', name: 'Хитиновый щит', description: 'Регенерирующий панцирь прикрывает оборонные узлы.', abilityName: 'Живой барьер', abilityDescription: 'Усиливает общую защиту и ускоряет восстановление тканей.' },
    'planetary-shield': { slug: 'surface-shield', name: 'Поверхностный щит', description: 'Планетарная мембрана формирует сплошной защитный слой.', abilityName: 'Мембрана улья', abilityDescription: 'Даёт максимальную защиту и повышенный шанс регенерации.' },
    'laser-ion-battery': { slug: 'laser-ion-turret', name: 'Лазерно-ионная турель', description: 'Гибридный орган сочетает лучевой прожиг и нервный импульс.', abilityName: 'Двойное жало', abilityDescription: 'Совмещает точность лазера и ионное подавление.' },
    'plasma-laser-battery': { slug: 'plasma-laser-turret', name: 'Плазменно-лазерная турель', description: 'Тяжёлый симбионт вскрывает защиту последовательным ударом.', abilityName: 'Огненный симбиоз', abilityDescription: 'Усиливает тяжёлый залп и панцирь соседних узлов.' },
    'ion-plasma-battery': { slug: 'ion-plasma-turret', name: 'Ионно-плазменная турель', description: 'Высшая форма планетарного хищника против капитальных кораблей.', abilityName: 'Шторм улья', abilityDescription: 'Сочетает подавляющий импульс и разрушительную плазму.' },
  },
};

const FACTION_TUNING: Readonly<Record<FactionId, FactionDefenseTuning>> = {
  aegis: { costPermille: 1_050, attackPermille: 1_030, armorPermille: 1_150, shieldPermille: 1_050, recoveryPermille: 1_000 },
  synod: { costPermille: 1_000, attackPermille: 980, armorPermille: 950, shieldPermille: 1_250, recoveryPermille: 1_050 },
  veyra: { costPermille: 950, attackPermille: 1_080, armorPermille: 1_000, shieldPermille: 1_000, recoveryPermille: 1_250 },
};

function scale(value: number, permille: number): number {
  if (value <= 0) return 0;
  return Math.max(1, Math.ceil((value * permille) / 1_000));
}

function keyForClass(defenseClass: CompleteDefenseClass): keyof CompleteDefenseIds {
  switch (defenseClass) {
    case 'basic-turret': return 'basicTurret';
    case 'laser-turret': return 'laserTurret';
    case 'ion-turret': return 'ionTurret';
    case 'plasma-turret': return 'plasmaTurret';
    case 'secondary-shield': return 'secondaryShield';
    case 'planetary-shield': return 'planetaryShield';
    case 'laser-ion-battery': return 'laserIonBattery';
    case 'plasma-laser-battery': return 'plasmaLaserBattery';
    case 'ion-plasma-battery': return 'ionPlasmaBattery';
  }
}

export function getCompleteDefenseId(
  factionId: FactionId,
  defenseClass: CompleteDefenseClass,
): string {
  return `defense.${factionId}.${IDENTITIES[factionId][defenseClass].slug}`;
}

export function getCompleteDefenseIds(factionId: FactionId): CompleteDefenseIds {
  return Object.fromEntries(
    DEFENSE_CLASSES.map((defenseClass) => [
      keyForClass(defenseClass),
      getCompleteDefenseId(factionId, defenseClass),
    ]),
  ) as unknown as CompleteDefenseIds;
}

function createCatalog(factionId: FactionId): readonly UnitDefinition[] {
  const buildings = getCompleteBuildingIds(factionId);
  const tuning = FACTION_TUNING[factionId];
  return DEFENSE_CLASSES.map((defenseClass) => {
    const template = TEMPLATES[defenseClass];
    const identity = IDENTITIES[factionId][defenseClass];
    const id = getCompleteDefenseId(factionId, defenseClass);
    return {
      id,
      name: identity.name,
      factionId,
      kind: 'defense',
      role: template.role,
      defenseClass,
      defenseAbility: {
        ...template.ability,
        name: identity.abilityName,
        description: identity.abilityDescription,
        recoveryBonusPermille: scale(
          template.ability.recoveryBonusPermille,
          tuning.recoveryPermille,
        ),
      },
      stationary: true,
      description: identity.description,
      assetId: id,
      baseCost: {
        metal: scale(template.baseCost.metal, tuning.costPermille),
        crystal: scale(template.baseCost.crystal, tuning.costPermille),
        gas: scale(template.baseCost.gas, tuning.costPermille),
      },
      baseSeconds: scale(template.baseSeconds, tuning.costPermille),
      populationCost: template.populationCost,
      hangarCost: 0,
      defenseGridCost: template.defenseGridCost,
      buildingRequirements: [
        { buildingId: buildings.advancedFactory, level: template.factoryLevel },
      ],
      researchRequirements: template.research.map((requirement) => ({
        technologyId: getCompleteResearchId(factionId, requirement.slug),
        level: requirement.level,
      })),
      stats: {
        speed: 0,
        cargo: 0,
        attack: scale(template.stats.attack, tuning.attackPermille),
        armor: scale(template.stats.armor, tuning.armorPermille),
        shield: scale(template.stats.shield, tuning.shieldPermille),
      },
    } satisfies UnitDefinition;
  });
}

export const COMPLETE_DEFENSE_CATALOGS: Readonly<Record<FactionId, readonly UnitDefinition[]>> = {
  aegis: createCatalog('aegis'),
  synod: createCatalog('synod'),
  veyra: createCatalog('veyra'),
};

const DEFENSE_CLASS_BY_ID = new Map<string, CompleteDefenseClass>(
  Object.values(COMPLETE_DEFENSE_CATALOGS)
    .flat()
    .map((definition) => [definition.id, definition.defenseClass!] as const),
);

export function getCompleteDefenseClass(unitId: string): CompleteDefenseClass | undefined {
  return DEFENSE_CLASS_BY_ID.get(unitId);
}
