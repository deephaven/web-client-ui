import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { TestUtils } from '@deephaven/test-utils';
import usePopoverOnScrollRef from './usePopoverOnScrollRef';

const { asMock, createMockProxy } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePopoverOnScrollRef', () => {
  const mock = {
    event: createMockProxy<Event>(),
    findScrollArea: jest.fn(),
    getInitialScrollPosition: jest.fn<Promise<number | null>, []>(),
    onScrollA: jest.fn(),
    onScrollB: jest.fn(),
    result: {
      findScrollArea: createMockProxy<HTMLElement>(),
      getInitialScrollPosition: 999,
    },
  };

  function getLastRegisteredOnScrollHandler() {
    const { calls } = asMock(mock.result.findScrollArea.addEventListener).mock;
    expect(calls.length).toBeGreaterThan(0);
    return calls[calls.length - 1][1] as EventListener;
  }

  beforeEach(() => {
    asMock(mock.findScrollArea)
      .mockName('findScrollArea')
      .mockReturnValue(mock.result.findScrollArea);

    asMock(mock.getInitialScrollPosition)
      .mockName('getInitialScrollPosition')
      .mockResolvedValue(mock.result.getInitialScrollPosition);

    asMock(mock.onScrollA).mockName('onScroll');
  });

  function testCommon(getInitialScrollPosition?: () => Promise<number | null>) {
    const renderResult = renderHook(
      props => usePopoverOnScrollRef(mock.findScrollArea, ...props),
      { initialProps: [mock.onScrollA, getInitialScrollPosition] as const }
    );

    render(<div ref={renderResult.result.current.ref} />);

    expect(renderResult.result.current.ref.current).toBeInstanceOf(
      HTMLDivElement
    );

    return renderResult;
  }

  it('should not register scroll handler on close', () => {
    const { result } = testCommon();

    result.current.onOpenChange(false);

    expect(mock.findScrollArea).not.toHaveBeenCalled();

    jest.advanceTimersByTime(0);

    expect(mock.findScrollArea).not.toHaveBeenCalled();
  });

  describe.each([null, mock.result.getInitialScrollPosition])(
    'onOpenChange callback: %s',
    position => {
      it.each([undefined, mock.getInitialScrollPosition])(
        'should initialize scroll position on open if given getInitialScrollPosition callback: %s',
        async getInitialScrollPosition => {
          asMock(mock.getInitialScrollPosition).mockResolvedValue(position);

          const { result } = testCommon(getInitialScrollPosition);

          result.current.onOpenChange(true);

          act(() => {
            // deal with the setTimeout(..., 0)
            jest.advanceTimersByTime(0);
          });

          if (getInitialScrollPosition != null) {
            expect(mock.getInitialScrollPosition).toHaveBeenCalled();

            jest.runAllTimers();
            await TestUtils.flushPromises();

            if (position == null) {
              expect(mock.result.findScrollArea.scroll).not.toHaveBeenCalled();
            } else {
              expect(mock.result.findScrollArea.scroll).toHaveBeenCalledWith(
                0,
                mock.result.getInitialScrollPosition
              );
            }
          }
        }
      );

      it.each([true, false])(
        'should register a scroll handler on open',
        testMultipleOpens => {
          const { result } = testCommon();

          result.current.onOpenChange(true);

          if (testMultipleOpens) {
            result.current.onOpenChange(false);
            result.current.onOpenChange(true);
          }

          expect(mock.findScrollArea).not.toHaveBeenCalled();

          act(() => {
            jest.advanceTimersByTime(0);
          });

          expect(mock.findScrollArea).toHaveBeenCalledTimes(1);

          expect(mock.findScrollArea).toHaveBeenCalledWith(
            result.current.ref.current
          );
          expect(
            mock.result.findScrollArea.addEventListener
          ).toHaveBeenCalledWith('scroll', expect.any(Function));
        }
      );

      it('should call latest onScroll handler on scroll event', () => {
        const { result, rerender } = testCommon();

        result.current.onOpenChange(true);

        act(() => {
          jest.advanceTimersByTime(0);
        });

        const scrollHandlerA = getLastRegisteredOnScrollHandler();
        scrollHandlerA(mock.event);

        expect(mock.onScrollA).toHaveBeenCalledWith(mock.event);

        jest.clearAllMocks();
        rerender([mock.onScrollB, undefined]);

        const scrollHandlerB = getLastRegisteredOnScrollHandler();
        scrollHandlerB(mock.event);

        expect(mock.onScrollA).not.toHaveBeenCalled();
        expect(mock.onScrollB).toHaveBeenCalledWith(mock.event);
      });
    }
  );
});
