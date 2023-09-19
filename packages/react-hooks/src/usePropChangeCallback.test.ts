import { renderHook } from '@testing-library/react-hooks';
import usePropChangeCallback from './usePropChangeCallback';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('usePropChangeCallback', () => {
  it('should create a prop setter callback', () => {
    const value = { first: 'John', last: 'Doe' };
    const onLastNameChange = jest.fn();
    const propValue = 'Smith';

    const { result } = renderHook(() =>
      usePropChangeCallback(value, 'last', onLastNameChange)
    );

    result.current(propValue);

    expect(onLastNameChange).toHaveBeenCalledWith({
      ...value,
      last: propValue,
    });
  });

  it.each([null, undefined])('should support defaultValue: %s', propValue => {
    const value = { first: 'John', last: 'Doe' };
    const onLastNameChange = jest.fn();
    const defaultValue = 'Jones';

    const { result } = renderHook(() =>
      usePropChangeCallback(value, 'last', onLastNameChange, defaultValue)
    );

    result.current(propValue);

    expect(onLastNameChange).toHaveBeenCalledWith({
      ...value,
      last: defaultValue,
    });
  });
});
