import { test, expect, Page } from '@playwright/test';
import { pasteInMonaco } from './utils';

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

async function createSingleColumnTable(page: Page, cmd: string) {
  const consoleInput = page.locator('.console-input');
  await pasteInMonaco(consoleInput, cmd);
  await page.keyboard.press('Enter');

  // wait for panel to show, finish loading, and data to be loaded
  await expect(page.locator('.iris-grid-panel')).toHaveCount(1);
  await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
    0
  );
  await waitForLoadingDone(page);
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

function runMultiselectFilter(
  testName: string,
  testFilePrefix: string,
  cmd: string,
  filters: { filter: string; name: string }[]
) {
  test(testName, async ({ page }) => {
    await page.goto('');
    await createSingleColumnTable(page, cmd);
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
        `multi-${testFilePrefix}-${i + 1}-${filters[i].name}.png`
      );
    }
    /* eslint-enable no-await-in-loop */
  });
}

// these are select filters that do not do multiselect
function runSpecialSelectFilter(
  testName: string,
  cmd: string,
  expectedButtons: string[]
) {
  test(testName, async ({ page }) => {
    await page.goto('');
    await createSingleColumnTable(page, cmd);

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

// null, empty string, and bool, where
runSpecialSelectFilter(
  'null select filter',
  `
from deephaven.column import string_col
from deephaven import new_table

my_table = new_table([
    string_col("MultiselectTestData", [None])
])`,
  ['is null', 'is not null']
);
runSpecialSelectFilter(
  'empty string select filter',
  `
from deephaven.column import string_col
from deephaven import new_table

my_table = new_table([
    string_col("MultiselectTestData", [""])
])`,
  ['is empty string', 'is not empty string']
);
runSpecialSelectFilter(
  'bool select filter',
  `
from deephaven.column import bool_col
from deephaven import new_table

my_table = new_table([
  bool_col("MultiselectTestData", [True])
])`,
  ['true', 'false', 'is null', 'is not null']
);

// the other types
runMultiselectFilter(
  'multiselect string filters',
  'string',
  `
from deephaven.column import string_col
from deephaven import new_table

my_table = new_table([
    string_col("MultiselectTestData", ["A", "ABA", None, "ABABA", "AA", "ABAA", "AABA", "a", "aba", "ababa", "aa", "abaa", "aaba"])
])`,
  [
    { name: 'is', filter: 'text is exactly' },
    { name: 'not-is', filter: 'text is not exactly' },
    { name: 'contains', filter: 'text contains' },
    { name: 'not-contains', filter: 'text does not contain' },
    { name: 'starts', filter: 'text starts with' },
    { name: 'ends', filter: 'text ends with' },
  ]
);
runMultiselectFilter(
  'multiselect number filters',
  'number',
  `
from deephaven.column import double_col
from deephaven import new_table

my_table = new_table([
    double_col("MultiselectTestData", [1, 2, None, 3, 4, 0, -1.1, 1.1])
])`,
  [
    { name: 'equal', filter: 'is equal to' },
    { name: 'not-equal', filter: 'is not equal to' },
    { name: 'greater', filter: 'greater than' },
    { name: 'greater-eq', filter: 'greater than or equal to' },
    { name: 'less', filter: 'less than' },
    { name: 'less-eq', filter: 'less than or equal to' },
  ]
);
runMultiselectFilter(
  'multiselect date filters',
  'date',
  `
from deephaven.time import to_j_instant
from deephaven import new_table
from deephaven.column import datetime_col

t1 = to_j_instant("2021-06-02T08:00:02 ET")
t2 = to_j_instant("2021-06-03T08:00:03 ET")
t3 = to_j_instant("2021-06-04T08:00:04 ET")
t4 = to_j_instant("2021-06-01T08:00:01 ET")

result = new_table([
    datetime_col("MultiselectTestData", [t1, t2, None, t3, t4])
])`,
  [
    { name: 'is', filter: 'date is' },
    { name: 'not-is', filter: 'date is not' },
    { name: 'before', filter: 'date is before' },
    { name: 'before-eq', filter: 'date is before or equal' },
    { name: 'after', filter: 'date is after' },
    { name: 'after-eq', filter: 'date is after or equal' },
  ]
);

// misc tests
test('char formatting, non selected right click, preview formatting', async ({
  page,
}) => {
  await page.goto('');
  await createSingleColumnTable(
    page,
    `
from deephaven.column import char_col
from deephaven import new_table

my_table = new_table([
    char_col("MultiselectTestData", [97, 98, 99, 100, 101])
])`
  );
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
