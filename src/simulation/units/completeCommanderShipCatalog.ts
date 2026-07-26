import type {
  CommanderAbilityDefinition,
  CommanderShipClass,
  UnitDefinition,
  UnitStats,
} from './types';

interface CommanderTemplate {
  readonly commanderClass: CommanderShipClass;
  readonly name: string;
  readonly description: string;
  readonly requiredAdmiralLevel: number;
  readonly requiredShipyardLevel: number;
  readonly baseCost: { readonly metal: number; readonly crystal: number; readonly gas: number };
  readonly baseSeconds: number;
  readonly stats: UnitStats;
  readonly ability: CommanderAbilityDefinition;
}

export interface CompleteCommanderShipIds {
  readonly annihilator: string;
  readonly corsair: string;
  readonly regenerator: string;
  readonly viper: string;
  readonly scorpion: string;
  readonly phantom: string;
  readonly hunter: string;
  readonly typhoon: string;
  readonly executor: string;
  readonly juggernaut: string;
  readonly argo: string;
  readonly judge: string;
  readonly polias: string;
}

export const COMPLETE_COMMANDER_SHIP_CLASSES: readonly CommanderShipClass[] = [
  'annihilator',
  'corsair',
  'regenerator',
  'viper',
  'scorpion',
  'phantom',
  'hunter',
  'typhoon',
  'executor',
  'juggernaut',
  'argo',
  'judge',
  'polias',
];

const commonStats = (overrides: Partial<UnitStats>): UnitStats => ({
  speed: 11,
  cargo: 1_000,
  attack: 120,
  armor: 220,
  shield: 80,
  ...overrides,
});

const TEMPLATES: readonly CommanderTemplate[] = [
  {
    commanderClass: 'annihilator',
    name: 'Аннигилятор «Предел»',
    description: 'Осадный командирский корабль, координирующий огонь по укреплениям и тяжёлым установкам.',
    requiredAdmiralLevel: 35,
    requiredShipyardLevel: 10,
    baseCost: { metal: 4_500, crystal: 4_500, gas: 0 },
    baseSeconds: 360,
    stats: commonStats({ speed: 8, attack: 190, armor: 300, shield: 95 }),
    ability: {
      id: 'annihilator', effect: 'demolition', name: 'Протокол демонтажа',
      description: 'Усиливает удар флагманской группы по планетарным установкам.',
      effectPerLevelBasisPoints: 50, maximumLevel: 10, battlePriority: 10,
    },
  },
  {
    commanderClass: 'corsair',
    name: 'Корсар «Черта»',
    description: 'Рейдерский командирский корабль для захвата грузов и быстрого выхода из боя.',
    requiredAdmiralLevel: 2,
    requiredShipyardLevel: 2,
    baseCost: { metal: 2_500, crystal: 2_500, gas: 0 },
    baseSeconds: 200,
    stats: commonStats({ speed: 14, cargo: 1_800, attack: 105, armor: 170, shield: 65 }),
    ability: {
      id: 'corsair', effect: 'plunder', name: 'Рейдерский мандат',
      description: 'Повышает долю ресурсов, доступную победившему флоту при разграблении.',
      effectPerLevelBasisPoints: 25, maximumLevel: 10, battlePriority: 90,
    },
  },
  {
    commanderClass: 'regenerator',
    name: 'Реаниматор «Эхо»',
    description: 'Ремонтно-командная платформа с резервными экипажами и автономными восстановителями.',
    requiredAdmiralLevel: 15,
    requiredShipyardLevel: 5,
    baseCost: { metal: 3_500, crystal: 3_500, gas: 0 },
    baseSeconds: 280,
    stats: commonStats({ attack: 90, armor: 260, shield: 120 }),
    ability: {
      id: 'regenerator', effect: 'recovery', name: 'Поле восстановления',
      description: 'Снижает необратимые потери флагманской группы за счёт боевой рекуперации.',
      effectPerLevelBasisPoints: 40, maximumLevel: 10, battlePriority: 45,
    },
  },
  {
    commanderClass: 'viper',
    name: 'Вайпер «Укус»',
    description: 'Ударный командирский корабль, синхронизирующий точные залпы по уязвимым узлам.',
    requiredAdmiralLevel: 20,
    requiredShipyardLevel: 6,
    baseCost: { metal: 3_500, crystal: 3_500, gas: 0 },
    baseSeconds: 280,
    stats: commonStats({ speed: 13, attack: 165, armor: 185, shield: 70 }),
    ability: {
      id: 'viper', effect: 'critical', name: 'Точный укус',
      description: 'Повышает вероятность критически эффективного залпа флагманской группы.',
      effectPerLevelBasisPoints: 8, maximumLevel: 10, battlePriority: 25,
    },
  },
  {
    commanderClass: 'scorpion',
    name: 'Скорпион «Зажим»',
    description: 'Корабль радиоэлектронного подавления, нарушающий циклы наведения противника.',
    requiredAdmiralLevel: 20,
    requiredShipyardLevel: 6,
    baseCost: { metal: 4_000, crystal: 4_000, gas: 0 },
    baseSeconds: 320,
    stats: commonStats({ attack: 135, armor: 230, shield: 105 }),
    ability: {
      id: 'scorpion', effect: 'paralysis', name: 'Парализующий контур',
      description: 'Снижает атакующий потенциал вражеской стороны на время боя.',
      effectPerLevelBasisPoints: 10, maximumLevel: 10, battlePriority: 20,
    },
  },
  {
    commanderClass: 'phantom',
    name: 'Фантом «Разворот»',
    description: 'Манёвренный флагман, создающий ложные сигнатуры и срывающий вражеские атаки.',
    requiredAdmiralLevel: 25,
    requiredShipyardLevel: 7,
    baseCost: { metal: 4_000, crystal: 4_000, gas: 0 },
    baseSeconds: 320,
    stats: commonStats({ speed: 15, attack: 100, armor: 190, shield: 145 }),
    ability: {
      id: 'phantom', effect: 'repulse', name: 'Ложный вектор',
      description: 'Повышает уклонение и устойчивость флагманской группы к первому натиску.',
      effectPerLevelBasisPoints: 75, maximumLevel: 10, battlePriority: 40,
    },
  },
  {
    commanderClass: 'hunter',
    name: 'Охотник «Дозор»',
    description: 'Разведывательный командирский корабль с усиленным контуром контрразведки.',
    requiredAdmiralLevel: 2,
    requiredShipyardLevel: 2,
    baseCost: { metal: 2_000, crystal: 2_000, gas: 0 },
    baseSeconds: 160,
    stats: commonStats({ speed: 16, cargo: 500, attack: 80, armor: 150, shield: 100 }),
    ability: {
      id: 'hunter', effect: 'spy-detection', name: 'Глубокий дозор',
      description: 'Усиливает обнаружение скрытых операций и качество боевой разведки.',
      effectPerLevelBasisPoints: 40, maximumLevel: 10, battlePriority: 100,
    },
  },
  {
    commanderClass: 'typhoon',
    name: 'Тайфун «Поток»',
    description: 'Навигационный флагман, оптимизирующий синхронизацию двигателей всего соединения.',
    requiredAdmiralLevel: 10,
    requiredShipyardLevel: 4,
    baseCost: { metal: 2_500, crystal: 2_500, gas: 0 },
    baseSeconds: 200,
    stats: commonStats({ speed: 18, attack: 95, armor: 175, shield: 90 }),
    ability: {
      id: 'typhoon', effect: 'speed', name: 'Единый импульс',
      description: 'Ускоряет перелёт флота, в котором назначен ведущим командирским кораблём.',
      effectPerLevelBasisPoints: 10, maximumLevel: 10, battlePriority: 80,
    },
  },
  {
    commanderClass: 'executor',
    name: 'Палач «Вердикт»',
    description: 'Боевой флагман прямого действия, усиливающий согласованность атакующих групп.',
    requiredAdmiralLevel: 5,
    requiredShipyardLevel: 4,
    baseCost: { metal: 4_000, crystal: 4_000, gas: 0 },
    baseSeconds: 320,
    stats: commonStats({ attack: 175, armor: 235, shield: 75 }),
    ability: {
      id: 'executor', effect: 'attack', name: 'Приказ на уничтожение',
      description: 'Повышает урон всех кораблей флагманского соединения.',
      effectPerLevelBasisPoints: 15, maximumLevel: 10, battlePriority: 30,
    },
  },
  {
    commanderClass: 'juggernaut',
    name: 'Джаггернаут «Несокрушимый»',
    description: 'Тяжёлый командирский корабль, распределяющий защитную нагрузку по строю.',
    requiredAdmiralLevel: 5,
    requiredShipyardLevel: 4,
    baseCost: { metal: 4_000, crystal: 4_000, gas: 0 },
    baseSeconds: 320,
    stats: commonStats({ speed: 9, attack: 120, armor: 340, shield: 125 }),
    ability: {
      id: 'juggernaut', effect: 'vitality', name: 'Несокрушимый строй',
      description: 'Повышает суммарную живучесть флагманского соединения.',
      effectPerLevelBasisPoints: 15, maximumLevel: 10, battlePriority: 35,
    },
  },
  {
    commanderClass: 'argo',
    name: 'Арго «Ковчег»',
    description: 'Экспедиционно-инженерная платформа для дальних операций и модернизации флота.',
    requiredAdmiralLevel: 12,
    requiredShipyardLevel: 5,
    baseCost: { metal: 2_500, crystal: 2_500, gas: 0 },
    baseSeconds: 200,
    stats: commonStats({ cargo: 2_400, attack: 85, armor: 240, shield: 100 }),
    ability: {
      id: 'argo', effect: 'upgrade-points', name: 'Инженерный ковчег',
      description: 'Усиливает грузовую и модернизационную эффективность соединения.',
      effectPerLevelBasisPoints: 50, maximumLevel: 10, battlePriority: 110,
    },
  },
  {
    commanderClass: 'judge',
    name: 'Судья «Приговор»',
    description: 'Командирский корабль анализа целей, вскрывающий защитный профиль противника.',
    requiredAdmiralLevel: 18,
    requiredShipyardLevel: 6,
    baseCost: { metal: 4_500, crystal: 4_500, gas: 0 },
    baseSeconds: 360,
    stats: commonStats({ attack: 155, armor: 245, shield: 105 }),
    ability: {
      id: 'judge', effect: 'armor-break', name: 'Приговор броне',
      description: 'Снижает эффективную защиту вражеских единиц в бою.',
      effectPerLevelBasisPoints: 15, maximumLevel: 10, battlePriority: 15,
    },
  },
  {
    commanderClass: 'polias',
    name: 'Polias «Хранитель»',
    description: 'Поздний защитный флагман, стабилизирующий планетарный контур и тяжёлые соединения.',
    requiredAdmiralLevel: 28,
    requiredShipyardLevel: 8,
    baseCost: { metal: 6_000, crystal: 6_000, gas: 0 },
    baseSeconds: 480,
    stats: commonStats({ speed: 8, attack: 130, armor: 360, shield: 180 }),
    ability: {
      id: 'polias', effect: 'planet-shield', name: 'Планетарный хранитель',
      description: 'Снижает эффективность разрушительных атак и укрепляет обороняющийся строй.',
      effectPerLevelBasisPoints: 50, maximumLevel: 10, battlePriority: 50,
    },
  },
] as const;

export function getCompleteCommanderShipId(commanderClass: CommanderShipClass): string {
  return `commander.shared.${commanderClass}`;
}

export function getCompleteCommanderShipIds(): CompleteCommanderShipIds {
  return Object.fromEntries(
    COMPLETE_COMMANDER_SHIP_CLASSES.map((commanderClass) => [
      commanderClass,
      getCompleteCommanderShipId(commanderClass),
    ]),
  ) as unknown as CompleteCommanderShipIds;
}

export const COMPLETE_COMMANDER_SHIP_CATALOG: readonly UnitDefinition[] = TEMPLATES.map(
  (template) => ({
    id: getCompleteCommanderShipId(template.commanderClass),
    name: template.name,
    factionId: 'shared',
    kind: 'ship',
    role: 'commander',
    commanderClass: template.commanderClass,
    commanderAbility: template.ability,
    requiredAdmiralLevel: template.requiredAdmiralLevel,
    requiredShipyardLevel: template.requiredShipyardLevel,
    description: template.description,
    assetId: getCompleteCommanderShipId(template.commanderClass),
    baseCost: template.baseCost,
    baseSeconds: template.baseSeconds,
    populationCost: 5,
    hangarCost: 10,
    defenseGridCost: 0,
    buildingRequirements: [],
    researchRequirements: [],
    stats: template.stats,
  }),
);

const COMMANDERS_BY_ID = new Map(
  COMPLETE_COMMANDER_SHIP_CATALOG.map((definition) => [definition.id, definition]),
);

export function getCompleteCommanderShipDefinition(
  commanderId: string,
): UnitDefinition | undefined {
  return COMMANDERS_BY_ID.get(commanderId);
}

export function getCompleteCommanderShipClass(
  commanderId: string,
): CommanderShipClass | undefined {
  return getCompleteCommanderShipDefinition(commanderId)?.commanderClass;
}
