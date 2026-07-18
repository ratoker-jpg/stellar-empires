import type { GameState } from '../simulation/types';
import { AUTOSAVE_SLOT_ID } from '../storage/AutoSaveController';
import {
  AUTOSAVE_SNAPSHOT_SLOT_ID,
  type SaveManager,
  type SaveSlotSummary,
} from '../storage/SaveManager';

export interface SaveManagerUiOptions {
  readonly manager: SaveManager;
  readonly getState: () => GameState;
  readonly writeStatus: (message: string) => void;
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
    void action().finally(() => {
      button.disabled = false;
    });
  });
  return button;
}

export function mountSaveManager(options: SaveManagerUiOptions): void {
  const navigationButton = document.querySelector<HTMLButtonElement>('[aria-label="Настройки"]');

  if (navigationButton === null) {
    return;
  }

  navigationButton.removeAttribute('disabled');
  const dialog = document.createElement('dialog');
  dialog.id = 'save-manager-dialog';
  dialog.className = 'save-manager-dialog';
  const header = document.createElement('header');
  const headerText = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Локальная партия';
  const title = document.createElement('h2');
  title.textContent = 'Сохранения';
  headerText.append(eyebrow, title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'dialog-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Закрыть сохранения');
  close.addEventListener('click', () => dialog.close());
  header.append(headerText, close);

  const controls = document.createElement('section');
  controls.className = 'save-manager-controls';
  const slotInput = document.createElement('input');
  slotInput.type = 'text';
  slotInput.value = 'manual-1';
  slotInput.maxLength = 48;
  slotInput.setAttribute('aria-label', 'Название слота сохранения');
  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.textContent = 'Сохранить текущую партию';
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = 'application/json,.json';
  importInput.setAttribute('aria-label', 'Импорт сохранения JSON');
  controls.append(slotInput, saveButton, importInput);

  const message = document.createElement('p');
  message.className = 'save-manager-message';
  const list = document.createElement('div');
  list.className = 'save-manager-list';
  dialog.append(header, controls, message, list);
  document.body.append(dialog);

  const showMessage = (text: string, error = false): void => {
    message.textContent = text;
    message.classList.toggle('is-error', error);
    options.writeStatus(text);
  };

  const activateSlot = async (summary: SaveSlotSummary): Promise<void> => {
    const loaded = await options.manager.load(summary.slotId);

    if (loaded.status !== 'loaded') {
      showMessage(`Слот ${summary.slotId} не прошёл проверку`, true);
      return;
    }

    await options.manager.save(AUTOSAVE_SLOT_ID, loaded.save.state);
    showMessage(`Слот ${summary.slotId} активирован · перезапуск`);
    window.location.reload();
  };

  const render = async (): Promise<void> => {
    list.replaceChildren();
    const summaries = await options.manager.list();

    if (summaries.length === 0) {
      list.textContent = 'Сохранённых партий пока нет.';
      return;
    }

    for (const summary of summaries) {
      const row = document.createElement('article');
      row.className = `save-slot${summary.valid ? '' : ' is-invalid'}`;
      const details = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = summary.slotId;
      const meta = document.createElement('span');
      meta.textContent = summary.valid
        ? `${summary.savedAt} · ${formatWorldTime(summary.elapsedSeconds)}`
        : `${summary.savedAt} · ${summary.errorCode ?? 'INVALID'}`;
      details.append(name, meta);
      const actions = document.createElement('div');
      actions.className = 'save-slot-actions';

      if (summary.valid) {
        actions.append(
          createAction('Загрузить', () => activateSlot(summary)),
          createAction('Экспорт', async () => {
            downloadJson(summary.slotId, await options.manager.export(summary.slotId));
            showMessage(`Слот ${summary.slotId} экспортирован`);
          }),
        );
      }

      if (!isReservedSlot(summary.slotId)) {
        actions.append(
          createAction('Удалить', async () => {
            await options.manager.delete(summary.slotId);
            showMessage(`Слот ${summary.slotId} удалён`);
            await render();
          }),
        );
      }

      row.append(details, actions);
      list.append(row);
    }
  };

  saveButton.addEventListener('click', () => {
    const slotId = slotInput.value.trim();

    if (slotId.length === 0 || isReservedSlot(slotId)) {
      showMessage('Укажите отдельное имя ручного слота', true);
      return;
    }

    saveButton.disabled = true;
    void options.manager
      .save(slotId, options.getState())
      .then(async () => {
        showMessage(`Слот ${slotId} сохранён`);
        await render();
      })
      .catch((error: unknown) => {
        showMessage(error instanceof Error ? error.message : 'Ошибка сохранения', true);
      })
      .finally(() => {
        saveButton.disabled = false;
      });
  });

  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0];

    if (file === undefined) {
      return;
    }

    const target = slotInput.value.trim();
    const targetSlotId = target.length > 0 && !isReservedSlot(target) ? target : undefined;
    importInput.disabled = true;
    void file
      .text()
      .then((json) => options.manager.import(json, targetSlotId))
      .then(async (save) => {
        showMessage(`Импортирован слот ${save.slotId}`);
        await render();
      })
      .catch((error: unknown) => {
        showMessage(error instanceof Error ? error.message : 'Ошибка импорта', true);
      })
      .finally(() => {
        importInput.value = '';
        importInput.disabled = false;
      });
  });

  navigationButton.addEventListener('click', () => {
    dialog.showModal();
    void render().catch((error: unknown) => {
      showMessage(error instanceof Error ? error.message : 'Ошибка чтения сохранений', true);
    });
  });
}
