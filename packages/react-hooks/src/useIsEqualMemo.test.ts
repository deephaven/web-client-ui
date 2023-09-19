import { renderHook } from '@testing-library/react-hooks';
import useIsEqualMemo from './useIsEqualMemo';

beforeEach(() => {
  jest.clearAllMocks();
});

const isEqual = jest.fn();
const initialValue = { name: 'initial' };
const updatedValue = { name: 'updated' };

it('should initially return given value', () => {
  const { result } = renderHook(() => useIsEqualMemo(initialValue, isEqual));
  expect(result.current).toBe(initialValue);
});

it.each([
  [initialValue, true],
  [updatedValue, false],
] as const)(
  'should return %s value if isEqual returns %s',
  (expectedValue, isEqualResult) => {
    const { result, rerender } = renderHook(
      value => useIsEqualMemo(value, isEqual),
      {
        initialProps: initialValue,
      }
    );

    isEqual.mockReturnValue(isEqualResult);

    rerender(updatedValue);

    expect(result.current).toBe(expectedValue);
  }
);
