import { test, expect } from '@playwright/test';
import { openTableOption, openTable, gotoPage } from './utils';

for (const delay of [0, 50, 100, 150, 200, 250, 300, 350, 400, 500]) {
  test(`repro delay ${delay}`, async ({ page }) => {
    await gotoPage(page, '');
    await openTable(page, 'all_types');
    await page.locator('data-testid=btn-iris-grid-settings-button-table').click();
    await openTableOption(page, 'Conditional Formatting');
    await page.getByRole('button', { name: 'Add New Rule' }).click();
    await page.locator('.style-editor').click();
    await page.getByRole('button', { name: 'Positive' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    const popping = await page.locator('.popping-view .style-editor button').allTextContents();
    console.log(`POP ${delay} ${JSON.stringify(popping)}`);
    await page.waitForTimeout(delay);
    await page.locator('.formatting-item').click();
    await page.waitForTimeout(800);
    const style = await page.locator('.conditional-format-editor .style-editor button').first().textContent();
    const disabled = await page.getByRole('button', { name: 'Done' }).isDisabled();
    console.log(`DELAY ${delay} style=${style} doneDisabled=${disabled}`);
    expect(style).toBe('Positive');
  });
}
