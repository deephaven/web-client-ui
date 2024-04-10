import { act, renderHook } from '@testing-library/react-hooks';
import type { DOMRefValue } from '@react-types/shared';
import { TestUtils } from '@deephaven/utils';
import { useCheckOverflow } from './useCheckOverflow';

const { createMockProxy } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useCheckOverflow', () => {
  const isOverflowing = createMockProxy<HTMLDivElement>({
    scrollWidth: 101,
    offsetWidth: 100,
  });

  const scrollWidthMatchesOffsetWidth = createMockProxy<HTMLDivElement>({
    scrollWidth: 100,
    offsetWidth: 100,
  });

  const offsetWidthGreaterThanScrollWidth = createMockProxy<HTMLDivElement>({
    scrollWidth: 99,
    offsetWidth: 100,
  });

  it.each([
    [null, false],
    [isOverflowing, true],
    [scrollWidthMatchesOffsetWidth, false],
    [offsetWidthGreaterThanScrollWidth, false],
  ])(
    'should check if a Spectrum `DOMRefValue` is overflowing: %s, %s',
    (el, expected) => {
      const { result } = renderHook(() => useCheckOverflow());

      const elRef =
        el == null
          ? null
          : createMockProxy<DOMRefValue<HTMLDivElement>>({
              UNSAFE_getDOMNode: () => createMockProxy<HTMLDivElement>(el),
            });

      act(() => {
        result.current.checkOverflow(elRef);
      });

      expect(result.current.isOverflowing).toBe(expected);

      act(() => {
        result.current.resetIsOverflowing();
      });

      expect(result.current.isOverflowing).toBe(false);
    }
  );
});
