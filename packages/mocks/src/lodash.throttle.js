const throttle = jest.fn((callback, delay = 0, options = {}) => {
  const { leading = true, trailing = true } = options;
  let timer = null;
  let pendingArgs = null;
  let pendingCall = false;
  let lastThis = this;

  const cancel = jest.fn(() => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = null;
    pendingArgs = null;
    pendingCall = false;
  });

  const flush = jest.fn(() => {
    if (timer && trailing && pendingCall) {
      callback.apply(lastThis, pendingArgs);
    }
    cancel();
  });

  function throttled(...args) {
    lastThis = this;
    // Calling throttled function during the delay period
    if (timer) {
      pendingCall = true;
      pendingArgs = args;
      return;
    }

    // Called outside of a throttle delay
    if (leading) {
      pendingCall = false;
      callback(...args);
    } else {
      pendingCall = true;
    }

    pendingArgs = args;
    timer = setTimeout(flush, throttled.delay);
  }

  throttled.cancel = cancel;
  throttled.flush = flush;
  throttled.delay = delay;

  return throttled;
});

export default throttle;
