import { formatProgressionProfile, formatWorldSpeed } from '../simulation/campaign/settings';
import type { GameState } from '../simulation/types';
import { AUTOSAVE_SLOT_ID } from '../storage/AutoSaveController';
import {
  AUTOSAVE_SNAPSHOT_SLOT_ID,
  isReservedSaveSlot,
  type SaveManager,
  type SaveSlotSummary,
} from '../storage/SaveManager';
import type { CampaignRuntimeMetadata } from '../storage/types';

export interface SaveManagerUiOptions {
  readonly manager?: SaveManager | undefined;
  readonly getState: () => GameState;
  readonly getRuntimeMetadata?: () => CampaignRuntimeMetadata | undefined;
  readonly writeStatus: (message: string) => void;
  readonly onNewCampaign?: () => Promise<void>;
  readonly onActivateSlot?: (slotId: string) => Promise<void>;
}

export interface SaveManagerUiMount {
  activate(): void;
  deactivate(): void;
  refresh(): void;
  dispose(): void;
}

function formatWorldTime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${days}д ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function isReservedSlot(slotId: string): boolean {
  return slotId === AUTOSAVE_SLOT_ID || slotId === AUTOSAVE_SNAPSHOT_SLOT_ID;
}

function downloadJson(slotId: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `stellar-empires-${slotId}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function createAction(label: string, action: () => Promise<void>): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', () => {
    button.disabled = true;
    void action().finally(() => { button.disabled = false; });
  });
  return button;
}

export function mountSaveManager(options: SaveManagerUiOptions): SaveManagerUiMount {
  const host = document.querySelector<HTMLElement>('#system-saves-view');
  if (host === null) throw new Error('System saves workspace is missing.');
  let active = false;
  host.innerHTML = `
    <section class="save-manager-campaign" aria-label="Настройки текущей кампании"></section>
    <section class="save-manager-controls">
      <label><span>Имя ручного слота</span><input type="text" value="manual-1" maxlength="48" aria-label="Название слота сохранения" /></label>
      <button type="button" data-save-action="create">Сохранить текущую партию</button>
      <button type="button" data-save-action="new-campaign">Новая партия</button>
      <label><span>Импорт JSON</span><input type="file" accept="application/json,.json" aria-label="Импорт сохранения JSON" /></label>
    </section>
    <section class="save-manager-confirm" data-new-campaign-confirm hidden>
      <p>Новая партия удалит текущий autosave. Ручные сохранения останутся.</p>
      <button type="button" data-new-campaign-action="cancel">Отмена</button>
      <button type="button" data-new-campaign-action="confirm">Подтвердить</button>
    </section>
    <p class="save-manager-message" role="status"></p>
    <div class="save-manager-list"></div>
  `;
  const campaign = host.querySelector<HTMLElement>('.save-manager-campaign')!;
  const slotInput = host.querySelector<HTMLInputElement>('input[type="text"]')!;
  const saveButton = host.querySelector<HTMLButtonElement>('[data-save-action="create"]')!;
  const newCampaignButton = host.querySelector<HTMLButtonElement>('[data-save-action="new-campaign"]')!;
  const confirmPanel = host.querySelector<HTMLElement>('[data-new-campaign-confirm]')!;
  const cancelNewCampaign = host.querySelector<HTMLButtonElement>('[data-new-campaign-action="cancel"]')!;
  const confirmNewCampaign = host.querySelector<HTMLButtonElement>('[data-new-campaign-action="confirm"]')!;
  const importInput = host.querySelector<HTMLInputElement>('input[type="file"]')!;
  const message = host.querySelector<HTMLElement>('.save-manager-message')!;
  const list = host.querySelector<HTMLElement>('.save-manager-list')!;

  const showMessage = (text: string, error = false): void => {
    message.textContent = text;
    message.classList.toggle('is-error', error);
    options.writeStatus(text);
  };

  const renderCampaign = (): void => {
    const state = options.getState();
    const settings = state.campaignSettings;
    campaign.innerHTML = `
      <div><span>Seed</span><strong data-current-seed>${state.seed}</strong></div>
      <div><span>Сценарий</span><strong>${settings.scenarioPreset}</strong></div>
      <div><span>Скорость мира</span><strong>${formatWorldSpeed(settings.worldSpeed)}</strong></div>
      <div><span>Профиль прогрессии</span><strong data-progression-profile="${settings.progressionProfile}">${formatProgressionProfile(settings.progressionProfile)}</strong></div>
      <div><span>Офлайн-прогрессия</span><strong>Включена</strong></div>
      <div><span>Создана</span><strong>${settings.createdAtReal}</strong></div>
      <p>Настройки и seed входят в checksum партии и не изменяются после создания.</p>
    `;
  };

  const activateSlot = async (summary: SaveSlotSummary): Promise<void> => {
    if (options.manager === undefined) return;
    if (options.onActivateSlot !== undefined) {
      await options.onActivateSlot(summary.slotId);
      return;
    }
    throw new Error('Campaign activation is unavailable.');
  };

  const render = async (): Promise<void> => {
    if (!active) return;
    renderCampaign();
    list.replaceChildren();
    if (options.manager === undefined) {
      saveButton.disabled = true;
      newCampaignButton.disabled = true;
      importInput.disabled = true;
      list.textContent = 'Локальное хранилище недоступно в текущем браузере.';
      return;
    }
    saveButton.disabled = false;
    newCampaignButton.disabled = options.onNewCampaign === undefined;
    importInput.disabled = false;
    const summaries = await options.manager.list();
    if (summaries.length === 0) {
      list.textContent = 'Сохранённых партий пока нет.';
      return;
    }
    for (const summary of summaries) {
      const row = document.createElement('article');
      row.className = `save-slot${summary.valid ? '' : ' is-invalid'}`;
      row.dataset.saveSlotId = summary.slotId;
      const details = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = summary.slotId;
      const meta = document.createElement('span');
      meta.textContent = summary.valid
        ? `${summary.savedAt} · ${summary.scenarioPreset ?? 'campaign'} · x${summary.worldSpeed ?? 1} · ${summary.progressionProfile === undefined ? 'legacy-v1' : summary.progressionProfile} · ${formatWorldTime(summary.elapsedSeconds)}`
        : `${summary.savedAt} · ${summary.errorCode ?? 'INVALID'}`;
      const cursor = document.createElement('small');
      cursor.textContent = summary.valid && summary.lastActiveAtReal !== undefined ? `Последняя активность: ${summary.lastActiveAtReal}` : '';
      details.append(name, meta, cursor);
      const actions = document.createElement('div');
      actions.className = 'save-slot-actions';
      if (summary.valid) {
        actions.append(
          createAction('Загрузить', () => activateSlot(summary)),
          createAction('Экспорт', async () => {
            downloadJson(summary.slotId, await options.manager!.export(summary.slotId));
            showMessage(`Слот ${summary.slotId} экспортирован`);
          }),
        );
      }
      if (!isReservedSlot(summary.slotId)) {
        actions.append(createAction('Удалить', async () => {
          await options.manager!.delete(summary.slotId);
          showMessage(`Слот ${summary.slotId} удалён`);
          await render();
        }));
      }
      row.append(details, actions);
      list.append(row);
    }
  };

  const onSave = (): void => {
    if (options.manager === undefined) return;
    const slotId = slotInput.value.trim();
    if (slotId.length === 0 || isReservedSlot(slotId)) {
      showMessage('Укажите отдельное имя ручного слота', true);
      return;
    }
    saveButton.disabled = true;
    void options.manager.save(slotId, options.getState(), options.getRuntimeMetadata?.())
      .then(async () => { showMessage(`Слот ${slotId} сохранён`); await render(); })
      .catch((error: unknown) => showMessage(error instanceof Error ? error.message : 'Ошибка сохранения', true))
      .finally(() => { saveButton.disabled = false; });
  };

  const onNewCampaign = (): void => { confirmPanel.hidden = false; };
  const onCancelNewCampaign = (): void => { confirmPanel.hidden = true; };
  const onConfirmNewCampaign = (): void => {
    if (options.onNewCampaign === undefined) return;
    confirmNewCampaign.disabled = true;
    void options.onNewCampaign()
      .catch((error: unknown) => showMessage(error instanceof Error ? error.message : 'Ошибка создания новой партии', true))
      .finally(() => { confirmNewCampaign.disabled = false; });
  };

  const onImport = (): void => {
    const file = importInput.files?.[0];
    if (file === undefined || options.manager === undefined) return;
    const targetSlotId = slotInput.value.trim();
    if (targetSlotId.length === 0) {
      showMessage('Для импорта укажите имя ручного слота', true);
      importInput.value = '';
      return;
    }
    if (isReservedSaveSlot(targetSlotId)) {
      showMessage('Импорт в autosave и autosave.snapshot запрещён', true);
      importInput.value = '';
      return;
    }
    importInput.disabled = true;
    void file.text()
      .then((json) => options.manager!.import(json, targetSlotId))
      .then(async (save) => { showMessage(`Импортирован слот ${save.slotId}`); await render(); })
      .catch((error: unknown) => showMessage(error instanceof Error ? error.message : 'Ошибка импорта', true))
      .finally(() => { importInput.value = ''; importInput.disabled = false; });
  };
  saveButton.addEventListener('click', onSave);
  newCampaignButton.addEventListener('click', onNewCampaign);
  cancelNewCampaign.addEventListener('click', onCancelNewCampaign);
  confirmNewCampaign.addEventListener('click', onConfirmNewCampaign);
  importInput.addEventListener('change', onImport);

  return {
    activate: () => {
      active = true;
      host.hidden = false;
      void render().catch((error: unknown) => showMessage(error instanceof Error ? error.message : 'Ошибка чтения сохранений', true));
    },
    deactivate: () => { active = false; host.hidden = true; confirmPanel.hidden = true; },
    refresh: () => { void render(); },
    dispose: () => {
      saveButton.removeEventListener('click', onSave);
      newCampaignButton.removeEventListener('click', onNewCampaign);
      cancelNewCampaign.removeEventListener('click', onCancelNewCampaign);
      confirmNewCampaign.removeEventListener('click', onConfirmNewCampaign);
      importInput.removeEventListener('change', onImport);
      host.replaceChildren();
    },
  };
}
