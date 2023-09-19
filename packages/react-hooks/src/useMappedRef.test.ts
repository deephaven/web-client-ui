import { MutableRefObject } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import useMappedRef from './useMappedRef';

const { asMock } = TestUtils;

type RefIn = string;
type RefOut = number;

const mock = {
  map: jest.fn<RefOut, [RefIn]>().mockName('map'),
  mapResult: 999,
  ref: {
    callback: jest.fn<void, [RefOut]>().mockName('callbackRef'),
    mutable: {} as MutableRefObject<RefOut>,
  },
};

beforeEach(() => {
  jest.clearAllMocks();

  asMock(mock.map).mockReturnValue(mock.mapResult);
});

describe('callback ref returned by hook', () => {
  it.each([mock.ref.callback, mock.ref.mutable])(
    'should map a given ref to another: %s',
    ref => {
      const { result } = renderHook(() => useMappedRef(ref, mock.map));

      const refIn = 'mock.refIn';

      result.current(refIn);

      if (typeof ref === 'function') {
        expect(ref).toHaveBeenCalledWith(mock.mapResult);
      } else {
        expect(ref.current).toBe(mock.mapResult);
      }
    }
  );
});
