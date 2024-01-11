import { act, renderHook } from '@testing-library/react-hooks';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { useContext } from 'react';
import { TestUtils } from '@deephaven/utils';
import { DeferredApiOptions, useDeferredApi } from './useDeferredApi';

const { asMock, createMockProxy, flushPromises } = TestUtils;

const dh1 = createMockProxy<DhType>();
const dh2 = createMockProxy<DhType>();

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useContext).mockName('useContext');
});

describe('useApi', () => {
  it('should return API directly if a value is provided from useContext, whatever the options are', () => {
    asMock(useContext).mockReturnValue(dh1);

    const { result } = renderHook(() => useDeferredApi());
    expect(result.current).toEqual([dh1, null]);

    const { result: result2 } = renderHook(() =>
      useDeferredApi({ foo: 'bar' })
    );
    expect(result2.current).toEqual([dh1, null]);
  });

  it('should resolve to the API value when it is provided from the function', async () => {
    asMock(useContext).mockReturnValue(async (options?: DeferredApiOptions) => {
      switch (options?.id) {
        case '1':
          return dh1;
        case '2':
          return dh2;
        default:
          throw new Error('Invalid id');
      }
    });

    const { rerender, result } = renderHook(
      (options?: DeferredApiOptions) => useDeferredApi(options),
      { initialProps: { id: '1' } }
    );
    await act(flushPromises);
    expect(result.current).toEqual([dh1, null]);

    rerender({ id: '2' });
    await act(flushPromises);
    expect(result.current).toEqual([dh2, null]);

    rerender({ id: '3' });
    await act(flushPromises);
    expect(result.current).toEqual([null, expect.any(Error)]);
  });

  it('returns an error if the context is null', async () => {
    asMock(useContext).mockReturnValue(null);

    const { result } = renderHook(() => useDeferredApi());
    expect(result.current).toEqual([null, expect.any(Error)]);
  });
});
