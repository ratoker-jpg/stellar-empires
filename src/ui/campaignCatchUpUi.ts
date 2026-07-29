import type { CampaignCatchUpSummary } from '../storage/types';
import type { CampaignCatchUpProgress } from '../runtime/campaignTimeRuntime';

export interface CampaignCatchUpProgressUi {
  update(progress: CampaignCatchUpProgress): void;
  dispose(): void;
}

function formatDuration(seconds: number): string {
  const rounded = Math.max(0, Math.floor(seconds));
  const days = Math.floor(rounded / 86_400);
  const hours = Math.floor((rounded % 86_400) / 3_600);
  const minutes = Math.floor((rounded % 3_600) / 60);
  const remainder = rounded % 60;
  const clock = [hours, minutes, remainder]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
  return days > 0 ? `${days}д ${clock}` : clock;
}

function sumResourceMap(
  value: CampaignCatchUpSummary['resources']['producedByPlanetAndResource'],
): number {
  return Object.values(value).reduce(
    (total, resources) => total + resources.metal + resources.crystal + resources.gas,
    0,
  );
}

function createDialog(id: string, className: string): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>(`#${id}`);
  existing?.remove();
  const dialog = document.createElement('dialog');
  dialog.id = id;
  dialog.className = className;
  dialog.addEventListener('cancel', (event) => event.preventDefault());
  document.body.append(dialog);
  return dialog;
}

export function mountCampaignCatchUpProgress(): CampaignCatchUpProgressUi {
  const dialog = createDialog('campaign-catch-up-dialog', 'campaign-time-dialog campaign-catch-up-dialog');
  dialog.innerHTML = `
    <div class="campaign-time-dialog__body">
      <p class="campaign-time-eyebrow">Синхронизация кампании</p>
      <h1>Мир продолжал жить</h1>
      <p data-catch-up-status>Подготовка безопасного контрольного сохранения…</p>
      <div class="campaign-catch-up-progress" role="progressbar" aria-label="Прогресс восстановления кампании" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
      <dl>
        <div><dt>Осталось реального времени</dt><dd data-catch-up-real>—</dd></div>
        <div><dt>Осталось игрового времени</dt><dd data-catch-up-game>—</dd></div>
        <div><dt>Операций в последнем блоке</dt><dd data-catch-up-operations>0</dd></div>
      </dl>
    </div>
  `;
  const progressBar = dialog.querySelector<HTMLElement>('.campaign-catch-up-progress')!;
  const fill = progressBar.querySelector<HTMLElement>('i')!;
  const status = dialog.querySelector<HTMLElement>('[data-catch-up-status]')!;
  const real = dialog.querySelector<HTMLElement>('[data-catch-up-real]')!;
  const game = dialog.querySelector<HTMLElement>('[data-catch-up-game]')!;
  const operations = dialog.querySelector<HTMLElement>('[data-catch-up-operations]')!;
  let initialRemaining: number | undefined;
  dialog.showModal();

  return {
    update: (snapshot) => {
      initialRemaining ??= Math.max(1, snapshot.remainingRealDurationMilliseconds + snapshot.processedRealDurationMilliseconds);
      const completed = Math.max(0, initialRemaining - snapshot.remainingRealDurationMilliseconds);
      const percent = snapshot.complete
        ? 100
        : Math.min(99, Math.floor((completed * 100) / initialRemaining));
      progressBar.setAttribute('aria-valuenow', String(percent));
      fill.style.width = `${percent}%`;
      status.textContent = snapshot.complete
        ? 'Состояние и контрольный курсор сохранены.'
        : 'Хронологически обрабатываются события, логистика и решения империй.';
      real.textContent = formatDuration(snapshot.remainingRealDurationMilliseconds / 1_000);
      game.textContent = formatDuration(snapshot.remainingGameSeconds);
      operations.textContent = String(snapshot.operationsProcessed);
      dialog.dataset.complete = String(snapshot.complete);
    },
    dispose: () => {
      dialog.close();
      dialog.remove();
    },
  };
}

function createMetric(label: string, value: string): HTMLElement {
  const item = document.createElement('div');
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = value;
  item.append(term, description);
  return item;
}

export function showCampaignReturnSummary(
  summary: CampaignCatchUpSummary,
  acknowledge: () => Promise<void>,
): void {
  const dialog = createDialog('campaign-return-summary', 'campaign-time-dialog campaign-return-summary');
  const body = document.createElement('div');
  body.className = 'campaign-time-dialog__body';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'campaign-time-eyebrow';
  eyebrow.textContent = 'Возвращение в кампанию';
  const title = document.createElement('h1');
  title.textContent = 'Что произошло в ваше отсутствие';
  const description = document.createElement('p');
  description.textContent = `Обработано ${formatDuration(summary.absence.realDurationSeconds)} реального времени · ${formatDuration(summary.absence.gameDurationSeconds)} игрового времени.`;
  const metrics = document.createElement('dl');
  metrics.append(
    createMetric('Получено ресурсов', sumResourceMap(summary.resources.producedByPlanetAndResource).toLocaleString('ru-RU')),
    createMetric('Потеряно ресурсов', sumResourceMap(summary.resources.lostByPlanetAndResource).toLocaleString('ru-RU')),
    createMetric('Завершено построек и исследований', String(summary.completions.buildings + summary.completions.research)),
    createMetric('Произведено кораблей и обороны', String(summary.completions.ships + summary.completions.defenses)),
    createMetric('Боёв с участием игрока', String(summary.combat.battles)),
    createMetric('Атак на ваши колонии', String(summary.combat.attacksOnPlayer)),
    createMetric('Решений автономных империй', String(summary.bots.decisions)),
    createMetric('Событий и операций мира', String(summary.world.expeditions + summary.world.spaceObjects + summary.world.logisticsTransfers + summary.world.worldEvents)),
  );
  const note = document.createElement('p');
  note.className = 'campaign-time-note';
  note.textContent = 'Сводка показывает только доступные игроку итоги и не раскрывает скрытые решения других империй.';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'se-button';
  button.textContent = 'Продолжить кампанию';
  button.addEventListener('click', () => {
    button.disabled = true;
    void acknowledge()
      .then(() => {
        dialog.close();
        dialog.remove();
      })
      .catch(() => {
        button.disabled = false;
        note.textContent = 'Не удалось подтвердить сводку. Повторите сохранение.';
      });
  });
  body.append(eyebrow, title, description, metrics, note, button);
  dialog.append(body);
  dialog.showModal();
}
