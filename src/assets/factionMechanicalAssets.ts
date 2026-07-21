import {
  AEGIS_VERTICAL_SLICE_ASSETS,
  type AegisVerticalSliceAsset,
  type AtlasFrame,
} from './aegisVerticalSliceAssets';
import { RUNTIME_ASSETS } from './runtimeAssets';

const frame = (x: number, y: number, width: number, height: number): AtlasFrame => ({
  x,
  y,
  width,
  height,
});

interface MechanicalAssetSeed {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

function atlasAssets(
  seeds: readonly MechanicalAssetSeed[],
  category: AegisVerticalSliceAsset['category'],
  atlasUrl: string,
  columns: number,
  availableFrames: number,
  cellSize: number,
): readonly AegisVerticalSliceAsset[] {
  return seeds.map((seed, index) => {
    const frameIndex = index % availableFrames;
    return {
      ...seed,
      category,
      atlasUrl,
      frame: frame(
        (frameIndex % columns) * cellSize,
        Math.floor(frameIndex / columns) * cellSize,
        cellSize,
        cellSize,
      ),
      stage: 'P1',
    };
  });
}

const SYNOD_BUILDINGS = atlasAssets(
  [
    ['building.synod.concord-nexus', 'Узел согласия', 'Управление колонией'],
    ['building.synod.matter-weave', 'Материальная ткацкая', 'Добыча металла'],
    ['building.synod.prism-refinery', 'Призматический очиститель', 'Добыча кристалла'],
    ['building.synod.flux-well', 'Потоковый коллектор', 'Добыча газа'],
    ['building.synod.resonant-core', 'Резонансное ядро', 'Производство энергии'],
    ['building.synod.cognition-vault', 'Когнитивное хранилище', 'Исследования'],
    ['building.synod.lattice-yard', 'Сетевая верфь', 'Производство кораблей'],
    ['building.synod.deep-array', 'Дальняя сенсорная решётка', 'Сенсоры и оборонная сеть'],
    ['building.synod.relay-archive', 'Архив ретрансляции', 'Хранение и логистика'],
    ['building.synod.concord-habitat', 'Жилой контур согласия', 'Население и стабильность'],
    ['building.synod.precision-forum', 'Форум точного командования', 'Военная координация'],
    ['building.synod.shield-foundry', 'Щитовая мануфактура', 'Тяжёлая оборона'],
  ].map(([id, name, role]) => ({ id, name, role })),
  'building',
  RUNTIME_ASSETS.factionSynodBuildingsAtlasWebp,
  4,
  8,
  256,
);

const SYNOD_SHIPS = atlasAssets(
  [
    ['ship.synod.whisper', 'Разведчик «Шёпот»', 'Разведка'],
    ['ship.synod.thread-carrier', 'Транспорт «Нить»', 'Перевозка'],
    ['ship.synod.lancet', 'Истребитель «Ланцет»', 'Перехват'],
    ['ship.synod.ward-frigate', 'Фрегат «Оберег»', 'Щитовой строй'],
    ['ship.synod.seed-ark', 'Ковчег «Семя»', 'Колонизация'],
    ['ship.synod.salvage-mind', 'Сборщик «Память»', 'Переработка'],
    ['ship.synod.phase-corvette', 'Корвет «Фаза»', 'Сопровождение'],
    ['ship.synod.chorus-cruiser', 'Крейсер «Хор»', 'Линейный бой'],
    ['ship.synod.relay-carrier', 'Носитель «Реле»', 'Дальнее снабжение'],
    ['ship.synod.oracle-dreadnought', 'Дредноут «Оракул»', 'Флагманский бой'],
  ].map(([id, name, role]) => ({ id, name, role })),
  'ship',
  RUNTIME_ASSETS.factionSynodShipsAtlasWebp,
  3,
  6,
  512,
);

const SYNOD_DEFENSES = atlasAssets(
  [
    ['defense.synod.lance-node', 'Узел направленного импульса', 'Точный огонь'],
    ['defense.synod.arc-silo', 'Дуговой пусковой узел', 'Тяжёлый залп'],
    ['defense.synod.harmonic-screen', 'Гармонический экран', 'Щитовая защита'],
    ['defense.synod.predictive-intercept', 'Предиктивный перехватчик', 'Перехват'],
    ['defense.synod.concord-bastion', 'Бастион согласия', 'Тяжёлая защита'],
  ].map(([id, name, role]) => ({ id, name, role })),
  'defense',
  RUNTIME_ASSETS.factionSynodDefensesAtlasWebp,
  3,
  3,
  256,
);

// A dedicated Synod technology atlas is not delivered yet. These entries use
// deterministic frames from the native Synod building atlas and are explicitly
// treated as temporary runtime fallbacks instead of Aegis artwork.
const SYNOD_TECHNOLOGIES = atlasAssets(
  [
    ['technology.synod.distributed-construction', 'Распределённая сборка', 'Строительство'],
    ['technology.synod.harmonic-grid', 'Гармоническая энергосеть', 'Энергетика'],
    ['technology.synod.deep-sight', 'Глубинное зрение', 'Сенсоры'],
    ['technology.synod.vector-folding', 'Свёртка векторов', 'Навигация'],
    ['technology.synod.coherent-shields', 'Когерентные щиты', 'Защита'],
    ['technology.synod.precision-fire', 'Прецизионный огонь', 'Вооружение'],
    ['technology.synod.seed-consensus', 'Консенсус основания', 'Колонизация'],
    ['technology.synod.relay-logistics', 'Ретрансляционная логистика', 'Логистика'],
    ['technology.synod.predictive-screening', 'Предиктивное экранирование', 'Защита'],
    ['technology.synod.chorus-command', 'Хоровое командование', 'Координация'],
  ].map(([id, name, role]) => ({ id, name, role })),
  'technology',
  RUNTIME_ASSETS.factionSynodBuildingsAtlasWebp,
  4,
  8,
  256,
);

export const SYNOD_MECHANICAL_ASSETS: readonly AegisVerticalSliceAsset[] = [
  ...SYNOD_BUILDINGS,
  ...SYNOD_SHIPS,
  ...SYNOD_DEFENSES,
  ...SYNOD_TECHNOLOGIES,
];

export const FACTION_MECHANICAL_ASSETS: readonly AegisVerticalSliceAsset[] = [
  ...AEGIS_VERTICAL_SLICE_ASSETS,
  ...SYNOD_MECHANICAL_ASSETS,
];

const ASSET_BY_ID = new Map(
  FACTION_MECHANICAL_ASSETS.map((asset) => [asset.id, asset]),
);

export function getFactionMechanicalAsset(
  assetId: string,
): AegisVerticalSliceAsset | undefined {
  return ASSET_BY_ID.get(assetId);
}
