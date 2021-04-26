import PromiseUtils from './PromiseUtils';

it('detects promise objects properly', () => {
  expect(PromiseUtils.isPromise()).toEqual(false);
  expect(PromiseUtils.isPromise([])).toEqual(false);
  expect(PromiseUtils.isPromise({})).toEqual(false);
  expect(PromiseUtils.isPromise({ then: 'test' })).toEqual(false);
  expect(PromiseUtils.isPromise({ then: () => {} })).toEqual(true);
});

it('detects cancelable promises properly', () => {
  expect(PromiseUtils.isCancelablePromise()).toEqual(false);
  expect(PromiseUtils.isCancelablePromise([])).toEqual(false);
  expect(PromiseUtils.isCancelablePromise({})).toEqual(false);
  expect(PromiseUtils.isCancelablePromise({ then: 'test' })).toEqual(false);
  expect(PromiseUtils.isCancelablePromise({ then: () => {} })).toEqual(false);
  expect(
    PromiseUtils.isCancelablePromise({ then: () => {}, cancel: 'test' })
  ).toEqual(false);
  expect(
    PromiseUtils.isCancelablePromise({ then: () => {}, cancel: () => {} })
  ).toEqual(true);
  expect(
    PromiseUtils.isCancelablePromise({ then: 'test', cancel: () => {} })
  ).toEqual(false);
  expect(PromiseUtils.isCancelablePromise({ cancel: () => {} })).toEqual(false);
});

it('wraps promises properly', () => {
  const makeCancelable = item => {
    // Need to add a catch block or the tests crash.
    // https://github.com/facebook/jest/issues/5311
    const cancelable = PromiseUtils.makeCancelable(item);
    cancelable.catch(() => {});
    return cancelable;
  };

  expect(PromiseUtils.isPromise(makeCancelable())).toEqual(true);
  expect(PromiseUtils.isCancelablePromise(makeCancelable())).toEqual(true);
});
