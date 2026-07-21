from __future__ import annotations

import re
from pathlib import Path

ROOT = Path.cwd()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    if content.count(old) != 1:
        raise RuntimeError(f"Expected exactly one match in {path}: {old[:80]!r}; got {content.count(old)}")
    write(path, content.replace(old, new, 1))


SLUGS = {
    "concord-nexus": "swarm-heart",
    "matter-weave": "alloy-bloom",
    "prism-refinery": "crystal-grove",
    "flux-well": "vapor-root",
    "resonant-core": "solar-membrane",
    "cognition-vault": "memory-pod",
    "lattice-yard": "living-dock",
    "deep-array": "pulse-canopy",
    "relay-archive": "spore-vault",
    "concord-habitat": "nest-cluster",
    "precision-forum": "hunter-node",
    "shield-foundry": "carapace-forge",
    "distributed-construction": "adaptive-growth",
    "harmonic-grid": "photosynthetic-grid",
    "deep-sight": "echo-sense",
    "vector-folding": "living-thrust",
    "coherent-shields": "carapace-weave",
    "precision-fire": "predator-instinct",
    "seed-consensus": "brood-seeding",
    "relay-logistics": "mycelial-logistics",
    "predictive-screening": "regenerative-shells",
    "chorus-command": "swarm-mind",
    "whisper": "wisp",
    "thread-carrier": "tendril",
    "lancet": "sting",
    "ward-frigate": "shellwing",
    "seed-ark": "brood-ark",
    "salvage-mind": "devourer",
    "phase-corvette": "dart",
    "chorus-cruiser": "manta",
    "relay-carrier": "hive-carrier",
    "oracle-dreadnought": "leviathan",
    "lance-node": "thorn-spire",
    "arc-silo": "spore-mortar",
    "harmonic-screen": "living-veil",
    "predictive-intercept": "snapper-node",
    "concord-bastion": "hive-bastion",
}

NAMES = {
    "Узел согласия": "Сердце роя",
    "Материальная ткацкая": "Сплавный цветок",
    "Призматический очиститель": "Кристальная роща",
    "Потоковый коллектор": "Газовый корень",
    "Резонансное ядро": "Солнечная мембрана",
    "Когнитивное хранилище": "Капсула памяти",
    "Сетевая верфь": "Живая верфь",
    "Дальняя сенсорная решётка": "Импульсный полог",
    "Архив ретрансляции": "Споровое хранилище",
    "Жилой контур согласия": "Гнездовой кластер",
    "Форум точного командования": "Узел охотника",
    "Щитовая мануфактура": "Кузница панциря",
    "Распределённая сборка": "Адаптивный рост",
    "Гармоническая энергосеть": "Фотосинтетическая сеть",
    "Глубинное зрение": "Эхолокационное чувство",
    "Свёртка векторов": "Живой импульс",
    "Когерентные щиты": "Переплетение панциря",
    "Прецизионный огонь": "Инстинкт хищника",
    "Консенсус основания": "Рассев выводка",
    "Ретрансляционная логистика": "Мицелиальная логистика",
    "Предиктивное экранирование": "Регенеративная оболочка",
    "Хоровое командование": "Разум роя",
    "Разведчик «Шёпот»": "Разведчик «Огонёк»",
    "Транспорт «Нить»": "Транспорт «Усик»",
    "Истребитель «Ланцет»": "Истребитель «Жало»",
    "Фрегат «Оберег»": "Фрегат «Панцирокрыл»",
    "Ковчег «Семя»": "Ковчег «Выводок»",
    "Сборщик «Память»": "Сборщик «Поглотитель»",
    "Корвет «Фаза»": "Корвет «Стрекоза»",
    "Крейсер «Хор»": "Крейсер «Манта»",
    "Носитель «Реле»": "Носитель «Улей»",
    "Дредноут «Оракул»": "Дредноут «Левиафан»",
    "Узел направленного импульса": "Шиповая башня",
    "Дуговой пусковой узел": "Споровый миномёт",
    "Гармонический экран": "Живая завеса",
    "Предиктивный перехватчик": "Хватающий узел",
    "Бастион согласия": "Бастион улья",
}

PHRASES = {
    "согласованную инфраструктуру": "саморастущую инфраструктуру",
    "согласованной атакующей группе": "быстрой охотничьей стае",
    "согласованные перелёты": "перелёты живых кораблей",
    "согласованный цикл": "единый инстинктивный цикл",
    "общую сеть": "роевой разум",
    "сетевой транспорт": "живой транспорт",
    "сетевых операций": "роевых операций",
    "соседних кораблей": "кораблей одной стаи",
    "защитной телеметрией": "регенеративными импульсами",
    "когнитив": "органическ",
    "прогноз вражеских огневых решений": "рефлекторную реакцию на вражеский огонь",
}


def transform_synod_text(content: str) -> str:
    content = content.replace("SYNOD", "VEYRA").replace("Synod", "Veyra").replace("synod", "veyra")
    for old, new in sorted(SLUGS.items(), key=lambda item: len(item[0]), reverse=True):
        content = content.replace(old, new)
    for old, new in NAMES.items():
        content = content.replace(old, new)
    for old, new in PHRASES.items():
        content = content.replace(old, new)
    return content


def parse_int(value: str) -> int:
    return int(value.replace("_", ""))


def format_int(value: int) -> str:
    return f"{value:_}" if value >= 1000 else str(value)


def rounded(value: float, step: int = 5) -> int:
    return max(step, int(round(value / step) * step))


def tune_veyra_catalog(content: str) -> str:
    def cost(match: re.Match[str]) -> str:
        metal = rounded(parse_int(match.group(1)) * 0.90)
        crystal = rounded(parse_int(match.group(2)) * 1.05)
        gas = rounded(parse_int(match.group(3)) * 1.12)
        return f"baseCost: {{ metal: {format_int(metal)}, crystal: {format_int(crystal)}, gas: {format_int(gas)} }}"

    content = re.sub(
        r"baseCost: \{ metal: ([\d_]+), crystal: ([\d_]+), gas: ([\d_]+) \}",
        cost,
        content,
    )

    def duration(match: re.Match[str]) -> str:
        return f"{match.group(1)}{format_int(rounded(parse_int(match.group(2)) * 0.88))}"

    content = re.sub(r"(baseBuildSeconds: )([\d_]+)", duration, content)
    content = re.sub(r"(baseSeconds: )([\d_]+)", duration, content)

    def stats(match: re.Match[str]) -> str:
        speed = parse_int(match.group(1))
        cargo = parse_int(match.group(2))
        attack = parse_int(match.group(3))
        armor = parse_int(match.group(4))
        shield = parse_int(match.group(5))
        tuned_speed = speed + 2 if speed > 0 else 0
        return (
            "stats: { "
            f"speed: {format_int(tuned_speed)}, "
            f"cargo: {format_int(max(0, rounded(cargo * 1.15, 1)))}, "
            f"attack: {format_int(max(0, rounded(attack * 1.08, 1)))}, "
            f"armor: {format_int(max(1, rounded(armor * 0.82, 1)))}, "
            f"shield: {format_int(max(1, rounded(shield * 0.90, 1)))} "
            "}"
        )

    content = re.sub(
        r"stats: \{ speed: ([\d_]+), cargo: ([\d_]+), attack: ([\d_]+), armor: ([\d_]+), shield: ([\d_]+) \}",
        stats,
        content,
    )

    content = content.replace("{ type: 'CONSTRUCTION_SPEED', percentPerLevel: 6 }", "{ type: 'CONSTRUCTION_SPEED', percentPerLevel: 8 }")
    content = content.replace("{ type: 'ENERGY_OUTPUT', percentPerLevel: 7 }", "{ type: 'ENERGY_OUTPUT', percentPerLevel: 5 }")
    content = content.replace("{ type: 'FLEET_SPEED', percentPerLevel: 6 }", "{ type: 'FLEET_SPEED', percentPerLevel: 8 }")
    content = content.replace("{ type: 'FLEET_SPEED', percentPerLevel: 4 }", "{ type: 'FLEET_SPEED', percentPerLevel: 6 }")
    content = content.replace("{ type: 'ARMOR_STRENGTH', percentPerLevel: 4 }", "{ type: 'ARMOR_STRENGTH', percentPerLevel: 3 }")
    content = content.replace("{ type: 'WEAPON_STRENGTH', percentPerLevel: 6 }", "{ type: 'WEAPON_STRENGTH', percentPerLevel: 7 }")
    content = content.replace("{ type: 'WEAPON_STRENGTH', percentPerLevel: 4 }", "{ type: 'WEAPON_STRENGTH', percentPerLevel: 5 }")
    return content


# Native Veyra catalog.
synod_catalog = read("src/simulation/factions/synodMechanicalCatalog.ts")
veyra_catalog = tune_veyra_catalog(transform_synod_text(synod_catalog))
write("src/simulation/factions/veyraMechanicalCatalog.ts", veyra_catalog)

# Manifest and central registry.
replace_once(
    "src/simulation/factions/factionCatalogManifest.ts",
    "  veyra: {\n    factionId: 'veyra',\n    sourceFactionId: 'aegis',\n    mode: 'legacy-alias',\n    migrationPolicy: 'replace-legacy-aliases',\n  },",
    "  veyra: {\n    factionId: 'veyra',\n    sourceFactionId: 'veyra',\n    mode: 'native',\n    migrationPolicy: 'replace-legacy-aliases',\n  },",
)

registry_path = "src/simulation/factions/factionMechanicalCatalogRegistry.ts"
registry = read(registry_path)
registry = registry.replace(
    "} from './synodMechanicalCatalog';\n",
    "} from './synodMechanicalCatalog';\nimport {\n  VEYRA_BUILDING_CATALOG,\n  VEYRA_RESEARCH_CATALOG,\n  VEYRA_UNIT_CATALOG,\n} from './veyraMechanicalCatalog';\n",
    1,
)
registry = registry.replace(
    "  synod: {\n    sourceFactionId: 'synod',\n    buildings: SYNOD_BUILDING_CATALOG,\n    research: SYNOD_RESEARCH_CATALOG,\n    units: SYNOD_UNIT_CATALOG,\n  },\n};",
    "  synod: {\n    sourceFactionId: 'synod',\n    buildings: SYNOD_BUILDING_CATALOG,\n    research: SYNOD_RESEARCH_CATALOG,\n    units: SYNOD_UNIT_CATALOG,\n  },\n  veyra: {\n    sourceFactionId: 'veyra',\n    buildings: VEYRA_BUILDING_CATALOG,\n    research: VEYRA_RESEARCH_CATALOG,\n    units: VEYRA_UNIT_CATALOG,\n  },\n};",
    1,
)
write(registry_path, registry)

# Mechanical role registry.
roles_path = "src/simulation/factions/factionMechanicalRoles.ts"
roles = read(roles_path)
synod_start = roles.index("  synod: {")
synod_end = roles.index("\n  },\n};", synod_start) + len("\n  },")
synod_role_block = roles[synod_start:synod_end]
veyra_role_block = transform_synod_text(synod_role_block)
roles = roles[:synod_end] + "\n" + veyra_role_block + roles[synod_end:]
write(roles_path, roles)

# Runtime mechanical assets and honest Veyra-only technology fallback.
assets_path = "src/assets/factionMechanicalAssets.ts"
assets = read(assets_path)
section_start = assets.index("const SYNOD_BUILDINGS")
section_end = assets.index("\nexport const FACTION_MECHANICAL_ASSETS")
synod_asset_section = assets[section_start:section_end]
veyra_asset_section = transform_synod_text(synod_asset_section)
assets = assets[:section_end] + "\n" + veyra_asset_section + assets[section_end:]
assets = assets.replace(
    "  ...AEGIS_VERTICAL_SLICE_ASSETS,\n  ...SYNOD_MECHANICAL_ASSETS,\n];",
    "  ...AEGIS_VERTICAL_SLICE_ASSETS,\n  ...SYNOD_MECHANICAL_ASSETS,\n  ...VEYRA_MECHANICAL_ASSETS,\n];",
    1,
)
write(assets_path, assets)

bind_path = "src/assets/bindFactionRuntimeAssets.ts"
bind = read(bind_path)
bind = bind.replace(
    "import { SYNOD_MECHANICAL_ASSETS } from './factionMechanicalAssets';",
    "import { SYNOD_MECHANICAL_ASSETS, VEYRA_MECHANICAL_ASSETS } from './factionMechanicalAssets';",
    1,
)
bind = bind.replace(
    "  const assets = factionId === 'synod'\n    ? SYNOD_MECHANICAL_ASSETS\n    : AEGIS_VERTICAL_SLICE_ASSETS;",
    "  const assets = factionId === 'synod'\n    ? SYNOD_MECHANICAL_ASSETS\n    : factionId === 'veyra'\n      ? VEYRA_MECHANICAL_ASSETS\n      : AEGIS_VERTICAL_SLICE_ASSETS;",
    1,
)
bind = bind.replace(
    "    if (factionId === 'synod' && asset.category === 'technology') {",
    "    if ((factionId === 'synod' || factionId === 'veyra') && asset.category === 'technology') {",
    1,
)
write(bind_path, bind)

# Veyra combat profiles: fast organic hulls with lighter protection and plasma-biased weapons.
combat_path = "src/simulation/combat/combatProfiles.ts"
combat = read(combat_path)
combat_start = combat.index("  'ship.synod.whisper':")
combat_end = combat.index("\n};", combat_start)
synod_profiles = combat[combat_start:combat_end]
veyra_profiles = transform_synod_text(synod_profiles)
veyra_profiles = veyra_profiles.replace("weaponType: 'disruptor'", "weaponType: 'plasma'")
veyra_profiles = veyra_profiles.replace("protectionType: 'shield-grid'", "protectionType: 'light-armor'")
veyra_profiles = veyra_profiles.replace(
    "'defense.veyra.living-veil': { weaponType: 'plasma', protectionType: 'light-armor'",
    "'defense.veyra.living-veil': { weaponType: 'plasma', protectionType: 'shield-grid'",
)
veyra_profiles = veyra_profiles.replace(
    "'defense.veyra.hive-bastion': { weaponType: 'plasma', protectionType: 'light-armor'",
    "'defense.veyra.hive-bastion': { weaponType: 'plasma', protectionType: 'fortified'",
)
combat = combat[:combat_end] + "\n" + veyra_profiles + combat[combat_end:]
write(combat_path, combat)

# Deterministic alias-era save migration.
synod_migration = read("src/storage/migrateLegacySynodAliases.ts")
write("src/storage/migrateLegacyVeyraAliases.ts", transform_synod_text(synod_migration))

migration_path = "src/storage/migrateGameStateV13.ts"
migration = read(migration_path)
migration = migration.replace(
    "import { migrateLegacySynodAliases } from './migrateLegacySynodAliases';",
    "import { migrateLegacySynodAliases } from './migrateLegacySynodAliases';\nimport { migrateLegacyVeyraAliases } from './migrateLegacyVeyraAliases';",
    1,
)
migration = migration.replace(
    "  return migrateLegacySynodAliases({\n    ...migrated,\n    schemaVersion: 13,\n    shipUpgrades,\n    commanders,\n  });",
    "  return migrateLegacyVeyraAliases(migrateLegacySynodAliases({\n    ...migrated,\n    schemaVersion: 13,\n    shipUpgrades,\n    commanders,\n  }));",
    1,
)
write(migration_path, migration)

# Regression coverage based on the native Synod acceptance suite.
synod_test = read("tests/simulation/synodNativeCatalog.test.ts")
veyra_test = transform_synod_text(synod_test)
veyra_test = veyra_test.replace(
    "      weaponType: 'disruptor',\n      protectionType: 'shield-grid',",
    "      weaponType: 'plasma',\n      protectionType: 'light-armor',",
    1,
)
write("tests/simulation/veyraNativeCatalog.test.ts", veyra_test)

registry_test_path = "tests/simulation/factionMechanicalCatalogRegistry.test.ts"
registry_test = read(registry_test_path)
registry_test = registry_test.replace(
    "  it('makes native and temporary alias catalogs explicit through the manifest', () => {",
    "  it('makes all native catalogs explicit through the manifest', () => {",
    1,
)
registry_test = registry_test.replace(
    "    expect(hasNativeMechanicalCatalog('veyra')).toBe(false);",
    "    expect(getFactionCatalogManifest('veyra')).toMatchObject({ mode: 'native', sourceFactionId: 'veyra' });\n    expect(hasNativeMechanicalCatalog('veyra')).toBe(true);",
    1,
)
match = re.search(
    r"\n  it\('registers a complete native Synod catalog', \(\) => \{.*?\n  \}\);",
    registry_test,
    re.DOTALL,
)
if match is None:
    raise RuntimeError("Could not locate native Synod registry test")
veyra_registry_test = transform_synod_text(match.group(0))
registry_test = registry_test[:match.end()] + veyra_registry_test + registry_test[match.end():]
write(registry_test_path, registry_test)

bind_test_path = "src/assets/bindFactionRuntimeAssets.test.ts"
bind_test = read(bind_test_path)
bind_test = bind_test.replace(
    "import { SYNOD_MECHANICAL_ASSETS } from './factionMechanicalAssets';",
    "import { SYNOD_MECHANICAL_ASSETS, VEYRA_MECHANICAL_ASSETS } from './factionMechanicalAssets';",
    1,
)
old_alias_test = """  it('keeps Veyra alias technology and effect assets on their explicit fallback', () => {\n    bindFactionRuntimeAssets('veyra');\n\n    expect(AEGIS_VERTICAL_SLICE_ASSETS.find((asset) => asset.category === 'technology')?.atlasUrl)\n      .toMatch(/aegis\\/p1\\/technologies-atlas\\.svg$/);\n    expect(AEGIS_VERTICAL_SLICE_ASSETS.find((asset) => asset.category === 'effect')?.atlasUrl)\n      .toMatch(/aegis\\/p1\\/effects-atlas\\.svg$/);\n  });"""
new_native_tests = """  it('binds native Veyra mechanical entries to Veyra atlases', () => {\n    bindFactionRuntimeAssets('veyra');\n\n    expect(VEYRA_MECHANICAL_ASSETS.find((asset) => asset.category === 'building')?.atlasUrl)\n      .toMatch(/veyra\\/p1\\/buildings-atlas\\.webp$/);\n    expect(VEYRA_MECHANICAL_ASSETS.find((asset) => asset.category === 'ship')?.atlasUrl)\n      .toMatch(/veyra\\/p1\\/ships-atlas\\.webp$/);\n    expect(VEYRA_MECHANICAL_ASSETS.find((asset) => asset.category === 'defense')?.atlasUrl)\n      .toMatch(/veyra\\/p1\\/defenses-atlas\\.webp$/);\n  });\n\n  it('keeps the documented Veyra technology fallback on Veyra artwork', () => {\n    bindFactionRuntimeAssets('veyra');\n    expect(VEYRA_MECHANICAL_ASSETS.find((asset) => asset.category === 'technology')?.atlasUrl)\n      .toMatch(/veyra\\/p1\\/buildings-atlas\\.webp$/);\n  });"""
if old_alias_test not in bind_test:
    raise RuntimeError("Could not locate Veyra alias asset test")
bind_test = bind_test.replace(old_alias_test, new_native_tests, 1)
write(bind_test_path, bind_test)

# Native catalog contract documentation.
write(
    "docs/22-native-veyra-catalog.md",
    """# Native Veyra mechanical catalog\n\n**Status:** Delivered by PR #81  \n**Date:** 2026-07-21\n\n## Scope\n\nVeyra now has a complete native mechanical namespace at the same prototype depth as Aegis and Synod:\n\n- 12 buildings;\n- 10 technologies;\n- 10 ships;\n- 5 planetary defenses.\n\nThe manifest resolves `veyra` through a native source catalog. New games, colonies, queues, fleets, combat, upgrades, bots and UI therefore use `building.veyra.*`, `technology.veyra.*`, `ship.veyra.*` and `defense.veyra.*` IDs.\n\n## Mechanical identity\n\nVeyra is the fast adaptive faction:\n\n- shorter construction, research and production times;\n- stronger mobility and cargo throughput;\n- lighter armor and shields than Aegis and Synod;\n- plasma-biased organic combat profiles;\n- research emphasis on adaptive growth, living propulsion, regeneration and swarm coordination.\n\nThe catalog uses original names, values and descriptions. It does not copy Nemexia factions or balance.\n\n## Shared runtime\n\nThe existing faction registry and role paths resolve Veyra definitions for:\n\n- starting buildings and planet economy;\n- laboratory, shipyard, hangar, sensors and defense-grid capacity;\n- research and production commands;\n- scout, recycle, colonize, expedition and strategic-object missions;\n- combat profiles and ship upgrades;\n- economy, research, production, fleet and recovery bot planners;\n- planet, research and production presentation.\n\n## Save migration\n\n`migrateLegacyVeyraAliases` deterministically maps alias-era Aegis IDs only inside Veyra-owned contexts. It covers buildings, queues, research, inventory, defenses, fleets, upgrades, intelligence snapshots, pending events and logs, then recalculates affected planet economies. Aegis and Synod contexts are not rewritten.\n\n## Runtime assets\n\nVeyra buildings, ships and defenses use the committed Veyra atlases. Until a dedicated Veyra technology atlas exists, technology cards use deterministic frames from the Veyra building atlas. This fallback is explicit and never displays Aegis technology art.\n\n## Verification\n\nRegression coverage verifies:\n\n- native manifest and catalog validation;\n- 12/10/10/5 catalog counts;\n- valid starting economy;\n- building, research, ship and defense queues;\n- faction role capacities;\n- scout, recycle and colonize missions;\n- combat and bot command paths;\n- Veyra-only planet view models;\n- deterministic alias-save migration and round-trip persistence;\n- Veyra runtime atlas binding.\n""",
)

print("PR #81 native Veyra patch applied")
