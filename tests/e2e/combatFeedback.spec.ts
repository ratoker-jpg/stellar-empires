import { expect, test, type Page } from '@playwright/test';

const ARENA_REPORT_ID = 'arena-result-e2e-combat-feedback';
const LEGACY_REPORT_ID = 'report-e2e-map-backlink';

async function openCombatReports(page: Page): Promise<void> {
  await page.goto('/?e2e=1#/reports/combat');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/reports\/combat$/);
  await expect(page.locator('[data-report-filter="combat"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
}

test('Reports route exposes Arena as PvE combat with persisted player tactical context', async ({ page }) => {
  await openCombatReports(page);

  const arena = page.locator(`[data-report-id="${ARENA_REPORT_ID}"]`);
  await expect(arena).toBeVisible();
  await expect(arena).toContainText('Арена · assault');
  await expect(arena).toContainText('Бой');
  await expect(arena).toContainText('PvE');
  await expect(arena).toContainText('success');

  const tactical = arena.locator('[data-testid="combat-tactical-context"]');
  await expect(tactical).toBeVisible();
  await expect(tactical).toContainText('Доктрина: vanguard');
  await expect(tactical).toContainText('Уровень Адмирала: 5');
  await expect(tactical).toContainText('Флагман: да');
  await expect(tactical).toContainText('Строй: wedge');
  await expect(tactical).toContainText('Приоритет цели: capitals');
  await expect(tactical).toContainText('Командир: commander.shared.executor');

  await expect(arena).not.toContainText('sentinel');
  await expect(arena).not.toContainText('defenderTacticalSnapshot');
});

test('legacy combat context renders safely without reconstructing current doctrine', async ({ page }) => {
  await openCombatReports(page);

  const legacy = page.locator(`[data-report-id="${LEGACY_REPORT_ID}"]`);
  await expect(legacy).toBeVisible();
  await expect(legacy).toContainText('Бой');
  await expect(legacy).toContainText('PvE');

  const tactical = legacy.locator('[data-testid="combat-tactical-context"]');
  await expect(tactical).toBeVisible();
  await expect(tactical).toHaveText('Тактический контекст: не зафиксирован.');
  await expect(tactical).not.toContainText('Доктрина:');
  await expect(tactical).not.toContainText('Флагман:');
});

test('ranking labels victories as combat-only and includes canonical combat history', async ({ page }) => {
  await page.goto('/?e2e=1#/ranking');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/ranking$/);

  const combatVictoryStat = page
    .locator('#ranking-profile-view .command-profile-stats > div')
    .filter({ hasText: 'Боевые победы' });
  await expect(combatVictoryStat).toHaveCount(1);
  await expect(combatVictoryStat.locator('span')).toHaveText('Боевые победы');
  await expect(combatVictoryStat.locator('strong')).toHaveText('2');

  const playerRow = page.locator('#ranking-list-view .command-ranking-entry.is-player');
  await expect(playerRow).toBeVisible();
  await expect(playerRow).toContainText('2 боев. побед');
  await expect(page.locator('#ranking-view')).not.toContainText('Победы');
});
