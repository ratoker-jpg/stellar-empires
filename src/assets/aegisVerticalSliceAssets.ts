import { RUNTIME_ASSETS } from './runtimeAssets';

export type AegisAssetCategory =
  | 'building'
  | 'ship'
  | 'defense'
  | 'technology'
  | 'effect';

export interface AtlasFrame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface AegisVerticalSliceAsset {
  readonly id: string;
  readonly name: string;
  readonly category: AegisAssetCategory;
  readonly atlasUrl: string;
  readonly frame: AtlasFrame;
  readonly role: string;
  readonly stage: 'P1';
}

const frame = (x: number, y: number, width: number, height: number): AtlasFrame => ({
  x,
  y,
  width,
  height,
});

export const AEGIS_VERTICAL_SLICE_ASSETS: readonly AegisVerticalSliceAsset[] = [
  {
    id: 'building.aegis.command',
    name: 'Центр командования',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(0, 0, 256, 256),
    role: 'Управление колонией и открытие инфраструктуры',
    stage: 'P1',
  },
  {
    id: 'building.aegis.metal-extractor',
    name: 'Металлодобывающий комплекс',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(256, 0, 256, 256),
    role: 'Базовая добыча металла',
    stage: 'P1',
  },
  {
    id: 'building.aegis.crystal-refinery',
    name: 'Кристаллический завод',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(512, 0, 256, 256),
    role: 'Переработка кристалла',
    stage: 'P1',
  },
  {
    id: 'building.aegis.gas-extractor',
    name: 'Газовый экстрактор',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(768, 0, 256, 256),
    role: 'Добыча и хранение топлива',
    stage: 'P1',
  },
  {
    id: 'building.aegis.power-plant',
    name: 'Энергетический реактор',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(0, 256, 256, 256),
    role: 'Производство энергии',
    stage: 'P1',
  },
  {
    id: 'building.aegis.research-lab',
    name: 'Исследовательский центр',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(256, 256, 256, 256),
    role: 'Запуск технологий',
    stage: 'P1',
  },
  {
    id: 'building.aegis.shipyard',
    name: 'Орбитальная верфь',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(512, 256, 256, 256),
    role: 'Производство кораблей',
    stage: 'P1',
  },
  {
    id: 'building.aegis.sensor-array',
    name: 'Сенсорный комплекс',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(768, 256, 256, 256),
    role: 'Разведка и обнаружение флотов',
    stage: 'P1',
  },
  {
    id: 'building.aegis.orbital-depot',
    name: 'Орбитальный распределитель',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(0, 0, 256, 256),
    role: 'Расширение складов и орбитального снабжения',
    stage: 'P1',
  },
  {
    id: 'building.aegis.civic-core',
    name: 'Гражданский координационный узел',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(256, 256, 256, 256),
    role: 'Население и стабильность колонии',
    stage: 'P1',
  },
  {
    id: 'building.aegis.tactical-academy',
    name: 'Тактическая академия',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(768, 256, 256, 256),
    role: 'Подготовка тяжёлых боевых соединений',
    stage: 'P1',
  },
  {
    id: 'building.aegis.defense-foundry',
    name: 'Оборонная литейная',
    category: 'building',
    atlasUrl: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    frame: frame(512, 256, 256, 256),
    role: 'Производство тяжёлой планетарной обороны',
    stage: 'P1',
  },
  {
    id: 'ship.aegis.scout',
    name: 'Разведчик «Вектор»',
    category: 'ship',
    atlasUrl: RUNTIME_ASSETS.factionAegisShipsAtlas,
    frame: frame(0, 0, 512, 512),
    role: 'Быстрая разведка',
    stage: 'P1',
  },
  {
    id: 'ship.aegis.cargo',
    name: 'Транспорт «Магистраль»',
    category: 'ship',
    atlasUrl: RUNTIME_ASSETS.factionAegisShipsAtlas,
    frame: frame(512, 0, 512, 512),
    role: 'Перевозка ресурсов',
    stage: 'P1',
  },
  {
    id: 'ship.aegis.fighter',
    name: 'Истребитель «Пика»',
    category: 'ship',
    atlasUrl: RUNTIME_ASSETS.factionAegisShipsAtlas,
    frame: frame(1024, 0, 512, 512),
    role: 'Лёгкая ударная единица',
    stage: 'P1',
  },
  {
    id: 'ship.aegis.frigate',
    name: 'Фрегат «Бастион»',
    category: 'ship',
    atlasUrl: RUNTIME_ASSETS.factionAegisShipsAtlas,
    frame: frame(0, 512, 512, 512),
    role: 'Универсальный боевой корабль',
    stage: 'P1',
  },
  {
    id: 'ship.aegis.colony',
    name: 'Колонизатор «Форпост»',
    category: 'ship',
    atlasUrl: RUNTIME_ASSETS.factionAegisShipsAtlas,
    frame: frame(512, 512, 512, 512),
    role: 'Основание новой колонии',
    stage: 'P1',
  },
  {
    id: 'ship.aegis.recycler',
    name: 'Переработчик «Сборщик»',
    category: 'ship',
    atlasUrl: RUNTIME_ASSETS.factionAegisShipsAtlas,
    frame: frame(1024, 512, 512, 512),
    role: 'Сбор поля обломков',
    stage: 'P1',
  },
  {
    id: 'defense.aegis.gun-battery',
    name: 'Кинетическая батарея',
    category: 'defense',
    atlasUrl: RUNTIME_ASSETS.factionAegisDefensesAtlas,
    frame: frame(0, 0, 256, 256),
    role: 'Базовая противокорабельная оборона',
    stage: 'P1',
  },
  {
    id: 'defense.aegis.missile-battery',
    name: 'Ракетная батарея',
    category: 'defense',
    atlasUrl: RUNTIME_ASSETS.factionAegisDefensesAtlas,
    frame: frame(256, 0, 256, 256),
    role: 'Залповый урон по тяжёлым целям',
    stage: 'P1',
  },
  {
    id: 'defense.aegis.shield-generator',
    name: 'Щитовой генератор',
    category: 'defense',
    atlasUrl: RUNTIME_ASSETS.factionAegisDefensesAtlas,
    frame: frame(512, 0, 256, 256),
    role: 'Защитный слой планеты',
    stage: 'P1',
  },
  {
    id: 'technology.aegis.construction',
    name: 'Инженерные системы',
    category: 'technology',
    atlasUrl: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    frame: frame(0, 0, 256, 256),
    role: 'Скорость и уровни строительства',
    stage: 'P1',
  },
  {
    id: 'technology.aegis.energy',
    name: 'Энергосети',
    category: 'technology',
    atlasUrl: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    frame: frame(256, 0, 256, 256),
    role: 'Мощность и эффективность энергии',
    stage: 'P1',
  },
  {
    id: 'technology.aegis.propulsion',
    name: 'Импульсные двигатели',
    category: 'technology',
    atlasUrl: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    frame: frame(512, 0, 256, 256),
    role: 'Скорость флотов',
    stage: 'P1',
  },
  {
    id: 'technology.aegis.sensors',
    name: 'Сенсорные матрицы',
    category: 'technology',
    atlasUrl: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    frame: frame(0, 256, 256, 256),
    role: 'Качество разведки',
    stage: 'P1',
  },
  {
    id: 'technology.aegis.armor',
    name: 'Композитная броня',
    category: 'technology',
    atlasUrl: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    frame: frame(256, 256, 256, 256),
    role: 'Прочность кораблей и обороны',
    stage: 'P1',
  },
  {
    id: 'technology.aegis.weapons',
    name: 'Системы наведения',
    category: 'technology',
    atlasUrl: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    frame: frame(512, 256, 256, 256),
    role: 'Точность и урон вооружения',
    stage: 'P1',
  },
  {
    id: 'effect.aegis.engine',
    name: 'Импульс двигателя',
    category: 'effect',
    atlasUrl: RUNTIME_ASSETS.factionAegisEffectsAtlas,
    frame: frame(0, 0, 256, 256),
    role: 'Отображение тяги',
    stage: 'P1',
  },
  {
    id: 'effect.aegis.laser',
    name: 'Энергетический выстрел',
    category: 'effect',
    atlasUrl: RUNTIME_ASSETS.factionAegisEffectsAtlas,
    frame: frame(256, 0, 256, 256),
    role: 'Боевой снаряд',
    stage: 'P1',
  },
  {
    id: 'effect.aegis.explosion',
    name: 'Взрыв корпуса',
    category: 'effect',
    atlasUrl: RUNTIME_ASSETS.factionAegisEffectsAtlas,
    frame: frame(512, 0, 256, 256),
    role: 'Разрушение цели',
    stage: 'P1',
  },
] as const;

export const AEGIS_ASSET_ATLASES = [
  {
    id: 'aegis-buildings',
    name: 'Здания',
    url: RUNTIME_ASSETS.factionAegisBuildingsAtlas,
    count: 12,
  },
  {
    id: 'aegis-ships',
    name: 'Корабли',
    url: RUNTIME_ASSETS.factionAegisShipsAtlas,
    count: 6,
  },
  {
    id: 'aegis-defenses',
    name: 'Оборона',
    url: RUNTIME_ASSETS.factionAegisDefensesAtlas,
    count: 3,
  },
  {
    id: 'aegis-technologies',
    name: 'Технологии',
    url: RUNTIME_ASSETS.factionAegisTechnologiesAtlas,
    count: 6,
  },
  {
    id: 'aegis-effects',
    name: 'Эффекты',
    url: RUNTIME_ASSETS.factionAegisEffectsAtlas,
    count: 3,
  },
] as const;
