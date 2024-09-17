import { renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/test-utils';
import {
  findSpectrumPickerScrollArea,
  usePopoverOnScrollRef,
  UsePopoverOnScrollRefResult,
} from '@deephaven/react-hooks';
import { usePickerScrollOnOpen } from './usePickerScrollOnOpen';

const { asMock, createMockProxy } = TestUtils;

jest.mock('@deephaven/react-hooks');

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('usePickerScrollOnOpen', () => {
  const getInitialScrollPosition = jest
    .fn()
    .mockName('getInitialScrollPosition');
  const onScroll = jest.fn().mockName('onScroll');
  const onOpenChange = jest.fn().mockName('onOpenChange');

  const mockUsePopoverOnScrollRefResult =
    createMockProxy<UsePopoverOnScrollRefResult<HTMLElement>>();

  beforeEach(() => {
    asMock(usePopoverOnScrollRef)
      .mockName('usePopoverOnScrollRef')
      .mockReturnValue(mockUsePopoverOnScrollRefResult);
  });

  it('should return ref from usePopoverOnScrollRef', () => {
    const { result } = renderHook(() =>
      usePickerScrollOnOpen({
        getInitialScrollPosition,
        onScroll,
        onOpenChange,
      })
    );

    expect(usePopoverOnScrollRef).toHaveBeenCalledWith(
      findSpectrumPickerScrollArea,
      onScroll,
      getInitialScrollPosition
    );
    expect(result.current.ref).toBe(mockUsePopoverOnScrollRefResult.ref);
  });

  it.each([true, false])(
    'should return a callback that calls popoverOnOpenChange and onOpenChange: %s',
    isOpen => {
      const { result } = renderHook(() =>
        usePickerScrollOnOpen({
          getInitialScrollPosition,
          onScroll,
          onOpenChange,
        })
      );

      result.current.onOpenChange(isOpen);

      expect(mockUsePopoverOnScrollRefResult.onOpenChange).toHaveBeenCalledWith(
        isOpen
      );
      expect(onOpenChange).toHaveBeenCalledWith(isOpen);
    }
  );
});
