import type debounceFn from 'lodash.debounce';

// lodash debounce needs mocking: https://github.com/facebook/jest/issues/3465#issuecomment-539496798

const debounce = jest
  .fn<ReturnType<typeof debounceFn>, Parameters<typeof debounceFn>>()
  .mockImplementation((callback, delay) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pendingArgs: Parameters<typeof debounceFn> | never[] = [];

    const cancel = jest.fn(() => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = null;
      pendingArgs = [];
    });

    const flush = jest.fn(() => {
      if (timer) {
        callback(...pendingArgs);
        cancel();
      }
    });

    const wrapped = (...args: Parameters<typeof debounceFn>) => {
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
