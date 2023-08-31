import { renderHook } from '@testing-library/react-hooks';
import { DependencyList } from 'react';
import shortid from 'shortid';
import useEffectNTimesWhen from './useEffectNTimesWhen';

const conditionTrue = true;
const conditionFalse = false;

// Creates unique dependencies array to ensure useEffect fires on every render
const dependencies = (): DependencyList => [shortid()];
const effectFn = jest.fn().mockName('effectFn');

beforeEach(() => {
  jest.clearAllMocks();
});

it('should call the effect n times when condition is true', () => {
  const n = 3;

  const { rerender } = renderHook(
    condition => useEffectNTimesWhen(effectFn, dependencies(), n, condition),
    {
      initialProps: conditionTrue,
    }
  );

  expect(effectFn).toHaveBeenCalledTimes(1);

  rerender(conditionFalse);
  expect(effectFn).toHaveBeenCalledTimes(1);

  rerender(conditionTrue);
  expect(effectFn).toHaveBeenCalledTimes(2);

  rerender(conditionTrue);
  expect(effectFn).toHaveBeenCalledTimes(3);

  rerender(conditionTrue);
  expect(effectFn).toHaveBeenCalledTimes(3);
});
