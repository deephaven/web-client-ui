import { renderHook } from '@testing-library/react-hooks';
import useOnScrollRef from './useOnScrollRef';

const mock = {
  refA: document.createElement('div'),
  refB: document.createElement('div'),
  refMappedA: document.createElement('div'),
  refMappedB: document.createElement('div'),
  extractHTMLElement: jest.fn<HTMLElement | null, [HTMLElement | null]>(),
  onScroll: jest.fn().mockName('onScroll'),
};

[mock.refA, mock.refB, mock.refMappedA, mock.refMappedB].forEach(ref => {
  jest.spyOn(ref, 'addEventListener');
  jest.spyOn(ref, 'removeEventListener');
});

beforeEach(() => {
  jest.clearAllMocks();
  mock.extractHTMLElement.mockImplementation(ref =>
    ref === mock.refA ? mock.refMappedA : mock.refMappedB
  );
});

describe.each([undefined, mock.extractHTMLElement])(
  'callback ref returned from hook: %s',
  extractHTMLElement => {
    it.each([null, mock.refA])(
      'should register onScroll as event listener if given element: %s',
      maybeRef => {
        const { result } = renderHook(() =>
          useOnScrollRef(mock.onScroll, extractHTMLElement)
        );

        result.current(maybeRef);

        const mappedMaybeRef = extractHTMLElement?.(maybeRef) ?? maybeRef;

        if (mappedMaybeRef) {
          expect(mappedMaybeRef.addEventListener).toHaveBeenCalledWith(
            'scroll',
            mock.onScroll
          );
        }
      }
    );

    it.each([null, mock.refB])(
      'should replace previous registration: %s',
      maybeRef => {
        const { result } = renderHook(() =>
          useOnScrollRef(mock.onScroll, extractHTMLElement)
        );

        result.current(mock.refA);
        jest.clearAllMocks();

        result.current(maybeRef);

        const mappedRefA = extractHTMLElement?.(mock.refA) ?? mock.refA;
        const mappedMaybeRef = extractHTMLElement?.(maybeRef) ?? maybeRef;

        expect(mappedRefA.removeEventListener).toHaveBeenCalledWith(
          'scroll',
          mock.onScroll
        );

        if (mappedMaybeRef) {
          expect(mappedMaybeRef.addEventListener).toHaveBeenCalledWith(
            'scroll',
            mock.onScroll
          );
        }
      }
    );

    it('should remove event handler on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useOnScrollRef(mock.onScroll, extractHTMLElement)
      );

      result.current(mock.refA);
      jest.clearAllMocks();

      const mappedRefA = extractHTMLElement?.(mock.refA) ?? mock.refA;

      expect(mappedRefA.removeEventListener).not.toHaveBeenCalled();

      unmount();

      expect(mappedRefA.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        mock.onScroll
      );
    });
  }
);
