import type { FactionId } from '../planet/types';
import type {
  ResearchCategory,
  ResearchDefinition,
  ResearchEffect,
} from './types';

interface TechnologyTemplate {
  readonly slug: string;
  readonly name: string;
  readonly category: ResearchCategory;
  readonly description: string;
  readonly maxLevel: number;
  readonly baseCost: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
  };
  readonly baseSeconds: number;
  readonly requiredLaboratoryLevel: number;
  readonly requirements: readonly {
    readonly slug: string;
    readonly level: number;
  }[];
  readonly effects: readonly ResearchEffect[];
}

const TECHNOLOGY_TEMPLATES: readonly TechnologyTemplate[] = [
  {
    slug: 'physics',
    name: 'Физика',
    category: 'energy',
    description: 'Фундаментальная наука об энергии и материи. Повышает выход энергетических установок.',
    maxLevel: 10,
    baseCost: { metal: 320, crystal: 420, gas: 80 },
    baseSeconds: 180,
    requiredLaboratoryLevel: 1,
    requirements: [],
    effects: [{ type: 'ENERGY_OUTPUT', percentPerLevel: 2 }],
  },
  {
    slug: 'chemistry',
    name: 'Химия',
    category: 'energy',
    description: 'Совершенствует топливо, реакционные смеси и переработку энергетического сырья.',
    maxLevel: 10,
    baseCost: { metal: 300, crystal: 470, gas: 120 },
    baseSeconds: 210,
    requiredLaboratoryLevel: 1,
    requirements: [{ slug: 'physics', level: 1 }],
    effects: [{ type: 'FUEL_EFFICIENCY', percentPerLevel: 3 }],
  },
  {
    slug: 'mathematics',
    name: 'Математика',
    category: 'infrastructure',
    description: 'Улучшает вычислительные модели, планирование исследований и инженерные расчёты.',
    maxLevel: 10,
    baseCost: { metal: 280, crystal: 560, gas: 100 },
    baseSeconds: 240,
    requiredLaboratoryLevel: 1,
    requirements: [{ slug: 'physics', level: 1 }],
    effects: [{ type: 'RESEARCH_SPEED', percentPerLevel: 4 }],
  },
  {
    slug: 'astronomy',
    name: 'Астрономия',
    category: 'navigation',
    description: 'Уточняет маршруты, небесную механику и расчёт дальних перелётов.',
    maxLevel: 10,
    baseCost: { metal: 360, crystal: 620, gas: 180 },
    baseSeconds: 300,
    requiredLaboratoryLevel: 2,
    requirements: [{ slug: 'mathematics', level: 1 }],
    effects: [{ type: 'FLEET_SPEED', percentPerLevel: 3 }],
  },
  {
    slug: 'espionage',
    name: 'Шпионаж',
    category: 'intelligence',
    description: 'Повышает глубину разведданных и точность обнаружения вражеских операций.',
    maxLevel: 10,
    baseCost: { metal: 340, crystal: 700, gas: 220 },
    baseSeconds: 360,
    requiredLaboratoryLevel: 2,
    requirements: [
      { slug: 'mathematics', level: 2 },
      { slug: 'astronomy', level: 1 },
    ],
    effects: [{ type: 'SENSOR_STRENGTH', pointsPerLevel: 1 }],
  },
  {
    slug: 'computer-systems',
    name: 'Компьютерные системы',
    category: 'infrastructure',
    description: 'Каждый уровень добавляет один параллельный канал управления полётами.',
    maxLevel: 10,
    baseCost: { metal: 420, crystal: 760, gas: 200 },
    baseSeconds: 390,
    requiredLaboratoryLevel: 2,
    requirements: [{ slug: 'mathematics', level: 2 }],
    effects: [{ type: 'FLIGHT_SLOTS', pointsPerLevel: 1 }],
  },
  {
    slug: 'ship-armor',
    name: 'Корабельная броня',
    category: 'defense',
    description: 'Повышает стойкость корпусов кораблей и планетарных защитных сооружений.',
    maxLevel: 10,
    baseCost: { metal: 650, crystal: 400, gas: 180 },
    baseSeconds: 420,
    requiredLaboratoryLevel: 2,
    requirements: [{ slug: 'physics', level: 2 }],
    effects: [{ type: 'ARMOR_STRENGTH', percentPerLevel: 2 }],
  },
  {
    slug: 'fuel-cells',
    name: 'Топливные элементы',
    category: 'energy',
    description: 'Повышает запас полезной энергии топлива и сокращает расход в перелётах.',
    maxLevel: 10,
    baseCost: { metal: 430, crystal: 540, gas: 360 },
    baseSeconds: 450,
    requiredLaboratoryLevel: 2,
    requirements: [{ slug: 'chemistry', level: 2 }],
    effects: [{ type: 'FUEL_EFFICIENCY', percentPerLevel: 4 }],
  },
  {
    slug: 'jet-engines',
    name: 'Реактивные двигатели',
    category: 'navigation',
    description: 'Увеличивает маршевую скорость кораблей с реактивными двигательными контурами.',
    maxLevel: 10,
    baseCost: { metal: 560, crystal: 520, gas: 420 },
    baseSeconds: 510,
    requiredLaboratoryLevel: 3,
    requirements: [
      { slug: 'fuel-cells', level: 1 },
      { slug: 'astronomy', level: 1 },
    ],
    effects: [{ type: 'FLEET_SPEED', percentPerLevel: 5 }],
  },
  {
    slug: 'laser-science',
    name: 'Лазерная технология',
    category: 'weapons',
    description: 'Открывает и усиливает лазерные боевые системы.',
    maxLevel: 10,
    baseCost: { metal: 520, crystal: 650, gas: 260 },
    baseSeconds: 540,
    requiredLaboratoryLevel: 3,
    requirements: [
      { slug: 'physics', level: 2 },
      { slug: 'mathematics', level: 1 },
    ],
    effects: [{ type: 'WEAPON_STRENGTH', percentPerLevel: 2 }],
  },
  {
    slug: 'ion-science',
    name: 'Ионная технология',
    category: 'weapons',
    description: 'Открывает и усиливает ионное вооружение против тяжёлых целей.',
    maxLevel: 10,
    baseCost: { metal: 620, crystal: 780, gas: 390 },
    baseSeconds: 630,
    requiredLaboratoryLevel: 4,
    requirements: [
      { slug: 'laser-science', level: 2 },
      { slug: 'chemistry', level: 2 },
    ],
    effects: [{ type: 'WEAPON_STRENGTH', percentPerLevel: 3 }],
  },
  {
    slug: 'plasma-science',
    name: 'Плазменная технология',
    category: 'weapons',
    description: 'Открывает наиболее мощные плазменные орудия поздней стадии развития.',
    maxLevel: 10,
    baseCost: { metal: 780, crystal: 920, gas: 560 },
    baseSeconds: 750,
    requiredLaboratoryLevel: 5,
    requirements: [
      { slug: 'ion-science', level: 3 },
      { slug: 'physics', level: 4 },
    ],
    effects: [{ type: 'WEAPON_STRENGTH', percentPerLevel: 4 }],
  },
  {
    slug: 'ecology',
    name: 'Экология',
    category: 'infrastructure',
    description: 'Расширяет экологический предел колонии и устойчивость планетарной инфраструктуры.',
    maxLevel: 10,
    baseCost: { metal: 500, crystal: 700, gas: 300 },
    baseSeconds: 600,
    requiredLaboratoryLevel: 3,
    requirements: [{ slug: 'chemistry', level: 3 }],
    effects: [{ type: 'ECOLOGY_CAPACITY', pointsPerLevel: 1_500 }],
  },
  {
    slug: 'hyperspace',
    name: 'Гиперпространство',
    category: 'navigation',
    description: 'Открывает дальние гиперпространственные маршруты и ускоряет тяжёлые флоты.',
    maxLevel: 10,
    baseCost: { metal: 820, crystal: 1_020, gas: 720 },
    baseSeconds: 840,
    requiredLaboratoryLevel: 5,
    requirements: [
      { slug: 'astronomy', level: 3 },
      { slug: 'jet-engines', level: 3 },
    ],
    effects: [{ type: 'FLEET_SPEED', percentPerLevel: 4 }],
  },
  {
    slug: 'parallel-universes',
    name: 'Параллельные вселенные',
    category: 'navigation',
    description: 'Поздняя пространственная теория. Каждый уровень также увеличивает предел колоний на одну.',
    maxLevel: 5,
    baseCost: { metal: 2_200, crystal: 2_500, gas: 1_600 },
    baseSeconds: 1_200,
    requiredLaboratoryLevel: 6,
    requirements: [
      { slug: 'hyperspace', level: 4 },
      { slug: 'mathematics', level: 5 },
    ],
    effects: [{ type: 'RESEARCH_SPEED', percentPerLevel: 3 }],
  },
  {
    slug: 'improved-construction',
    name: 'Улучшенное строительство',
    category: 'infrastructure',
    description: 'Оптимизирует проектирование и сокращает время возведения инфраструктуры.',
    maxLevel: 10,
    baseCost: { metal: 740, crystal: 620, gas: 260 },
    baseSeconds: 660,
    requiredLaboratoryLevel: 4,
    requirements: [
      { slug: 'mathematics', level: 3 },
      { slug: 'physics', level: 3 },
    ],
    effects: [{ type: 'CONSTRUCTION_SPEED', percentPerLevel: 5 }],
  },
  {
    slug: 'piercing-attack',
    name: 'Пробивающая атака',
    category: 'weapons',
    description: 'Повышает способность вооружения преодолевать броню противника.',
    maxLevel: 10,
    baseCost: { metal: 760, crystal: 820, gas: 480 },
    baseSeconds: 720,
    requiredLaboratoryLevel: 4,
    requirements: [
      { slug: 'laser-science', level: 3 },
      { slug: 'ship-armor', level: 2 },
    ],
    effects: [{ type: 'ARMOR_PENETRATION', percentPerLevel: 2 }],
  },
  {
    slug: 'maneuver-defense',
    name: 'Маневренная защита',
    category: 'defense',
    description: 'Повышает живучесть кораблей и обороны на 5% за уровень, максимум на 50%.',
    maxLevel: 10,
    baseCost: { metal: 720, crystal: 860, gas: 520 },
    baseSeconds: 750,
    requiredLaboratoryLevel: 4,
    requirements: [
      { slug: 'ship-armor', level: 3 },
      { slug: 'astronomy', level: 2 },
    ],
    effects: [{ type: 'SHIP_DURABILITY', percentPerLevel: 5 }],
  },
  {
    slug: 'critical-hit',
    name: 'Критический удар',
    category: 'weapons',
    description: 'Повышает шанс критического удара; итоговый бонус ограничен двенадцатью процентами.',
    maxLevel: 10,
    baseCost: { metal: 900, crystal: 1_050, gas: 620 },
    baseSeconds: 870,
    requiredLaboratoryLevel: 5,
    requirements: [
      { slug: 'mathematics', level: 4 },
      { slug: 'laser-science', level: 4 },
    ],
    effects: [{ type: 'CRITICAL_CHANCE', basisPointsPerLevel: 120 }],
  },
  {
    slug: 'light-armor',
    name: 'Лёгкая броня',
    category: 'defense',
    description: 'Открывает лёгкую броню с базовым профилем защиты 3%.',
    maxLevel: 1,
    baseCost: { metal: 480, crystal: 360, gas: 140 },
    baseSeconds: 360,
    requiredLaboratoryLevel: 2,
    requirements: [{ slug: 'ship-armor', level: 1 }],
    effects: [{ type: 'ARMOR_STRENGTH', percentPerLevel: 3 }],
  },
  {
    slug: 'medium-armor',
    name: 'Средняя броня',
    category: 'defense',
    description: 'Открывает среднюю броню с базовым профилем защиты 6%.',
    maxLevel: 1,
    baseCost: { metal: 760, crystal: 540, gas: 260 },
    baseSeconds: 510,
    requiredLaboratoryLevel: 3,
    requirements: [
      { slug: 'light-armor', level: 1 },
      { slug: 'ship-armor', level: 3 },
    ],
    effects: [{ type: 'ARMOR_STRENGTH', percentPerLevel: 6 }],
  },
  {
    slug: 'heavy-armor',
    name: 'Тяжёлая броня',
    category: 'defense',
    description: 'Открывает тяжёлую броню с базовым профилем защиты 9%.',
    maxLevel: 1,
    baseCost: { metal: 1_100, crystal: 820, gas: 480 },
    baseSeconds: 720,
    requiredLaboratoryLevel: 5,
    requirements: [
      { slug: 'medium-armor', level: 1 },
      { slug: 'plasma-science', level: 2 },
    ],
    effects: [{ type: 'ARMOR_STRENGTH', percentPerLevel: 9 }],
  },
] as const;

export function getCompleteResearchId(factionId: FactionId, slug: string): string {
  return `technology.${factionId}.${slug}`;
}

function createCatalog(factionId: FactionId): readonly ResearchDefinition[] {
  return TECHNOLOGY_TEMPLATES.map((template) => ({
    id: getCompleteResearchId(factionId, template.slug),
    name: template.name,
    factionId,
    category: template.category,
    description: template.description,
    maxLevel: template.maxLevel,
    baseCost: template.baseCost,
    baseSeconds: template.baseSeconds,
    requiredLaboratoryLevel: template.requiredLaboratoryLevel,
    requirements: template.requirements.map((requirement) => ({
      technologyId: getCompleteResearchId(factionId, requirement.slug),
      level: requirement.level,
    })),
    effects: template.effects,
    assetId: getCompleteResearchId(factionId, template.slug),
  }));
}

export const COMPLETE_RESEARCH_CATALOGS: Readonly<Record<FactionId, readonly ResearchDefinition[]>> = {
  aegis: createCatalog('aegis'),
  synod: createCatalog('synod'),
  veyra: createCatalog('veyra'),
};

export const AEGIS_COMPLETE_RESEARCH_CATALOG = COMPLETE_RESEARCH_CATALOGS.aegis;
export const SYNOD_COMPLETE_RESEARCH_CATALOG = COMPLETE_RESEARCH_CATALOGS.synod;
export const VEYRA_COMPLETE_RESEARCH_CATALOG = COMPLETE_RESEARCH_CATALOGS.veyra;
