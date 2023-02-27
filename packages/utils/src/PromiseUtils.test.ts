import CanceledPromiseError from './CanceledPromiseError';
import { PromiseUtils } from './PromiseUtils';
import TimeoutError from './TimeoutError';

describe('makeCancelable', () => {
  it('wraps promises properly', () => {
    const makeCancelable = () => {
      // Need to add a catch block or the tests crash.
      // https://github.com/facebook/jest/issues/5311
      const cancelable = PromiseUtils.makeCancelable(null);
      return cancelable;
    };

    expect(typeof makeCancelable().cancel).toEqual('function');
  });
});

describe('isCanceled', () => {
  it('returns true if the error is a CanceledPromiseError', () => {
    const error = new CanceledPromiseError();
    expect(PromiseUtils.isCanceled(error)).toBe(true);
  });

  it('returns false if the error is not a CanceledPromiseError', () => {
    const error = new Error();
    expect(PromiseUtils.isCanceled(error)).toBe(false);
  });
});

describe('isTimedOut', () => {
  it('returns true if the error is a TimeoutError', () => {
    const error = new TimeoutError();
    expect(PromiseUtils.isTimedOut(error)).toBe(true);
  });

  it('returns false if the error is not a TimeoutError', () => {
    const error = new Error();
    expect(PromiseUtils.isTimedOut(error)).toBe(false);
  });
});
