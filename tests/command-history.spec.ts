import { test, expect, type Page, type Locator } from '@playwright/test';
import { pasteInMonaco, dragComponent, generateId } from './utils';

// Runs commands to populate command history, so keep it serial
test.describe.configure({ mode: 'serial' });

let page: Page;
let consoleInput: Locator;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('');

  consoleInput = page.locator('.console-input');
});

test.afterAll(async () => {
  await page.close();
});

/**
 * Reproduces a bug where the Command History panel goes blank when a sibling
 * panel is removed from golden-layout. Removing the panel causes a RowOrColumn
 * to collapse, which calls `replaceChild` on an ancestor of the Command History.
 * Moving that ancestor's DOM element resets the virtualized list's scroll
 * position to 0 while react-window still believes it is scrolled, so no items
 * render in the viewport.
 */
test('command history keeps scroll position and items after a sibling panel is removed', async ({
  browserName,
}) => {
  // PouchDB's IndexedDB storage does not populate under Playwright's webkit
  // build (raw IndexedDB works, but pouch writes never persist and its
  // transactions deadlock), so the command history panel stays empty. The
  // feature works in real Safari; this is a Playwright-webkit limitation.
  test.skip(
    browserName === 'webkit',
    'Command history PouchDB storage does not populate under Playwright webkit'
  );

  const commandHistory = page.locator('.command-history');
  const scrollPane = commandHistory.locator('.item-list-scroll-pane');
  const items = commandHistory.locator('.command-history-item');

  // Counts how many command history items are actually within the visible
  // viewport of the scroll pane. When the bug occurs the list renders items at
  // the previous scroll offset while the scroll container is reset to 0, so the
  // items fall outside the viewport and this returns 0.
  async function visibleItemCount(): Promise<number> {
    return scrollPane.evaluate(pane => {
      const paneRect = pane.getBoundingClientRect();
      const renderedItems = pane.querySelectorAll('.command-history-item');
      let count = 0;
      renderedItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        if (
          rect.height > 0 &&
          rect.bottom > paneRect.top &&
          rect.top < paneRect.bottom
        ) {
          count += 1;
        }
      });
      return count;
    });
  }

  const marker = generateId();

  // Markdown panels opened from the Controls menu are titled "Markdown"
  const markdownTitle = 'Markdown';

  const commandCount = 60; // Enough commands to make the command history list taller than the panel

  await test.step('populate command history so it is scrollable', async () => {
    // Enough commands to make the command history list taller than the panel
    for (let i = 0; i < commandCount; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await pasteInMonaco(consoleInput, `history_${marker}_${i} = ${i}`);
      // eslint-disable-next-line no-await-in-loop
      await page.keyboard.press('Enter');
    }
  });

  await test.step('open a markdown panel from the Controls menu', async () => {
    // Opening a markdown widget gives us a closable panel to drop next to the
    // command history
    await page.getByRole('button', { name: 'Controls' }).click();
    await page.getByText('Markdown Widget').click();
    await expect(page.locator('.markdown-panel')).toBeVisible();
  });

  await test.step('open the command history tab', async () => {
    await page
      .locator('.lm_tab .lm_title')
      .filter({ hasText: 'Command History' })
      .click();

    // Wait for the last executed command to show up in the history
    await expect(
      items.filter({ hasText: `history_${marker}_${commandCount - 1}` })
    ).toBeVisible();
  });

  await test.step('split the command history stack with the markdown panel', async () => {
    const markdownTab = page
      .locator('.lm_tab')
      .filter({ has: page.getByText(markdownTitle, { exact: true }) });
    const dropIndicator = page.locator('.lm_dragProxy');

    // Drop the markdown panel into the bottom of the command history panel to
    // split the stack vertically (wrapping the command history stack in a new
    // column)
    const paneBox = await commandHistory.boundingBox();
    if (paneBox == null) throw new Error('command history not found');
    await dragComponent(
      markdownTab,
      commandHistory,
      dropIndicator,
      paneBox.height * 0.35
    );
  });

  let scrollBefore = 0;
  await test.step('scroll the command history to a non-zero offset', async () => {
    // Make sure the command history tab is the active one after the split
    await page
      .locator('.lm_tab .lm_title')
      .filter({ hasText: 'Command History' })
      .click();

    // The list must be scrollable for the bug to manifest
    await expect
      .poll(() => scrollPane.evaluate(el => el.scrollHeight - el.clientHeight))
      .toBeGreaterThan(0);

    // Wait for the split layout to finish resizing. While the panel height is
    // still settling, the sticky-bottom list can be pulled to a transient
    // bottom, which would clobber the scroll position we set below.
    let lastHeight = -1;
    await expect
      .poll(async () => {
        const height = await scrollPane.evaluate(el => el.clientHeight);
        const stable = height === lastHeight;
        lastHeight = height;
        return stable;
      })
      .toBe(true);

    // Scroll into the middle so the offset is larger than the viewport height
    await scrollPane.evaluate(el => {
      // eslint-disable-next-line no-param-reassign
      el.scrollTop = Math.floor(el.scrollHeight / 2);
    });

    scrollBefore = await scrollPane.evaluate(el => el.scrollTop);
    expect(scrollBefore).toBeGreaterThan(0);
    // react-window reconciles a programmatic scrollTop change on the next
    // scroll event (a frame later), and only then ingests the new offset into
    // the list's state. Wait until the middle item (the row at the top of the
    // viewport after scrolling to scrollHeight/2) has actually rendered, which
    // guarantees the list has committed the new scroll offset.
    const middleIndex = Math.floor(commandCount / 2);
    await expect(
      items.filter({ hasText: `history_${marker}_${middleIndex}` })
    ).toBeVisible();
    expect(await visibleItemCount()).toBeGreaterThan(0);
  });

  await test.step('remove the sibling markdown panel', async () => {
    const markdownTab = page
      .locator('.lm_tab')
      .filter({ has: page.getByText(markdownTitle, { exact: true }) });
    await markdownTab.hover();
    await markdownTab.locator('.lm_close_tab').click();

    // The markdown panel should be gone
    await expect(page.locator('.markdown-panel')).toHaveCount(0);
  });

  await test.step('command history scroll position and items are preserved', async () => {
    // Removing the markdown panel collapses the wrapping column, which moves the
    // command history's ancestor DOM element via `replaceChild`. The scroll
    // position should be preserved and the items should still be rendered in
    // the viewport.
    await expect
      .poll(() => scrollPane.evaluate(el => el.scrollTop))
      .toBe(scrollBefore);

    expect(await visibleItemCount()).toBeGreaterThan(0);
  });
});
