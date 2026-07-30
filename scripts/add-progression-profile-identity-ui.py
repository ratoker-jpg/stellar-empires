from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


replace(
    'src/ui/newGameFactionPicker.ts',
    "  createCampaignSettings,\n  type CampaignSettings,",
    "  createCampaignSettings,\n  DEFAULT_PROGRESSION_PROFILE_ID,\n  formatProgressionProfile,\n  type CampaignSettings,",
)
replace(
    'src/ui/newGameFactionPicker.ts',
    "function createSelect<T extends string | number>(",
    "function createProgressionProfileIdentity(): HTMLDivElement {\n  const identity = document.createElement('div');\n  identity.className = 'new-game-setting';\n  identity.dataset.progressionProfile = DEFAULT_PROGRESSION_PROFILE_ID;\n  const caption = document.createElement('span');\n  caption.textContent = 'Профиль прогрессии';\n  const value = document.createElement('strong');\n  value.textContent = formatProgressionProfile(DEFAULT_PROGRESSION_PROFILE_ID);\n  identity.append(caption, value);\n  return identity;\n}\n\nfunction createSelect<T extends string | number>(",
)
replace(
    'src/ui/newGameFactionPicker.ts',
    "    settings.append(scenario.label, speed.label);",
    "    settings.append(scenario.label, speed.label, createProgressionProfileIdentity());",
)
replace(
    'src/ui/newGameFactionPicker.ts',
    "        worldSpeed,\n        createdAtReal: new Date().toISOString(),",
    "        worldSpeed,\n        progressionProfile: DEFAULT_PROGRESSION_PROFILE_ID,\n        createdAtReal: new Date().toISOString(),",
)
replace(
    'src/ui/newGameFactionPicker.ts',
    "      'Офлайн-прогрессия включена для локальной кампании. Изменить размер мира или скорость после старта нельзя.';",
    "      'Офлайн-прогрессия включена. Размер мира, скорость и профиль прогрессии после старта изменить нельзя.';",
)

replace(
    'src/storage/SaveManager.ts',
    "import type { WorldSpeed } from '../simulation/campaign/settings';",
    "import type { ProgressionProfileId, WorldSpeed } from '../simulation/campaign/settings';",
)
replace(
    'src/storage/SaveManager.ts',
    "  readonly worldSpeed?: WorldSpeed;\n  readonly lastActiveAtReal?: string;",
    "  readonly worldSpeed?: WorldSpeed;\n  readonly progressionProfile?: ProgressionProfileId;\n  readonly lastActiveAtReal?: string;",
)
replace(
    'src/storage/SaveManager.ts',
    "        worldSpeed: result.save.state.campaignSettings.worldSpeed,\n        lastActiveAtReal:",
    "        worldSpeed: result.save.state.campaignSettings.worldSpeed,\n        progressionProfile: result.save.state.campaignSettings.progressionProfile,\n        lastActiveAtReal:",
)

replace(
    'src/ui/saveManager.ts',
    "import { formatWorldSpeed } from '../simulation/campaign/settings';",
    "import { formatProgressionProfile, formatWorldSpeed } from '../simulation/campaign/settings';",
)
replace(
    'src/ui/saveManager.ts',
    "      <div><span>Скорость мира</span><strong>${formatWorldSpeed(settings.worldSpeed)}</strong></div>\n      <div><span>Офлайн-прогрессия</span><strong>Включена</strong></div>",
    "      <div><span>Скорость мира</span><strong>${formatWorldSpeed(settings.worldSpeed)}</strong></div>\n      <div><span>Профиль прогрессии</span><strong data-progression-profile=\"${settings.progressionProfile}\">${formatProgressionProfile(settings.progressionProfile)}</strong></div>\n      <div><span>Офлайн-прогрессия</span><strong>Включена</strong></div>",
)
replace(
    'src/ui/saveManager.ts',
    "? `${summary.savedAt} · ${summary.scenarioPreset ?? 'campaign'} · x${summary.worldSpeed ?? 1} · ${formatWorldTime(summary.elapsedSeconds)}`",
    "? `${summary.savedAt} · ${summary.scenarioPreset ?? 'campaign'} · x${summary.worldSpeed ?? 1} · ${summary.progressionProfile === undefined ? 'legacy-v1' : summary.progressionProfile} · ${formatWorldTime(summary.elapsedSeconds)}`",
)

replace(
    'src/ui/systemWorkspace.ts',
    "import type { SystemShellMode } from './appShellRoute';",
    "import { formatProgressionProfile } from '../simulation/campaign/settings';\nimport type { GameState } from '../simulation/types';\nimport type { SystemShellMode } from './appShellRoute';",
)
replace(
    'src/ui/systemWorkspace.ts',
    "export interface SystemWorkspaceOptions {\n  readonly saves: SaveManagerUiMount;",
    "export interface SystemWorkspaceOptions {\n  readonly saves: SaveManagerUiMount;\n  readonly getState: () => GameState;",
)
replace(
    'src/ui/systemWorkspace.ts',
    "      <p>Настройки сохраняются только в браузере и не входят в GameState или игровые сохранения.</p>\n      <label><input type=\"checkbox\" name=\"reduce-motion\" />",
    "      <p>Настройки интерфейса сохраняются только в браузере и не входят в GameState.</p>\n      <div class=\"system-campaign-profile\"><span>Профиль кампании</span><strong data-campaign-profile></strong><small>Входит в checksum и не меняется после создания.</small></div>\n      <label><input type=\"checkbox\" name=\"reduce-motion\" />",
)
replace(
    'src/ui/systemWorkspace.ts',
    "  const reset = settingsHost.querySelector<HTMLButtonElement>('[data-settings-reset]')!;",
    "  const reset = settingsHost.querySelector<HTMLButtonElement>('[data-settings-reset]')!;\n  const campaignProfile = settingsHost.querySelector<HTMLElement>('[data-campaign-profile]')!;",
)
replace(
    'src/ui/systemWorkspace.ts',
    "    compactLayout.checked = settings.compactLayout;\n    applyClientPresentationSettings(settings);",
    "    compactLayout.checked = settings.compactLayout;\n    const progressionProfile = options.getState().campaignSettings.progressionProfile;\n    campaignProfile.dataset.progressionProfile = progressionProfile;\n    campaignProfile.textContent = formatProgressionProfile(progressionProfile);\n    applyClientPresentationSettings(settings);",
)

replace(
    'src/main.ts',
    "  DEFAULT_CAMPAIGN_CREATED_AT_REAL,\n  formatWorldSpeed,",
    "  DEFAULT_CAMPAIGN_CREATED_AT_REAL,\n  formatProgressionProfile,\n  formatWorldSpeed,",
)
replace(
    'src/main.ts',
    "status: `${statusPrefix} · ${selection.faction.toUpperCase()} · ${formatWorldSpeed(selection.campaignSettings.worldSpeed)} · seed ${state.seed}`",
    "status: `${statusPrefix} · ${selection.faction.toUpperCase()} · ${formatWorldSpeed(selection.campaignSettings.worldSpeed)} · ${formatProgressionProfile(selection.campaignSettings.progressionProfile)} · seed ${state.seed}`",
)
replace(
    'src/main.ts',
    "      const speed = formatWorldSpeed(initialState.campaignSettings.worldSpeed);\n      startupStatus = restored.source === 'snapshot'\n        ? `Партия восстановлена из резерва · ${speed} · seed ${initialState.seed}`\n        : `Партия восстановлена · ${speed} · seed ${initialState.seed}`;",
    "      const speed = formatWorldSpeed(initialState.campaignSettings.worldSpeed);\n      const progressionProfile = formatProgressionProfile(\n        initialState.campaignSettings.progressionProfile,\n      );\n      startupStatus = restored.source === 'snapshot'\n        ? `Партия восстановлена из резерва · ${speed} · ${progressionProfile} · seed ${initialState.seed}`\n        : `Партия восстановлена · ${speed} · ${progressionProfile} · seed ${initialState.seed}`;",
)
replace(
    'src/main.ts',
    "  const systemWorkspace = mountSystemWorkspace({\n    saves: saveWorkspace,",
    "  const systemWorkspace = mountSystemWorkspace({\n    saves: saveWorkspace,\n    getState: () => application.getState(),",
)
