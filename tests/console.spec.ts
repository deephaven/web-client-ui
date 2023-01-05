import { test, expect, Page } from '@playwright/test';
import shortid from 'shortid';
import { generateVarName, makeTableCommand, typeInMonaco } from './utils';

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('');
});

test.afterAll(async () => {
  await page.close();
});

test.describe('console input tests', () => {
  test.beforeEach(async () => {
    // Find the console input
    const consoleInput = page.locator('.console-input');

    // Monaco editor doesn't have a native input, so need to just click into it and type on the page
    // https://github.com/microsoft/playwright/issues/14126
    await consoleInput.click();
  });

  test('print commands get logged', async () => {
    const message = `Hello ${shortid()}!`;
    const command = `print("${message}")`;

    await typeInMonaco(page, command);
    await page.keyboard.press('Enter');

    // Expect the output to show up in the log
    await expect(
      page.locator('.console-history .log-message').filter({ hasText: message })
    ).toHaveCount(1);
  });

  test('object button is created when creating a table', async () => {
    const tableName = generateVarName('t');
    const command = makeTableCommand(tableName);

    await typeInMonaco(page, command);
    await page.keyboard.press('Enter');

    // Expect a button to show up in the console history
    const btnLocator = await page
      .locator('.console-history .btn-console-object')
      .filter({ hasText: tableName });
    await expect(btnLocator).toHaveCount(1);
    expect(await btnLocator.nth(0).isDisabled()).toBe(false);

    // Enter the same command again; the old button should be disabled
    await typeInMonaco(page, command);
    await page.keyboard.press('Enter');
    await expect(btnLocator).toHaveCount(2);
    await expect(btnLocator.nth(0)).toBeDisabled();
    await expect(btnLocator.nth(1)).not.toBeDisabled();
  });
});
