import { renderHook } from '@testing-library/react-hooks';
import { useIsMountedRef } from './useIsMountedRef';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useIsMountedRef', () => {
  it('should return a ref which tracks whether the component is mounted or not', () => {
    const { result, unmount } = renderHook(() => useIsMountedRef());

    expect(result.current.current).toBe(true);

    unmount();

    expect(result.current.current).toBe(false);
  });
});
