import { test, expect, Page, Locator } from '@playwright/test';
import { string } from 'prop-types';
import { makeTableCommand, pasteInMonaco, TableTypes } from './utils';

// Run tests serially since they all use the same table
test.describe.configure({ mode: 'serial' });

async function openSimpleTable(page: Page) {
  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  const command = makeTableCommand();

  await pasteInMonaco(consoleInput, command);
  await page.keyboard.press('Enter');

  // Wait for the panel to show
  await expect(page.locator('.iris-grid-panel')).toHaveCount(1);

  // Wait until it's done loading
  await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
    0
  );

  // Model is loaded, need to make sure table data is also loaded
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);
}

async function dragComponent(
  page: Page,
  element: Locator,
  offsetX: number,
  offsetY: number,
  stepNumber: number = 500
) {
  // flipped the sign for offSetY since coordinates are from top-left of window
  const [x, y] = await element
    .boundingBox()
    .then(pos =>
      pos && pos.x && pos.y ? [pos.x + offsetX, pos.y - offsetY] : [0, 0]
    );

  await element.hover();
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: stepNumber });
  await page.mouse.up();

  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);
}

test('can open a simple table', async ({ page }) => {
  await page.goto('');
  await openSimpleTable(page);

  // Now we should be able to check the snapshot
  await expect(page.locator('.iris-grid-panel .iris-grid')).toHaveScreenshot();
});

test('can open a table with column header groups', async ({ page }) => {
  await page.goto('');
  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  const command = `${makeTableCommand('column_header_group')}
column_groups = [{ 'name': 'YandZ', 'children': ['y', 'z'] }, { 'name': 'All', 'children': ['x', 'YandZ'], 'color': 'white' }]
column_header_group = column_header_group.layout_hints(column_groups=column_groups)`;

  await pasteInMonaco(consoleInput, command);
  await page.keyboard.press('Enter');

  // Wait for the panel to show
  await expect(page.locator('.iris-grid-panel')).toHaveCount(1);

  // Wait until it's done loading
  await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
    0
  );

  // Model is loaded, need to make sure table data is also loaded
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);

  // Now we should be able to check the snapshot
  await expect(page.locator('.iris-grid-panel .iris-grid')).toHaveScreenshot();
});

test('can open a table with column header groups and hidden columns', async ({
  page,
}) => {
  await page.goto('');
  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  const command = `${makeTableCommand('column_header_group')}
column_groups = [{ 'name': 'YandZ', 'children': ['y', 'z'] }, { 'name': 'All', 'children': ['x', 'YandZ'], 'color': 'white' }]
column_header_group = column_header_group.layout_hints(column_groups=column_groups, hide=['y', 'z'])`;

  await pasteInMonaco(consoleInput, command);
  await page.keyboard.press('Enter');

  // Wait for the panel to show
  await expect(page.locator('.iris-grid-panel')).toHaveCount(1);

  // Wait until it's done loading
  await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
    0
  );

  // Model is loaded, need to make sure table data is also loaded
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);

  // Now we should be able to check the snapshot
  await expect(page.locator('.iris-grid-panel .iris-grid')).toHaveScreenshot();
});
test.describe('tests complex table operations', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('');

    const consoleInput = page.locator('.console-input');
    await consoleInput.click();

    const command = `${makeTableCommand(undefined, TableTypes.ManyColumns)}`;

    await pasteInMonaco(consoleInput, command);
    await page.keyboard.press('Enter');

    // Wait for the panel to show
    await expect(page.locator('.iris-grid-panel')).toHaveCount(1);

    // Wait until it's done loading
    await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
      0
    );

    // Model is loaded, need to make sure table data is also loaded
    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);
    // await page.waitForTimeout(delayForGridRender);

    const tableOperationsMenu = page.locator(
      'data-testid=btn-iris-grid-settings-button-table'
    );
    await tableOperationsMenu.click();

    // Wait for Table Options menu to show
    await expect(page.locator('.table-sidebar')).toHaveCount(1);
  });

  test('can select distinct values', async () => {
    // open Select Distinct panel
    await page.locator('data-testid=menu-item-Select Distinct Values').click();

    const columnSelect = page.getByRole('combobox');
    await expect(columnSelect).toHaveCount(1);

    await columnSelect.selectOption('String');

    // Check snapshot
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  test('can search', async () => {
    // open Search Bar panel
    await page.locator('data-testid=menu-item-Search Bar').click();

    const searchBar = page.getByPlaceholder('Search Data...');
    await expect(searchBar).toHaveCount(1);

    await searchBar.click();
    await page.keyboard.type('2');

    // Wait until it's done loading
    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(searchBar).toHaveValue('2');

    // Check snapshot
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Clear search query
    await page.keyboard.press('Backspace');

    await expect(searchBar).toHaveValue('');

    // Wait until it's done loading
    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    // Check snapshot
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  test('can rollup rows', async () => {
    // open Rollup Rows panel
    await page.locator('data-testid=menu-item-Rollup Rows').click();

    // Rollup string column
    const stringColumn = page.getByRole('button', { name: 'String' });
    await dragComponent(page, stringColumn, -100, 100);

    const browserName = stringColumn
      .page()
      .context()
      .browser()
      ?.browserType()
      .name();

    const stringDropdownPos =
      browserName === 'firefox' ? { x: 20, y: 78 } : { x: 19, y: 80 };
    await page
      .locator('.iris-grid .grid-wrapper')
      .click({ position: stringDropdownPos });

    const [stringColX, stringColY] = await stringColumn
      .boundingBox()
      .then(e => (e && e.x && e.y ? [e?.x, e?.y] : [0, 0]));

    await page.mouse.move(stringColX, stringColY, { steps: 100 }); // move mouse to prevent row highlight
    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot({
      maxDiffPixels: browserName === 'firefox' ? 60 : 0,
    });

    // Rollup int column after string
    const intColumn = page.getByRole('button', { name: 'Int', exact: true });
    await dragComponent(page, intColumn, 200, 80);
    await page.mouse.move(stringColX, stringColY, { steps: 100 }); // move mouse to prevent row highlight

    const intDropdownPos =
      browserName === 'firefox' ? { x: 31, y: 97 } : { x: 34, y: 98 };
    await page
      .locator('.iris-grid .grid-wrapper')
      .click({ position: stringDropdownPos });

    await page.mouse.move(stringColX, stringColY, { steps: 100 }); // move mouse to prevent row highlight

    await page
      .locator('.iris-grid .grid-wrapper')
      .click({ position: intDropdownPos });

    await page.mouse.move(stringColX, stringColY, { steps: 100 }); // move mouse to prevent row highlight
    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot({
      maxDiffPixels: browserName === 'firefox' ? 60 : 0,
    });

    // Toggle Constituents
    await page.getByText('Constituents').click();

    await page
      .locator('.iris-grid .grid-wrapper')
      .click({ position: stringDropdownPos });

    await page.mouse.move(stringColX, stringColY, { steps: 100 }); // move mouse to prevent row highlight
    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot({
      maxDiffPixels: browserName === 'firefox' ? 60 : 0,
    });

    // Toggle Non-Aggregated Columns
    await page.getByText('Non-Aggregated Columns').click();

    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot({
      maxDiffPixels: browserName === 'firefox' ? 60 : 0,
    });
  });
});

test.describe('tests simple table operations', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('');
    await openSimpleTable(page);
  });
  test.beforeEach(async () => {
    const tableOperationsMenu = page.locator(
      'data-testid=btn-iris-grid-settings-button-table'
    );
    await tableOperationsMenu.click();

    // Wait for Table Options menu to show
    await expect(page.locator('.table-sidebar')).toHaveCount(1);
  });

  test.afterEach(async () => {
    // Close the table operations sidebar
    await page
      .locator('.iris-grid')
      .locator('data-testid=btn-page-close')
      .click();

    await expect(page.locator('.iris-grid .table-sidebar')).toHaveCount(0);
  });

  test('can download table successfully', async () => {
    // open Download CSV panel
    await page.locator('data-testid=menu-item-Download CSV').click();

    const downloadButton = page.locator(
      'data-testid=btn-csv-exporter-download'
    );
    expect(downloadButton).toHaveCount(1);

    // try renaming file before downloading
    const fileNameInputField = page.locator(
      'data-testid=input-csv-exporter-file-name'
    );
    // Triple click to highlight current, autogenerated name
    await fileNameInputField.click({ clickCount: 3 });
    await page.keyboard.type('sin-and-cos.csv');
    await expect(fileNameInputField).toHaveValue('sin-and-cos.csv');

    downloadButton.click();

    // Wait for download to complete
    await expect(
      page.locator('.progress.progress-bar-striped.progress-bar-animated')
    ).toHaveCount(0);

    await expect(
      page.locator('.progress .progress-bar.bg-success')
    ).toHaveCount(1);
  });

  test('go to', async () => {
    // open with sidepanel button
    await page.locator('data-testid=menu-item-Go to').click();

    const gotoBar = page.locator('.iris-grid-bottom-bar.goto-row');
    const gotoBarInputField = gotoBar.getByPlaceholder('Row number');

    // wait for panel to open
    await expect(gotoBarInputField).toHaveCount(1);

    // test invalid row index
    await gotoBarInputField.click();
    await page.keyboard.type('641');
    await expect(gotoBar.locator('.goto-row-wrapper .text-danger')).toHaveCount(
      1
    );

    // test valid row index (row 64)
    await page.keyboard.press('Backspace');
    await expect(gotoBar.locator('.goto-row-wrapper .text-danger')).toHaveCount(
      0
    );

    // Check snapshot
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // close with sidepanel button
    await page.locator('data-testid=menu-item-Go to').click();

    await expect(gotoBar).toHaveCount(0);
  });

  test('advanced filters', async () => {
    // turn quick filters on
    const quickFiltersItem = page.locator(
      'data-testid=menu-item-Quick Filters'
    );
    await quickFiltersItem.click();

    // wait for toggle to switch to 'on'
    await expect(
      quickFiltersItem.locator('.btn.btn-switch.active')
    ).toHaveCount(1);

    // Open the Advanced Filters panel from the table (pick the 'y' column)
    // Note: This may click in the wrong place if the browser size is changed
    await page
      .locator('.iris-grid .grid-wrapper')
      .click({ position: { x: 100, y: 35 } });

    // wait for the panel to open
    await expect(page.locator('.advanced-filter-creator')).toHaveCount(1);

    // Apply filter (greater than 0)
    const selectionMenu = page
      .locator('.advanced-filter-creator')
      .locator('select');
    await selectionMenu.click();
    await selectionMenu.selectOption('greaterThan');
    await page
      .locator('.advanced-filter-creator')
      .getByPlaceholder('Enter value')
      .click();
    await page.keyboard.type('0');

    // wait for filter adding to appear
    const addFilterItem = page.locator(
      '.advanced-filter-creator .add-filter-item'
    );
    await expect(addFilterItem).toHaveCount(1);

    // Apply additional filter (OR equal to 0)
    const selectionMenu2 = selectionMenu.nth(1);
    await addFilterItem.locator('button:has-text("OR")').click();
    await selectionMenu2.click();
    await selectionMenu2.selectOption('eq');
    await page
      .locator('.advanced-filter-creator')
      .getByPlaceholder('Enter value')
      .nth(1)
      .click();
    await page.keyboard.type('0');

    await page
      .locator('.advanced-filter-creator')
      .locator('button:has-text("Done")')
      .click();

    // Wait until it's done loading
    await expect(page.locator('.iris-grid .iris-grid-loading')).toHaveCount(0);

    // Check snapshot
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  test('quick filters (with the advanced filters in above test applied)', async () => {
    // check if quick filters are still on
    await expect(
      page
        .locator('data-testid=menu-item-Quick Filters')
        .locator('.btn.btn-switch.active')
    ).toHaveCount(1);

    // Click the quick filter box (x column)
    // Note: This may click in the wrong place if the browser size is changed
    await page
      .locator('.iris-grid .grid-wrapper')
      .click({ position: { x: 20, y: 35 } });

    // Apply filter (greater 37)
    await page.keyboard.type('>37');

    // Wait until it's done loading
    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    // Check snapshot
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });
});
