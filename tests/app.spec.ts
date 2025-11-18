import { test, expect } from '@playwright/test';
import { gotoPage } from './utils';

test.describe('app loading tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '');
  });

  test('initial dashboard is immediately ready after `gotoPage` has completed', async ({
    page,
  }) => {
    await page.goto('');

    // Now poll every 5ms to see if the app has finished loading. Until it has finished loading, a loading spinner should be visible.
    await expect
      .poll(
        async () => {
          const isSpinnerVisible = await page
            .getByRole('progressbar', { name: 'Loading...', exact: true })
            .isVisible();
          const isAppLoaded =
            (await page.getByTestId('app-loaded').count()) === 1;
          if (!isSpinnerVisible && !isAppLoaded) {
            throw new Error(
              'App is in an invalid state: no spinner and app not loaded'
            );
          }
          return isAppLoaded;
        },
        {
          intervals: [5],
        }
      )
      .toBe(true);
  });
});
