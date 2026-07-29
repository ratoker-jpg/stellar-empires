import { expect, test, type Page } from '@playwright/test';

const APP_READY_TIMEOUT = 45_000;
const CLOCK_OFFSET_KEY = 'stellar-e2e-clock-offset-milliseconds';

async function waitForApp(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true', {
    timeout: APP_READY_TIMEOUT,
  });
}

async function installPersistentClockOffset(page: Page): Promise<void> {
  await page.addInitScript((storageKey) => {
    const offset = window.localStorage.getItem(storageKey);
    if (offset !== null) {
      document.documentElement.dataset.e2eClockOffsetMilliseconds = offset;
    }
  }, CLOCK_OFFSET_KEY);
}

async function setClockOffset(page: Page, milliseconds: number): Promise<void> {
  await page.evaluate(({ storageKey, offset }) => {
    window.localStorage.setItem(storageKey, String(offset));
  }, { storageKey: CLOCK_OFFSET_KEY, offset: milliseconds });
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )).toBe(true);
}

async function observeCatchUpProgress(page: Page): Promise<void> {
  const dialog = page.locator('#campaign-catch-up-dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await expect(dialog.locator('[role="progressbar"]')).toBeVisible();
  await expect.poll(() => dialog.getAttribute('data-progress-updates')).not.toBeNull();
}

test('active campaign clock advances without player fast-forward controls', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
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
  await expectNoHorizontalOverflow(page);
});

test('one-day catch-up resumes after browser interruption with keyboard and reduced motion', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installPersistentClockOffset(page);
  await page.goto('/?e2e=1#/planet/overview');
  await waitForApp(page);
  await expect(page.locator('#hud-save-state')).toHaveAttribute('data-save-phase', 'saved', {
    timeout: 8_000,
  });

  await setClockOffset(page, 86_400_000);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await observeCatchUpProgress(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForApp(page);

  await expect(page.locator('#hud-world-time')).toHaveText('1д 02:00:00');
  await expect(page.locator('#campaign-return-summary')).toBeVisible();
  await expect(page.locator('#campaign-return-summary')).toContainText(
    'Что произошло в ваше отсутствие',
  );
  await expect(page.locator('#campaign-return-summary')).not.toContainText(
    'Решений автономных империй',
  );
  const continueButton = page.getByRole('button', { name: 'Продолжить кампанию' });
  await continueButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#campaign-return-summary')).toHaveCount(0);

  await page.reload();
  await waitForApp(page);
  await expect(page.locator('#hud-world-time')).toHaveText('1д 02:00:00');
  await expect(page.locator('#campaign-return-summary')).toHaveCount(0);
  await expect(page.locator('.planet-time-controls')).toBeHidden();
  await expectNoHorizontalOverflow(page);
});

test('seven-day catch-up exposes progress at the large release viewport', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await installPersistentClockOffset(page);
  await page.goto('/?e2e=1#/planet/overview');
  await waitForApp(page);
  await expect(page.locator('#hud-save-state')).toHaveAttribute('data-save-phase', 'saved', {
    timeout: 8_000,
  });

  await setClockOffset(page, 604_800_000);
  const startedAt = Date.now();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await observeCatchUpProgress(page);
  await waitForApp(page);
  expect(Date.now() - startedAt).toBeLessThan(35_000);
  await expect(page.locator('#hud-world-time')).toHaveText('7д 02:00:00');
  await expect(page.locator('#campaign-return-summary')).toBeVisible();
  await expect(page.locator('.planet-time-controls')).toBeHidden();
  await expectNoHorizontalOverflow(page);
});
