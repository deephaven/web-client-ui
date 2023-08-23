import { test, expect, Page } from '@playwright/test';
import {
  makeTableCommand,
  pasteInMonaco,
  TableTypes,
  dragComponent,
  waitForLoadingDone,
  openTableOption,
  generateVarName,
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

/**
 * Acts as a small time buffer so that the table has time to update before the screenshot.
 * Can be deleted in the future if the timing is figured out with the polling intervals for advanced settings.
 * Without it the snapshot is taken before the table is updated.
 * Attempt was made to check for loading status bar with custom polling intervals but no luck
 * @param page
 */
async function artificialWait(page: Page, tableNumber = 0) {
  const tableOperationsMenu = page
    .locator('data-testid=btn-iris-grid-settings-button-table')
    .nth(tableNumber);
  await tableOperationsMenu.click();
  await page.getByTestId('btn-page-close').first().click();
}

const tableName = generateVarName('t');
test.beforeEach(async ({ page }) => {
  await page.goto('');

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`Error text: "${msg.text()}"`);
  });

  const consoleInput = page.locator('.console-input');
  await consoleInput.click();
  await expect(page.locator('.console-input-inner-wrapper.focus')).toHaveCount(
    1
  );

  const command = makeTableCommand(tableName, TableTypes.AllTypes);

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

test.afterEach(async ({ page }) => {
  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  const command = `del ${tableName}`;
  await pasteInMonaco(consoleInput, command);
  await page.keyboard.press('Enter');
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

  // const searchBar = page.getByPlaceholder('Search Data...');
  const searchBar = page.getByTestId('cross-column-search');
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
//     await page
//       .locator('.conditional-format-editor')
//       .getByRole('button', { name: 'Cancel' })
//       .click();

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

  // await test.step('Drag', async () => {
  //   await addColumnButton.click();

  //   const dragColumn = page.getByPlaceholder('Column Name').nth(1);
  //   await dragColumn.click();
  //   await page.keyboard.type('Drag');

  //   const dragColumnFormula = page.locator('.editor-container').nth(1);
  //   await dragColumnFormula.click();
  //   await page.keyboard.type('String');

  //   const dragButton = page
  //     .getByRole('button', { name: 'Drag column to re-order' })
  //     .nth(1);
  //   const panelAbove = page
  //     .getByRole('button', { name: 'Drag column to re-order' })
  //     .first();
  //   const dropIndicator = page
  //     .locator('.custom-column-builder-container')
  //     .locator('.dragging');

  //   const browser = dragButton.page().context().browser()?.browserType().name();
  //   await dragComponent(
  //     dragButton,
  //     panelAbove,
  //     dropIndicator,
  //     0,
  //     browser === 'webkit' ? 1000 : undefined
  //   );

  //   await saveButton.click();

  //   await waitForLoadingDone(page);
  //   await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
  // });
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

test('advanced settings', async ({ page }) => {
  const table2Name = generateVarName('t2');

  await test.step('create 2nd table', async () => {
    const consoleInput = page.locator('.console-input');
    await consoleInput.click();

    const command = makeTableCommand(table2Name, TableTypes.AllTypes);

    await pasteInMonaco(consoleInput, command);
    await page.keyboard.press('Enter');
  });

  await test.step('drag table to new panel', async () => {
    // opening up this menu makes it easier to drag to that corner
    await page
      .getByTestId('btn-iris-grid-settings-button-table')
      .first()
      .click();

    const table = page
      .locator('.lm_tab')
      .filter({ has: page.getByText(table2Name) });
    const target = page.getByText('Command History');
    const dropIndicator = page.locator('.lm_dragProxy');
    await dragComponent(table, target, dropIndicator, 300);

    await page.getByTestId('btn-page-close').nth(1).click();
    await page.getByTestId('btn-page-close').first().click();

    await waitForLoadingDone(page);
  });

  await test.step('add input filter to int column', async () => {
    await page.getByRole('button', { name: 'Controls' }).click();

    const inputFilter = page.getByRole('button', { name: 'Input Filter' });
    const target = page.getByText('Command History');
    const dropIndicator = page.locator('.lm_dragProxy');
    await dragComponent(inputFilter, target, dropIndicator);

    await page.getByRole('button', { name: 'Panels' }).click();
  });

  await test.step('add linker filter to string column', async () => {
    await page.getByRole('button', { name: 'Controls' }).click();
    await page.getByRole('button', { name: 'Linker' }).click();

    // Note: do not have to drag to use linker filter I just wanted it in this position
    const firstStringCol = page.locator('.iris-grid .grid-wrapper').first();
    await firstStringCol.click({ position: { x: 20, y: 10 } });
    const secondStringCol = page.locator('.iris-grid .grid-wrapper').nth(1);
    await secondStringCol.click({
      position: { x: 20, y: 10 },
    });

    await page
      .locator('.linker-toast-dialog')
      .getByRole('button', { name: 'Done' })
      .click();
  });

  await test.step('use linker filter', async () => {
    await page
      .locator('.iris-grid .grid-wrapper')
      .first()
      .dblclick({
        position: { x: 20, y: 60 },
      });

    await waitForLoadingDone(page, 1);
  });

  await test.step('use input filter', async () => {
    await page.getByRole('combobox').selectOption({ label: 'Int' });
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByPlaceholder('Enter value...')).toHaveCount(1);
    await page.getByPlaceholder('Enter value...').click();
    await page.keyboard.type('>1000');
    await expect(page.getByPlaceholder('Enter value...')).toHaveValue('>1000');

    await artificialWait(page, 1);
    await waitForLoadingDone(page);
    await waitForLoadingDone(page, 1);

    await expect(page.locator('.iris-grid-column').nth(1)).toHaveScreenshot();
  });

  await test.step('toggle control setting', async () => {
    const tableOperationsMenu = page
      .locator('data-testid=btn-iris-grid-settings-button-table')
      .nth(1);
    await tableOperationsMenu.click();

    await expect(page.locator('.table-sidebar')).toHaveCount(1);

    await openTableOption(page, 'Advanced Settings');
    await page
      .getByTestId(
        'menu-item-Clear current table filters before applying new filters from a control'
      )
      .click();
    await page.getByTestId('btn-page-close').click();
  });

  await test.step('use input filter', async () => {
    await expect(page.getByPlaceholder('Enter value...')).toHaveCount(1);
    await page.getByPlaceholder('Enter value...').fill('>5000');
    await expect(page.getByPlaceholder('Enter value...')).toHaveValue('>5000');

    await artificialWait(page, 1);
    await waitForLoadingDone(page);
    await waitForLoadingDone(page, 1);

    await expect(page.locator('.iris-grid-column').nth(1)).toHaveScreenshot();
  });

  await test.step('use linker filter', async () => {
    await page
      .locator('.iris-grid .grid-wrapper')
      .first()
      .dblclick({
        position: { x: 20, y: 60 },
      });

    await artificialWait(page, 1);
    await waitForLoadingDone(page, 1);

    await expect(page.locator('.iris-grid-column').nth(1)).toHaveScreenshot();
  });

  await test.step('toggle linker setting', async () => {
    const tableOperationsMenu = page
      .locator('data-testid=btn-iris-grid-settings-button-table')
      .nth(1);
    await tableOperationsMenu.click();

    await expect(page.locator('.table-sidebar')).toHaveCount(1);

    await openTableOption(page, 'Advanced Settings');
    await page
      .getByTestId(
        'menu-item-Clear current table filters before applying new filters from an incoming link filter'
      )
      .click();
    await page.getByTestId('btn-page-close').click();
  });

  await test.step('use linker filter', async () => {
    await page
      .locator('.iris-grid .grid-wrapper')
      .first()
      .dblclick({
        position: { x: 20, y: 60 },
      });

    await artificialWait(page, 1);
    await waitForLoadingDone(page, 1);

    await expect(page.locator('.iris-grid-column').nth(1)).toHaveScreenshot();
  });
});
