import { test, expect } from '@playwright/test';
import { dragComponent, waitForLoadingDone, openTableOption, openTable, gotoPage } from './utils';

test.beforeEach(async ({ page }) => {

  // Fail quickly if console errors are detected
  await page.addInitScript(() => {
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      const details = args.map(a => {
        if (a instanceof Error || (a != null && typeof a === 'object' && 'stack' in (a as object))) {
          const e = a as any;
          return `ERR ${String(e)} STACK ${e.stack} CAUSE ${e.cause?.stack ?? ''} BACK ${e.backingJsObject?.stack ?? ''} ${e.e?.stack ?? ''}`;
        }
        return String(a);
      });
      orig.call(console, 'DETAILS', new Error('here').stack, details.join(' | '));
      orig.apply(console, args);
    };
  });
  await gotoPage(page, '');
  page.on('console', msg => {
    if (msg.type() === 'error') {
      // eslint-disable-next-line no-console
      console.log('CONSOLE_ERROR', msg.text());
      if (!msg.text().startsWith('DETAILS')) throw new Error(msg.text());
    }
  });
  page.on('pageerror', error => {
    throw error;
  });

  await openTable(page, 'all_types');

  const tableOperationsMenu = page.locator(
    'data-testid=btn-iris-grid-settings-button-table'
  );
  await tableOperationsMenu.click();

  // Wait for Table Options menu to show
  await expect(page.locator('.table-sidebar')).toHaveCount(1);
});

test('custom column', async ({ page, browserName }) => {
  await openTableOption(page, 'Custom Columns');

  await test.step('Create custom column', async () => {
    const columnName = page.getByPlaceholder('Column Name');
    await expect(columnName).toHaveCount(1);
    await columnName.click();
    await page.keyboard.type('Test');

    const columnFormula = page.locator(
      '.input-editor-wrapper .editor-container'
    );
    await expect(columnFormula).toHaveCount(1);
    await expect(columnFormula.locator('.monaco-editor')).toBeVisible();
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

    const newColumnFormula = page
      .locator('.input-editor-wrapper .editor-container')
      .nth(1);
    await expect(newColumnFormula.locator('.monaco-editor')).toBeVisible();
    await newColumnFormula.click();
    await page.keyboard.type('Test * 2');

    await saveButton.click();

    await waitForLoadingDone(page);
    
  });

  await test.step('Delete', async () => {
    const deleteLastColumnButton = page
      .getByRole('button', { name: 'Delete custom column' })
      .nth(1);
    await deleteLastColumnButton.click();
    await saveButton.click();

    await waitForLoadingDone(page);
    
  });

  await test.step('Drag', async () => {
    if (browserName === 'webkit') return;

    await addColumnButton.click();

    const dragColumn = page.getByPlaceholder('Column Name').nth(1);
    await dragColumn.click();
    await page.keyboard.type('Drag');

    const dragColumnFormula = page
      .locator('.input-editor-wrapper .editor-container')
      .nth(1);
    await expect(dragColumnFormula.locator('.monaco-editor')).toBeVisible();
    await dragColumnFormula.click();
    await page.keyboard.type('String');

    await saveButton.click();
    await waitForLoadingDone(page);

    const dragButton = page
      .getByRole('button', { name: 'Drag column to re-order' })
      .nth(1);
    const panelAbove = page
      .getByRole('button', { name: 'Drag column to re-order' })
      .first();
    const dropIndicator = page
      .locator('.custom-column-builder-container')
      .locator('.dragging');

    await dragComponent(dragButton, panelAbove, dropIndicator, 0);

    await saveButton.click();

    await waitForLoadingDone(page);

    
  });
});

