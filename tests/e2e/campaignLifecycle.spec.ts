import { expect, test, type Page } from '@playwright/test';

const APP_READY_TIMEOUT = 45_000;
const FACTION_BUTTON_NAME = 'Начать кампанию: Директорат «Эгида»';

async function waitForApp(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true', {
    timeout: APP_READY_TIMEOUT,
  });
}

async function readSlotJson(page: Page, slotId: string): Promise<string | null> {
  return page.evaluate(async (id) => new Promise<string | null>((resolve, reject) => {
    const open = indexedDB.open('stellar-empires', 1);
    open.onerror = () => reject(open.error ?? new Error('IndexedDB open failed.'));
    open.onsuccess = () => {
      const database = open.result;
      const transaction = database.transaction('saves', 'readonly');
      const request = transaction.objectStore('saves').get(id);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed.'));
      request.onsuccess = () => {
        resolve(request.result === undefined ? null : JSON.stringify(request.result));
      };
      transaction.oncomplete = () => database.close();
    };
  }), slotId);
}

function seedFromSaveJson(json: string | null): number | null {
  if (json === null) return null;
  return (JSON.parse(json) as { readonly state: { readonly seed: number } }).state.seed;
}

function galaxyFromSaveJson(json: string | null): string | null {
  if (json === null) return null;
  const parsed = JSON.parse(json) as { readonly state: { readonly galaxy: unknown } };
  return JSON.stringify(parsed.state.galaxy);
}

async function waitForSlot(page: Page, slotId: string): Promise<string> {
  await expect.poll(() => readSlotJson(page, slotId), { timeout: 15_000 }).not.toBeNull();
  const stored = await readSlotJson(page, slotId);
  if (stored === null) throw new Error(`Expected save slot ${slotId}.`);
  return stored;
}

async function selectAegisCampaign(page: Page, seed: number): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Настройте кампанию' })).toBeVisible({
    timeout: APP_READY_TIMEOUT,
  });
  await expect(page.getByLabel('Seed кампании')).toHaveValue(String(seed));
  await page.getByRole('button', { name: FACTION_BUTTON_NAME }).click();
  await waitForApp(page);
  await expect(page.locator('[data-current-seed]')).toHaveText(String(seed));
  await waitForSlot(page, 'autosave');
}

async function saveManualSlot(page: Page, slotId: string): Promise<void> {
  await page.getByLabel('Название слота сохранения').fill(slotId);
  await page.getByRole('button', { name: 'Сохранить текущую партию' }).click();
  await expect(page.locator(`[data-save-slot-id="${slotId}"]`)).toBeVisible();
  await waitForSlot(page, slotId);
}

async function setNextCampaignSeed(page: Page, seed: number): Promise<void> {
  await page.evaluate((nextSeed) => {
    const url = new URL(window.location.href);
    url.searchParams.set('campaignSeed', String(nextSeed));
    window.history.replaceState(null, '', url);
  }, seed);
}

async function markCurrentDocument(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.dataset.campaignLifecycleDocument = 'old';
  });
}

async function expectNewDocument(page: Page): Promise<void> {
  await expect(page.locator('html')).not.toHaveAttribute('data-campaign-lifecycle-document', 'old');
}

async function confirmNewCampaign(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Новая партия' }).click();
  const panel = page.locator('[data-new-campaign-confirm]');
  await expect(panel).toBeVisible();
  await markCurrentDocument(page);
  await panel.getByRole('button', { name: 'Подтвердить' }).click();
  await expect(page.getByRole('heading', { name: 'Настройте кампанию' })).toBeVisible({
    timeout: APP_READY_TIMEOUT,
  });
  await expectNewDocument(page);
}

async function importSaveThroughUi(page: Page, json: string, targetSlotId: string): Promise<void> {
  await page.getByLabel('Название слота сохранения').fill(targetSlotId);
  await page.evaluate(({ payload, target }) => {
    const slotInput = document.querySelector<HTMLInputElement>('input[aria-label="Название слота сохранения"]');
    const fileInput = document.querySelector<HTMLInputElement>('input[aria-label="Импорт сохранения JSON"]');
    if (slotInput === null || fileInput === null) throw new Error('Save manager import controls missing.');
    if (slotInput.value !== target) throw new Error('Import target was not applied.');
    const transfer = new DataTransfer();
    transfer.items.add(new File([payload], 'campaign.json', { type: 'application/json' }));
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  }, { payload: json, target: targetSlotId });
  await expect(page.locator(`[data-save-slot-id="${targetSlotId}"]`)).toBeVisible();
}

test('replayable campaign lifecycle keeps storage authority safe across real reloads', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?e2e=1&interactiveNewGame=1&campaignSeed=111#/system/saves');

  await selectAegisCampaign(page, 111);
  const campaignAFirst = await waitForSlot(page, 'autosave');
  const campaignAGalaxy = galaxyFromSaveJson(campaignAFirst);
  expect(campaignAGalaxy).not.toBeNull();

  await saveManualSlot(page, 'manual-survivor');

  const primaryBeforeImport = await readSlotJson(page, 'autosave');
  const snapshotBeforeImport = await readSlotJson(page, 'autosave.snapshot');
  if (primaryBeforeImport === null) throw new Error('Primary autosave missing before Import.');
  await importSaveThroughUi(page, primaryBeforeImport, 'manual-import');
  await expect(page.locator('.save-manager-message')).toHaveText('Импортирован слот manual-import');
  expect(await readSlotJson(page, 'autosave')).toBe(primaryBeforeImport);
  expect(await readSlotJson(page, 'autosave.snapshot')).toBe(snapshotBeforeImport);
  expect(seedFromSaveJson(await readSlotJson(page, 'manual-import'))).toBe(111);

  await page.getByRole('button', { name: 'Новая партия' }).click();
  const cancelPanel = page.locator('[data-new-campaign-confirm]');
  await expect(cancelPanel).toBeVisible();
  await cancelPanel.getByRole('button', { name: 'Отмена' }).click();
  await expect(cancelPanel).toBeHidden();
  await expect(page.locator('[data-current-seed]')).toHaveText('111');
  expect(seedFromSaveJson(await readSlotJson(page, 'autosave'))).toBe(111);

  await setNextCampaignSeed(page, 222);
  await confirmNewCampaign(page);
  expect(await readSlotJson(page, 'autosave')).toBeNull();
  expect(await readSlotJson(page, 'autosave.snapshot')).toBeNull();
  expect(seedFromSaveJson(await readSlotJson(page, 'manual-survivor'))).toBe(111);
  expect(seedFromSaveJson(await readSlotJson(page, 'manual-import'))).toBe(111);

  await selectAegisCampaign(page, 222);
  const campaignB = await waitForSlot(page, 'autosave');
  expect(seedFromSaveJson(campaignB)).toBe(222);
  expect(galaxyFromSaveJson(campaignB)).not.toBe(campaignAGalaxy);
  await saveManualSlot(page, 'manual-b');

  await setNextCampaignSeed(page, 111);
  await confirmNewCampaign(page);
  expect(await readSlotJson(page, 'autosave')).toBeNull();
  expect(seedFromSaveJson(await readSlotJson(page, 'manual-b'))).toBe(222);
  expect(seedFromSaveJson(await readSlotJson(page, 'manual-survivor'))).toBe(111);

  await selectAegisCampaign(page, 111);
  const campaignASecond = await waitForSlot(page, 'autosave');
  expect(galaxyFromSaveJson(campaignASecond)).toBe(campaignAGalaxy);

  const manualBRow = page.locator('[data-save-slot-id="manual-b"]');
  await expect(manualBRow).toBeVisible();
  await markCurrentDocument(page);
  await manualBRow.getByRole('button', { name: 'Загрузить' }).click();
  await waitForApp(page);
  await expectNewDocument(page);
  await expect(page.locator('[data-current-seed]')).toHaveText('222');
  expect(seedFromSaveJson(await readSlotJson(page, 'autosave'))).toBe(222);
  const snapshotAfterLoad = await readSlotJson(page, 'autosave.snapshot');
  if (snapshotAfterLoad !== null) expect(seedFromSaveJson(snapshotAfterLoad)).toBe(222);
  expect(seedFromSaveJson(await readSlotJson(page, 'manual-b'))).toBe(222);
  expect(seedFromSaveJson(await readSlotJson(page, 'manual-survivor'))).toBe(111);

  await markCurrentDocument(page);
  await page.reload();
  await waitForApp(page);
  await expectNewDocument(page);
  await expect(page.locator('[data-current-seed]')).toHaveText('222');
  expect(seedFromSaveJson(await readSlotJson(page, 'autosave'))).toBe(222);
});
