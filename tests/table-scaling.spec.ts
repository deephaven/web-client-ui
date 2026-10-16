import { test, expect, type Page } from '@playwright/test';
import {
  getCellRect,
  getColumnHeaderNames,
  waitForGrid,
} from '@deephaven/playwright-grid';
import { gotoPage, openTable, waitForLoadingDone } from './utils';

/**
 * The grid reads pointer positions in screen space and its metrics in layout space.
 * These tests apply a CSS transform to the grid and check that every place that
 * converts between the two still lands where the user can see it. Scale 1 is the
 * baseline; at any other scale, code that uses on-screen sizes where layout sizes
 * are expected (or the reverse) puts things in the wrong place.
 */

const GRID = '.iris-grid-panel .iris-grid';
const CANVAS = `${GRID} canvas.grid-canvas`;

const SCALES = [1, 0.5, 2];

/** Allowed difference in screen pixels between where something is and where it should be */
const TOLERANCE = 3;

type Box = { x: number; y: number; width: number; height: number };

function center(box: Box): { x: number; y: number } {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Rendered size of the canvas divided by its layout size */
async function getRenderedScale(page: Page): Promise<number> {
  const canvas = page.locator(CANVAS);
  const box = await canvas.boundingBox();
  if (box == null) throw new Error('Grid canvas not found');
  const layoutWidth = await canvas.evaluate(element => element.clientWidth);
  return box.width / layoutWidth;
}

/**
 * Scale the grid with a CSS transform, so it is rendered at `scale` times its layout size.
 * A transform does not notify the grid, so move the mouse over it to have it refresh its metrics.
 */
async function scaleGrid(page: Page, scale: number): Promise<void> {
  await page.locator(GRID).evaluate((element, value) => {
    const grid = element as HTMLElement;
    grid.style.transformOrigin = '0 0';
    grid.style.transform = `scale(${value})`;
    if (value > 1) {
      // Shrink the layout box so the scaled grid still fits its panel, otherwise the panel scrolls it out of view
      grid.style.width = `${100 / value}%`;
      grid.style.height = `${100 / value}%`;
    }
  }, scale);

  await expect.poll(() => getRenderedScale(page)).toBeCloseTo(scale, 1);

  // The grid can extend past the viewport when scaled up, so use a point that is always on screen
  const box = await page
    .locator('.advanced-filter-menu-container')
    .first()
    .boundingBox();
  if (box == null) throw new Error('Grid not found');
  const { x, y } = center(box);
  await page.mouse.move(x, y);
  await page.mouse.move(x + 5, y + 5);

  // The refreshed metrics reach IrisGrid state from the canvas redraw, which runs in an animation frame
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );
}

async function openScaledTable(page: Page, scale: number): Promise<void> {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);
  await waitForGrid(page.locator(GRID));
  await scaleGrid(page, scale);
}

/**
 * On-screen bounds of a column header.
 * Each visible column has an advanced filter menu container that exactly covers its header.
 */
async function getHeaderBox(page: Page, columnIndex: number): Promise<Box> {
  const box = await page
    .locator('.advanced-filter-menu-container')
    .nth(columnIndex)
    .boundingBox();
  if (box == null) throw new Error(`Header ${columnIndex} not found`);
  return box;
}

/** On-screen centre of a cell, converting its layout position within the canvas */
async function getCellPoint(
  page: Page,
  column: string,
  row: number,
  scale: number
): Promise<{ x: number; y: number }> {
  const rect = await getCellRect(page.locator(GRID), column, row);
  const canvasBox = await page.locator(CANVAS).boundingBox();
  if (canvasBox == null) throw new Error('Grid canvas not found');
  return {
    x: canvasBox.x + (rect.x + rect.width / 2) * scale,
    y: canvasBox.y + (rect.y + rect.height / 2) * scale,
  };
}

test.beforeEach(async ({ page }) => {
  await gotoPage(page, '');
});

SCALES.forEach(scale => {
  test.describe(`grid scaled to ${scale}`, () => {
    test('clicking a cell selects the cell under the pointer', async ({
      page,
    }) => {
      await openScaledTable(page, scale);

      const { x, y } = await getCellPoint(page, 'y', 5, scale);
      await page.mouse.click(x, y);

      // Go to Row starts from the cursor, so it reports which cell was clicked
      await page.keyboard.press('ControlOrMeta+g');
      await expect(page.getByTestId('goto-row-input')).toHaveValue('6');
      await expect(page.locator('#column-name-select')).toHaveValue('y');
    });

    test('dragging a column separator resizes the column by the distance dragged', async ({
      page,
    }) => {
      await openScaledTable(page, scale);

      const before = await getHeaderBox(page, 0);
      const separatorX = before.x + before.width;
      const { y } = center(before);
      const dragDistance = 40;

      await page.mouse.move(separatorX, y);
      await page.mouse.down();
      await page.mouse.move(separatorX + dragDistance, y, { steps: 20 });
      await page.mouse.up();

      // The header follows the pointer on screen, whatever the scale
      await expect
        .poll(async () =>
          Math.abs(
            (await getHeaderBox(page, 0)).width - (before.width + dragDistance)
          )
        )
        .toBeLessThanOrEqual(TOLERANCE);
    });

    test('dragging a column header moves the column', async ({
      page,
      browserName,
    }) => {
      test.skip(
        browserName === 'webkit',
        'Column moves are driven by movementX, which Playwright mouse events leave at 0 in WebKit'
      );
      await openScaledTable(page, scale);
      await expect
        .poll(() => getColumnHeaderNames(page.locator(GRID)))
        .toEqual(['x', 'y', 'z']);

      const first = await getHeaderBox(page, 0);
      const second = await getHeaderBox(page, 1);
      const { x: startX, y } = center(first);

      // The column swaps once its leading edge passes the middle of the next column, which is only reached if the drag distance is converted to layout pixels
      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(startX + second.width * 0.8, y, { steps: 20 });
      await page.mouse.up();

      await expect
        .poll(() => getColumnHeaderNames(page.locator(GRID)))
        .toEqual(['y', 'x', 'z']);
    });

    test('column tooltip points at the hovered column header', async ({
      page,
    }) => {
      await openScaledTable(page, scale);

      const header = await getHeaderBox(page, 1);
      const headerCenter = center(header);
      await page.mouse.move(headerCenter.x, headerCenter.y);

      const tooltip = page
        .locator('.popper-tooltip')
        .filter({ has: page.locator('.column-statistics') });
      await expect(tooltip).toBeVisible();

      // The arrow stays on the reference even when the popper is shifted to fit the window
      await expect
        .poll(async () => {
          const arrow = await tooltip.locator('.popper-arrow').boundingBox();
          return arrow == null
            ? Infinity
            : Math.abs(center(arrow).x - headerCenter.x);
        })
        .toBeLessThanOrEqual(TOLERANCE);
    });

    test('linker anchors to the bottom centre of the selected column header', async ({
      page,
    }) => {
      await openScaledTable(page, scale);

      await page.getByRole('button', { name: 'Controls' }).click();
      await page.getByRole('button', { name: 'Linker' }).click();

      const header = await getHeaderBox(page, 1);
      const { x } = center(header);
      await page.mouse.move(x, header.y + header.height / 2);
      await page.mouse.click(x, header.y + header.height / 2);

      const dot = page.locator('.linker-overlay .link-dot');
      await expect(dot).toHaveCount(1);

      await expect
        .poll(async () => {
          const dotBox = await dot.boundingBox();
          if (dotBox == null) return Infinity;
          const dotCenter = center(dotBox);
          return Math.max(
            Math.abs(dotCenter.x - x),
            Math.abs(dotCenter.y - (header.y + header.height))
          );
        })
        .toBeLessThanOrEqual(TOLERANCE);
    });
  });
});
