/* eslint class-methods-use-this: "off" */
import { KeyboardEvent } from 'react';
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import GridUtils from '../GridUtils';
import KeyHandler from '../KeyHandler';

/**
 * Parse out data from an HTML table. Currently does not support colspan/rowspan
 * @param table HTML Table
 * @returns A two dimensional array with the data found in the table
 */
export function parseValueFromTable(table: HTMLTableElement): string[][] {
  const data = [];
  const rows = table.querySelectorAll('tr');
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    const cells = row.querySelectorAll('td');
    const rowData = [];
    for (let c = 0; c < cells.length; c += 1) {
      const cell = cells[c];
      rowData.push(cell.textContent?.trim() ?? '');
    }
    data.push(rowData);
  }

  return data;
}

/**
 * Parses out a table of data from HTML elements. Treats each element as one rows.
 * Filters out blank rows.
 * @param rows The elements to parse out
 * @returns A string table of data
 */
export function parseValueFromNodes(nodes: NodeListOf<ChildNode>): string[][] {
  const result = [] as string[][];
  nodes.forEach(node => {
    const text = node.textContent ?? '';
    if (text.length > 0) {
      // When Chrome pastes a table from text, it preserves the tab characters
      // In Firefox, it breaks it into a combination of non-breaking spaces and spaces
      result.push(text.split(/\t|\u00a0\u00a0 \u00a0/));
    }
  });

  return result;
}

export function parseValueFromElement(
  element: HTMLElement
): string | string[][] | null {
  // Check first if there's an HTML table element that we can use
  const table = element.querySelector('table');
  if (table != null) {
    return parseValueFromTable(table);
  }

  // Otherwise check if there's any text content at all
  const text = element.textContent?.trim() ?? '';
  if (text.length > 0) {
    // If there's text content, try and parse out a table from the child nodes. Each node is a row.
    // If there's only one row and it doesn't contain a tab, then just treat it as a regular value
    const { childNodes } = element;
    const hasTabChar = text.includes('\t');
    const hasFirefoxTab = text.includes('\u00a0\u00a0 \u00a0');
    if (
      hasTabChar &&
      childNodes.length !== 0 &&
      (childNodes.length === 1 ||
        (childNodes.length > 1 && !childNodes[0].textContent?.includes('\t')))
    ) {
      // When Chrome pastes a single row, it gets split into multiple child nodes
      // If we check the first child node and it doesn't have a tab character, but the full element text content does, then
      // just parse the text out separated by the tab chars
      return text.split('\n').map(row => row.split('\t'));
    }
    if (childNodes.length > 1 || hasFirefoxTab) {
      return parseValueFromNodes(element.childNodes);
    }
    // If there's no tabs or no multiple rows, than just treat it as one value
    return text;
  }
  return null;
}

/**
 * Handles the paste key combination
 */
class PasteKeyHandler extends KeyHandler {
  onDown(event: KeyboardEvent, grid: Grid): EventHandlerResult {
    switch (event.key) {
      case 'v':
        if (GridUtils.isModifierKeyDown(event)) {
          // Chrome doesn't allow the paste event on canvas elements
          // Instead, we capture the ctrl+v keydown, then do this to capture the input
          const dummyInput = document.createElement('div');
          document.body.appendChild(dummyInput);
          dummyInput.setAttribute('contenteditable', 'true');

          // Give it invisible styling
          dummyInput.setAttribute(
            'style',
            'clip-path: "inset(50%)"; height: 1px; width: 1px; margin: -1px; overflow: hidden; padding 0; position: absolute;'
          );

          const listener = () => {
            dummyInput.removeEventListener('input', listener);
            dummyInput.remove();

            grid.focus();
            const value = parseValueFromElement(dummyInput);
            if (value != null) {
              grid.pasteValue(value);
            }
          };

          // Listen for the `input` event, when there's a change to the HTML
          // We could also listen to the `paste` event to get the clipboard data, but that's just text data
          // By listening to `input`, we can get a table that's already parsed in HTML, which is easier to consume
          dummyInput.addEventListener('input', listener);

          // Focus the element so it receives the paste event
          dummyInput.focus();

          // Don't block the paste event from updating our dummy input
          return { preventDefault: false, stopPropagation: true };
        }
        break;
    }
    return false;
  }
}

export default PasteKeyHandler;
