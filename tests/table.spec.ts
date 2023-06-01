import { test, expect, Page } from '@playwright/test';
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

async function changeCondFormatComparison(page: Page, condition: string) {
  const formattingRule = page.locator('.formatting-item');
  const conditionSelect = page.locator('data-testid=condition-select');
  const highlightCell = page.getByRole('button', { name: 'Conditional' });

  await expect(formattingRule).toHaveCount(1);
  await expect(conditionSelect).toHaveCount(0);
  await expect(highlightCell).toHaveCount(0);

  await formattingRule.click();
  await highlightCell.click();

  await conditionSelect.selectOption(condition);
  if (condition === 'is-between') {
    const startInput = page.getByPlaceholder('Start value');
    const endInput = page.getByPlaceholder('end value');

    expect(startInput).toHaveCount(1);
    expect(endInput).toHaveCount(1);

    await startInput.click();
    await page.keyboard.type('3');
    await endInput.click();
    await page.keyboard.type('10');
  }

  await page.getByRole('button', { name: 'Done' }).click();
}

async function changeCondFormatHighlight(page: Page) {
  const formattingRule = page.locator('.formatting-item');
  const highlightRow = page.getByRole('button', { name: 'Rows' });

  await expect(formattingRule).toHaveCount(1);
  await expect(highlightRow).toHaveCount(0);

  await formattingRule.click();
  await highlightRow.click();
  await page.getByRole('button', { name: 'Done' }).click();
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

  test('can conditional format', async () => {
    // Open Conditional Formatting Panel
    await page.locator('data-testid=menu-item-Conditional Formatting').click();

    // Setup New Formatting Rule
    await page.getByRole('button', { name: 'Add New Rule' }).click();
    await page.locator('.style-editor').click();
    await page.getByRole('button', { name: 'Positive' }).click();
    await page.getByPlaceholder('Enter value').click();
    await page.keyboard.type('3');
    await page.getByRole('button', { name: 'Done' }).click();

    // Is Equal To
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    await changeCondFormatHighlight(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Is Not Equal To
    await changeCondFormatComparison(page, 'is-not-equal');
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    await changeCondFormatHighlight(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Cancel
    const formattingRule = page.locator('.formatting-item');
    const conditionSelect = page.locator('data-testid=condition-select');

    await expect(conditionSelect).toHaveCount(0);

    await formattingRule.click();
    await conditionSelect.selectOption('is-null');
    await page.getByRole('button', { name: 'Cancel' }).first().click();
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Delete
    await page.getByRole('button', { name: 'Delete rule' }).click();
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
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
