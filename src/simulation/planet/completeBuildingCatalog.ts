import type { ResourceCost } from '../economy/types';
import type { FactionId, PlanetZoneId } from './types';
import type {
  BuildingDefinition,
  BuildingOperationalEffects,
  BuildingRequirement,
} from './buildingDefinitions';

export interface CompleteBuildingIds {
  readonly metalPrimary: string;
  readonly metalSecondary: string;
  readonly metalTertiary: string;
  readonly crystalPrimary: string;
  readonly crystalSecondary: string;
  readonly gasPrimary: string;
  readonly gasSecondary: string;
  readonly solarPower: string;
  readonly independentPower: string;
  readonly hangar: string;
  readonly constructionComplex: string;
  readonly advancedFactory: string;
  readonly metalStorage: string;
  readonly crystalStorage: string;
  readonly gasStorage: string;
  readonly scrapyard: string;
  readonly tradeCenter: string;
  readonly shipyard: string;
  readonly researchCenter: string;
  readonly spaceport: string;
  readonly government: string;
  readonly bank: string;
  readonly galacticObelisk: string;
  readonly supremeGalacticGates: string;
}

const SLUGS: Readonly<Record<keyof CompleteBuildingIds, string>> = {
  metalPrimary: 'metal-bot-1',
  metalSecondary: 'metal-bot-2',
  metalTertiary: 'metal-bot-3',
  crystalPrimary: 'mineral-bot-1',
  crystalSecondary: 'mineral-bot-2',
  gasPrimary: 'gas-probe-1',
  gasSecondary: 'gas-probe-2',
  solarPower: 'infrared-bot',
  independentPower: 'uranium-bot',
  hangar: 'bunker',
  constructionComplex: 'construction',
  advancedFactory: 'teret-factory',
  metalStorage: 'metal-vault',
  crystalStorage: 'mineral-treasury',
  gasStorage: 'gas-chamber',
  scrapyard: 'scrapyard',
  tradeCenter: 'trade-center',
  shipyard: 'shipyard',
  researchCenter: 'experimental-center',
  spaceport: 'spaceport',
  government: 'control-chamber',
  bank: 'bank',
  galacticObelisk: 'aksum-obelisk',
  supremeGalacticGates: 'supreme-galactic-gates',
};

const NAMES: Readonly<Record<FactionId, Readonly<Record<keyof CompleteBuildingIds, string>>>> = {
  aegis: {
    metalPrimary: 'Буровой комплекс «Кестрел I»',
    metalSecondary: 'Буровой комплекс «Кестрел II»',
    metalTertiary: 'Буровой комплекс «Кестрел III»',
    crystalPrimary: 'Призматическая шахта I',
    crystalSecondary: 'Призматическая шахта II',
    gasPrimary: 'Паровая скважина I',
    gasSecondary: 'Паровая скважина II',
    solarPower: 'Массив «Гелиос»',
    independentPower: 'Ядро деления Aegis',
    hangar: 'Ангар «Бастион»',
    constructionComplex: 'Гражданский фабрикатор',
    advancedFactory: 'Производственный комплекс «Авангард»',
    metalStorage: 'Хранилище «Айронхолд»',
    crystalStorage: 'Призматический резерв',
    gasStorage: 'Газовый резерв',
    scrapyard: 'Перерабатывающий комплекс',
    tradeCenter: 'Транзитная биржа',
    shipyard: 'Флотская верфь',
    researchCenter: 'Когнитивная лаборатория',
    spaceport: 'Орбитальный космодром',
    government: 'Планетарный директорат',
    bank: 'Кредитная цитадель',
    galacticObelisk: 'Обелиск «Фарос»',
    supremeGalacticGates: 'Суверенные Галактические Врата',
  },
  synod: {
    metalPrimary: 'Ферритовая решётка I',
    metalSecondary: 'Ферритовая решётка II',
    metalTertiary: 'Ферритовая решётка III',
    crystalPrimary: 'Призматический сепаратор I',
    crystalSecondary: 'Призматический сепаратор II',
    gasPrimary: 'Коллектор потока I',
    gasSecondary: 'Коллектор потока II',
    solarPower: 'Лучевой приёмник',
    independentPower: 'Резонансное ядро',
    hangar: 'Архив флота',
    constructionComplex: 'Сборочный узел',
    advancedFactory: 'Кузница точности',
    metalStorage: 'Ферритовый архив',
    crystalStorage: 'Минеральный архив',
    gasStorage: 'Резервуар потока',
    scrapyard: 'Рекламатор материи',
    tradeCenter: 'Биржа Конкорда',
    shipyard: 'Решётчатая верфь',
    researchCenter: 'Горнило паттернов',
    spaceport: 'Пусковой массив ретрансляции',
    government: 'Палата Конкорда',
    bank: 'Финансовый нексус',
    galacticObelisk: 'Монолит Оси',
    supremeGalacticGates: 'Врата Конкорда',
  },
  veyra: {
    metalPrimary: 'Пасть панциря I',
    metalSecondary: 'Пасть панциря II',
    metalTertiary: 'Пасть панциря III',
    crystalPrimary: 'Огненный сифон I',
    crystalSecondary: 'Огненный сифон II',
    gasPrimary: 'Дыхательный инкубатор I',
    gasSecondary: 'Дыхательный инкубатор II',
    solarPower: 'Солнечная мембрана',
    independentPower: 'Урановый абсорбер',
    hangar: 'Хранилище выводка',
    constructionComplex: 'Порождающая кузница',
    advancedFactory: 'Военный кокон роста',
    metalStorage: 'Панцирный запас',
    crystalStorage: 'Кристальное хранилище выводка',
    gasStorage: 'Дыхательная киста',
    scrapyard: 'Костяной рекламатор',
    tradeCenter: 'Биржа усиков',
    shipyard: 'Живая верфь',
    researchCenter: 'Святилище Сверхразума',
    spaceport: 'Канал Пустоты',
    government: 'Корона улья',
    bank: 'Шпиль дани',
    galacticObelisk: 'Кровавый обелиск',
    supremeGalacticGates: 'Врата Пасти',
  },
};

const FACTION_TUNING: Readonly<Record<FactionId, {
  readonly metal: number;
  readonly crystal: number;
  readonly gas: number;
  readonly energy: number;
  readonly cost: number;
  readonly time: number;
}>> = {
  aegis: { metal: 1.08, crystal: 1, gas: 0.96, energy: 1, cost: 1.04, time: 1 },
  synod: { metal: 0.96, crystal: 1.1, gas: 1, energy: 1.08, cost: 1, time: 0.98 },
  veyra: { metal: 1, crystal: 0.96, gas: 1.12, energy: 1.02, cost: 0.95, time: 0.9 },
};

function scaleCost(cost: ResourceCost, multiplier: number): ResourceCost {
  return {
    metal: Math.ceil(cost.metal * multiplier),
    crystal: Math.ceil(cost.crystal * multiplier),
    gas: Math.ceil(cost.gas * multiplier),
  };
}

function idsForFaction(factionId: FactionId): CompleteBuildingIds {
  return Object.fromEntries(
    Object.entries(SLUGS).map(([key, slug]) => [key, `building.${factionId}.${slug}`]),
  ) as unknown as CompleteBuildingIds;
}

function requirement(buildingId: string, level: number): BuildingRequirement {
  return { buildingId, level };
}

interface Seed {
  readonly key: keyof CompleteBuildingIds;
  readonly zoneId: PlanetZoneId;
  readonly maxLevel: number;
  readonly cost: ResourceCost;
  readonly seconds: number;
  readonly requirements: (ids: CompleteBuildingIds) => readonly BuildingRequirement[];
  readonly economy?: BuildingDefinition['economy'];
  readonly operations?: BuildingOperationalEffects;
}

const SEEDS: readonly Seed[] = [
  { key: 'metalPrimary', zoneId: 'resource', maxLevel: 20, cost: { metal: 160, crystal: 60, gas: 10 }, seconds: 75, requirements: () => [], economy: { resourceProductionPerHour: { metal: 120 }, energyConsumption: 12, populationUse: 1, stabilityDemand: 6 } },
  { key: 'metalSecondary', zoneId: 'resource', maxLevel: 15, cost: { metal: 900, crystal: 420, gas: 90 }, seconds: 280, requirements: (ids) => [requirement(ids.metalPrimary, 10)], economy: { resourceProductionPerHour: { metal: 190 }, energyConsumption: 20, populationUse: 1, stabilityDemand: 8 } },
  { key: 'metalTertiary', zoneId: 'resource', maxLevel: 10, cost: { metal: 3_200, crystal: 1_600, gas: 420 }, seconds: 900, requirements: (ids) => [requirement(ids.metalPrimary, 15), requirement(ids.metalSecondary, 5)], economy: { resourceProductionPerHour: { metal: 300 }, energyConsumption: 34, populationUse: 2, stabilityDemand: 12 } },
  { key: 'crystalPrimary', zoneId: 'resource', maxLevel: 20, cost: { metal: 140, crystal: 120, gas: 20 }, seconds: 90, requirements: () => [], economy: { resourceProductionPerHour: { crystal: 85 }, energyConsumption: 14, populationUse: 1, stabilityDemand: 6 } },
  { key: 'crystalSecondary', zoneId: 'resource', maxLevel: 15, cost: { metal: 800, crystal: 900, gas: 150 }, seconds: 320, requirements: (ids) => [requirement(ids.crystalPrimary, 10)], economy: { resourceProductionPerHour: { crystal: 145 }, energyConsumption: 24, populationUse: 1, stabilityDemand: 9 } },
  { key: 'gasPrimary', zoneId: 'resource', maxLevel: 20, cost: { metal: 180, crystal: 100, gas: 60 }, seconds: 110, requirements: () => [], economy: { resourceProductionPerHour: { gas: 55 }, energyConsumption: 16, populationUse: 1, stabilityDemand: 6 } },
  { key: 'gasSecondary', zoneId: 'resource', maxLevel: 15, cost: { metal: 1_000, crystal: 680, gas: 300 }, seconds: 380, requirements: (ids) => [requirement(ids.gasPrimary, 10)], economy: { resourceProductionPerHour: { gas: 95 }, energyConsumption: 28, populationUse: 1, stabilityDemand: 9 } },
  { key: 'solarPower', zoneId: 'resource', maxLevel: 20, cost: { metal: 220, crystal: 160, gas: 30 }, seconds: 120, requirements: () => [], economy: { energyProduction: 130, populationUse: 1, stabilityCapacity: 18 } },
  { key: 'independentPower', zoneId: 'resource', maxLevel: 10, cost: { metal: 2_500, crystal: 1_900, gas: 900 }, seconds: 780, requirements: (ids) => [requirement(ids.solarPower, 10), requirement(ids.constructionComplex, 4)], economy: { energyProduction: 320, populationUse: 3, stabilityDemand: 8 } },
  { key: 'hangar', zoneId: 'resource', maxLevel: 15, cost: { metal: 650, crystal: 520, gas: 180 }, seconds: 260, requirements: (ids) => [requirement(ids.constructionComplex, 1)], economy: { energyConsumption: 8, populationCapacity: 12, stabilityCapacity: 12 }, operations: { hangarCapacity: 80 } },
  { key: 'constructionComplex', zoneId: 'industry', maxLevel: 15, cost: { metal: 500, crystal: 350, gas: 120 }, seconds: 210, requirements: (ids) => [requirement(ids.metalPrimary, 2), requirement(ids.crystalPrimary, 2)], economy: { energyConsumption: 18, populationUse: 2, stabilityDemand: 6 }, operations: { constructionSpeedPercent: 6 } },
  { key: 'advancedFactory', zoneId: 'industry', maxLevel: 15, cost: { metal: 1_500, crystal: 1_100, gas: 450 }, seconds: 520, requirements: (ids) => [requirement(ids.constructionComplex, 4), requirement(ids.shipyard, 2)], economy: { energyConsumption: 34, populationUse: 3, stabilityDemand: 10 }, operations: { shipProductionSpeedPercent: 5, defenseProductionSpeedPercent: 8 } },
  { key: 'metalStorage', zoneId: 'industry', maxLevel: 15, cost: { metal: 700, crystal: 260, gas: 60 }, seconds: 240, requirements: (ids) => [requirement(ids.metalPrimary, 4)], economy: { storageCapacity: { metal: 8_000 }, energyConsumption: 4, stabilityDemand: 2 } },
  { key: 'crystalStorage', zoneId: 'industry', maxLevel: 15, cost: { metal: 520, crystal: 680, gas: 90 }, seconds: 250, requirements: (ids) => [requirement(ids.crystalPrimary, 4)], economy: { storageCapacity: { crystal: 8_000 }, energyConsumption: 4, stabilityDemand: 2 } },
  { key: 'gasStorage', zoneId: 'industry', maxLevel: 15, cost: { metal: 600, crystal: 420, gas: 180 }, seconds: 270, requirements: (ids) => [requirement(ids.gasPrimary, 4)], economy: { storageCapacity: { gas: 8_000 }, energyConsumption: 5, stabilityDemand: 2 } },
  { key: 'scrapyard', zoneId: 'industry', maxLevel: 10, cost: { metal: 1_100, crystal: 800, gas: 300 }, seconds: 420, requirements: (ids) => [requirement(ids.constructionComplex, 3), requirement(ids.hangar, 2)], economy: { energyConsumption: 18, populationUse: 2, stabilityDemand: 5 }, operations: { salvageEfficiencyPercent: 5 } },
  { key: 'tradeCenter', zoneId: 'industry', maxLevel: 10, cost: { metal: 1_400, crystal: 1_400, gas: 420 }, seconds: 480, requirements: (ids) => [requirement(ids.government, 2), requirement(ids.metalStorage, 2), requirement(ids.crystalStorage, 2), requirement(ids.gasStorage, 2)], economy: { energyConsumption: 20, populationUse: 2, stabilityCapacity: 8 }, operations: { marketEfficiencyPercent: 2 } },
  { key: 'shipyard', zoneId: 'military', maxLevel: 15, cost: { metal: 1_000, crystal: 800, gas: 400 }, seconds: 480, requirements: (ids) => [requirement(ids.constructionComplex, 2)], economy: { energyConsumption: 40, populationUse: 4, stabilityDemand: 12 }, operations: { shipProductionSpeedPercent: 3, defenseProductionSpeedPercent: 3 } },
  { key: 'researchCenter', zoneId: 'military', maxLevel: 15, cost: { metal: 850, crystal: 1_100, gas: 420 }, seconds: 430, requirements: (ids) => [requirement(ids.constructionComplex, 2)], economy: { energyConsumption: 32, populationUse: 3, stabilityDemand: 8 }, operations: { researchSpeedPercent: 7 } },
  { key: 'spaceport', zoneId: 'military', maxLevel: 12, cost: { metal: 1_800, crystal: 1_550, gas: 780 }, seconds: 660, requirements: (ids) => [requirement(ids.shipyard, 4), requirement(ids.researchCenter, 3)], economy: { energyConsumption: 38, populationUse: 3, stabilityDemand: 9 }, operations: { shipProductionSpeedPercent: 2, defenseProductionSpeedPercent: 2, shipUpgradeCapacity: 1 } },
  { key: 'government', zoneId: 'military', maxLevel: 10, cost: { metal: 220, crystal: 180, gas: 60 }, seconds: 180, requirements: (ids) => [requirement(ids.constructionComplex, 3), requirement(ids.solarPower, 5)], economy: { energyConsumption: 16, populationCapacity: 45, stabilityCapacity: 55 } },
  { key: 'bank', zoneId: 'military', maxLevel: 10, cost: { metal: 1_800, crystal: 2_200, gas: 650 }, seconds: 700, requirements: (ids) => [requirement(ids.government, 4), requirement(ids.tradeCenter, 2)], economy: { energyConsumption: 14, populationUse: 2, stabilityCapacity: 18 }, operations: { bankCreditEfficiencyPercent: 5 } },
  { key: 'galacticObelisk', zoneId: 'military', maxLevel: 1, cost: { metal: 2_500_000, crystal: 2_500_000, gas: 500_000 }, seconds: 604_800, requirements: (ids) => [requirement(ids.government, 10), requirement(ids.researchCenter, 15), requirement(ids.spaceport, 10)], economy: { energyConsumption: 500, populationUse: 25, stabilityDemand: 25 }, operations: { endgameLocked: true } },
  { key: 'supremeGalacticGates', zoneId: 'military', maxLevel: 1, cost: { metal: 8_000_000, crystal: 8_000_000, gas: 2_000_000 }, seconds: 604_800, requirements: (ids) => [requirement(ids.galacticObelisk, 1), requirement(ids.government, 10), requirement(ids.researchCenter, 15), requirement(ids.spaceport, 12)], economy: { energyConsumption: 1_000, populationUse: 50, stabilityDemand: 40 }, operations: { endgameLocked: true } },
];

export function getCompleteBuildingIds(factionId: FactionId): CompleteBuildingIds {
  return idsForFaction(factionId);
}

export function createCompleteBuildingCatalog(
  factionId: FactionId,
): readonly BuildingDefinition[] {
  const ids = idsForFaction(factionId);
  const tuning = FACTION_TUNING[factionId];
  return SEEDS.map((seed) => {
    const id = ids[seed.key];
    const baseEconomy = seed.economy;
    const resourceProductionPerHour = baseEconomy?.resourceProductionPerHour;
    const tunedProduction = resourceProductionPerHour === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(resourceProductionPerHour).map(([resourceId, value]) => {
            const multiplier = resourceId === 'metal'
              ? tuning.metal
              : resourceId === 'crystal'
                ? tuning.crystal
                : tuning.gas;
            return [resourceId, Math.floor((value ?? 0) * multiplier)];
          }),
        );
    const economy = baseEconomy === undefined
      ? undefined
      : {
          ...baseEconomy,
          ...(tunedProduction === undefined
            ? {}
            : { resourceProductionPerHour: tunedProduction }),
          ...(baseEconomy.energyProduction === undefined
            ? {}
            : { energyProduction: Math.floor(baseEconomy.energyProduction * tuning.energy) }),
        };
    return {
      id,
      name: NAMES[factionId][seed.key],
      factionId,
      zoneId: seed.zoneId,
      fieldCost: 1,
      maxLevel: seed.maxLevel,
      assetId: id,
      baseCost: scaleCost(seed.cost, tuning.cost),
      baseBuildSeconds: Math.max(1, Math.ceil(seed.seconds * tuning.time)),
      requirements: seed.requirements(ids),
      ...(economy === undefined ? {} : { economy }),
      ...(seed.operations === undefined ? {} : { operations: seed.operations }),
    } satisfies BuildingDefinition;
  });
}

export const COMPLETE_BUILDING_CATALOGS: Readonly<Record<FactionId, readonly BuildingDefinition[]>> = {
  aegis: createCompleteBuildingCatalog('aegis'),
  synod: createCompleteBuildingCatalog('synod'),
  veyra: createCompleteBuildingCatalog('veyra'),
};
