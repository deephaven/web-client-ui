import { renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import useOnScrollOffsetChangeCallback from './useOnScrollOffsetChangeCallback';

const { createMockProxy } = TestUtils;

function mockScrollEvent(scrollTop: number) {
  return createMockProxy<Event>({
    target: { scrollTop } as unknown as EventTarget,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

describe.each([undefined, 100])('returned callback', debounceMs => {
  const offsetSize = 10;
  const onChange = jest.fn().mockName('onChange');
  let callback: (event: Event) => void;

  beforeEach(() => {
    callback = renderHook(() =>
      useOnScrollOffsetChangeCallback(offsetSize, onChange, debounceMs)
    ).result.current;
  });

  it.each([
    ['min', 0],
    ['max', offsetSize - 1],
  ])(
    'should not call onChanged while offset remains zero after init: scrollTop zero offset %s:%s',
    (_label, scrollTop) => {
      callback(mockScrollEvent(scrollTop));

      jest.advanceTimersByTime(debounceMs ?? 0);

      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['min', 0],
    ['max', offsetSize - 1],
  ])(
    'should not call onChanged if offset does not change: %s:%s',
    (_label, addWithinOffset) => {
      const initialOffset = offsetSize;

      // Setup initial offset
      callback(mockScrollEvent(initialOffset));
      jest.advanceTimersByTime(debounceMs ?? 0);
      jest.clearAllMocks();

      // Add value that should still be within offset
      const scrollTop = offsetSize + addWithinOffset;

      callback(mockScrollEvent(scrollTop));

      jest.advanceTimersByTime(debounceMs ?? 0);

      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'should pass changed scroll offset to onChange after debounce: expectedOffset:%s',
    expectedOffset => {
      const scrollTop = expectedOffset * offsetSize;

      callback(mockScrollEvent(scrollTop));

      expect(onChange).not.toHaveBeenCalled();

      jest.advanceTimersByTime(debounceMs ?? 0);

      expect(onChange).toHaveBeenCalledWith(expectedOffset);
    }
  );

  it('should not call onChange if debounce expires and last call offset has not changed', () => {
    const scrollTop0 = 0 * offsetSize;
    const scrollTop1 = 1 * offsetSize;

    callback(mockScrollEvent(scrollTop1));
    callback(mockScrollEvent(scrollTop0));

    jest.advanceTimersByTime(debounceMs ?? 0);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should call onChange with last offset after debounce', () => {
    const scrollTop0 = 0 * offsetSize;
    const scrollTop1 = 1 * offsetSize;
    const scrollTop2 = 2 * offsetSize;

    callback(mockScrollEvent(scrollTop1));
    callback(mockScrollEvent(scrollTop0));
    callback(mockScrollEvent(scrollTop1));
    callback(mockScrollEvent(scrollTop2));

    jest.advanceTimersByTime(debounceMs ?? 0);

    expect(onChange).toHaveBeenCalledWith(2);
  });
});
