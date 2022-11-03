import { Page } from '@playwright/test';
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
    await page.keyboard.press(' ');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Shift+Enter');
  }
}

export default { generateVarName, typeInMonaco };
