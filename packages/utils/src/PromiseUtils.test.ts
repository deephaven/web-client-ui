import CanceledPromiseError from './CanceledPromiseError';
import { PromiseUtils } from './PromiseUtils';
import TimeoutError from './TimeoutError';

describe('abortable', () => {
  it('returns the promise unchanged without a signal', () => {
    const promise = Promise.resolve(1);
    expect(PromiseUtils.abortable(promise)).toBe(promise);
  });

  it('resolves with the promise', async () => {
    const controller = new AbortController();
    await expect(
      PromiseUtils.abortable(Promise.resolve(1), controller.signal)
    ).resolves.toBe(1);
  });

  it('rejects with the promise', async () => {
    const error = new Error('failed');
    const controller = new AbortController();
    await expect(
      PromiseUtils.abortable(Promise.reject(error), controller.signal)
    ).rejects.toBe(error);
  });

  it('rejects with signal.reason on abort', async () => {
    const controller = new AbortController();
    const reason = new Error('aborted');

    const promise = PromiseUtils.abortable(
      new Promise(() => {
        // Never settles
      }),
      controller.signal
    );
    controller.abort(reason);

    await expect(promise).rejects.toBe(reason);
  });

  it('rejects with signal.reason if already aborted', async () => {
    const reason = new Error('aborted');
    await expect(
      PromiseUtils.abortable(Promise.resolve(1), AbortSignal.abort(reason))
    ).rejects.toBe(reason);
  });

  it.each([
    ['resolved', () => Promise.resolve(1)],
    ['rejected', () => Promise.reject(new Error('failed'))],
  ])('removes its abort listener once %s', async (_label, createPromise) => {
    const controller = new AbortController();
    const add = jest.spyOn(controller.signal, 'addEventListener');
    const remove = jest.spyOn(controller.signal, 'removeEventListener');

    await PromiseUtils.abortable(createPromise(), controller.signal).catch(
      () => undefined
    );

    const onAbort = add.mock.calls[0][1];
    expect(remove).toHaveBeenCalledWith('abort', onAbort);
  });
});

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

describe('withTimeout', () => {
  const timeoutMs = 500;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should call callback after timeout and return result', async () => {
    const returnValue = 999;
    const callback = jest.fn().mockReturnValue(returnValue);

    const promise = PromiseUtils.withTimeout(timeoutMs, callback);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(timeoutMs - 1);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalled();

    const result = await promise;
    expect(result).toEqual(returnValue);
  });

  it('should return a rejected promise if an error occurs in the callback', async () => {
    const error = new Error('Mock error');
    const callback = jest.fn().mockImplementation(() => {
      throw error;
    });

    const promise = PromiseUtils.withTimeout(timeoutMs, callback);
    jest.advanceTimersToNextTimer();

    expect(callback).toHaveBeenCalled();
    expect(promise).rejects.toThrow(error);
  });
});
