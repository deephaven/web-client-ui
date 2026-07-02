import { expect, test } from '@playwright/test';

// Isolated styleguide section (see packages/code-studio/src/styleguide/Grids.tsx)
// that renders an IrisGrid whose Table Options include a plugin page that
// throws on render, so we can exercise PluginTableOptionsErrorBoundary.
const sectionId = 'sample-section-grids-iris-plugin-error';

test('PluginTableOptionsErrorBoundary renders a fallback when a configPage throws', async ({
  page,
}) => {
  // Note: this section's configPage throws on purpose, which logs caught-error
  // output to the console. Do not fail the test on console errors here.
  await page.goto(`/ide/styleguide?isolateSection=true#${sectionId}`);

  // Open the Table Options sidebar on the isolated IrisGrid.
  const settingsButton = page.getByTestId(
    'btn-iris-grid-settings-button-table'
  );
  await expect(settingsButton).toBeVisible({ timeout: 45000 });
  await settingsButton.click();

  await expect(page.locator('.table-sidebar')).toHaveCount(1);

  // Open the plugin page whose configPage throws on render.
  await page.getByText('Throwing Plugin Page').click();

  // The error boundary should catch the throw and render its fallback instead
  // of unmounting the grid.
  const fallback = page.getByTestId('plugin-sidebar-error');
  await expect(fallback).toBeVisible();

  // Snapshot the whole sidebar so the fallback's padding within the sidebar
  // chrome is visible (not just the fallback element on its own).
  await expect(page.locator('.table-sidebar')).toHaveScreenshot(
    'plugin-table-options-error-boundary.png'
  );
});
