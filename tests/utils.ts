import { Locator, Page } from '@playwright/test';
import shortid from 'shortid';

/**
 * Generate a unique python variable name
 * @param prefix Prefix to give the variable name
 * @returns A unique string that is a valid python variable name
 */
export function generateVarName(prefix = 'v'): string {
  // Don't allow a `-` in variable names
  let id: string;
  do {
    id = shortid();
  } while (id.includes('-'));
  return `${prefix}_${id}`;
}

/**
 * Create a command that creates a table with three columns, x/y/z
 * @param tableName Name of the variable to assign the table to
 * @returns String of the command to create a table
 */
export function makeTableCommand(tableName = generateVarName('t')): string {
  return `from deephaven import empty_table
${tableName} = empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"])`;
}

/**
 * Types into monaco input and avoids autocomplete suggestions.
 * Clicks the monaco input provided to give it focus to start.
 * @param locator Locator to use for monaco editor
 * @param text Text to be typed, with carriage returns
 */
export async function typeInMonaco(
  locator: Locator,
  text: string
): Promise<void> {
  const page = locator.page();
  const splitByLine = text.split('\n');

  // Give the monaco editor focus so we can start typing
  await locator.click();
  for (let i = 0; i < splitByLine.length; i += 1) {
    await page.keyboard.type(splitByLine[i]);
    // Pressing space and then backspace escapes any autocomplete suggestions that may appear
    // Pressing shift+Enter moves the cursor to a new line
    await page.keyboard.press(' ', { delay: 50 });
    await page.keyboard.press('Backspace', { delay: 50 });
    await page.keyboard.press('Shift+Enter', { delay: 50 });

    // Automatic indenting can screw up some of our commands, so delete any automatic indent - we'll put our own indent there with the copied command
    await page.keyboard.press('Shift+Home', { delay: 50 });
    await page.keyboard.press('Delete', { delay: 50 });
  }
}

/**
 * Pastes text into a monaco input
 * @param locator Locator to use for monaco editor
 * @param text Text to be pasted
 */
export async function pasteInMonaco(
  locator: Locator,
  text: string
): Promise<void> {
  const browserName = locator.page().context().browser()?.browserType().name();
  if (browserName === 'firefox') {
    await typeInMonaco(locator, text);
  } else {
    await locator.locator('textarea').evaluate(async (element, evalText) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', evalText);
      const clipboardEvent = new ClipboardEvent('paste', {
        clipboardData,
      });
      element.dispatchEvent(clipboardEvent);
    }, text);
  }
}

export default { generateVarName, pasteInMonaco, typeInMonaco };
