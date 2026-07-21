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

const VEYRA_BUILDINGS = atlasAssets(
  [
    seed('building.veyra.swarm-heart', 'Сердце роя', 'Управление колонией'),
    seed('building.veyra.alloy-bloom', 'Сплавный цветок', 'Добыча металла'),
    seed('building.veyra.crystal-grove', 'Кристальная роща', 'Добыча кристалла'),
    seed('building.veyra.vapor-root', 'Газовый корень', 'Добыча газа'),
    seed('building.veyra.solar-membrane', 'Солнечная мембрана', 'Производство энергии'),
    seed('building.veyra.memory-pod', 'Капсула памяти', 'Исследования'),
    seed('building.veyra.living-dock', 'Живая верфь', 'Производство кораблей'),
    seed('building.veyra.pulse-canopy', 'Импульсный полог', 'Сенсоры и оборонная сеть'),
    seed('building.veyra.spore-vault', 'Споровое хранилище', 'Хранение и логистика'),
    seed('building.veyra.nest-cluster', 'Гнездовой кластер', 'Население и стабильность'),
    seed('building.veyra.hunter-node', 'Узел охотника', 'Военная координация'),
    seed('building.veyra.carapace-forge', 'Кузница панциря', 'Тяжёлая оборона'),
  ],
  'building',
  RUNTIME_ASSETS.factionVeyraBuildingsAtlasWebp,
  4,
  8,
  256,
);

const VEYRA_SHIPS = atlasAssets(
  [
    seed('ship.veyra.wisp', 'Разведчик «Огонёк»', 'Разведка'),
    seed('ship.veyra.tendril', 'Транспорт «Усик»', 'Перевозка'),
    seed('ship.veyra.sting', 'Истребитель «Жало»', 'Перехват'),
    seed('ship.veyra.shellwing', 'Фрегат «Панцирокрыл»', 'Щитовой строй'),
    seed('ship.veyra.brood-ark', 'Ковчег «Выводок»', 'Колонизация'),
    seed('ship.veyra.devourer', 'Сборщик «Поглотитель»', 'Переработка'),
    seed('ship.veyra.dart', 'Корвет «Стрекоза»', 'Сопровождение'),
    seed('ship.veyra.manta', 'Крейсер «Манта»', 'Линейный бой'),
    seed('ship.veyra.hive-carrier', 'Носитель «Улей»', 'Дальнее снабжение'),
    seed('ship.veyra.leviathan', 'Дредноут «Левиафан»', 'Флагманский бой'),
  ],
  'ship',
  RUNTIME_ASSETS.factionVeyraShipsAtlasWebp,
  3,
  6,
  512,
);

const VEYRA_DEFENSES = atlasAssets(
  [
    seed('defense.veyra.thorn-spire', 'Шиповая башня', 'Точный огонь'),
    seed('defense.veyra.spore-mortar', 'Споровый миномёт', 'Тяжёлый залп'),
    seed('defense.veyra.living-veil', 'Живая завеса', 'Щитовая защита'),
    seed('defense.veyra.snapper-node', 'Хватающий узел', 'Перехват'),
    seed('defense.veyra.hive-bastion', 'Бастион улья', 'Тяжёлая защита'),
  ],
  'defense',
  RUNTIME_ASSETS.factionVeyraDefensesAtlasWebp,
  3,
  3,
  256,
);

// A dedicated Veyra technology atlas is not delivered yet. These entries use
// deterministic frames from the native Veyra building atlas and are explicitly
// treated as temporary runtime fallbacks instead of Aegis artwork.
const VEYRA_TECHNOLOGIES = atlasAssets(
  [
    seed('technology.veyra.adaptive-growth', 'Адаптивный рост', 'Строительство'),
    seed('technology.veyra.photosynthetic-grid', 'Фотосинтетическая сеть', 'Энергетика'),
    seed('technology.veyra.echo-sense', 'Эхолокационное чувство', 'Сенсоры'),
    seed('technology.veyra.living-thrust', 'Живой импульс', 'Навигация'),
    seed('technology.veyra.carapace-weave', 'Переплетение панциря', 'Защита'),
    seed('technology.veyra.predator-instinct', 'Инстинкт хищника', 'Вооружение'),
    seed('technology.veyra.brood-seeding', 'Рассев выводка', 'Колонизация'),
    seed('technology.veyra.mycelial-logistics', 'Мицелиальная логистика', 'Логистика'),
    seed('technology.veyra.regenerative-shells', 'Регенеративная оболочка', 'Защита'),
    seed('technology.veyra.swarm-mind', 'Разум роя', 'Координация'),
  ],
  'technology',
  RUNTIME_ASSETS.factionVeyraBuildingsAtlasWebp,
  4,
  8,
  256,
);

export const VEYRA_MECHANICAL_ASSETS: readonly AegisVerticalSliceAsset[] = [
  ...VEYRA_BUILDINGS,
  ...VEYRA_SHIPS,
  ...VEYRA_DEFENSES,
  ...VEYRA_TECHNOLOGIES,
];

export const FACTION_MECHANICAL_ASSETS: readonly AegisVerticalSliceAsset[] = [
  ...AEGIS_VERTICAL_SLICE_ASSETS,
  ...SYNOD_MECHANICAL_ASSETS,
  ...VEYRA_MECHANICAL_ASSETS,
];

const ASSET_BY_ID = new Map(
  FACTION_MECHANICAL_ASSETS.map((asset) => [asset.id, asset]),
);

export function getFactionMechanicalAsset(
  assetId: string,
): AegisVerticalSliceAsset | undefined {
  return ASSET_BY_ID.get(assetId);
}
