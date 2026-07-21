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

const seed = (id: string, name: string, role: string): MechanicalAssetSeed => ({
  id,
  name,
  role,
});

function atlasAssets(
  seeds: readonly MechanicalAssetSeed[],
  category: AegisVerticalSliceAsset['category'],
  atlasUrl: string,
  columns: number,
  availableFrames: number,
  cellSize: number,
): readonly AegisVerticalSliceAsset[] {
  return seeds.map((assetSeed, index) => {
    const frameIndex = index % availableFrames;
    return {
      ...assetSeed,
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
    seed('building.synod.concord-nexus', 'Узел согласия', 'Управление колонией'),
    seed('building.synod.matter-weave', 'Материальная ткацкая', 'Добыча металла'),
    seed('building.synod.prism-refinery', 'Призматический очиститель', 'Добыча кристалла'),
    seed('building.synod.flux-well', 'Потоковый коллектор', 'Добыча газа'),
    seed('building.synod.resonant-core', 'Резонансное ядро', 'Производство энергии'),
    seed('building.synod.cognition-vault', 'Когнитивное хранилище', 'Исследования'),
    seed('building.synod.lattice-yard', 'Сетевая верфь', 'Производство кораблей'),
    seed('building.synod.deep-array', 'Дальняя сенсорная решётка', 'Сенсоры и оборонная сеть'),
    seed('building.synod.relay-archive', 'Архив ретрансляции', 'Хранение и логистика'),
    seed('building.synod.concord-habitat', 'Жилой контур согласия', 'Население и стабильность'),
    seed('building.synod.precision-forum', 'Форум точного командования', 'Военная координация'),
    seed('building.synod.shield-foundry', 'Щитовая мануфактура', 'Тяжёлая оборона'),
  ],
  'building',
  RUNTIME_ASSETS.factionSynodBuildingsAtlasWebp,
  4,
  8,
  256,
);

const SYNOD_SHIPS = atlasAssets(
  [
    seed('ship.synod.whisper', 'Разведчик «Шёпот»', 'Разведка'),
    seed('ship.synod.thread-carrier', 'Транспорт «Нить»', 'Перевозка'),
    seed('ship.synod.lancet', 'Истребитель «Ланцет»', 'Перехват'),
    seed('ship.synod.ward-frigate', 'Фрегат «Оберег»', 'Щитовой строй'),
    seed('ship.synod.seed-ark', 'Ковчег «Семя»', 'Колонизация'),
    seed('ship.synod.salvage-mind', 'Сборщик «Память»', 'Переработка'),
    seed('ship.synod.phase-corvette', 'Корвет «Фаза»', 'Сопровождение'),
    seed('ship.synod.chorus-cruiser', 'Крейсер «Хор»', 'Линейный бой'),
    seed('ship.synod.relay-carrier', 'Носитель «Реле»', 'Дальнее снабжение'),
    seed('ship.synod.oracle-dreadnought', 'Дредноут «Оракул»', 'Флагманский бой'),
  ],
  'ship',
  RUNTIME_ASSETS.factionSynodShipsAtlasWebp,
  3,
  6,
  512,
);

const SYNOD_DEFENSES = atlasAssets(
  [
    seed('defense.synod.lance-node', 'Узел направленного импульса', 'Точный огонь'),
    seed('defense.synod.arc-silo', 'Дуговой пусковой узел', 'Тяжёлый залп'),
    seed('defense.synod.harmonic-screen', 'Гармонический экран', 'Щитовая защита'),
    seed('defense.synod.predictive-intercept', 'Предиктивный перехватчик', 'Перехват'),
    seed('defense.synod.concord-bastion', 'Бастион согласия', 'Тяжёлая защита'),
  ],
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
    seed('technology.synod.distributed-construction', 'Распределённая сборка', 'Строительство'),
    seed('technology.synod.harmonic-grid', 'Гармоническая энергосеть', 'Энергетика'),
    seed('technology.synod.deep-sight', 'Глубинное зрение', 'Сенсоры'),
    seed('technology.synod.vector-folding', 'Свёртка векторов', 'Навигация'),
    seed('technology.synod.coherent-shields', 'Когерентные щиты', 'Защита'),
    seed('technology.synod.precision-fire', 'Прецизионный огонь', 'Вооружение'),
    seed('technology.synod.seed-consensus', 'Консенсус основания', 'Колонизация'),
    seed('technology.synod.relay-logistics', 'Ретрансляционная логистика', 'Логистика'),
    seed('technology.synod.predictive-screening', 'Предиктивное экранирование', 'Защита'),
    seed('technology.synod.chorus-command', 'Хоровое командование', 'Координация'),
  ],
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
