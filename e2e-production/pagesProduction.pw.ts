import { expect, test } from '@playwright/test';

const PRODUCTION_PATH = '/stellar-empires/';

test('production Pages build survives real new game, save/load, navigation and reload', async ({ page }) => {
  const notFoundResponses: string[] = [];
  page.on('response', (response) => {
    if (response.status() === 404 && response.url().includes(PRODUCTION_PATH)) {
      notFoundResponses.push(response.url());
    }
  });

  await page.goto(PRODUCTION_PATH);

  const dialog = page.locator('.new-game-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-campaign-orientation="true"]')).toContainText('Solar War');
  await expect(dialog.locator('[data-campaign-terminal-note="true"]')).toContainText('Победа фиксируется');

  const hero = dialog.locator('.new-game-faction__hero').first();
  await expect(hero).toHaveAttribute('src', /\/stellar-empires\/assets\//);
  await expect.poll(
    () => hero.evaluate((image) => {
      const element = image as HTMLImageElement;
      return element.complete && element.naturalWidth > 0;
    }),
  ).toBe(true);

  await dialog.locator('.new-game-setting__select').nth(0).selectOption('test');
  await dialog.locator('.new-game-setting__select').nth(1).selectOption('10');
  await dialog.locator('.new-game-faction--aegis').click();

  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(new RegExp(`${PRODUCTION_PATH.replaceAll('/', '\\/')}`));
  await expect(page.locator('.brand-logo')).toBeVisible();
  expect(notFoundResponses).toEqual([]);

  await page.locator('#nav-system').click();
  await expect(page).toHaveURL(new RegExp(`${PRODUCTION_PATH.replaceAll('/', '\\/')}#/system/saves$`));
  const saveButton = page.locator('[data-save-action="create"]');
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(page.locator('.save-manager-message')).toContainText('Слот manual-1 сохранён');

  const manualSlot = page.locator('.save-slot').filter({ hasText: 'manual-1' }).first();
  await expect(manualSlot).toBeVisible();
  await Promise.all([
    page.waitForEvent('load'),
    manualSlot.getByRole('button', { name: 'Загрузить' }).click(),
  ]);

  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('.new-game-dialog')).toHaveCount(0);
  await expect(page.locator('#system-view')).toBeVisible();
  expect(notFoundResponses).toEqual([]);

  const returnSummary = page.locator('#campaign-return-summary');
  if (await returnSummary.isVisible()) {
    await returnSummary.getByRole('button', { name: 'Продолжить кампанию' }).click();
    await expect(returnSummary).toHaveCount(0);
  }

  await page.locator('#nav-reports').click();
  await expect(page).toHaveURL(new RegExp(`${PRODUCTION_PATH.replaceAll('/', '\\/')}#/reports/all$`));
  await expect(page.locator('#reports-view')).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(new RegExp(`${PRODUCTION_PATH.replaceAll('/', '\\/')}#/reports/all$`));
  await expect(page.locator('#reports-view')).toBeVisible();
  await expect(page.locator('.new-game-dialog')).toHaveCount(0);
  expect(notFoundResponses).toEqual([]);
});
