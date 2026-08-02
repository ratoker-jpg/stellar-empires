import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

const LEGACY_TOP_LEVEL_DIALOGS = [
  '#mission-screen-dialog',
  '#operations-workspace-dialog',
  '#mission-reports-dialog',
  '#galaxy-intel-dialog',
  '#expedition-dialog',
  '#space-objects-dialog',
  '#world-events-dialog',
] as const;

test('Fleet, Operations and Reports are canonical routed workspaces', async ({ page }) => {
  await page.goto('/?e2e=1#/fleets/overview');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');

  await expect(page.locator('#fleets-view')).toBeVisible();
  await expect(page.locator('#nav-fleet')).toHaveAttribute('aria-current', 'page');
  for (const selector of LEGACY_TOP_LEVEL_DIALOGS) {
    await expect(page.locator(selector)).toHaveCount(0);
  }
  await expect(page.locator('#nav-expeditions, #nav-space-objects, #nav-world-events')).toHaveCount(0);
  for (const id of ['nav-fleet', 'nav-operations', 'nav-reports']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }

  for (const mode of ['compose', 'active', 'battles', 'overview'] as const) {
    await page.locator(`[data-fleet-mode="${mode}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#\\/fleets\\/${mode}$`));
    await expect(page.locator('html')).toHaveAttribute('data-fleet-route-mode', mode);
    await expect(page.locator(`[data-fleet-mode="${mode}"]`)).toHaveAttribute('aria-selected', 'true');
  }

  await page.locator('#nav-operations').click();
  await expect(page).toHaveURL(/#\/operations\/overview$/);
  await expect(page.locator('#operations-view')).toBeVisible();
  await expect(page.locator('.galaxy-intel-workspace')).toBeVisible();
  await expect(page.locator('[data-testid="pve-opportunity-intelligence"]')).toBeVisible();
  for (const mode of ['expeditions', 'objects', 'events', 'market', 'logistics', 'overview'] as const) {
    await page.locator(`[data-operations-mode="${mode}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#\\/operations\\/${mode}$`));
    await expect(page.locator('html')).toHaveAttribute('data-operations-route-mode', mode);
    await expect(page.locator(`[data-operations-mode="${mode}"]`)).toHaveAttribute('aria-selected', 'true');
    if (mode === 'expeditions') {
      await expect(page.getByLabel('Флот экспедиции')).toHaveCount(1);
      await expect(page.getByLabel('Цель экспедиции')).toHaveCount(1);
      await expect(page.locator('[data-testid="pve-opportunity-intelligence"]')).toBeVisible();
      await expect(page.locator('[data-opportunity-kind="expedition"]').first()).toBeVisible();
    }
    if (mode === 'objects') {
      await expect(page.getByLabel('Космический объект')).toHaveCount(1);
      await expect(page.getByLabel('Флот операции')).toHaveCount(1);
      await expect(page.locator('[data-testid="pve-opportunity-intelligence"]')).toBeVisible();
      await expect(page.locator('[data-opportunity-kind="space-object"]').first()).toBeVisible();
    }
    if (mode === 'events') {
      await expect(page.locator('[data-testid="pve-opportunity-intelligence"]')).toBeVisible();
      await expect(page.locator('[data-opportunity-kind="pirate-base"]').first()).toBeVisible();
      await expect(page.locator('[data-opportunity-kind="pirate-base"]').first()).toContainText('Множитель');
    }
  }

  await page.locator('#nav-reports').click();
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await expect(page.locator('#reports-view')).toBeVisible();
  for (const filter of ['combat', 'expedition', 'object', 'event', 'all'] as const) {
    await page.locator(`[data-report-filter="${filter}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#\\/reports\\/${filter}$`));
    await expect(page.locator('html')).toHaveAttribute('data-report-route-filter', filter);
    await expect(page.locator(`[data-report-filter="${filter}"]`)).toHaveAttribute('aria-selected', 'true');
  }

  await page.goBack();
  await expect(page).toHaveURL(/#\/reports\/event$/);
  await page.goForward();
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await expect(page.locator('html')).toHaveAttribute('data-report-route-filter', 'all');
  await expect(page.locator('#reports-view')).toBeVisible();
});

test('target handoff is presentation-only and repeated activation does not duplicate UI', async ({ page }) => {
  await page.goto('/?e2e=1#/operations/overview');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '0');

  const detail = {
    targetId: 'planet-e2e-target',
    label: 'Тестовая цель',
    mission: 'scout',
    source: 'galaxy-intel',
  };
  await page.evaluate((target) => {
    window.dispatchEvent(new CustomEvent('stellar:fleet-mission-target', { detail: target }));
    window.dispatchEvent(new CustomEvent('stellar:fleet-mission-target', { detail: target }));
  }, detail);

  await expect(page).toHaveURL(/#\/fleets\/compose$/);
  await expect(page.locator('#fleets-view')).toBeVisible();
  await expect(page.locator('[data-testid="mission-target-notice"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="mission-target-notice"]')).toContainText('Тестовая цель');
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '0');
  await expect(page.locator('#mission-screen-dialog')).toHaveCount(0);
});

test('canonical logistics supports create, edit, pause, resume, endpoint return and delete', async ({ page }) => {
  await page.goto('/?e2e=1#/operations/logistics');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('[data-testid="canonical-logistics-panel"]')).toHaveCount(1);
  await expect(page.locator('.command-panel .logistics-panel')).toHaveCount(0);

  const form = page.locator('[data-testid="logistics-create-form"]');
  const origin = form.locator('label').filter({ hasText: 'Планета отправления' }).locator('select');
  const target = form.locator('label').filter({ hasText: 'Планета назначения' }).locator('select');
  const values = await origin.locator('option').evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value));
  expect(values.length).toBeGreaterThanOrEqual(2);
  await origin.selectOption(values[0]!);
  await target.selectOption(values[1]!);
  await form.locator('label').filter({ hasText: 'Объём рейса' }).locator('input').fill('120');
  await form.locator('label').filter({ hasText: 'Резерв отправителя' }).locator('input').fill('50');
  await form.locator('label').filter({ hasText: 'Интервал' }).locator('select').selectOption('900');
  await form.locator('label').filter({ hasText: 'Приоритет' }).locator('select').selectOption('3');
  await form.getByRole('button', { name: 'Создать маршрут' }).click();

  const card = page.locator('[data-testid="logistics-route-list"] article');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('120 за рейс');
  await expect(card).toContainText('480/ч');
  await expect(card).toContainText('приоритет 3');
  await expect(card.locator('[data-testid="logistics-origin-link"]')).toHaveCount(1);
  await expect(card.locator('[data-testid="logistics-target-link"]')).toHaveCount(1);

  await card.locator('[data-testid="logistics-edit"]').click();
  const editForm = card.locator('.logistics-edit-form');
  await editForm.locator('label').filter({ hasText: 'Объём рейса' }).locator('input').fill('200');
  await editForm.locator('label').filter({ hasText: 'Интервал' }).locator('select').selectOption('1800');
  await editForm.locator('label').filter({ hasText: 'Приоритет' }).locator('select').selectOption('1');
  await editForm.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(card).toContainText('200 за рейс');
  await expect(card).toContainText('400/ч');
  await expect(card).toContainText('приоритет 1');

  await card.locator('[data-testid="logistics-toggle"]').click();
  await expect(card).toContainText('Маршрут приостановлен');
  await card.locator('[data-testid="logistics-toggle"]').click();
  await expect(card).toContainText('Следующий рейс через');

  await card.locator('[data-testid="logistics-edit"]').click();
  await expect(card.locator('.logistics-edit-form')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/operations\/logistics$/);
  await expect(page.locator('.logistics-edit-form')).toHaveCount(0);

  const endpoint = page.locator('[data-testid="logistics-origin-link"]').first();
  await endpoint.click();
  await expect(page).toHaveURL(/#\/planet\/.+\/overview$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/operations\/logistics$/);
  await expect(page.locator('[data-testid="canonical-logistics-panel"]')).toBeVisible();

  await page.locator('[data-testid="logistics-delete"]').click();
  await expect(page.locator('[data-testid="logistics-route-list"] article')).toHaveCount(0);
});

test('market executes on the explicitly selected colony', async ({ page }) => {
  await page.goto('/?e2e=1#/operations/market');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('[data-testid="canonical-market-panel"]')).toHaveCount(1);
  await expect(page.locator('.command-panel .market-panel')).toHaveCount(0);

  const secondaryPlanetId = await page.locator('html').getAttribute('data-e2e-secondary-planet-id');
  expect(secondaryPlanetId).not.toBeNull();
  await page.locator('[data-testid="market-planet"]').selectOption(secondaryPlanetId!);
  await expect(page.locator('[data-testid="market-colony-stocks"]')).toContainText('Металл');
  await page.locator('[data-testid="market-give-resource"]').selectOption('metal');
  await page.locator('[data-testid="market-receive-resource"]').selectOption('crystal');
  await page.locator('[data-testid="market-give-amount"]').fill('500');
  await expect(page.locator('[data-testid="market-quote"]')).toContainText('Получишь');
  await page.getByRole('button', { name: 'Подтвердить обмен' }).click();

  await expect(page.locator('.market-history')).toContainText('Вторая колония E2E');
  await expect(page.locator('[data-testid="market-feedback"]')).toHaveCount(1);
});

test('operation workspaces fit release and mobile viewports', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of [
      '#/fleets/compose',
      '#/operations/overview',
      '#/operations/expeditions',
      '#/operations/objects',
      '#/operations/events',
      '#/operations/market',
      '#/operations/logistics',
      '#/reports/all',
      '#/reports/event',
    ]) {
      await page.goto(`/?e2e=1${route}`);
      await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
      await expectNoHorizontalOverflow(page);
    }
  }
});
