import { test, expect, Page, Locator } from '@playwright/test';
import shortid from 'shortid';
import { generateVarName, pasteInMonaco, makeTableCommand } from './utils';

let page: Page;
let consoleInput: Locator;

// keep this as serial becomes it runs commands
test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('');

  consoleInput = page.locator('.console-input');
});

test.afterAll(async () => {
  await page.close();
});

test.describe('console input tests', () => {
  test('print commands get logged', async ({ browserName }) => {
    const message = `Hello ${browserName} ${shortid()}!`;
    const command = `print("${message}")`;

    await pasteInMonaco(consoleInput, command);
    await page.keyboard.press('Enter');

    // Expect the output to show up in the log
    await expect(
      page.locator('.console-history .log-message').filter({ hasText: message })
    ).toHaveCount(1);
  });

  test('object button is created when creating a table', async ({
    browserName,
  }) => {
    const tableName = `${generateVarName(`${browserName}_t`)}`;
    const command = makeTableCommand(tableName);

    await pasteInMonaco(consoleInput, command);
    await page.keyboard.press('Enter');

    // Expect a button to show up in the console history
    const btnLocator = await page
      .locator('.console-history .btn-console-object')
      .filter({ hasText: tableName });
    await expect(btnLocator).toHaveCount(1);
    expect(await btnLocator.nth(0).isDisabled()).toBe(false);

    // Enter the same command again; the old button should be disabled
    await pasteInMonaco(consoleInput, command);
    await page.keyboard.press('Enter');
    await expect(btnLocator).toHaveCount(2);
    await expect(btnLocator.nth(0)).toBeDisabled();
    await expect(btnLocator.nth(1)).not.toBeDisabled();
  });
});
