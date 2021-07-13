import { PromiseUtils } from './PromiseUtils';

it('wraps promises properly', () => {
  const makeCancelable = () => {
    // Need to add a catch block or the tests crash.
    // https://github.com/facebook/jest/issues/5311
    const cancelable = PromiseUtils.makeCancelable(null);
    return cancelable;
  };

  expect(typeof makeCancelable().cancel).toEqual('function');
});
