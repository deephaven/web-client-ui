import { act, renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import { useContentRect } from './useContentRect';
import useResizeObserver from './useResizeObserver';

jest.mock('./useResizeObserver');

const { asMock, createMockProxy } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
  asMock(useResizeObserver).mockName('useResizeObserver');
});

describe.each([true, false])('useContentRect - explicitMap:%s', explicitMap => {
  const mock = {
    refValue: document.createElement('div'),
    mappedValue: document.createElement('span'),
    resizeEntry: createMockProxy<ResizeObserverEntry>({
      contentRect: new DOMRect(0, 0, 100, 100),
    }),
    observer: createMockProxy<ResizeObserver>(),
  };

  const mockMap = explicitMap ? jest.fn(() => mock.mappedValue) : undefined;

  it('should initially return zero size contentRect', () => {
    const { result } = renderHook(() => useContentRect(mockMap));
    expect(useResizeObserver).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current.contentRect).toEqual(new DOMRect());
  });

  it('should pass expected value to resize observer based on presence of map function', () => {
    const { result, rerender } = renderHook(() => useContentRect(mockMap));

    result.current.ref(mock.refValue);
    rerender();

    if (mockMap != null) {
      expect(mockMap).toHaveBeenCalledWith(mock.refValue);
    }
    expect(useResizeObserver).toHaveBeenCalledWith(
      mockMap == null ? mock.refValue : mock.mappedValue,
      expect.any(Function)
    );
    expect(result.current.contentRect).toEqual(new DOMRect());
  });

  it.each([
    [[], new DOMRect()],
    [[mock.resizeEntry], mock.resizeEntry.contentRect],
  ])(
    'should update contentRect when resize observer triggers: %s',
    (entries, expected) => {
      const { result, rerender } = renderHook(() => useContentRect(mockMap));

      result.current.ref(mock.refValue);
      rerender();

      const handleResize = asMock(useResizeObserver).mock.calls.at(-1)?.[1];

      act(() => {
        handleResize?.(entries, mock.observer);
      });

      expect(result.current.contentRect).toEqual(expected);
    }
  );
});
