import { test, expect } from '@playwright/test';
import shortid from 'shortid';

test('print commands get logged', async ({ page }) => {
  await page.goto('http://localhost:4000/');

  // create a locator
  const consoleInput = page.locator('.console-input');

  // Monaco editor doesn't have a native input, so need to just click into it and type on the page
  // https://github.com/microsoft/playwright/issues/14126
  await consoleInput.click();

  const message = `Hello ${shortid()}!`;
  await page.keyboard.type(`print("${message}")`);
  await page.keyboard.press('Enter');

  // Expect the output to show up in the log
  await expect(page.locator('.console-history .log-message')).toHaveText(
    message
  );
});
