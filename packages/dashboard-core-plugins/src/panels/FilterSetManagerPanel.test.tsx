import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterSetManagerPanel } from './FilterSetManagerPanel';

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
} = {}) {
  render(
    <FilterSetManagerPanel
      glContainer={makeGlComponent()}
      glEventHub={makeGlComponent()}
      filterSets={filterSets}
      localDashboardId={localId}
      dashboardOpenedPanelMap={panelMap}
      panelTableMap={tableMap}
      setDashboardFilterSets={setFilterSets}
    />
  );
}

describe('FilterSetManagerPanel', () => {
  it('Renders the initial screen without errors', () => {
    renderFilterSetManagerPanel();
    expect(screen.getByText('Capture filter set')).toBeVisible();
  });

  it('Rejects empty filter set name', async () => {
    renderFilterSetManagerPanel();
    await userEvent.click(screen.getByText('Capture filter set'));
    expect(screen.getByText('Name captured set')).toBeVisible();
    await userEvent.type(screen.getByPlaceholderText('Enter name...'), '');
    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('Name cannot be empty')).toBeVisible();
  });

  it('Captures filter set correctly', async () => {
    const title = 'TEST SET';
    const setFilterSets = jest.fn();
    renderFilterSetManagerPanel({ setFilterSets });
    await userEvent.click(screen.getByText('Capture filter set'));
    expect(screen.getByText('Name captured set')).toBeVisible();
    await userEvent.type(screen.getByPlaceholderText('Enter name...'), title);
    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('Edit filter sets')).toBeVisible();
    // Save and flip to the main screen
    expect(setFilterSets).not.toBeCalled();
    await userEvent.click(screen.getByText('Save'));
    expect(setFilterSets).toBeCalledWith(expect.anything(), [
      expect.objectContaining({ title }),
    ]);
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
