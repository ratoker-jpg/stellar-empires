import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const QUALITY_VIEWPORT = { width: 1366, height: 768 } as const;
const EMPIRE_OVERVIEW_BASELINE_WIDTH = 1089;
const EMPIRE_OVERVIEW_BASELINE_HEIGHT = 640;
const VISUAL_SIGNATURE_COLUMNS = 12;
const VISUAL_SIGNATURE_ROWS = 8;
const EMPIRE_OVERVIEW_VISUAL_SIGNATURE = [
  50, 61, 45, 32, 31, 31, 30, 30, 31, 31, 31, 32,
  35, 35, 28, 27, 31, 26, 26, 26, 27, 26, 26, 28,
  35, 40, 34, 18, 38, 38, 29, 20, 43, 35, 34, 23,
  47, 46, 35, 33, 28, 28, 51, 54, 46, 33, 28, 27,
  34, 23, 34, 23, 27, 18, 36, 21, 37, 21, 27, 17,
  30, 28, 28, 24, 29, 22, 31, 25, 30, 23, 30, 19,
  29, 26, 18, 12, 12, 14, 29, 26, 16, 12, 12, 13,
  19, 20, 23, 24, 19, 19, 18, 19, 26, 26, 18, 16,
] as const;

async function openStableEmpireOverview(page: Page): Promise<void> {
  await page.setViewportSize(QUALITY_VIEWPORT);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?e2e=1#/command/overview');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('#command-overview-view')).toBeVisible();
  await expect(page.locator('.empire-colony-card')).toHaveCount(2);
}

async function createVisualSignature(page: Page, screenshotBase64: string): Promise<number[]> {
  return page.evaluate(async ({ base64, columns, rows }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context === null) throw new Error('Canvas 2D context is unavailable.');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const signature: number[] = [];

    for (let row = 0; row < rows; row += 1) {
      const yStart = Math.floor((row * canvas.height) / rows);
      const yEnd = Math.floor(((row + 1) * canvas.height) / rows);
      for (let column = 0; column < columns; column += 1) {
        const xStart = Math.floor((column * canvas.width) / columns);
        const xEnd = Math.floor(((column + 1) * canvas.width) / columns);
        let luminance = 0;
        let count = 0;
        for (let y = yStart; y < yEnd; y += 1) {
          for (let x = xStart; x < xEnd; x += 1) {
            const offset = (y * canvas.width + x) * 4;
            const red = pixels[offset] ?? 0;
            const green = pixels[offset + 1] ?? 0;
            const blue = pixels[offset + 2] ?? 0;
            luminance += red * 0.2126 + green * 0.7152 + blue * 0.0722;
            count += 1;
          }
        }
        signature.push(Math.round(luminance / Math.max(1, count)));
      }
    }
    return signature;
  }, {
    base64: screenshotBase64,
    columns: VISUAL_SIGNATURE_COLUMNS,
    rows: VISUAL_SIGNATURE_ROWS,
  });
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

test('empire overview visual signature remains stable', async ({ page }) => {
  await openStableEmpireOverview(page);

  // The canonical shell intentionally changed the component's available width.
  // Keep the regression signal textual and deterministic so CI can validate the
  // rendered component without requiring binary snapshot updates through GitHub.
  const overview = page.locator('#command-overview-view');
  const box = await overview.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box?.width ?? 0)).toBe(EMPIRE_OVERVIEW_BASELINE_WIDTH);
  expect(Math.round(box?.height ?? 0)).toBe(EMPIRE_OVERVIEW_BASELINE_HEIGHT);

  const screenshot = await overview.screenshot({ animations: 'disabled', caret: 'hide' });
  const signature = await createVisualSignature(page, screenshot.toString('base64'));
  expect(signature).toHaveLength(EMPIRE_OVERVIEW_VISUAL_SIGNATURE.length);

  const deltas = signature.map((value, index) => {
    const expectedValue = EMPIRE_OVERVIEW_VISUAL_SIGNATURE[index];
    if (expectedValue === undefined) throw new Error(`Visual signature index ${index} is outside the baseline.`);
    return Math.abs(value - expectedValue);
  });
  const meanDelta = deltas.reduce((total, value) => total + value, 0) / deltas.length;
  expect(meanDelta).toBeLessThanOrEqual(2);
  expect(Math.max(...deltas)).toBeLessThanOrEqual(10);
  expect(deltas.filter((value) => value > 6)).toHaveLength(0);
});
