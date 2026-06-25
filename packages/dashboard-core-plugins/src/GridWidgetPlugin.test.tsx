import React from 'react';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { TestUtils } from '@deephaven/test-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { createMockStore } from '@deephaven/redux';
import dh from '@deephaven/jsapi-shim';
import GridWidgetPlugin from './GridWidgetPlugin';

const mockGoldenLayout = { eventHub: TestUtils.createMockProxy() };

jest.mock('@deephaven/dashboard', () => ({
  ...(jest.requireActual('@deephaven/dashboard') as Record<string, unknown>),
  useLayoutManager: jest.fn(() => mockGoldenLayout),
  useDashboardId: jest.fn(() => 'test'),
  useDhId: jest.fn(() => ({})),
  usePersistentState: jest.fn(initialValue => [initialValue, jest.fn()]),
}));

const MockIrisGrid: React.FC & jest.Mock = jest.fn(() => (
  <div>MockIrisGrid</div>
));

jest.mock('@deephaven/iris-grid', () => {
  const { forwardRef } = jest.requireActual('react');
  return {
    ...(jest.requireActual('@deephaven/iris-grid') as Record<string, unknown>),
    // eslint-disable-next-line react/jsx-props-no-spreading
    IrisGrid: forwardRef((props, ref) => <MockIrisGrid {...props} />),
  };
});

it('mounts without crashing', async () => {
  const table = TestUtils.createMockProxy<DhType.Table>({ columns: [] });
  const fetch = jest.fn(() => Promise.resolve(table));

  const store = createMockStore();

  const { container, queryByText } = render(
    <Provider store={store}>
      <ApiContext.Provider value={dh}>
        <GridWidgetPlugin fetch={fetch} />
      </ApiContext.Provider>
    </Provider>
  );

  expect(queryByText('MockIrisGrid')).not.toBeInTheDocument();

  await waitFor(() =>
    expect(
      container.querySelector('[role=progressbar].loading-spinner-large')
    ).toBeInTheDocument()
  );

  await waitFor(() =>
    expect(
      container.querySelector('[role=progressbar].loading-spinner-large')
    ).not.toBeInTheDocument()
  );

  expect(queryByText('MockIrisGrid')).toBeInTheDocument();
});

it('forwards the transformTableOptions prop to IrisGrid.transformTableOptions', async () => {
  MockIrisGrid.mockClear();
  const table = TestUtils.createMockProxy<DhType.Table>({ columns: [] });
  const fetch = jest.fn(() => Promise.resolve(table));
  const store = createMockStore();
  const transformTableOptions = jest.fn(defaults => defaults);

  const { queryByText } = render(
    <Provider store={store}>
      <ApiContext.Provider value={dh}>
        <GridWidgetPlugin
          fetch={fetch}
          transformTableOptions={transformTableOptions}
        />
      </ApiContext.Provider>
    </Provider>
  );

  await waitFor(() => expect(queryByText('MockIrisGrid')).toBeInTheDocument());

  const { calls } = MockIrisGrid.mock;
  expect(calls.length).toBeGreaterThan(0);
  const lastProps = calls[calls.length - 1][0];
  expect(lastProps.transformTableOptions).toBe(transformTableOptions);
});

it('applies transformModel to the model passed to IrisGrid', async () => {
  MockIrisGrid.mockClear();
  const table = TestUtils.createMockProxy<DhType.Table>({ columns: [] });
  const fetch = jest.fn(() => Promise.resolve(table));
  const store = createMockStore();
  const transformedModel = TestUtils.createMockProxy({ columns: [] });
  const transformModel = jest.fn(() => transformedModel);

  const { queryByText } = render(
    <Provider store={store}>
      <ApiContext.Provider value={dh}>
        <GridWidgetPlugin fetch={fetch} transformModel={transformModel} />
      </ApiContext.Provider>
    </Provider>
  );

  await waitFor(() => expect(queryByText('MockIrisGrid')).toBeInTheDocument());

  expect(transformModel).toHaveBeenCalledTimes(1);
  const { calls } = MockIrisGrid.mock;
  expect(calls.length).toBeGreaterThan(0);
  const lastProps = calls[calls.length - 1][0];
  expect(lastProps.model).toBe(transformedModel);
});
