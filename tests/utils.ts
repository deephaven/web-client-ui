import { Locator } from '@playwright/test';
import shortid from 'shortid';

export enum TableTypes {
  Number,
  StringAndNumber,
  AllTypes
}

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
export function makeTableCommand(
  tableName = generateVarName('t'),
  type = TableTypes.Number
): string {
  switch (type) { 
    case TableTypes.AllTypes:
      return `from deephaven import empty_table, time_table
size = 20
scale = 999
${tableName} = empty_table(size).update([
"String=(i%11==0? null : ` + '`a`' +`+(int)(scale*(i%2==0? i+1 : 1)))",
"Int=(i%12==0 ? null : (int)(scale*(i*2-1)))",
"Long=(i%13==0 ? null : (long)(scale*(i*2-1)))",
"Float=(float)(i%14==0 ? null : i%10==0 ? 1.0F/0.0F: i%5==0 ? -1.0F/0.0F : (float) scale*(i*2-1))",
"Double=(double)(i%16==0 ? null : i%10==0 ? 1.0D/0.0D: i%5==0 ? -1.0D/0.0D : (double) scale*(i*2-1))",
"Bool = (i%17==0 ? null : (int)(i)%2==0)",
"Char = (i%18==0 ? null : new Character((char) (((26+i*i)%26)+97)) )",
"Short=(short)(i%19==0 ? null : (int)(scale*(i*2-1)))",
"BigDec=(i%21==0 ? null : new java.math.BigDecimal(scale*(i*2-1)))",
"BigInt=(i%22==0 ? null : new java.math.BigInteger(Integer.toString((int)(scale*(i*2-1)))))",
"Byte=(Byte)(i%19==0 ? null : new Byte( Integer.toString((int)(i))))",
])`
    case TableTypes.StringAndNumber:
      return `from deephaven import new_table
from deephaven.column import string_col, double_col

${tableName} = new_table([
double_col("Doubles", [3.1, 5.45, -1.0, 1.0, 3.0, 4.20]),
string_col("Strings", ["Creating", "New", "Tables", "Tables", "New", "Creating"])
])`;
    case TableTypes.Number:
    default:
      return `from deephaven import empty_table
${tableName} = empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"])`;
  }
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
    /* eslint-disable no-await-in-loop */
    await page.keyboard.type(splitByLine[i]);
    // Pressing space and then backspace escapes any autocomplete suggestions that may appear
    // Pressing shift+Enter moves the cursor to a new line
    await page.keyboard.press(' ', { delay: 50 });
    await page.keyboard.press('Backspace', { delay: 50 });
    await page.keyboard.press('Shift+Enter', { delay: 50 });

    // Automatic indenting can screw up some of our commands, so delete any automatic indent - we'll put our own indent there with the copied command
    await page.keyboard.press('Shift+Home', { delay: 50 });
    await page.keyboard.press('Delete', { delay: 50 });
    /* eslint-enable no-await-in-loop */
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
