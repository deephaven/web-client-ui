import PromiseUtils from './PromiseUtils';

interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

/**
 * Helper class for managing pending promises.
 * IDS-6391 When cancel is called, it calls cancel on ALL promises, including ones that have already resolved.
 * This behaviour may change when IDS-6806 is implemented.
 */
class Pending {
  pending: Array<CancelablePromise<unknown>> = [];

  resolved: Array<CancelablePromise<unknown>> = [];

  /**
   * Begins tracking a promise. After the promise has resolved, it's removed from tracking.
   * @param item Item to track.
   * @param cleanup The cleanup function to use when the promise is cancelled
   * @returns CancelablePromise Returns a cancelable promise.
   */
  add(
    item: unknown,
    cleanup: (val: unknown) => void | null
  ): CancelablePromise<unknown> {
    const promise = PromiseUtils.makeCancelable(
      item,
      cleanup
    ) as CancelablePromise<unknown>;
    this.pending.push(promise);
    promise.then(
      () => {
        this.resolve(promise);
      },
      () => {
        this.resolve(promise);
      }
    );
    return promise;
  }

  /**
   * Remove a promise from tracking.
   * @param {Promise} promise Promise to stop tracking
   */
  remove(promise: Promise<unknown>): void {
    for (let i = 0; i < this.pending.length; i += 1) {
      if (this.pending[i] === promise) {
        this.pending.splice(i, 1);
        return;
      }
    }
  }

  resolve(promise: CancelablePromise<unknown>): void {
    this.remove(promise);
    this.resolved.push(promise);
  }

  /**
   * Cancel all pending promises and remove them from tracking.
   */
  cancel(): void {
    const allPromises = [...this.pending, ...this.resolved];
    for (let i = 0; i < allPromises.length; i += 1) {
      allPromises[i].cancel();
    }
    this.pending = [];
    this.resolved = [];
  }
}

export default Pending;
