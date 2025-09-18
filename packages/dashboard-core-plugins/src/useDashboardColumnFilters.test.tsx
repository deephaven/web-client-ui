import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMockStore, type RootState } from '@deephaven/redux';
import { TestUtils } from '@deephaven/test-utils';
import GoldenLayout, { EventHub, type Config } from '@deephaven/golden-layout';
import { type dh } from '@deephaven/jsapi-types';
import { useDashboardColumnFilters } from './useDashboardColumnFilters';
import {
  type FilterChangeEvent,
  listenForFilterColumnsChanged,
  listenForFilterTableChanged,
} from './FilterEvents';

const mockGoldenLayout = {
  eventHub: new EventHub(new GoldenLayout({} as Config, undefined)),
};

jest.mock('@deephaven/dashboard', () => ({
  ...(jest.requireActual('@deephaven/dashboard') as Record<string, unknown>),
  useLayoutManager: jest.fn(() => mockGoldenLayout),
  useDashboardId: jest.fn(() => 'testDashboardId'),
  useDhId: jest.fn(() => 'testDhId'),
}));

const MOCK_COLUMNS = [
  {
    name: 'Foo',
    type: 'java.lang.String',
  },
  {
    name: 'Bar',
    type: 'java.lang.Integer',
  },
];

const FOO_STRING_FILTER = {
  name: 'Foo',
  type: 'java.lang.String',
  value: 'test',
  timestamp: 0,
  excludePanelIds: [],
};

const FOO_INT_FILTER = {
  name: 'Foo',
  type: 'java.lang.Integer',
  value: '4',
  timestamp: 0,
  excludePanelIds: [],
};

const BAR_STRING_FILTER = {
  name: 'Bar',
  type: 'java.lang.String',
  value: 'test',
  timestamp: 0,
  excludePanelIds: [],
};

const BAR_INT_FILTER = {
  name: 'Bar',
  type: 'java.lang.Integer',
  value: '4',
  timestamp: 0,
  excludePanelIds: [],
};

const BAZ_STRING_FILTER = {
  name: 'Baz',
  type: 'java.lang.String',
  value: 'test',
  timestamp: 0,
  excludePanelIds: [],
};

function createStoreWithFilters(filters: FilterChangeEvent[] = []) {
  const store = createMockStore();
  store.getState = jest.fn(() =>
    TestUtils.createMockProxy<RootState>({
      dashboardData: {
        testDashboardId: {
          filters,
        },
      },
    })
  );
  return store;
}

describe('useDashboardColumnFilters', () => {
  test('Gets filters matching name and type', () => {
    const store = createStoreWithFilters([FOO_STRING_FILTER, BAR_INT_FILTER]);
    const { result } = renderHook(
      () => useDashboardColumnFilters(MOCK_COLUMNS),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      }
    );

    expect(result.current).toEqual([FOO_STRING_FILTER, BAR_INT_FILTER]);
  });

  test('Ignores filters with different name or type', () => {
    const store = createStoreWithFilters([
      FOO_INT_FILTER,
      BAR_STRING_FILTER,
      BAZ_STRING_FILTER,
    ]);
    const { result } = renderHook(
      () => useDashboardColumnFilters(MOCK_COLUMNS),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      }
    );

    expect(result.current).toEqual([]);
  });

  test('Ignores filters with different name or type', () => {
    const store = createStoreWithFilters([
      FOO_INT_FILTER,
      BAR_STRING_FILTER,
      BAZ_STRING_FILTER,
    ]);
    const { result } = renderHook(
      () => useDashboardColumnFilters(MOCK_COLUMNS),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      }
    );

    expect(result.current).toEqual([]);
  });

  test('Ignores filters when panelId is excluded', () => {
    const newFooFilter = {
      ...FOO_STRING_FILTER,
      excludePanelIds: ['testDhId'],
    };
    const store = createStoreWithFilters([newFooFilter, BAR_INT_FILTER]);
    const { result } = renderHook(
      () => useDashboardColumnFilters(MOCK_COLUMNS),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      }
    );

    expect(result.current).toEqual([BAR_INT_FILTER]);
  });

  test('Emits column and table changed events', () => {
    const store = createStoreWithFilters();

    const mockColumnsChanged = jest.fn();
    listenForFilterColumnsChanged(
      mockGoldenLayout.eventHub,
      mockColumnsChanged
    );

    const mockTableChanged = jest.fn();
    listenForFilterTableChanged(mockGoldenLayout.eventHub, mockTableChanged);

    const mockTable = {} as dh.Table;

    const { rerender, unmount } = renderHook(
      ({ columns, table }) => useDashboardColumnFilters(columns, table),
      {
        initialProps: { columns: MOCK_COLUMNS, table: mockTable },
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      }
    );

    expect(mockColumnsChanged).toHaveBeenCalledWith('testDhId', MOCK_COLUMNS);
    expect(mockTableChanged).toHaveBeenCalledWith('testDhId', mockTable);

    // Change the columns and table to check re-emit
    mockColumnsChanged.mockClear();
    mockTableChanged.mockClear();

    const otherMockTable = {} as dh.Table;
    const otherMockColumns = [
      {
        name: 'Other',
        type: 'java.lang.String',
      },
    ];

    rerender({ columns: otherMockColumns, table: otherMockTable });
    expect(mockColumnsChanged).toHaveBeenCalledTimes(1);
    expect(mockTableChanged).toHaveBeenCalledTimes(1);
    expect(mockColumnsChanged).toHaveBeenCalledWith(
      'testDhId',
      otherMockColumns
    );
    expect(mockTableChanged).toHaveBeenCalledWith('testDhId', otherMockTable);

    // Check unmount emits with null
    mockColumnsChanged.mockClear();
    mockTableChanged.mockClear();

    unmount();

    expect(mockColumnsChanged).toHaveBeenCalledTimes(1);
    expect(mockTableChanged).toHaveBeenCalledTimes(1);
    expect(mockColumnsChanged).toHaveBeenCalledWith('testDhId', null);
    expect(mockTableChanged).toHaveBeenCalledWith('testDhId', null);
  });
});
