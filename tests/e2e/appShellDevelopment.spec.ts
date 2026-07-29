import { expect, test, type Page } from '@playwright/test';

async function activePlanetId(page: Page): Promise<string> {
  return page.locator('#hud-planet-selector').inputValue();
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

function captureStartupDiagnostics(page: Page): string[] {
  const diagnostics: string[] = [];
  page.on('pageerror', (error) => diagnostics.push(`pageerror=${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.push(`console=${message.text()}`);
  });
  return diagnostics;
}

async function expectAppReady(page: Page, diagnostics: readonly string[]): Promise<void> {
  await expect.poll(async () => {
    const ready = await page.locator('html').getAttribute('data-app-ready');
    if (ready === 'true') return 'true';
    const status = await page.locator('#app-status').textContent().catch(() => null);
    return `ready=${ready ?? 'unset'}; status=${status?.trim() ?? 'missing'}; ${diagnostics.join(' | ') || 'errors=none'}`;
  }, { timeout: 15_000 }).toBe('true');
}

test('Research is a primary route and zone gateways use browser history', async ({ page }) => {
  const diagnostics = captureStartupDiagnostics(page);
  await page.goto('/?e2e=1#/research');
  await expectAppReady(page, diagnostics);
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'research');
  await expect(page.locator('#research-view')).toBeVisible();
  await expect(page.locator('#research-screen-dialog')).toHaveCount(0);
  await expect(page.locator('#nav-research')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[data-testid="research-queue"]')).toBeVisible();
  await expect(page.locator('[data-testid="research-grid"] .research-card').first()).toBeVisible();

  await page.locator('#nav-planet').click();
  await page.locator('[data-planet-mode="industry"]').click();
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/industry$/);
  const researchGateway = page.getByRole('button', { name: /^Исследовательский комплекс/ });
  await expect(researchGateway).toBeVisible();
  await researchGateway.click();
  await expect(page).toHaveURL(/#\/research$/);
  await expect(page.locator('#research-view')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/industry$/);
  await expect(page.locator('#planet-view')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/#\/research$/);
  await expect(page.locator('#research-view')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'research');
});

test('shipyard, defence repair and upgrades restore as local Planet surfaces', async ({ page }) => {
  await page.goto('/?e2e=1#/research');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  const planetId = await activePlanetId(page);

  await page.goto(`/?e2e=1#/planet/${encodeURIComponent(planetId)}/industry?surface=shipyard`);
  await expect(page.locator('html')).toHaveAttribute('data-planet-development-surface', 'shipyard');
  await expect(page.locator('#ship-production-view')).toBeVisible();
  await expect(page.locator('#ship-production-dialog')).toHaveCount(0);
  await expect(page.locator('[data-testid="ship-production-queue"]')).toBeVisible();
  await expect(page.locator('[data-testid="ship-production-grid"] .production-card').first()).toBeVisible();

  await page.locator('[data-development-surface="zone"]').click();
  await expect(page).toHaveURL(new RegExp(`#\\/planet\\/${encodeURIComponent(planetId)}\\/industry$`));
  await expect(page.locator('#planet-core-workspace')).toBeVisible();
  const shipyardGateway = page.getByRole('button', { name: /^Орбитальная верфь/ });
  await expect(shipyardGateway).toBeVisible();
  await shipyardGateway.click();
  await expect(page).toHaveURL(/\/industry\?surface=shipyard$/);

  await page.locator('[data-planet-mode="military"]').click();
  await expect(page).toHaveURL(new RegExp(`#\\/planet\\/${encodeURIComponent(planetId)}\\/military$`));
  const defenseGateway = page.getByRole('button', { name: /^Планетарная оборона/ });
  await expect(defenseGateway).toBeVisible();
  await defenseGateway.click();
  await expect(page).toHaveURL(/\/military\?surface=defense$/);
  await expect(page.locator('#defense-production-view')).toBeVisible();
  await expect(page.locator('#defense-production-dialog')).toHaveCount(0);
  await expect(page.locator('[data-testid="defense-repair-queue"]')).toBeVisible();

  await page.goto(`/?e2e=1#/planet/${encodeURIComponent(planetId)}/industry?surface=upgrades`);
  await expect(page.locator('#ship-upgrades-view')).toBeVisible();
  await expect(page.locator('#ship-upgrades-dialog')).toHaveCount(0);
  await expect(page.locator('[data-testid="ship-upgrade-queue"]')).toBeVisible();
  await expect(page.locator('[data-testid="ship-upgrade-grid"] .ship-upgrade-card').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(new RegExp(`#\\/planet\\/${encodeURIComponent(planetId)}\\/industry\\?surface=upgrades$`));
  await expect(page.locator('html')).toHaveAttribute('data-planet-development-surface', 'upgrades');
  await expect(page.locator('#ship-upgrades-view')).toBeVisible();
});

test('development routes fit both release viewports and HUD follows active colony', async ({ page }) => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/?e2e=1#/research');
    await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
    await expect(page.locator('#hud-planet-selector')).toBeVisible();
    await expect(page.locator('#hud-active-coordinate')).not.toHaveText('—');
    await expect(page.locator('#hud-world-time')).not.toHaveText('');
    await expectNoHorizontalOverflow(page);

    const planetId = await activePlanetId(page);
    await page.goto(`/?e2e=1#/planet/${encodeURIComponent(planetId)}/military?surface=defense`);
    await expect(page.locator('#defense-production-view')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
