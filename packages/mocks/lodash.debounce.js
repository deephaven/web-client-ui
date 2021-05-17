// lodash debounce needs mocking: https://github.com/facebook/jest/issues/3465#issuecomment-539496798

const debounce = jest.fn().mockImplementation((callback, delay) => {
  let timer = null;
  let pendingArgs = null;

  const cancel = jest.fn(() => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = null;
    pendingArgs = null;
  });

  const flush = jest.fn(() => {
    if (timer) {
      callback(...pendingArgs);
      cancel();
    }
  });

  const wrapped = (...args) => {
    cancel();

    pendingArgs = args;
    timer = setTimeout(flush, wrapped.delay);
  };

  wrapped.cancel = cancel;
  wrapped.flush = flush;
  wrapped.delay = delay;

  return wrapped;
});

export default debounce;
