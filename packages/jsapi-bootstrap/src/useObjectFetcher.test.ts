import { act, renderHook } from '@testing-library/react-hooks';
import { useContext } from 'react';
import { TestUtils } from '@deephaven/utils';
import { useObjectFetcher } from './useObjectFetcher';

const { asMock, flushPromises } = TestUtils;

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useContext).mockName('useContext');
});

it('should resolve the fetcher when set in the context', async () => {
  const fetcher = jest.fn(async () => undefined);
  asMock(useContext).mockReturnValue(fetcher);

  const { result } = renderHook(() => useObjectFetcher());
  await act(flushPromises);
  expect(result.current).toEqual(fetcher);
  expect(result.error).toBeUndefined();
  expect(fetcher).not.toHaveBeenCalled();
});

it('throws an error if the context is null', async () => {
  asMock(useContext).mockReturnValue(null);

  const { result } = renderHook(() => useObjectFetcher());
  expect(result.error).not.toBeNull();
});
