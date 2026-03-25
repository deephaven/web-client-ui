import { test, expect } from '@playwright/test';
import {
  dragComponent,
  waitForLoadingDone,
  openTable,
  gotoPage,
} from './utils';

test('ctrl+e clears input filter without getting stuck in Filtering state', async ({
  page,
}) => {
  await gotoPage(page, '');

  await openTable(page, 'all_types');

  await test.step('add input filter', async () => {
    await page.getByRole('button', { name: 'Controls' }).click();

    const inputFilter = page.getByRole('button', { name: 'Input Filter' });
    const target = page.getByText('Command History');
    const dropIndicator = page.locator('.lm_dragProxy');
    await dragComponent(inputFilter, target, dropIndicator);
  });

  await test.step('configure input filter for Int column', async () => {
    await page.getByRole('combobox').selectOption({ label: 'Int' });
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByPlaceholder('Enter value...')).toHaveCount(1);
  });

  await test.step('set input filter value', async () => {
    await page.getByPlaceholder('Enter value...').click();
    await page.keyboard.type('>1000');
    await expect(page.getByPlaceholder('Enter value...')).toHaveValue('>1000');

    await waitForLoadingDone(page);
  });

  await test.step('clear all filters with Ctrl+E', async () => {
    // Click on the grid to ensure it has focus for the keyboard shortcut
    await page.locator('.iris-grid .grid-wrapper').click();

    await page.keyboard.press('ControlOrMeta+e');

    // Wait for any debounced updates to process (input filter debounce is ~400ms total)
    await page.waitForTimeout(1000);

    // The table should NOT be stuck in a loading/filtering state
    await waitForLoadingDone(page);
  });
});
