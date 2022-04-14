import React from 'react';
import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// import { LayoutUtils } from '@deephaven/dashboard';
import { FilterSetManagerPanel } from './FilterSetManagerPanel';

// jest.mock('LayoutUtils', () => ({
//   getPanelId: () => 'Grid1',
// }));

function makeGlComponent() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    tab: null,
  };
}

function makeColumns(count = 30) {
  const columns = [];
  for (let i = 0; i < count; i += 1) {
    const column = { index: i, name: `${i}` };
    columns.push(column);
  }
  return columns;
}

function renderFilterSetManagerPanel({
  filterSets = [],
  localId = 'TEST_ID',
  panelMap = new Map(),
  tableMap = new Map(),
  setFilterSets = jest.fn(),
  panelState = undefined,
} = {}) {
  return render(
    <FilterSetManagerPanel
      glContainer={makeGlComponent()}
      glEventHub={makeGlComponent()}
      filterSets={filterSets}
      localDashboardId={localId}
      dashboardOpenedPanelMap={panelMap}
      panelTableMap={tableMap}
      setDashboardFilterSets={setFilterSets}
      panelState={panelState}
    />
  );
}

describe('FilterSetManagerPanel', () => {
  afterEach(cleanup);

  it('Renders the initial screen without errors', () => {
    const { getByText } = renderFilterSetManagerPanel();
    expect(getByText('Capture filter set')).toBeVisible();
  });

  it('Rejects empty filter set name', async () => {
    const {
      getAllByRole,
      getByPlaceholderText,
      getByText,
    } = renderFilterSetManagerPanel();
    await userEvent.click(getByText('Capture filter set'));
    expect(getByText('Name captured set')).toBeVisible();
    await userEvent.type(getByPlaceholderText('Enter name...'), '');
    await userEvent.click(getAllByRole('button')[0]);
    expect(getByText('Name cannot be empty')).toBeVisible();
  });

  it('Captures filter set correctly', async () => {
    const title = 'TEST SET';
    const setFilterSets = jest.fn();
    const {
      getAllByRole,
      getByPlaceholderText,
      getByText,
    } = renderFilterSetManagerPanel({ setFilterSets });
    await userEvent.click(getByText('Capture filter set'));
    expect(getByText('Name captured set')).toBeVisible();
    await userEvent.type(getByPlaceholderText('Enter name...'), title);
    await userEvent.click(getAllByRole('button')[0]);
    expect(getByText('Edit filter sets')).toBeVisible();
    // Save and flip to the main screen
    expect(setFilterSets).not.toBeCalled();
    await userEvent.click(getByText('Save'));
    expect(setFilterSets).toBeCalledWith(expect.anything(), [
      expect.objectContaining({ title, restoreFullState: false }),
    ]);
  });

  it('Captures filter set with Restore Full State checked', async () => {
    const title = 'TEST SET';
    const setFilterSets = jest.fn();
    const {
      getByTestId,
      getByLabelText,
      getByPlaceholderText,
      getByText,
    } = renderFilterSetManagerPanel({ setFilterSets });
    await userEvent.click(getByText('Capture filter set'));
    expect(getByText('Name captured set')).toBeVisible();
    await userEvent.type(getByPlaceholderText('Enter name...'), title);
    await userEvent.click(getByLabelText('Restore full table state'));
    await userEvent.click(getByTestId('rename-confirm-button'));
    expect(getByText('Edit filter sets')).toBeVisible();
    // Save and flip to the main screen
    expect(setFilterSets).not.toBeCalled();
    await userEvent.click(getByText('Save'));
    expect(setFilterSets).toBeCalledWith(expect.anything(), [
      expect.objectContaining({ title, restoreFullState: true }),
    ]);
  });

  it('Applies filter set on button click and dropdown select', async () => {
    const filterSets = [
      {
        id: 'ID 1',
        title: 'SET 1',
        restoreFullState: false,
        panels: [
          { panelId: 'InputFilterPanel1', state: {}, type: 'InputFilterPanel' },
        ],
      },
      {
        id: 'ID 2',
        title: 'SET 2',
        restoreFullState: true,
        panels: [
          { panelId: 'IrisGridPanel1', state: {}, type: 'IrisGridPanel' },
        ],
      },
      {
        id: 'ID 3',
        title: 'SET 3',
        restoreFullState: false,
        panels: [
          { panelId: 'IrisGridPanel1', state: {}, type: 'IrisGridPanel' },
        ],
      },
    ];
    const setFiltersMock = jest.fn();
    const setStateOverridesMock = jest.fn();
    const setPanelStateMock = jest.fn();
    const { getByTestId } = renderFilterSetManagerPanel({
      filterSets,
      panelState: { isValueShown: true },
      panelMap: new Map([
        [
          'InputFilterPanel1',
          {
            panelState: {},
            props: { glContainer: { _config: { id: 'InputFilterPanel1' } } },
            setPanelState: setPanelStateMock,
          },
        ],
        [
          'IrisGridPanel1',
          {
            panelState: {},
            props: { glContainer: { _config: { id: 'IrisGridPanel1' } } },
            setFilters: setFiltersMock,
            setStateOverrides: setStateOverridesMock,
          },
        ],
      ]),
      tableMap: new Map([['IrisGridPanel1', 'IrisGridPanel1Table']]),
    });
    const dropdown = getByTestId('value-card-filter-select');
    expect(dropdown).toBeVisible();
    expect(dropdown).toHaveValue('ID 1');

    expect(setPanelStateMock).not.toBeCalled();
    await userEvent.click(getByTestId('filter-apply-button'));
    expect(setPanelStateMock).toBeCalled();

    expect(setStateOverridesMock).not.toBeCalled();
    await userEvent.selectOptions(dropdown, 'ID 2');
    expect(dropdown).toHaveValue('ID 2');
    expect(setStateOverridesMock).toBeCalled();

    expect(setFiltersMock).not.toBeCalled();
    await userEvent.selectOptions(dropdown, 'ID 3');
    expect(dropdown).toHaveValue('ID 3');
    expect(setFiltersMock).toBeCalled();
  });
});

describe('changeFilterIndexesToColumnNames', () => {
  const DEFAULT_FILTER = {};
  const columns = makeColumns(10);
  it('Replaces indexes with column names', () => {
    const filters = [
      [1, DEFAULT_FILTER],
      [3, DEFAULT_FILTER],
      [5, DEFAULT_FILTER],
    ];
    expect(
      FilterSetManagerPanel.changeFilterIndexesToColumnNames(
        { columns },
        filters
      )
    ).toEqual([
      { name: '1', filter: DEFAULT_FILTER },
      { name: '3', filter: DEFAULT_FILTER },
      { name: '5', filter: DEFAULT_FILTER },
    ]);
  });

  it('Omits columns with invalid indexes', () => {
    const filters = [
      [1, DEFAULT_FILTER],
      // Invalid column index
      [30, DEFAULT_FILTER],
      [5, DEFAULT_FILTER],
    ];
    expect(
      FilterSetManagerPanel.changeFilterIndexesToColumnNames(
        { columns },
        filters
      )
    ).toEqual([
      { name: '1', filter: DEFAULT_FILTER },
      { name: '5', filter: DEFAULT_FILTER },
    ]);
  });
});
