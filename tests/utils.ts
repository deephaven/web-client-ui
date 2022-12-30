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
 * Types into monaco input and avoids autocomplete suggestions
 * @param page The Page instance for each test
 * @param text Text to be typed, with carriage returns
 */
export async function typeInMonaco(page: Page, text: string): Promise<void> {
  const splitByLine = text.split('\n');
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
 * @param browserName Name of the browser being tested. Pasting is not available in firefox, so it will fall back to typing.
 */
export async function pasteInMonaco(
  locator: Locator,
  text: string,
  browserName: string
): Promise<void> {
  if (browserName === 'firefox') {
    await typeInMonaco(locator.page(), text);
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

export default { generateVarName, typeInMonaco };
