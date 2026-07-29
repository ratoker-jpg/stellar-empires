import { expect, test, type Page } from '@playwright/test';

const APP_READY_TIMEOUT = 45_000;
const CLOCK_OFFSET_QUERY = 'e2eClockOffsetMilliseconds';
const CATCH_UP_INTERRUPTED_KEY = 'stellar-e2e-catch-up-interrupted';
const CATCH_UP_PROGRESS_OBSERVED_KEY = 'stellar-e2e-catch-up-progress-observed';

async function waitForApp(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true', {
    timeout: APP_READY_TIMEOUT,
  });
}

async function installClockOffsetInjection(page: Page): Promise<void> {
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (request.resourceType() !== 'document') {
      await route.continue();
      return;
    }
    const offset = new URL(request.url()).searchParams.get(CLOCK_OFFSET_QUERY);
    if (offset === null) {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const body = await response.text();
    await route.fulfill({
      response,
      body: body.replace(
        '<html',
        `<html data-e2e-clock-offset-milliseconds="${offset}"`,
      ),
    });
  });
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )).toBe(true);
}

async function acknowledgeSummaryByKeyboard(page: Page): Promise<void> {
  const continueButton = page.getByRole('button', { name: 'Продолжить кампанию' });
  const routeBeforeAcknowledgement = page.url();
  await continueButton.focus();
  await expect(continueButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(routeBeforeAcknowledgement);
  await expect(page.locator('#campaign-return-summary')).toHaveCount(0);
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
  await expect(page.locator('#hud-save-state')).toHaveAttribute('data-save-phase', 'saved', {
    timeout: 8_000,
  });
  await expectNoHorizontalOverflow(page);
});

test('seven-day catch-up resumes after browser interruption with reduced motion', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installClockOffsetInjection(page);
  await page.goto('/?e2e=1#/planet/overview');
  await waitForApp(page);
  await expect(page.locator('#hud-save-state')).toHaveAttribute('data-save-phase', 'saved', {
    timeout: 8_000,
  });

  await page.goto(
    `/?e2e=1&${CLOCK_OFFSET_QUERY}=604800000&e2eInterruptCatchUp=1#/planet/overview`,
    { waitUntil: 'domcontentloaded' },
  );
  await expect.poll(() => page.evaluate(
    (key) => window.localStorage.getItem(key),
    CATCH_UP_INTERRUPTED_KEY,
  ), { timeout: 30_000 }).toBe('true');
  await waitForApp(page);

  await expect.poll(() => page.evaluate(
    (key) => window.localStorage.getItem(key),
    CATCH_UP_PROGRESS_OBSERVED_KEY,
  )).toBe('true');
  await expect(page.locator('#hud-world-time')).toHaveText('7д 02:00:00');
  await expect(page.locator('#campaign-return-summary')).toBeVisible();
  await expect(page.locator('#campaign-return-summary')).toContainText(
    'Что произошло в ваше отсутствие',
  );
  await expect(page.locator('#campaign-return-summary')).not.toContainText(
    'Решений автономных империй',
  );
  await acknowledgeSummaryByKeyboard(page);

  await page.reload();
  await waitForApp(page);
  await expect(page.locator('#hud-world-time')).toHaveText('7д 02:00:00');
  await expect(page.locator('#campaign-return-summary')).toHaveCount(0);
  await expect(page.locator('.planet-time-controls')).toBeHidden();
  await expectNoHorizontalOverflow(page);
});

test('one-day catch-up completes at the large release viewport', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await installClockOffsetInjection(page);
  await page.goto('/?e2e=1#/planet/overview');
  await waitForApp(page);
  await expect(page.locator('#hud-save-state')).toHaveAttribute('data-save-phase', 'saved', {
    timeout: 8_000,
  });

  const startedAt = Date.now();
  await page.goto(
    `/?e2e=1&${CLOCK_OFFSET_QUERY}=86400000#/planet/overview`,
    { waitUntil: 'domcontentloaded' },
  );
  await waitForApp(page);
  expect(Date.now() - startedAt).toBeLessThan(35_000);
  await expect(page.locator('#hud-world-time')).toHaveText('1д 02:00:00');
  await expect(page.locator('#campaign-return-summary')).toBeVisible();
  await acknowledgeSummaryByKeyboard(page);
  await expect(page.locator('.planet-time-controls')).toBeHidden();
  await expectNoHorizontalOverflow(page);
});
