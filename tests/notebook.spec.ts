import { test, expect } from '@playwright/test';
import shortid from 'shortid';
import { pasteInMonaco } from './utils';

test('test creating a file, saving it, closing it, re-opening it, running it, then deleting it', async ({
  page,
}) => {
  await page.goto('');

  // Click text=File Explorer
  await page.locator('text=File Explorer').click();

  // Click [aria-label="New notebook"]
  await page.locator('[aria-label="New notebook"]').click();

  // Click editor container
  await page.locator('.editor-container').click();

  const message = `Hello notebook ${shortid()}!`;
  const command = `print("${message}")`;

  await pasteInMonaco(page.locator('.editor-container'), command);

  // Click the Save button
  await page.locator('[aria-label="Save"]').click();

  // Generate a unique filename so it doesn't conflict with any previously created files
  const filename = `__playwright_test${shortid()}.py`;

  // Fill id=file-name-input
  await page.locator('id=file-name-input').fill(filename);

  // Click button:has-text("Save")
  await page.locator('button:has-text("Save")').click();

  // Click close on the notebook file .lm_close_tab
  await page.locator('.lm_close_tab').click();

  // Wait for notebook file to close
  await expect(page.locator('.notebook-toolbar')).toHaveCount(0);

  // Wait for file to appear in file explorer
  const fileInExplorer = page.locator('.item-list-item', { hasText: filename });
  await expect(fileInExplorer).toHaveCount(1);

  // Click to re-open the file
  await fileInExplorer.click();

  // Click the Run button
  await page.locator('.notebook-toolbar [aria-label="Run"]').click();

  // Click close on the notebook file .lm_close_tab
  await page.locator('.lm_close_tab').click();

  // Right-click the file to open the menu, then delete it
  await page.locator(`text=${filename}`).click({
    button: 'right',
  });

  // Click button:has-text("Delete")
  await page.locator('button:has-text("Delete")').click();

  // Confirm delete
  await page
    .locator('.modal-content')
    .locator('button:has-text("Delete")')
    .click();

  await expect(fileInExplorer).toHaveCount(0);
});
