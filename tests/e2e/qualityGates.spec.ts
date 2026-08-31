import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const QUALITY_VIEWPORT = { width: 1366, height: 768 } as const;
const EMPIRE_OVERVIEW_BASELINE_WIDTH = 1093;

async function openStableEmpireOverview(page: Page): Promise<void> {
  await page.setViewportSize(QUALITY_VIEWPORT);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?e2e=1#/command/overview');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('#command-overview-view')).toBeVisible();
  await expect(page.locator('.empire-colony-card')).toHaveCount(2);
}

test('empire overview has no WCAG A/AA automated accessibility violations', async ({ page }) => {
  await openStableEmpireOverview(page);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(
    results.violations,
    JSON.stringify(
      results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })),
      null,
      2,
    ),
  ).toEqual([]);
});

test('empire overview visual baseline remains stable', async ({ page }) => {
  await openStableEmpireOverview(page);

  // NAV-V2-01 intentionally changes the surrounding shell width. Keep this
  // component snapshot at its established capture width so the baseline still
  // detects visual regressions inside Empire Overview instead of accepting or
  // rejecting a screenshot only because the outer navigation geometry moved.
  const overview = page.locator('#command-overview-view');
  await overview.evaluate((element, width) => {
    const htmlElement = element as HTMLElement;
    htmlElement.style.width = `${width}px`;
    htmlElement.style.maxWidth = `${width}px`;
  }, EMPIRE_OVERVIEW_BASELINE_WIDTH);

  await expect(overview).toHaveScreenshot('empire-overview.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.001,
  });
});
