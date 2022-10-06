import { test } from '@playwright/test';
import shortid from 'shortid';

test('test creating a file, saving it, closing it, re-opening it, running it, then deleting it', async ({
  page,
}) => {
  // Go to http://localhost:4000/
  await page.goto('http://localhost:4000/');

  // Click text=File Explorer
  await page.locator('text=File Explorer').click();

  // Click [aria-label="New notebook"]
  await page.locator('[aria-label="New notebook"]').click();

  // Click .editor-container > div > .overflow-guard > .monaco-scrollable-element > .lines-content > .view-lines
  await page
    .locator(
      '.editor-container > div > .overflow-guard > .monaco-scrollable-element > .lines-content > .view-lines'
    )
    .click();

  const message = `Hello notebook ${shortid()}!`;

  await page.keyboard.type(`print("${message}")`);

  // Click the Save button
  await page.locator('[aria-label="Save notebook"]').click();

  // Generate a unique filename so it doesn't conflict with any previously created files
  const filename = `__playwright_test${shortid()}.py`;

  // Fill text=Save file asDirectory: // >> input[type="text"]
  await page
    .locator('text=Save file asDirectory: // >> input[type="text"]')
    .fill(filename);

  // Click button:has-text("Save")
  await page.locator('button:has-text("Save")').click();

  // Click close on the notebook file .lm_close_tab
  await page.locator('.lm_close_tab').click();

  // Click to re-open the file
  await page.locator(`text=${filename}`).click();

  // Click the Save button
  await page.locator('[aria-label="Run notebook"]').click();

  // Click close on the notebook file .lm_close_tab
  await page.locator('.lm_close_tab').click();

  // Expect the output to show up in the log
  // await expect(page.locator('.console-history .log-message')).toHaveText(
  //   'Hello Playwright!'
  // );

  // Right-click the file to open the menu, then delete it
  await page.locator(`text=${filename}`).click({
    button: 'right',
  });

  // Click button:has-text("DeleteDelete")
  await page.locator('button:has-text("DeleteDelete")').click();

  // Click button:has-text("Delete")
  await page.locator('button:has-text("Delete")').click();
});
