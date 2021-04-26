import CanceledPromiseError from './CanceledPromiseError';
import TimeoutError from './TimeoutError';

class PromiseUtils {
  static isCancelablePromise(promise) {
    return (
      this.isPromise(promise) &&
      promise.cancel != null &&
      typeof promise.cancel === 'function'
    );
  }

  static isPromise(promise) {
    return (
      promise != null &&
      promise.then != null &&
      typeof promise.then === 'function'
    );
  }

  /**
   * Creates a promise that can be canceled by calling the `cancel` function
   * Pass an optional `cleanupFunc` to perform actions on the resolved item after promise is cancelled.
   * @param {Any} promise The item to resolve
   * @param {Function} cleanup Function to cleanup the resolved item after cancelation. Called after both this promise is cancelled and the wrapped item was resolved (order does not matter).
   */
  static makeCancelable(promise, cleanup = null) {
    let hasCanceled = false;
    let resolved = null;

    const wrappedPromise = new Promise((resolve, reject) => {
      Promise.resolve(promise).then(
        val => {
          if (hasCanceled) {
            if (cleanup) {
              cleanup(val);
            }
            reject(new CanceledPromiseError());
          } else {
            resolved = val;
            resolve(val);
          }
        },
        error =>
          hasCanceled ? reject(new CanceledPromiseError()) : reject(error)
      );
    });

    wrappedPromise.cancel = () => {
      hasCanceled = true;

      if (resolved != null && cleanup) {
        cleanup(resolved);
      }
    };

    return wrappedPromise;
  }

  static isCanceled(error) {
    return error instanceof CanceledPromiseError;
  }

  static isTimedOut(error) {
    return error instanceof TimeoutError;
  }
}

export default PromiseUtils;
