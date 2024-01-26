import React from 'react';
import { act, render } from '@testing-library/react';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import DeferredApiBootstrap from './DeferredApiBootstrap';
import { DeferredApiContext } from './useDeferredApi';

it('should call the error callback if no API provider wrapped', () => {
  const onError = jest.fn();
  render(<DeferredApiBootstrap onError={onError} />);
  expect(onError).toHaveBeenCalled();
});

it('renders children if the API is loaded', () => {
  const api = TestUtils.createMockProxy<DhType>();
  const { queryByText } = render(
    <DeferredApiContext.Provider value={api}>
      <DeferredApiBootstrap>
        <div>Child</div>
      </DeferredApiBootstrap>
    </DeferredApiContext.Provider>
  );
  expect(queryByText('Child')).not.toBeNull();
});

it('waits to render children until the API is loaded', async () => {
  let resolveApi: (api: DhType) => void;
  const apiPromise = new Promise<DhType>(resolve => {
    resolveApi = resolve;
  });
  const deferredApi = jest.fn(() => apiPromise);
  const options = { foo: 'bar' };
  const { queryByText } = render(
    <DeferredApiContext.Provider value={deferredApi}>
      <DeferredApiBootstrap options={options}>
        <div>Child</div>
      </DeferredApiBootstrap>
    </DeferredApiContext.Provider>
  );
  expect(queryByText('Child')).toBeNull();
  expect(deferredApi).toHaveBeenCalledTimes(1);
  expect(deferredApi).toHaveBeenCalledWith(options);

  const api = TestUtils.createMockProxy<DhType>();
  await act(async () => {
    resolveApi(api);
    await apiPromise;
  });
  expect(queryByText('Child')).not.toBeNull();
});
