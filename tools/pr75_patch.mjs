import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function write(path, content) {
  fs.mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(path, content);
}

function replaceOnce(path, from, to) {
  const content = read(path);
  if (!content.includes(from)) {
    throw new Error(`Expected fragment missing in ${path}: ${from.slice(0, 120)}`);
  }
  write(path, content.replace(from, to));
}

replaceOnce(
  'src/simulation/reducer.ts',
  "import {\n  cancelDefenseRepair,",
  "import { assignFlagship, setCommandDoctrine } from './command/commandDoctrine';\nimport {\n  cancelDefenseRepair,",
);
replaceOnce(
  'src/simulation/reducer.ts',
  "    case 'SET_FLEET_COMBAT_DOCTRINE': return setFleetCombatDoctrine(state, command);\n    case 'SEND_FLEET':",
  "    case 'SET_FLEET_COMBAT_DOCTRINE': return setFleetCombatDoctrine(state, command);\n    case 'SET_COMMAND_DOCTRINE': return setCommandDoctrine(state, command);\n    case 'ASSIGN_FLAGSHIP': return assignFlagship(state, command);\n    case 'SEND_FLEET':",
);

replaceOnce(
  'src/storage/migrateGameStateV13.ts',
  "import { createInitialShipUpgradeStates } from '../simulation/upgrades/shipUpgrades';",
  "import {\n  calculateCommandLevel,\n  createInitialCommandStates,\n  isCommandDoctrineId,\n} from '../simulation/command/commandDoctrine';\nimport type { EmpireCommandState } from '../simulation/command/types';\nimport { createInitialShipUpgradeStates } from '../simulation/upgrades/shipUpgrades';",
);
replaceOnce(
  'src/storage/migrateGameStateV13.ts',
  "export function migrateGameStateV13(value: unknown): GameState | undefined {",
  `function readCommandStates(\n  value: unknown,\n  empireIds: readonly string[],\n): readonly EmpireCommandState[] | undefined {\n  if (value === undefined) return createInitialCommandStates(empireIds);\n  if (!Array.isArray(value)) return undefined;\n  const states: EmpireCommandState[] = [];\n  for (const item of value) {\n    if (\n      !isRecord(item) ||\n      typeof item.empireId !== 'string' ||\n      !isCommandDoctrineId(item.doctrineId) ||\n      !isNonNegativeInteger(item.experience) ||\n      (item.flagshipFleetId !== null && typeof item.flagshipFleetId !== 'string')\n    ) {\n      return undefined;\n    }\n    states.push({\n      empireId: item.empireId,\n      doctrineId: item.doctrineId,\n      experience: item.experience,\n      level: calculateCommandLevel(item.experience),\n      flagshipFleetId: item.flagshipFleetId,\n    });\n  }\n  return empireIds.map(\n    (empireId) =>\n      states.find((state) => state.empireId === empireId) ?? {\n        empireId,\n        doctrineId: 'adaptive',\n        experience: 0,\n        level: 1,\n        flagshipFleetId: null,\n      },\n  );\n}\n\nexport function migrateGameStateV13(value: unknown): GameState | undefined {`,
);
replaceOnce(
  'src/storage/migrateGameStateV13.ts',
  "  const shipUpgrades = readShipUpgradeStates(value.shipUpgrades, empireIds);\n  if (shipUpgrades === undefined) return undefined;",
  "  const shipUpgrades = readShipUpgradeStates(value.shipUpgrades, empireIds);\n  const commanders = readCommandStates(value.commanders, empireIds);\n  if (shipUpgrades === undefined || commanders === undefined) return undefined;",
);
replaceOnce(
  'src/storage/migrateGameStateV13.ts',
  "    shipUpgrades,\n  };",
  "    shipUpgrades,\n    commanders,\n  };",
);

replaceOnce(
  'src/storage/saveFormat.ts',
  "import { createStateChecksum } from '../simulation/checksum';",
  "import { createStateChecksum } from '../simulation/checksum';\nimport { COMMAND_MAX_LEVEL, isCommandDoctrineId } from '../simulation/command/commandDoctrine';",
);
replaceOnce(
  'src/storage/saveFormat.ts',
  "function isFleetLocation(value: unknown): boolean {",
  `function isCommandState(value: unknown): boolean {\n  return isRecord(value) && typeof value.empireId === 'string' &&\n    isCommandDoctrineId(value.doctrineId) && isNonNegativeInteger(value.experience) &&\n    isPositiveInteger(value.level) && value.level <= COMMAND_MAX_LEVEL &&\n    (value.flagshipFleetId === null || typeof value.flagshipFleetId === 'string');\n}\nfunction isFleetLocation(value: unknown): boolean {`,
);
replaceOnce(
  'src/storage/saveFormat.ts',
  "    value.shipUpgrades.every(isShipUpgradeState) && value.shipUpgrades.length === value.empires.length &&\n    Array.isArray(value.fleets)",
  "    value.shipUpgrades.every(isShipUpgradeState) && value.shipUpgrades.length === value.empires.length &&\n    Array.isArray(value.commanders) && value.commanders.every(isCommandState) &&\n    value.commanders.length === value.empires.length && Array.isArray(value.fleets)",
);

replaceOnce(
  'src/simulation/combat/resolveAttackMission.ts',
  "import type { ResourceCost } from '../economy/types';",
  "import {\n  awardBattleCommandExperience,\n  getCommandCombatEffects,\n} from '../command/commandDoctrine';\nimport type { ResourceCost } from '../economy/types';",
);
replaceOnce(
  'src/simulation/combat/resolveAttackMission.ts',
  "  units: Readonly<Record<string, number>>,\n) {\n  const research",
  "  units: Readonly<Record<string, number>>,\n  fleetId?: string,\n) {\n  const research",
);
replaceOnce(
  'src/simulation/combat/resolveAttackMission.ts',
  "  return {\n    weaponBonusPercent: effects?.weaponStrengthPercent ?? 0,\n    armorBonusPercent: effects?.armorStrengthPercent ?? 0,",
  "  const command = getCommandCombatEffects(state.commanders, empireId, fleetId);\n  return {\n    weaponBonusPercent: (effects?.weaponStrengthPercent ?? 0) + command.weaponBonusPercent,\n    armorBonusPercent: (effects?.armorStrengthPercent ?? 0) + command.armorBonusPercent,",
);
replaceOnce(
  'src/simulation/combat/resolveAttackMission.ts',
  "      ...getCombatEffects(state, attackerFleet.empireId, attackerFleet.ships),",
  "      ...getCombatEffects(state, attackerFleet.empireId, attackerFleet.ships, attackerFleet.id),",
);
replaceOnce(
  'src/simulation/combat/resolveAttackMission.ts',
  "      ...getCombatEffects(state, target.ownerEmpireId, effectiveDefenderUnits),",
  "      ...getCombatEffects(state, target.ownerEmpireId, effectiveDefenderUnits, defenderDoctrine?.id),",
);
replaceOnce(
  'src/simulation/combat/resolveAttackMission.ts',
  "      fleets,\n      debrisFields,",
  "      fleets,\n      debrisFields,\n      commanders: awardBattleCommandExperience(state.commanders, report),",
);

replaceOnce(
  'src/main.ts',
  "import { mountCommandRankingScreen } from './ui/commandRankingScreen';",
  "import { mountCommandDoctrineScreen } from './ui/commandDoctrineScreen';\nimport { mountCommandRankingScreen } from './ui/commandRankingScreen';",
);
replaceOnce(
  'src/main.ts',
  "  mountCommandRankingScreen({ getState: () => runtimeState });\n  mountResearchScreen",
  "  mountCommandRankingScreen({ getState: () => runtimeState });\n  mountCommandDoctrineScreen(commandBridge);\n  mountResearchScreen",
);

write('src/ui/commandDoctrineScreen.ts', `import '../styles/commandDoctrine.css';\nimport {\n  COMMAND_DOCTRINES,\n  COMMAND_LEVEL_THRESHOLDS,\n  FLAGSHIP_UNLOCK_LEVEL,\n  getEmpireCommandState,\n} from '../simulation/command/commandDoctrine';\nimport type { CommandDoctrineId } from '../simulation/command/types';\nimport type { GameCommand, GameState } from '../simulation/types';\n\ninterface CommandDoctrineBridge {\n  readonly getState: () => GameState;\n  readonly execute: (command: GameCommand, successMessage: string) => boolean;\n}\n\nfunction createNavigationButton(): HTMLButtonElement {\n  const existing = document.querySelector<HTMLButtonElement>('#nav-command-doctrine');\n  if (existing !== null) return existing;\n  const fleetDoctrine = document.querySelector<HTMLButtonElement>('#nav-fleet-doctrine');\n  const button = document.createElement('button');\n  button.id = 'nav-command-doctrine';\n  button.className = 'rail-button';\n  button.type = 'button';\n  button.setAttribute('aria-label', 'Командный профиль');\n  button.innerHTML = '<span class="rail-button__icon">✦</span><small>Командир</small>';\n  fleetDoctrine?.insertAdjacentElement('afterend', button);\n  if (fleetDoctrine === null) document.querySelector<HTMLElement>('.side-rail')?.append(button);\n  return button;\n}\n\nfunction createDialog(): HTMLDialogElement {\n  const existing = document.querySelector<HTMLDialogElement>('#command-doctrine-dialog');\n  if (existing !== null) return existing;\n  const dialog = document.createElement('dialog');\n  dialog.id = 'command-doctrine-dialog';\n  dialog.className = 'command-doctrine-dialog';\n  dialog.innerHTML = \`\n    <header class="command-doctrine-header">\n      <div><p class="panel-label">Command Profile</p><h2>Командная доктрина</h2><p>Опыт растёт после боёв. Флагман усиливает назначенный флот.</p></div>\n      <button type="button" class="dialog-close" aria-label="Закрыть командный профиль">×</button>\n    </header>\n    <section class="command-progress" aria-live="polite"></section>\n    <form class="command-doctrine-form">\n      <label>Доктрина<select name="doctrine"></select></label>\n      <button type="submit" class="primary-button">Применить доктрину</button>\n    </form>\n    <form class="flagship-form">\n      <label>Флагманский флот<select name="fleet"></select></label>\n      <button type="submit" class="primary-button">Назначить флагман</button>\n    </form>\n    <section class="command-doctrine-cards"></section>\n  \`;\n  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => dialog.close());\n  document.body.append(dialog);\n  return dialog;\n}\n\nexport function mountCommandDoctrineScreen(bridge: CommandDoctrineBridge): void {\n  const button = createNavigationButton();\n  const dialog = createDialog();\n  const doctrineForm = dialog.querySelector<HTMLFormElement>('.command-doctrine-form');\n  const flagshipForm = dialog.querySelector<HTMLFormElement>('.flagship-form');\n  const doctrineSelect = doctrineForm?.elements.namedItem('doctrine');\n  const fleetSelect = flagshipForm?.elements.namedItem('fleet');\n  const progress = dialog.querySelector<HTMLElement>('.command-progress');\n  const cards = dialog.querySelector<HTMLElement>('.command-doctrine-cards');\n  if (\n    doctrineForm === null ||\n    flagshipForm === null ||\n    !(doctrineSelect instanceof HTMLSelectElement) ||\n    !(fleetSelect instanceof HTMLSelectElement) ||\n    progress === null ||\n    cards === null\n  ) throw new Error('Command doctrine controls are missing.');\n\n  doctrineSelect.replaceChildren(\n    ...Object.values(COMMAND_DOCTRINES).map((doctrine) => {\n      const option = document.createElement('option');\n      option.value = doctrine.id;\n      option.textContent = doctrine.name;\n      return option;\n    }),\n  );\n  cards.replaceChildren(\n    ...Object.values(COMMAND_DOCTRINES).map((doctrine) => {\n      const card = document.createElement('article');\n      const title = document.createElement('strong');\n      title.textContent = doctrine.name;\n      const description = document.createElement('p');\n      description.textContent = doctrine.description;\n      card.append(title, description);\n      return card;\n    }),\n  );\n\n  const render = (): void => {\n    const state = bridge.getState();\n    const command = getEmpireCommandState(state.commanders, 'player');\n    if (command === undefined) return;\n    doctrineSelect.value = command.doctrineId;\n    const nextThreshold = COMMAND_LEVEL_THRESHOLDS[command.level] ?? COMMAND_LEVEL_THRESHOLDS.at(-1)!;\n    const currentThreshold = COMMAND_LEVEL_THRESHOLDS[command.level - 1] ?? 0;\n    const range = Math.max(1, nextThreshold - currentThreshold);\n    const progressPercent = command.level >= COMMAND_LEVEL_THRESHOLDS.length\n      ? 100\n      : Math.min(100, Math.floor(((command.experience - currentThreshold) * 100) / range));\n    progress.innerHTML = \`\n      <article><span>Уровень командования</span><strong>\${command.level}</strong></article>\n      <article><span>Опыт</span><strong>\${command.experience} / \${nextThreshold}</strong><progress max="100" value="\${progressPercent}"></progress></article>\n      <article><span>Флагман</span><strong>\${command.flagshipFleetId ?? 'не назначен'}</strong></article>\n    \`;\n    const stationed = state.fleets.filter((fleet) =>\n      fleet.empireId === 'player' && fleet.status === 'stationed' && fleet.location.type === 'planet',\n    );\n    fleetSelect.replaceChildren();\n    const none = document.createElement('option');\n    none.value = '';\n    none.textContent = 'Не назначать';\n    fleetSelect.append(none);\n    for (const fleet of stationed) {\n      const option = document.createElement('option');\n      option.value = fleet.id;\n      option.textContent = \`\${fleet.id} · \${Object.values(fleet.ships).reduce((sum, count) => sum + count, 0)} кораблей\`;\n      fleetSelect.append(option);\n    }\n    fleetSelect.value = command.flagshipFleetId ?? '';\n    flagshipForm.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled =\n      command.level < FLAGSHIP_UNLOCK_LEVEL && command.flagshipFleetId === null;\n  };\n\n  doctrineForm.addEventListener('submit', (event) => {\n    event.preventDefault();\n    if (bridge.execute({\n      type: 'SET_COMMAND_DOCTRINE',\n      empireId: 'player',\n      doctrineId: doctrineSelect.value as CommandDoctrineId,\n    }, 'Командная доктрина обновлена')) render();\n  });\n  flagshipForm.addEventListener('submit', (event) => {\n    event.preventDefault();\n    if (bridge.execute({\n      type: 'ASSIGN_FLAGSHIP',\n      empireId: 'player',\n      fleetId: fleetSelect.value.length > 0 ? fleetSelect.value : null,\n    }, 'Флагманское назначение обновлено')) render();\n  });\n  button.addEventListener('click', () => {\n    render();\n    dialog.showModal();\n  });\n}\n`);

write('src/styles/commandDoctrine.css', `.command-doctrine-dialog {\n  width: min(920px, calc(100vw - 32px));\n  max-height: calc(100vh - 32px);\n  overflow: auto;\n  border: 1px solid var(--border-strong);\n  border-radius: 20px;\n  padding: 0;\n  color: var(--text-primary);\n  background: color-mix(in srgb, var(--surface-elevated) 94%, transparent);\n}\n.command-doctrine-dialog::backdrop { background: rgb(2 8 18 / 78%); backdrop-filter: blur(7px); }\n.command-doctrine-header { display: flex; justify-content: space-between; gap: 24px; padding: 24px; border-bottom: 1px solid var(--border-subtle); }\n.command-doctrine-header h2 { margin: 4px 0 6px; }\n.command-doctrine-header p { margin: 0; color: var(--text-secondary); }\n.command-progress, .command-doctrine-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 18px 24px; }\n.command-progress article, .command-doctrine-cards article { padding: 16px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--surface-panel); }\n.command-progress span { display: block; color: var(--text-secondary); font-size: .82rem; margin-bottom: 6px; }\n.command-progress strong { font-size: 1.1rem; }\n.command-progress progress { width: 100%; margin-top: 10px; }\n.command-doctrine-form, .flagship-form { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: end; padding: 12px 24px; }\n.command-doctrine-form label, .flagship-form label { display: grid; gap: 7px; color: var(--text-secondary); }\n.command-doctrine-form select, .flagship-form select { min-height: 42px; border: 1px solid var(--border-strong); border-radius: 10px; padding: 0 12px; color: var(--text-primary); background: var(--surface-panel); }\n.command-doctrine-cards { padding-bottom: 24px; }\n.command-doctrine-cards strong { display: block; margin-bottom: 8px; }\n.command-doctrine-cards p { margin: 0; color: var(--text-secondary); line-height: 1.45; }\n@media (max-width: 720px) {\n  .command-progress, .command-doctrine-cards { grid-template-columns: 1fr; }\n  .command-doctrine-form, .flagship-form { grid-template-columns: 1fr; }\n}\n`);

write('tests/simulation/commandDoctrine.test.ts', `import { describe, expect, it } from 'vitest';\nimport {\n  addCommandExperience,\n  calculateCommandLevel,\n  getCommandCombatEffects,\n} from '../../src/simulation/command/commandDoctrine';\nimport { createInitialGameState } from '../../src/simulation/createInitialGameState';\nimport { executeCommand } from '../../src/simulation/reducer';\n\ndescribe('command doctrine and flagships', () => {\n  it('initializes every empire and calculates deterministic levels', () => {\n    const state = createInitialGameState('command-initial');\n    expect(state.commanders).toHaveLength(state.empires.length);\n    expect(state.commanders.every((entry) => entry.level === 1 && entry.experience === 0)).toBe(true);\n    expect(calculateCommandLevel(0)).toBe(1);\n    expect(calculateCommandLevel(100)).toBe(2);\n    expect(calculateCommandLevel(1_500)).toBe(5);\n  });\n\n  it('changes doctrine through the shared reducer and applies its effects', () => {\n    const state = createInitialGameState('command-doctrine');\n    const result = executeCommand(state, {\n      type: 'SET_COMMAND_DOCTRINE',\n      empireId: 'player',\n      doctrineId: 'vanguard',\n    });\n    expect(result.ok).toBe(true);\n    if (!result.ok) return;\n    expect(result.value.commanders.find((entry) => entry.empireId === 'player')?.doctrineId).toBe('vanguard');\n    expect(getCommandCombatEffects(result.value.commanders, 'player')).toMatchObject({\n      weaponBonusPercent: 8,\n      armorBonusPercent: -2,\n      isFlagship: false,\n    });\n  });\n\n  it('requires level two and an armed stationed fleet for a flagship', () => {\n    const initial = createInitialGameState('command-flagship');\n    const planet = initial.planets.find((candidate) => candidate.ownerEmpireId === 'player');\n    if (planet === undefined) throw new Error('Player planet is missing.');\n    const fleet = {\n      id: 'player-flagship',\n      empireId: 'player',\n      originPlanetId: planet.id,\n      location: { type: 'planet' as const, planetId: planet.id },\n      status: 'stationed' as const,\n      ships: { 'ship.aegis.fighter': 4 },\n      cargo: { metal: 0, crystal: 0, gas: 0 },\n      speed: 13,\n      cargoCapacity: 120,\n      formation: 'wedge' as const,\n      targetPriority: 'balanced' as const,\n      mission: null,\n    };\n    const levelOne = { ...initial, fleets: [...initial.fleets, fleet] };\n    expect(executeCommand(levelOne, { type: 'ASSIGN_FLAGSHIP', empireId: 'player', fleetId: fleet.id })).toMatchObject({\n      ok: false,\n      code: 'FLAGSHIP_LEVEL_REQUIRED',\n    });\n    const levelTwo = {\n      ...levelOne,\n      commanders: addCommandExperience(levelOne.commanders, 'player', 100),\n    };\n    const assigned = executeCommand(levelTwo, {\n      type: 'ASSIGN_FLAGSHIP',\n      empireId: 'player',\n      fleetId: fleet.id,\n    });\n    expect(assigned.ok).toBe(true);\n    if (!assigned.ok) return;\n    expect(getCommandCombatEffects(assigned.value.commanders, 'player', fleet.id)).toMatchObject({\n      isFlagship: true,\n      weaponBonusPercent: 11,\n      armorBonusPercent: 11,\n    });\n  });\n\n  it('awards adaptive doctrine experience deterministically', () => {\n    const state = createInitialGameState('command-xp');\n    const after = addCommandExperience(state.commanders, 'player', 100);\n    const player = after.find((entry) => entry.empireId === 'player');\n    expect(player).toMatchObject({ experience: 110, level: 2 });\n  });\n});\n`);

replaceOnce(
  'tests/storage/saveFormat.test.ts',
  "      shipUpgrades: _shipUpgrades,\n      ...withoutNewCollections",
  "      shipUpgrades: _shipUpgrades,\n      commanders: _commanders,\n      ...withoutNewCollections",
);
replaceOnce(
  'tests/storage/saveFormat.test.ts',
  "      expect(parsed.value.state.shipUpgrades.every((entry) => entry.queue.length === 0)).toBe(true);",
  "      expect(parsed.value.state.shipUpgrades.every((entry) => entry.queue.length === 0)).toBe(true);\n      expect(parsed.value.state.commanders).toHaveLength(parsed.value.state.empires.length);",
);
replaceOnce(
  'tests/storage/saveFormat.test.ts',
  "    const { shipUpgrades: _shipUpgrades, ...legacyBase } = current;",
  "    const { shipUpgrades: _shipUpgrades, commanders: _commanders, ...legacyBase } = current;",
);
replaceOnce(
  'tests/storage/saveFormat.test.ts',
  "  it('rejects malformed JSON and checksum tampering', () => {",
  `  it('adds default command profiles to schema-v13 saves that predate command progression', () => {\n    const current = createInitialGameState('command-migration');\n    const { commanders: _commanders, ...legacyState } = current;\n    const legacySave = {\n      formatVersion: 2,\n      slotId: 'command-v13',\n      savedAt: '2026-07-18T12:00:00.000Z',\n      checksum: createStateChecksum(legacyState),\n      state: legacyState,\n    };\n    const parsed = parseSaveJson(JSON.stringify(legacySave));\n    expect(parsed.ok).toBe(true);\n    if (parsed.ok) {\n      expect(parsed.value.state.commanders).toHaveLength(parsed.value.state.empires.length);\n      expect(parsed.value.state.commanders.every((entry) => entry.doctrineId === 'adaptive')).toBe(true);\n    }\n  });\n\n  it('rejects malformed JSON and checksum tampering', () => {`,
);

write('docs/changes/pr75-command-doctrine-flagships.md', `# PR #75 — Command doctrine progression and flagships\n\n## Delivered\n\n- One persistent command profile per empire.\n- Five deterministic command levels with battle-earned experience.\n- Three original doctrines: vanguard, sentinel and adaptive command.\n- Shared commands for doctrine selection and flagship assignment.\n- Flagship unlock at command level two.\n- Flagships require an owned, stationed fleet with at least one armed ship.\n- Doctrine, level and flagship bonuses are applied inside combat resolution.\n- Both sides gain deterministic command experience after battles.\n- Dedicated accessible command-profile dialog.\n- Additive schema-v13 migration for older saves.\n\n## Boundaries\n\n- A flagship is a fleet appointment, not a new hull yet.\n- Command experience is local to a round and has no account meta progression.\n- Bots use the same command state and combat effects; doctrine planning remains future AI work.\n`);

const statusPath = 'docs/project-status.json';
const status = JSON.parse(read(statusPath));
status.updatedAt = '2026-07-21';
status.lastMergedPr = 74;
status.lastMergeSha = '770b5d9ee5faf3f9a158e05dc471d768f2f6f4bc';
status.activePr = 75;
status.nextPrAfterActive = 76;
status.currentMilestone = 'Command progression, faction asymmetry and diplomacy';
status.currentBatch = {
  standard: [75, 76, 77, 78, 79, 80],
  completed: [],
  plannedCapabilities: [
    'command doctrine progression and flagship framework',
    'faction mechanical catalog architecture and ID migration policy',
    'full Aegis economy, buildings, research and unit roster',
    'full Synod economy, buildings, research and unit roster',
    'full Veyra economy, buildings, research and unit roster',
    'relations, reputation and diplomatic positions',
  ],
};
status.deliveredDomains = Array.from(new Set([
  ...status.deliveredDomains,
  'fleet formations, target priorities and original class skills',
]));
status.knownLimitations = [
  'all factions still share Aegis mechanical catalogs',
  'command progression and flagship framework are active in PR #75',
  'diplomacy, coalitions, strategic stars and endgame are missing',
  'bots do not yet plan ship upgrades, expeditions, object operations, command doctrine or diplomacy',
  'strategic exotic matter has no spending loop',
  'captured Nemexia HTML/screens/assets are excluded',
];
write(statusPath, `${JSON.stringify(status, null, 2)}\n`);

console.log('PR75 patch applied.');
