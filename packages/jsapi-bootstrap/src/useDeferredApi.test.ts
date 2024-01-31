import { act, renderHook } from '@testing-library/react-hooks';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { useContext } from 'react';
import { TestUtils } from '@deephaven/utils';
import { useDeferredApi } from './useDeferredApi';
import { VariableDescriptor } from './useObjectFetcher';

const { asMock, createMockProxy, flushPromises } = TestUtils;

const dh1 = createMockProxy<DhType>();
const dh2 = createMockProxy<DhType>();
const objectMetadata = { type: 'TEST_TYPE' };

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useContext).mockName('useContext');
});

describe('useDeferredApi', () => {
  it('should return API directly if a value is provided from useContext, whatever the options are', () => {
    asMock(useContext).mockReturnValue(dh1);

    const { result } = renderHook(() => useDeferredApi(objectMetadata));
    expect(result.current).toEqual([dh1, null]);

    const { result: result2 } = renderHook(() =>
      useDeferredApi({ type: 'foo', foo: 'bar' })
    );
    expect(result2.current).toEqual([dh1, null]);
  });

  it('should resolve to the API value when it is provided from the function', async () => {
    asMock(useContext).mockReturnValue(async (metadata: VariableDescriptor) => {
      switch (metadata.type) {
        case '1':
          return dh1;
        case '2':
          return dh2;
        default:
          throw new Error('Invalid id');
      }
    });

    const { rerender, result } = renderHook(
      (metadata: VariableDescriptor) => useDeferredApi(metadata),
      { initialProps: { type: '1' } }
    );
    await act(flushPromises);
    expect(result.current).toEqual([dh1, null]);

    rerender({ type: '2' });
    await act(flushPromises);
    expect(result.current).toEqual([dh2, null]);

    rerender({ type: '3' });
    await act(flushPromises);
    expect(result.current).toEqual([null, expect.any(Error)]);
  });

  it('returns an error if the context is null', async () => {
    asMock(useContext).mockReturnValue(null);

    const { result } = renderHook(() => useDeferredApi(objectMetadata));
    expect(result.current).toEqual([null, expect.any(Error)]);
  });
});
