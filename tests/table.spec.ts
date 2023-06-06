import { test, expect, Page, Locator } from '@playwright/test';
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
  await waitForLoadingDone(page);
}

async function waitForLoadingDone(page: Page) {
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);
}

async function dragComponent(
  page: Page,
  element: Locator,
  offsetX: number,
  offsetY: number,
  stepNumber: number = 1000
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

  const dropTargetIndicator = page.locator('.is-dropping');
  expect(dropTargetIndicator).toBeVisible();

  await page.mouse.up();

  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);
}

async function changeCondFormatComparison(
  page: Page,
  condition: string,
  column: string = ''
) {
  const formattingRule = page.locator('.formatting-item');
  const conditionSelect = page.locator('data-testid=condition-select');
  const highlightCell = page.getByRole('button', { name: 'Conditional' });
  const doneButton = page.getByRole('button', { name: 'Done' });
  const columnSelect = page
    .locator('.conditional-rule-editor')
    .getByRole('button')
    .first();

  await expect(formattingRule).toHaveCount(1);
  await expect(conditionSelect).toHaveCount(0);
  await expect(highlightCell).toHaveCount(0);

  await formattingRule.click();

  await expect(formattingRule).toHaveCount(0);
  await expect(conditionSelect).toHaveCount(1);
  await expect(highlightCell).toHaveCount(1);
  await expect(columnSelect).toHaveCount(1);

  await highlightCell.click();
  if (column !== '') {
    await columnSelect.click();
    await page.getByRole('button', { name: column, exact: true }).click();

    await page.locator('.style-editor').click();
    await page
      .locator('.style-options')
      .getByRole('button', { name: 'Positive' })
      .click();
  }
  await conditionSelect.selectOption(condition);
  await doneButton.click();

  await expect(formattingRule).toHaveCount(1);
  await expect(conditionSelect).toHaveCount(0);
  await expect(highlightCell).toHaveCount(0);
  await expect(columnSelect).toHaveCount(0);
  await waitForLoadingDone(page);
}

async function changeCondFormatHighlight(page: Page) {
  const formattingRule = page.locator('.formatting-item');
  const highlightRow = page.getByRole('button', { name: 'Rows' });
  const doneButton = page.getByRole('button', { name: 'Done' });

  await expect(formattingRule).toHaveCount(1);
  await expect(highlightRow).toHaveCount(0);
  await expect(doneButton).toHaveCount(0);

  await formattingRule.click();

  await expect(highlightRow).toHaveCount(1);
  await expect(doneButton).toHaveCount(1);

  await highlightRow.click();
  await doneButton.click();

  await expect(formattingRule).toHaveCount(1);
  await expect(highlightRow).toHaveCount(0);
  await expect(doneButton).toHaveCount(0);
  await waitForLoadingDone(page);
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
  await waitForLoadingDone(page);

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
  await waitForLoadingDone(page);

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

    const command = `${makeTableCommand(undefined, TableTypes.AllTypes)}`;

    await pasteInMonaco(consoleInput, command);
    await page.keyboard.press('Enter');

    // Wait for the panel to show
    await expect(page.locator('.iris-grid-panel')).toHaveCount(1);

    // Wait until it's done loading
    await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
      0
    );

    // Model is loaded, need to make sure table data is also loaded
    await waitForLoadingDone(page);

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

    await expect(searchBar).toHaveValue('2');

    // Wait until it's done loading
    await waitForLoadingDone(page);

    // Check snapshot
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Clear search query
    await page.keyboard.press('Backspace');

    await expect(searchBar).toHaveValue('');

    // Wait until it's done loading
    await waitForLoadingDone(page);

    // Check snapshot
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  test('can conditional format', async () => {
    await page.locator('data-testid=menu-item-Conditional Formatting').click();

    await test.step(' Setup new formatting rule', async () => {
      await page.getByRole('button', { name: 'Add New Rule' }).click();
      await page.locator('.style-editor').click();
      await page.getByRole('button', { name: 'Positive' }).click();
      await page.getByRole('button', { name: 'Done' }).click();
    });

    await test.step('Is null', async () => {
      await changeCondFormatComparison(page, 'is-null');
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

      await changeCondFormatHighlight(page);
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Is not null', async () => {
      await changeCondFormatComparison(page, 'is-not-null');
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

      await changeCondFormatHighlight(page);
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Change column', async () => {
      await changeCondFormatComparison(page, 'is-not-null', 'Int');
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

      await changeCondFormatHighlight(page);
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Cancel', async () => {
      const formattingRule = page.locator('.formatting-item');
      const conditionSelect = page.locator('data-testid=condition-select');

      await expect(conditionSelect).toHaveCount(0);

      await formattingRule.click();
      await conditionSelect.selectOption('is-null');
      await page.getByRole('button', { name: 'Cancel' }).first().click();

      await waitForLoadingDone(page);
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Delete', async () => {
      await page.getByRole('button', { name: 'Delete rule' }).click();

      await waitForLoadingDone(page);
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });
  });

  test('can organize columns', async () => {
    await page.locator('data-testid=menu-item-Organize Columns').click();

    await test.step('Search', async () => {
      await page.getByPlaceholder('Search').click();
      await page.keyboard.type('dou');

      await expect(
        page.locator('.visibility-ordering-builder')
      ).toHaveScreenshot();
    });

    await test.step('Move Selection Down', async () => {
      await page
        .getByRole('button', { name: 'Move selection down' })
        .click({ clickCount: 2 });

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Move Selection Up', async () => {
      await page.getByRole('button', { name: 'Move selection up' }).click();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Move Selection to Bottom', async () => {
      await page
        .getByRole('button', { name: 'Move selection to bottom' })
        .click();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Move Selection to Top', async () => {
      await page.getByRole('button', { name: 'Move selection to top' }).click();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Sort Descending', async () => {
      await page.getByRole('button', { name: 'Sort descending' }).click();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Sort Ascending', async () => {
      await page.getByRole('button', { name: 'Sort ascending' }).click();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Hide Selected', async () => {
      await page.getByRole('button', { name: 'Hide Selected' }).click();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Reset', async () => {
      await page.getByRole('button', { name: 'Reset' }).click();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Drag', async () => {
      const dragColumnButton = page.getByRole('button', {
        name: 'Toggle visibility Float',
      });
      const [x, y] = await dragColumnButton
        .boundingBox()
        .then(pos =>
          pos && pos.x != null && pos.y != null ? [pos.x, pos.y - 50] : [0, 0]
        );
      await dragColumnButton.hover();
      await page.mouse.down();
      await page.mouse.move(x, y, { steps: 50 });
      await page.mouse.up();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Create Group', async () => {
      await page
        .getByRole('button', { name: 'Toggle visibility String' })
        .click();
      await page.getByRole('button', { name: 'Group' }).click();
      await page.getByPlaceholder('Group Name').click();
      await page.keyboard.type('test');
      await page.keyboard.press('Enter');

      const dragColumnButton = page.getByRole('button', {
        name: 'Toggle visibility Long',
      });
      const [x, y] = await dragColumnButton
        .boundingBox()
        .then(pos =>
          pos && pos.x != null && pos.y != null
            ? [pos.x + 200, pos.y - 75]
            : [0, 0]
        );
      await dragColumnButton.hover();
      await page.mouse.down();
      await page.mouse.move(x, y, { steps: 50 });
      await page.mouse.up();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

      // Edit Group Name
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      await page.keyboard.type('new_test');
      await page.keyboard.press('Enter');

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

      // Delete Group
      await page
        .getByRole('button', { name: 'Delete group', exact: true })
        .click();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Toggle Visibility', async () => {
      await page
        .getByRole('button', { name: 'Toggle visibility Double' })
        .getByRole('button', { name: 'Toggle visibility' })
        .click();

      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });
  });

  test('can custom column', async () => {
    // open Custom Columns panel
    await page.locator('data-testid=menu-item-Custom Columns').click();

    await test.step('Create custom column', async () => {
      const columnName = page.getByPlaceholder('Column Name');
      await expect(columnName).toHaveCount(1);
      await columnName.click();
      await page.keyboard.type('Test');

      const columnFormula = page.locator('.editor-container');
      await expect(columnFormula).toHaveCount(1);
      await columnFormula.click({ force: true });
      await page.keyboard.type('Double * 2');
    });

    const addColumnButton = page.getByRole('button', {
      name: 'Add Another Column',
    });
    const saveButton = page.getByRole('button', { name: 'Save Column' });

    await test.step('Create 2nd custom columns from 1st', async () => {
      await addColumnButton.click();

      const newColumnName = page.getByPlaceholder('Column Name').nth(1);
      await newColumnName.click();
      await page.keyboard.type('Test2');

      const newColumnFormula = page.locator('.editor-container').nth(1);
      await newColumnFormula.click();
      await page.keyboard.type('Test * 2');

      await saveButton.click();

      await waitForLoadingDone(page);
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Drag', async () => {
      await addColumnButton.click();

      const dragColumn = page.getByPlaceholder('Column Name').nth(2);
      await dragColumn.click();
      await page.keyboard.type('Drag');

      const dragColumnFormula = page.locator('.editor-container').nth(2);
      await dragColumnFormula.click();
      await page.keyboard.type('String');

      const reorderButton = page
        .getByRole('button', { name: 'Drag column to re-order' })
        .nth(2);
      const [x, y] = await reorderButton
        .boundingBox()
        .then(pos => (pos && pos.x && pos.y ? [pos.x, pos.y - 100] : [0, 0]));
      await reorderButton.hover();
      await page.mouse.down();
      await page.mouse.move(x, y, { steps: 500 });
      await page.mouse.up();

      await saveButton.click();

      await waitForLoadingDone(page);
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });

    await test.step('Delete', async () => {
      const deleteLastColumnButton = page
        .getByRole('button', { name: 'Delete custom column' })
        .nth(1);
      await deleteLastColumnButton.click();
      await saveButton.click();

      await waitForLoadingDone(page);
      await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
    });
  });

  test('can rollup rows and aggregrate columns', async () => {
    // open Rollup Rows panel
    await page.locator('data-testid=menu-item-Rollup Rows').click();

    // Rollup string column
    const stringColumn = page.getByRole('button', { name: 'String' });
    await dragComponent(page, stringColumn, -150, 100);

    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Toggle Constituents
    await page.getByText('Constituents').click();

    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Toggle Non-Aggregated Columns
    await page.getByText('Non-Aggregated Columns').click();

    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Rollup int column after string
    const intColumn = page.getByRole('button', { name: 'Int', exact: true });
    await dragComponent(page, intColumn, 150, 80);

    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Aggregrate Columns
    await page.getByText('Constituents').click();
    await page.getByText('Non-Aggregated Columns').click();

    await page.getByTestId('btn-page-back').click();
    await page.getByTestId('menu-item-Aggregate Columns').click();
    await page.getByRole('button', { name: 'Add Aggregation' }).click();

    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Edit Aggregated Columns
    await page
      .getByRole('button', { name: 'Edit Columns', exact: true })
      .click();
    await page.getByText('Double', { exact: true }).click();

    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

    // Reset Aggregated Columns
    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(
      page.locator('.iris-grid .iris-grid-loading-status')
    ).toHaveCount(0);

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
    await waitForLoadingDone(page);

    // Check snapshot
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });
});
