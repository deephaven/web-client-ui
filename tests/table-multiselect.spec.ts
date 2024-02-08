import { test, expect, Page } from '@playwright/test';
import { openTable } from './utils';

const rowHeight = 19;
const columnHeight = 30;
const filterHeight = 30;

async function waitForLoadingDone(page: Page) {
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);
}

async function getGridLocation(page: Page) {
  const grid = await page.locator('.iris-grid-panel .iris-grid');
  const gridLocation = await grid.boundingBox();
  expect(gridLocation).not.toBeNull();
  return gridLocation;
}

async function filterAndScreenshot(
  page: Page,
  gridLocation: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  filterType: string,
  screenshotName: string
) {
  // select the first 3 rows
  await page.mouse.move(
    gridLocation.x + 1,
    gridLocation.y + 1 + columnHeight + filterHeight
  );
  await page.mouse.down();
  await page.mouse.move(
    gridLocation.x + 1,
    gridLocation.y + 1 + columnHeight + filterHeight + rowHeight * 2
  );
  await page.mouse.up();
  await page.mouse.click(
    gridLocation.x + 1,
    gridLocation.y + 1 + columnHeight + filterHeight + rowHeight * 2,
    { button: 'right' }
  );
  // apply filter
  await page.getByRole('button', { name: 'Filter by Values' }).hover();
  await page.getByRole('button', { name: filterType, exact: true }).click();
  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot(
    screenshotName
  );

  // reset
  await page.keyboard.down('Control');
  await page.keyboard.press('E');
  await page.keyboard.up('Control');
  await waitForLoadingDone(page);
}

// these are select filters that do not do multiselect
function runSpecialSelectFilter(
  columnType: 'null' | 'empty' | 'bool',
  expectedButtons: string[]
) {
  test(`select ${columnType} filters`, async ({ page }) => {
    await openTable(page, `multiselect_${columnType}`);
    const gridLocation = await getGridLocation(page);
    if (gridLocation === null) return;

    await page.mouse.click(
      gridLocation.x + 1,
      gridLocation.y + 1 + columnHeight,
      { button: 'right' }
    );

    await page.getByRole('button', { name: 'Filter by Value' }).hover();
    await Promise.all(
      expectedButtons.map(async button => {
        await expect(page.getByRole('button', { name: button })).toBeVisible();
      })
    );
  });
}

function runMultiSelectFilter(
  columnType: 'datetime' | 'char' | 'number' | 'string',
  filters: { filter: string; name: string }[]
) {
  test(`multiselect ${columnType} filters`, async ({ page }) => {
    await openTable(page, `multiselect_${columnType}`);
    const gridLocation = await getGridLocation(page);
    if (gridLocation === null) return;

    // activate the quick filter to get that text as well
    await page.mouse.click(gridLocation.x + 805, gridLocation.y + 1);
    await page.keyboard.down('Control');
    await page.keyboard.press('F');
    await page.keyboard.up('Control');

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < filters.length; i += 1) {
      await filterAndScreenshot(
        page,
        gridLocation,
        filters[i].filter,
        `${columnType}-${i + 1}-${filters[i].name}.png`
      );
    }
    /* eslint-enable no-await-in-loop */
  });
}

// null, empty string, and bool, where
runSpecialSelectFilter('null', ['is null', 'is not null']);
runSpecialSelectFilter('empty', ['is empty string', 'is not empty string']);
runSpecialSelectFilter('bool', ['true', 'false', 'is null', 'is not null']);

// the other types
runMultiSelectFilter('string', [
  { name: 'is', filter: 'text is exactly' },
  { name: 'not-is', filter: 'text is not exactly' },
  { name: 'contains', filter: 'text contains' },
  { name: 'not-contains', filter: 'text does not contain' },
  { name: 'starts', filter: 'text starts with' },
  { name: 'ends', filter: 'text ends with' },
]);
runMultiSelectFilter('number', [
  { name: 'equal', filter: 'is equal to' },
  { name: 'not-equal', filter: 'is not equal to' },
  { name: 'greater', filter: 'greater than' },
  { name: 'greater-eq', filter: 'greater than or equal to' },
  { name: 'less', filter: 'less than' },
  { name: 'less-eq', filter: 'less than or equal to' },
]);
runMultiSelectFilter('datetime', [
  { name: 'is', filter: 'date is' },
  { name: 'not-is', filter: 'date is not' },
  { name: 'before', filter: 'date is before' },
  { name: 'before-eq', filter: 'date is before or equal' },
  { name: 'after', filter: 'date is after' },
  { name: 'after-eq', filter: 'date is after or equal' },
]);

// misc tests
test('char formatting, non selected right click, preview formatting', async ({
  page,
}) => {
  await openTable(page, 'multiselect_char');
  const gridLocation = await getGridLocation(page);
  if (gridLocation === null) return;

  // select row 2, 4
  await page.keyboard.down('Control');
  await page.mouse.click(
    gridLocation.x + 1,
    gridLocation.y + 1 + columnHeight + rowHeight
  );
  await page.mouse.click(
    gridLocation.x + 1,
    gridLocation.y + 1 + columnHeight + rowHeight * 3
  );
  await page.keyboard.up('Control');

  await page.mouse.click(
    gridLocation.x + 1,
    gridLocation.y + 1 + columnHeight,
    { button: 'right' }
  );
  await page.getByRole('button', { name: 'Filter by Value' }).hover();
  await expect(page.getByText('"a"', { exact: true })).toHaveCount(1);
});
