import { test, expect, type Page } from '@playwright/test';
import {
  gotoPage,
  openTable,
  openTableOption,
  waitForLoadingDone,
} from './utils';

/**
 * Checks that table settings survive a reload. Saved grid state omits values
 * equal to their defaults, and hydrating fills them back in.
 *
 * Tables are opened from application mode through the Panels menu. Tables
 * opened from console commands are closed on reload when "Close panels on
 * disconnect" is enabled (the default), so they can't be used here.
 */

/** localStorage key the app persists its workspace under */
const WORKSPACE_STORAGE_KEY = 'deephaven.WorkspaceStorage';

type LayoutItem = {
  type: string;
  component?: string;
  props?: { metadata?: Record<string, unknown>; panelState?: PanelState };
  content?: LayoutItem[];
} & Record<string, unknown>;

type PanelState = Record<string, Record<string, unknown> | null | undefined>;

type Workspace = { data: { layoutConfig: LayoutItem[] } };

/**
 * Keys of `irisGridState` that are only saved when they differ from their
 * defaults. None of the tests change them, so none should be saved.
 */
const UNCHANGED_IRIS_GRID_STATE_KEYS = [
  'advancedFilters',
  'aggregationSettings',
  'customColumnFormatMap',
  'columnAlignmentMap',
  'userColumnWidths',
  'userRowHeights',
  'conditionalFormats',
  'reverse',
  'selectDistinctColumns',
  'selectedSearchColumns',
  'invertSearchColumns',
  'pendingDataMap',
];

async function getWorkspace(page: Page): Promise<Workspace | null> {
  return page.evaluate(key => {
    const value = localStorage.getItem(key);
    return value == null ? null : JSON.parse(value);
  }, WORKSPACE_STORAGE_KEY);
}

function findPanels(items: LayoutItem[], component: string): LayoutItem[] {
  return items.flatMap(item => [
    ...(item.component === component ? [item] : []),
    ...findPanels(item.content ?? [], component),
  ]);
}

/** Saved panel state of the first table panel, or undefined if not saved yet */
async function getGridPanelState(page: Page): Promise<PanelState | undefined> {
  const workspace = await getWorkspace(page);
  const [panel] = findPanels(
    workspace?.data.layoutConfig ?? [],
    'IrisGridPanel'
  );
  return panel?.props?.panelState;
}

async function openContextMenuItem(page: Page, name: string): Promise<void> {
  // Opens the context menu for the first column, `String`
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });
  await page.getByRole('button', { name }).click();
}

async function sortStringAscending(page: Page): Promise<void> {
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });
  await page.getByRole('button', { name: 'Sort By' }).hover();
  await page.getByRole('button', { name: 'String Ascending' }).click();
  await waitForLoadingDone(page);
}

async function addQuickFilter(page: Page, text: string): Promise<void> {
  await openContextMenuItem(page, 'Quick Filters');
  await page.keyboard.type(text);
  await waitForLoadingDone(page);
}

async function openTableOptions(page: Page): Promise<void> {
  await page.getByTestId('btn-iris-grid-settings-button-table').click();
  await expect(page.locator('.table-sidebar')).toHaveCount(1);
}

async function closeTableOptions(page: Page): Promise<void> {
  await page.getByTestId('btn-page-close').first().click();
  await expect(page.locator('.table-sidebar')).toHaveCount(0);
}

async function waitForTableLoaded(page: Page): Promise<void> {
  await expect(page.locator('.iris-grid-panel')).toHaveCount(1);
  await expect(page.locator('.iris-grid-panel canvas')).toHaveCount(1);
  await waitForLoadingDone(page);
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => {
    throw error;
  });
  await gotoPage(page, '');
  await openTable(page, 'all_types');
});

test('table settings survive a reload and save without default values', async ({
  page,
}) => {
  await test.step('Change table settings', async () => {
    await sortStringAscending(page);

    await openContextMenuItem(page, 'Freeze Column');
    await waitForLoadingDone(page);

    await addQuickFilter(page, 'a999');

    await openTableOptions(page);
    await openTableOption(page, 'Custom Columns');
    await page.getByPlaceholder('Column Name').click();
    await page.keyboard.type('Test');
    const formula = page.locator('.input-editor-wrapper .editor-container');
    await expect(formula.locator('.monaco-editor')).toBeVisible();
    await formula.click();
    await page.keyboard.type('Double * 2');
    await page.getByRole('button', { name: 'Save Column' }).click();
    await waitForLoadingDone(page);
    await closeTableOptions(page);

    await openTableOptions(page);
    await page.getByText('Search Bar').click();
    const searchBar = page.getByTestId('cross-column-search');
    await searchBar.click();
    await page.keyboard.type('2');
    await expect(searchBar).toHaveValue('2');
    await waitForLoadingDone(page);
  });

  let savedPanelState: PanelState | undefined;

  await test.step('Saved state has the changed settings and no defaults', async () => {
    await expect
      .poll(async () => (await getGridPanelState(page))?.irisGridState)
      .toEqual(
        expect.objectContaining({
          isFilterBarShown: true,
          quickFilters: [[0, { text: 'a999' }]],
          sorts: [
            expect.objectContaining({ column: 'String', direction: 'ASC' }),
          ],
          customColumns: ['Test=Double * 2'],
          frozenColumns: ['String'],
          showSearchBar: true,
          searchValue: '2',
        })
      );

    savedPanelState = await getGridPanelState(page);
    const savedKeys = Object.keys(savedPanelState?.irisGridState ?? {});
    expect(
      UNCHANGED_IRIS_GRID_STATE_KEYS.filter(key => savedKeys.includes(key))
    ).toEqual([]);
    expect(savedPanelState?.gridState).toEqual({});
    expect(savedPanelState?.irisGridPanelState).toEqual({});
  });

  await test.step('Reload restores every setting', async () => {
    await gotoPage(page, '');
    await waitForTableLoaded(page);

    const searchBar = page.getByTestId('cross-column-search');
    await expect(searchBar).toHaveValue('2');

    // An unchanged reload may not save again. Change the search value so the
    // grid saves the state it hydrated, then compare it with the state saved
    // before the reload.
    await searchBar.click();
    await searchBar.press('End');
    await page.keyboard.type('3');
    await expect(searchBar).toHaveValue('23');
    await waitForLoadingDone(page);

    await expect
      .poll(async () => (await getGridPanelState(page))?.irisGridState)
      .toEqual({ ...savedPanelState?.irisGridState, searchValue: '23' });
    const reloadedPanelState = await getGridPanelState(page);
    expect(reloadedPanelState?.gridState).toEqual(savedPanelState?.gridState);
    expect(reloadedPanelState?.irisGridPanelState).toEqual(
      savedPanelState?.irisGridPanelState
    );
  });
});

test('chart created after a reload uses the saved sort and filter', async ({
  page,
}) => {
  await sortStringAscending(page);
  await addQuickFilter(page, 'a1');
  await expect
    .poll(async () => (await getGridPanelState(page))?.irisGridState)
    .toEqual(
      expect.objectContaining({
        quickFilters: [[0, { text: 'a1' }]],
        sorts: [expect.objectContaining({ column: 'String' })],
      })
    );

  await gotoPage(page, '');
  await waitForTableLoaded(page);

  await openTableOptions(page);
  await openTableOption(page, 'Chart Builder');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('.chart-panel-container')).toHaveCount(1);

  await expect
    .poll(async () => {
      const workspace = await getWorkspace(page);
      const [chart] = findPanels(
        workspace?.data.layoutConfig ?? [],
        'ChartPanel'
      );
      return chart?.props?.metadata?.tableSettings;
    })
    .toEqual(
      expect.objectContaining({
        quickFilters: [[0, { text: 'a1' }]],
        sorts: [
          expect.objectContaining({ column: 'String', direction: 'ASC' }),
        ],
        advancedFilters: [],
        partitions: [],
      })
    );
});

test('table state saved with every default value loads and saves without them', async ({
  page,
}) => {
  // Use the workspace the app saved for this table, so the panel metadata
  // matches what the app writes
  await expect
    .poll(async () => (await getGridPanelState(page)) != null)
    .toBe(true);
  const workspace = await getWorkspace(page);
  if (workspace == null) {
    throw new Error('Workspace was not saved');
  }

  // Grid state in the shape saved before default values were omitted
  const [panel] = findPanels(workspace.data.layoutConfig, 'IrisGridPanel');
  panel.props = {
    ...panel.props,
    panelState: {
      irisGridPanelState: {
        isSelectingPartition: false,
        partitions: [],
        advancedSettings: [
          ['filter-control-change-clears-all-filters', false],
          ['link-change-clears-all-filters', false],
        ],
      },
      irisGridState: {
        advancedFilters: [],
        aggregationSettings: { aggregations: [], showOnTop: false },
        customColumnFormatMap: [],
        columnAlignmentMap: [],
        isFilterBarShown: false,
        quickFilters: [],
        sorts: [{ column: 'String', isAbs: false, direction: 'ASC' }],
        userColumnWidths: [],
        userRowHeights: [],
        customColumns: [],
        conditionalFormats: [],
        reverse: false,
        showSearchBar: true,
        searchValue: '2',
        selectDistinctColumns: [],
        selectedSearchColumns: [],
        invertSearchColumns: true,
        pendingDataMap: [],
        frozenColumns: [],
        columnHeaderGroups: [],
      },
      gridState: {
        isStuckToBottom: false,
        isStuckToRight: false,
        movedColumns: [],
        movedRows: [],
      },
      pluginState: null,
    },
  };

  // Set before the app loads, so a pending save can't overwrite it
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [WORKSPACE_STORAGE_KEY, JSON.stringify(workspace)]
  );
  await gotoPage(page, '');
  await waitForTableLoaded(page);

  const searchBar = page.getByTestId('cross-column-search');
  await expect(searchBar).toHaveValue('2');

  // Change a setting so the grid saves again
  await searchBar.click();
  await searchBar.press('End');
  await page.keyboard.type('3');
  await expect(searchBar).toHaveValue('23');
  await waitForLoadingDone(page);

  await expect
    .poll(async () => getGridPanelState(page))
    .toEqual({
      irisGridPanelState: {},
      irisGridState: {
        sorts: [{ column: 'String', isAbs: false, direction: 'ASC' }],
        showSearchBar: true,
        searchValue: '23',
        frozenColumns: [],
        columnHeaderGroups: [],
      },
      gridState: {},
      pluginState: null,
    });
});
