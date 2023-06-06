import { test, expect, Page, Locator } from '@playwright/test';
import { string } from 'prop-types';
import { makeTableCommand, pasteInMonaco, TableTypes } from './utils';

// Run tests serially since they all use the same table
test.describe.configure({ mode: 'serial' });

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
      pos && pos.x !== null && pos.y != null
        ? [pos.x + offsetX, pos.y - offsetY]
        : [1130, 470.5]
    );

  await element.hover();
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: stepNumber });

  const dropTargetIndicator = page.locator('.is-dropping');
  expect(dropTargetIndicator).toBeVisible();

  await page.mouse.up();

  await waitForLoadingDone(page);
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
  await expect(highlightRow).toHaveClass('btn btn-icon btn-formatter-type active');
  await doneButton.click();

  await expect(formattingRule).toHaveCount(1);
  await expect(highlightRow).toHaveCount(0);
  await expect(doneButton).toHaveCount(0);
  await waitForLoadingDone(page);
}

test.beforeEach(async ({ page }) => {
  // page = await browser.newPage();
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

test('can select distinct values', async ({ page }) => {
  // open Select Distinct panel
  await page.locator('data-testid=menu-item-Select Distinct Values').click();

  const columnSelect = page.getByRole('combobox');
  await expect(columnSelect).toHaveCount(1);

  await columnSelect.selectOption('String');

  // Check snapshot
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('can search', async ({ page }) => {
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

test('can conditional format', async ({ page }) => {
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
    await page.getByRole('button', { name: 'Cancel' }).click();

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Delete', async () => {
    await page.getByRole('button', { name: 'Delete rule' }).click();

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });
});

test('can organize columns', async ({ page }) => {
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

test('can custom column', async ({ page }) => {
  await page.locator('data-testid=menu-item-Custom Columns').click();

  await test.step('Create custom column', async () => {
    const columnName = page.getByPlaceholder('Column Name');
    await expect(columnName).toHaveCount(1);
    await columnName.click();
    await page.keyboard.type('Test');

    const columnFormula = page.locator('.editor-container');
    await expect(columnFormula).toHaveCount(1);
    await columnFormula.click();
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
      .then(pos =>
        pos && pos.x && pos.y ? [pos.x, pos.y - 100] : [1235, 302.5]
      );
    await reorderButton.hover();
    await page.mouse.down();
    await page.mouse.move(x, y, { steps: 1000 });

    const dropTargetIndicator = page.locator('.droppable-container');
    expect(dropTargetIndicator).toBeVisible();

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

test('can rollup rows and aggregrate columns', async ({ page }) => {
  await page.locator('data-testid=menu-item-Rollup Rows').click();

  await test.step('Rollup column', async () => {
    const stringColumn = page.getByRole('button', { name: 'String' });
    expect(stringColumn).toBeTruthy();
    await dragComponent(page, stringColumn, -150, 100);

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Toggle constituents', async () => {
    await page.getByText('Constituents').click();

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Toggle non-aggregated columns', async () => {
    await page.getByText('Non-Aggregated Columns').click();

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Rollup another column', async () => {
    const intColumn = page.getByRole('button', { name: 'Int', exact: true });
    expect(intColumn).toBeTruthy();
    await dragComponent(page, intColumn, 150, 80);

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Aggregate columns', async () => {
    await page.getByText('Constituents').click();
    await page.getByText('Non-Aggregated Columns').click();

    await page.getByTestId('btn-page-back').click();
    await page.getByTestId('menu-item-Aggregate Columns').click();
    await page.getByRole('button', { name: 'Add Aggregation' }).click();

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Edit aggregated columns', async () => {
    await page
      .getByRole('button', { name: 'Edit Columns', exact: true })
      .click();
    await page.getByText('Double', { exact: true }).click();

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Reset aggregated columns', async () => {
    await page.getByRole('button', { name: 'Reset' }).click();

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });
});
