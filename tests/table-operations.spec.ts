import { test, expect, Page } from '@playwright/test';
import {
  makeTableCommand,
  pasteInMonaco,
  TableTypes,
  dragComponent,
  waitForLoadingDone,
  openTableOption,
} from './utils';

// Run tests serially since they all use the same table
test.describe.configure({ mode: 'serial' });

async function changeCondFormatComparison(
  page: Page,
  condition: string,
  column = ''
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
  await expect(page.getByText('Edit Formatting Rule')).toHaveCount(1);

  await highlightCell.click();
  await expect(highlightCell).toHaveClass(
    'btn btn-icon btn-formatter-type active'
  );
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
  await expect(conditionSelect).toHaveValue(condition);

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
  await expect(highlightRow).toHaveClass(
    'btn btn-icon btn-formatter-type active'
  );
  await doneButton.click();

  await expect(formattingRule).toHaveCount(1);
  await expect(highlightRow).toHaveCount(0);
  await expect(doneButton).toHaveCount(0);
  await waitForLoadingDone(page);
}

test.beforeEach(async ({ page }) => {
  await page.goto('');

  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  const command = makeTableCommand(undefined, TableTypes.AllTypes);

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

test('select distinct values', async ({ page }) => {
  await openTableOption(page, 'Select Distinct Values');

  const columnSelect = page.getByRole('combobox');
  await expect(columnSelect).toHaveCount(1);

  await columnSelect.selectOption('String');

  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('search', async ({ page }) => {
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

// TODO: Fix flakiness of this test by linking loading status bar to this menu (#1367)
// test('conditional format', async ({ page }) => {
//   await openTableOption(page, 'Conditional Formatting');

//   await test.step('Setup new formatting rule', async () => {
//     await page.getByRole('button', { name: 'Add New Rule' }).click();
//     await page.locator('.style-editor').click();
//     await page.getByRole('button', { name: 'Positive' }).click();
//     await page.getByRole('button', { name: 'Done' }).click();
//   });

//   await test.step('Is null', async () => {
//     await changeCondFormatComparison(page, 'is-null');
//     await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

//     await changeCondFormatHighlight(page);
//     await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
//   });

//   await test.step('Is not null', async () => {
//     await changeCondFormatComparison(page, 'is-not-null');
//     await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

//     await changeCondFormatHighlight(page);
//     await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
//   });

//   await test.step('Change column', async () => {
//     await changeCondFormatComparison(page, 'is-not-null', 'Int');
//     await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

//     await changeCondFormatHighlight(page);
//     await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
//   });

//   await test.step('Cancel', async () => {
//     const formattingRule = page.locator('.formatting-item');
//     const conditionSelect = page.locator('data-testid=condition-select');

//     await expect(conditionSelect).toHaveCount(0);

//     await formattingRule.click();
//     await conditionSelect.selectOption('is-null');
//     await page.getByRole('button', { name: 'Cancel' }).click();

//     await waitForLoadingDone(page);
//     await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
//   });

//   await test.step('Delete', async () => {
//     await page.getByRole('button', { name: 'Delete rule' }).click();

//     await waitForLoadingDone(page);
//     await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
//   });
// });

test('organize columns', async ({ page }) => {
  await openTableOption(page, 'Organize Columns');

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

  const dropIndicator = page
    .locator('.visibility-ordering-list')
    .locator('.marching-ants');
  await test.step('Drag', async () => {
    const floatOption = page.getByRole('button', {
      name: 'Toggle visibility Float',
    });
    const stringOption = page.getByRole('button', {
      name: 'Toggle visibility String',
    });
    await dragComponent(floatOption, stringOption, dropIndicator, 20);

    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Create Group', async () => {
    const stringOption = page.getByRole('button', {
      name: 'Toggle visibility String',
    });
    await stringOption.click();
    await page.getByRole('button', { name: 'Group' }).click();
    await page.getByPlaceholder('Group Name').click();
    await page.keyboard.type('test');
    await page.keyboard.press('Enter');

    const longOption = page.getByRole('button', {
      name: 'Toggle visibility Long',
    });
    await dragComponent(longOption, stringOption, dropIndicator);

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

// TODO: Figure out why webkit drag doesn't work if steps aren't insanely high when generating linux snapshot (#1360)
test('custom column', async ({ page }) => {
  await openTableOption(page, 'Custom Columns');

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

  await test.step('Delete', async () => {
    const deleteLastColumnButton = page
      .getByRole('button', { name: 'Delete custom column' })
      .nth(1);
    await deleteLastColumnButton.click();
    await saveButton.click();

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Drag', async () => {
    await addColumnButton.click();

    const dragColumn = page.getByPlaceholder('Column Name').nth(1);
    await dragColumn.click();
    await page.keyboard.type('Drag');

    const dragColumnFormula = page.locator('.editor-container').nth(1);
    await dragColumnFormula.click();
    await page.keyboard.type('String');

    const dragButton = page
      .getByRole('button', { name: 'Drag column to re-order' })
      .nth(1);
    const panelAbove = page
      .getByRole('button', { name: 'Drag column to re-order' })
      .first();
    const dropIndicator = page
      .locator('.custom-column-builder-container')
      .locator('.dragging');

    const browser = dragButton.page().context().browser()?.browserType().name();
    await dragComponent(
      dragButton,
      panelAbove,
      dropIndicator,
      0,
      browser === 'webkit' ? 1000 : undefined
    );

    await saveButton.click();

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });
});

test('rollup rows and aggregrate columns', async ({ page }) => {
  await openTableOption(page, 'Rollup Rows');

  const dropdown = page.locator('.rollup-rows-group-by');
  const dropIndicator = dropdown.locator('.is-dropping');

  const stringColumn = page.getByRole('button', { name: 'String' });
  await test.step('Rollup column', async () => {
    expect(stringColumn).toBeTruthy();
    await dragComponent(stringColumn, dropdown, dropIndicator);

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
    await dragComponent(intColumn, stringColumn, dropIndicator, 10);

    await waitForLoadingDone(page);
    await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  });

  await test.step('Aggregate columns', async () => {
    await page.getByText('Constituents').click();
    await page.getByText('Non-Aggregated Columns').click();

    await page.getByTestId('btn-page-back').click();
    await openTableOption(page, 'Aggregate Columns');
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
