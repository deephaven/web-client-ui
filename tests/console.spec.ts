import { test, expect } from '@playwright/test';
import shortid from 'shortid';
import { typeInMonaco } from './utils';

test('print commands get logged', async ({ page }) => {
  await page.goto('http://localhost:4000/');

  // create a locator
  const consoleInput = page.locator('.console-input');

  // Monaco editor doesn't have a native input, so need to just click into it and type on the page
  // https://github.com/microsoft/playwright/issues/14126
  await consoleInput.click();

  const message = `Hello ${shortid()}!`;
  const command = `print("${message}")`;

  await typeInMonaco(page, command);
  await page.keyboard.press('Enter');

  // Expect the output to show up in the log
  await expect(
    await page
      .locator('.console-history .log-message')
      .filter({ hasText: message })
  ).not.toBeNull();
});
