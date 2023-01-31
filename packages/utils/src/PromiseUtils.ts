import CanceledPromiseError from './CanceledPromiseError';
import TimeoutError from './TimeoutError';

export interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

export class PromiseUtils {
  /**
   * Creates a promise that can be canceled by calling the `cancel` function
   * Pass an optional `cleanupFunc` to perform actions on the resolved item after promise is cancelled.
   * @param promise The item to resolve
   * @param cleanup Function to cleanup the resolved item after cancelation. Called after both this promise is cancelled and the wrapped item was resolved (order does not matter).
   */
  static makeCancelable<T>(
    promise: Promise<T> | T,
    cleanup?: (val: T) => void | null
  ): CancelablePromise<T> {
    let hasCanceled = false;
    let resolved: T | undefined;
    let rejectFn: (val?: unknown) => void;

    const wrappedPromise = new Promise((resolve, reject) => {
      rejectFn = reject;
      Promise.resolve(promise)
        .then(val => {
          if (hasCanceled) {
            if (cleanup) {
              cleanup(val);
            }
          } else {
            resolved = val;
            resolve(val);
          }
        })
        .catch(error => reject(error));
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrappedPromise as any).cancel = () => {
      hasCanceled = true;
      rejectFn(new CanceledPromiseError());

      if (resolved != null && cleanup) {
        cleanup(resolved);
      }
    };

    return wrappedPromise as CancelablePromise<T>;
  }

  static isCanceled(error: unknown): boolean {
    return error instanceof CanceledPromiseError;
  }

  static isTimedOut(error: unknown): boolean {
    return error instanceof TimeoutError;
  }
}
