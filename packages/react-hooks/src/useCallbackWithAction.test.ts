import { renderHook } from '@testing-library/react-hooks';

import useCallbackWithAction from './useCallbackWithAction';

it('should call callback with args and call action', () => {
  const callback = jest.fn((name: string, age: number) => [name, age]);
  const action = jest.fn();

  const { result } = renderHook(() => useCallbackWithAction(callback, action));

  const name = 'jdoe';
  const age = 42;

  const actual = result.current(name, age);

  expect(actual).toEqual([name, age]);
  expect(callback).toHaveBeenCalledWith(name, age);
  expect(action).toHaveBeenCalledTimes(1);
});
