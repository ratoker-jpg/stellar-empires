import { expect, test } from '@playwright/test';

const APP_READY_TIMEOUT = 45_000;

async function waitForApp(page: Parameters<typeof test>[0]['page']): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true', {
    timeout: APP_READY_TIMEOUT,
  });
}

async function installClockOffset(
  page: Parameters<typeof test>[0]['page'],
  milliseconds: number,
): Promise<void> {
  await page.addInitScript((offset) => {
    document.documentElement.dataset.e2eClockOffsetMilliseconds = String(offset);
  }, milliseconds);
}

test('active campaign clock advances without player fast-forward controls', async ({ page }) => {
  await page.goto('/?e2e=1#/planet/overview');
  await waitForApp(page);
  await expect(page.locator('#hud-world-time')).toHaveText('02:00:00');
  await expect(page.locator('.planet-time-controls')).toBeHidden();

  await page.evaluate(() => {
    document.documentElement.dataset.e2eClockOffsetMilliseconds = '5000';
  });
  await expect(page.locator('#hud-world-time')).toHaveText('02:00:05', {
    timeout: 8_000,
  });
  await expect(page.locator('#app-status')).toContainText('Кампания активна');
  await expect(page.locator('#hud-save-state')).toHaveAttribute('data-save-phase', 'saved', {
    timeout: 8_000,
  });
});

test('offline one-day and seven-day catch-up are bounded, resumable and acknowledged', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?e2e=1#/planet/overview');
  await waitForApp(page);
  await expect(page.locator('#hud-save-state')).toHaveAttribute('data-save-phase', 'saved', {
    timeout: 8_000,
  });

  await installClockOffset(page, 86_400_000);
  const oneDayStartedAt = Date.now();
  await page.reload();
  await waitForApp(page);
  const oneDayDurationMilliseconds = Date.now() - oneDayStartedAt;
  expect(oneDayDurationMilliseconds).toBeLessThan(20_000);
  await expect(page.locator('#hud-world-time')).toHaveText('1д 02:00:00');
  await expect(page.locator('#campaign-return-summary')).toBeVisible();
  await expect(page.locator('#campaign-return-summary')).toContainText(
    'Что произошло в ваше отсутствие',
  );
  await page.getByRole('button', { name: 'Продолжить кампанию' }).click();
  await expect(page.locator('#campaign-return-summary')).toHaveCount(0);

  await page.reload();
  await waitForApp(page);
  await expect(page.locator('#hud-world-time')).toHaveText('1д 02:00:00');
  await expect(page.locator('#campaign-return-summary')).toHaveCount(0);

  await installClockOffset(page, 604_800_000);
  const sevenDayStartedAt = Date.now();
  await page.reload();
  await waitForApp(page);
  const sevenDayDurationMilliseconds = Date.now() - sevenDayStartedAt;
  expect(sevenDayDurationMilliseconds).toBeLessThan(35_000);
  await expect(page.locator('#hud-world-time')).toHaveText('7д 02:00:00');
  await expect(page.locator('#campaign-return-summary')).toBeVisible();
  await expect(page.locator('.planet-time-controls')).toBeHidden();
});
