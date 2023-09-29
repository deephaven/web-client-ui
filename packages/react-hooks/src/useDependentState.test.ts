import { act, renderHook } from '@testing-library/react-hooks';
import { useDependentState } from './useDependentState';

beforeEach(() => {
  jest.resetAllMocks();
  expect.hasAssertions();
});

describe('useDependentState', () => {
  const inputA = 0;
  const inputB = 1;

  it('should return a stateful value, and a function to update it', () => {
    const { result } = renderHook(() => useDependentState(inputA));
    expect(result.current[0]).toEqual(inputA);

    act(() => result.current[1](inputB));
    expect(result.current[0]).toEqual(inputB);
  });

  it('should update the state if the input value changes', () => {
    const { rerender, result } = renderHook(
      inputValue => useDependentState(inputValue),
      { initialProps: inputA }
    );
    expect(result.current[0]).toEqual(inputA);

    rerender(inputB);
    expect(result.current[0]).toEqual(inputB);
  });
});
