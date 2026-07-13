import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { performance } from 'perf_hooks';
import 'jest-canvas-mock';
import './__mocks__/dh-core';
import Log from '@deephaven/log';
import { TestUtils } from '@deephaven/test-utils';

let logLevel = parseInt(process.env.DH_LOG_LEVEL ?? '', 10);
if (!Number.isFinite(logLevel)) {
  logLevel = -1;
}
Log.setLogLevel(logLevel);

// disable annoying dnd-react warnings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window['__@hello-pangea/dnd-disable-dev-warnings'] = true;

// Define the matchMedia property so we can mock out monaco properly
// https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
// https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(window, 'CSSAnimation', {
  value: function () {
    return class CSSAnimation {};
  },
});

Object.defineProperty(window, 'performance', {
  value: performance,
  writable: true,
});

// Report a non-zero size when an element is observed. jsdom has no layout, so
// getBoundingClientRect returns 0; virtualized components (e.g. ItemList) need
// a size to render their contents in tests. Mirrors the previous
// react-virtualized-auto-sizer mock which reported a fixed 500x500.
class MockResizeObserver {
  private callback: ResizeObserverCallback;

  private isNotifying = false;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    // A real ResizeObserver notifies asynchronously and batches. Guard against
    // synchronous re-entrancy so consumers that re-observe from within their
    // own callback (e.g. @tanstack/virtual-core) don't recurse infinitely.
    if (this.isNotifying) {
      return;
    }
    this.isNotifying = true;
    try {
      this.callback(
        [
          {
            target,
            contentRect: { width: 500, height: 500 },
          } as unknown as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver
      );
    } finally {
      this.isNotifying = false;
    }
  }

  unobserve = jest.fn();

  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: MockResizeObserver,
});

Object.defineProperty(window, 'IntersectionObserver', {
  value: function () {
    return TestUtils.createMockProxy<IntersectionObserver>();
  },
});

Object.defineProperty(window, 'DOMRect', {
  value: function (x: number = 0, y: number = 0, width = 0, height = 0) {
    return TestUtils.createMockProxy<DOMRect>({
      x,
      y,
      width,
      height,
      top: y,
      bottom: y + height,
      left: x,
      right: x + width,
    });
  },
});

Object.defineProperty(window, 'TextDecoder', {
  value: TextDecoder,
});

Object.defineProperty(window, 'TextEncoder', {
  value: TextEncoder,
});

Object.defineProperty(document, 'fonts', {
  value: {
    ready: Promise.resolve(),
  },
});

Object.defineProperty(document, 'getAnimations', {
  value: () => [],
  writable: true,
});

Object.defineProperty(window.CSS, 'supports', {
  value: () => true,
  writable: true,
});
