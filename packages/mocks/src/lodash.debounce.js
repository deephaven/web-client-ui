// lodash debounce needs mocking: https://github.com/facebook/jest/issues/3465#issuecomment-539496798

const debounce = jest.fn((callback, delay) => {
  let timer = null;
  let pendingArgs = null;
  let lastThis = this;

  const cancel = jest.fn(() => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = null;
    pendingArgs = null;
  });

  const flush = jest.fn(() => {
    if (timer) {
      callback.apply(lastThis, pendingArgs);
      cancel();
    }
  });

  function wrapped(...args) {
    cancel();

    lastThis = this;
    pendingArgs = args;
    timer = setTimeout(flush, wrapped.delay);
  }

  wrapped.cancel = cancel;
  wrapped.flush = flush;
  wrapped.delay = delay;

  return wrapped;
});

export default debounce;
