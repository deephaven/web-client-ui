import { renderHook } from '@testing-library/react-hooks';
import { Evented } from '@deephaven/jsapi-types';
import useTableListener from './useTableListener';

const eventName = 'mock.event';

const addEventListener = jest.fn();
const handler = jest.fn();
const unsubscribe = jest.fn();

const evented = ({
  addEventListener,
} as unknown) as Evented;

beforeEach(() => {
  jest.clearAllMocks();
  addEventListener.mockReturnValue(unsubscribe);
});

it('should register an event listener', () => {
  renderHook(() => useTableListener(evented, eventName, handler));
  expect(evented.addEventListener).toHaveBeenCalledWith(eventName, handler);
});

it('should unsubscribe on unmount', () => {
  const { unmount } = renderHook(() =>
    useTableListener(evented, eventName, handler)
  );

  expect(unsubscribe).not.toHaveBeenCalled();

  unmount();

  expect(unsubscribe).toHaveBeenCalled();
});

it.each([null, undefined])(
  'should handle null or undefined: %s',
  nullOrUndefined => {
    const { unmount } = renderHook(() =>
      useTableListener(nullOrUndefined, eventName, handler)
    );

    unmount();

    expect(unsubscribe).not.toHaveBeenCalled();
  }
);
