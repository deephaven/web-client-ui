import React from 'react';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { TestUtils } from '@deephaven/test-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { createMockStore } from '@deephaven/redux';
import dh from '@deephaven/jsapi-shim';
import ChartWidgetPlugin from './ChartWidgetPlugin';

const MockChart: React.FC<Record<string, unknown>> & jest.Mock = jest.fn(
  () => null
);

jest.mock('@deephaven/chart', () => ({
  ...(jest.requireActual('@deephaven/chart') as Record<string, unknown>),
  // eslint-disable-next-line react/jsx-props-no-spreading
  Chart: (props: Record<string, unknown>) => <MockChart {...props} />,
  ChartModelFactory: {
    makeModel: jest.fn(() => Promise.resolve({ mock: 'model' })),
  },
}));

function renderComponent(
  fetch = jest.fn(() =>
    Promise.resolve(TestUtils.createMockProxy<DhType.plot.Figure>())
  ),
  storeOverrides?: Parameters<typeof createMockStore>[0]
) {
  const store = createMockStore(storeOverrides);
  return render(
    <Provider store={store}>
      <ApiContext.Provider value={dh}>
        <ChartWidgetPlugin fetch={fetch} />
      </ApiContext.Provider>
    </Provider>
  );
}

beforeEach(() => {
  MockChart.mockClear();
});

it('renders Chart with the model after fetch resolves', async () => {
  renderComponent();

  expect(MockChart).not.toHaveBeenCalled();

  await waitFor(() => expect(MockChart).toHaveBeenCalled());

  expect(MockChart).toHaveBeenCalledWith(
    expect.objectContaining({ model: { mock: 'model' } }),
    expect.anything()
  );
});

it('passes settings from Redux to Chart', async () => {
  renderComponent();

  await waitFor(() => expect(MockChart).toHaveBeenCalled());

  expect(MockChart).toHaveBeenCalledWith(
    expect.objectContaining({ settings: expect.any(Object) }),
    expect.anything()
  );
});
