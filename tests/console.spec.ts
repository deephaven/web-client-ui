import { test, expect, Page, Locator } from '@playwright/test';
import {
  generateVarName,
  pasteInMonaco,
  makeTableCommand,
  generateId,
} from './utils';

function logMessageLocator(page: Page, text?: string): Locator {
  return page
    .locator('.console-history .log-message')
    .filter({ hasText: text });
}

function historyContentLocator(page: Page, text?: string): Locator {
  return page
    .locator('.console-history .console-history-content')
    .filter({ hasText: text });
}

function panelTabLocator(page: Page, text: string): Locator {
  return page.locator('.lm_tab .lm_title').filter({ hasText: text });
}

function scrollPanelLocator(page: Page): Locator {
  return page.locator('.console-pane .scroll-pane');
}

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
    const message = `Hello ${browserName} ${generateId()}!`;
    const command = `print("${message}")`;

    await pasteInMonaco(consoleInput, command);
    await page.keyboard.press('Enter');

    // Expect the output to show up in the log
    await expect(logMessageLocator(page, message)).toHaveCount(1);
    await expect(logMessageLocator(page, message)).toBeVisible();
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

test.describe('console scroll tests', () => {
  test.beforeEach(async () => {
    // Whenever we start a session, the server sends it logs over
    // We should wait for those to appear before running commands
    await logMessageLocator(page).first().waitFor();
  });

  test('scrolls to the bottom when command is executed', async () => {
    // The command needs to be long, but it doesn't need to actually print anything
    const ids = Array.from(Array(50).keys()).map(() => generateId());
    const command = ids.map(i => `# Really long command ${i}`).join('\n');

    await pasteInMonaco(consoleInput, command);
    await page.keyboard.press('Enter');

    await historyContentLocator(page, ids[ids.length - 1]).waitFor({
      state: 'attached',
    });

    // Wait for the scroll to complete, since it starts on the next available animation frame
    await page.waitForTimeout(500);

    // Expect the console to be scrolled to the bottom
    const scrollPane = await scrollPanelLocator(page);
    expect(
      await scrollPane.evaluate(el =>
        Math.floor(el.scrollHeight - el.scrollTop - el.clientHeight)
      )
    ).toBeLessThanOrEqual(0);
  });

  test('scrolls to the bottom when focus changed when command executed', async () => {
    // The command needs to be long, but it doesn't need to actually print anything
    const ids = Array.from(Array(50).keys()).map(() => generateId());
    const command = `import time\ntime.sleep(0.5)\n${ids
      .map(i => `# Really long command ${i}`)
      .join('\n')}`;

    await pasteInMonaco(consoleInput, command);
    page.keyboard.press('Enter');

    // Immediately open the log before the command code block has a chance to finish colorizing/rendering
    await panelTabLocator(page, 'Log').click();

    // wait for a bit for the code block to render
    await historyContentLocator(page, ids[ids.length - 1]).waitFor({
      state: 'attached',
    });

    // Switch back to the console, and expect it to be scrolled to the bottom
    await panelTabLocator(page, 'Console').click();

    // Wait for the scroll to complete, since it starts on the next available animation frame
    await page.waitForTimeout(500);

    const scrollPane = await scrollPanelLocator(page);
    expect(
      await scrollPane.evaluate(el =>
        Math.floor(el.scrollHeight - el.scrollTop - el.clientHeight)
      )
    ).toBeLessThanOrEqual(0);
  });
});
