import type userEvent from '@testing-library/user-event';

interface MockContext {
  arc: jest.Mock<void>;
  beginPath: jest.Mock<void>;
  clip: jest.Mock<void>;
  closePath: jest.Mock<void>;
  createLinearGradient: jest.Mock<{ addColorStop: jest.Mock<void> }>;
  fill: jest.Mock<void>;
  fillRect: jest.Mock<void>;
  fillText: jest.Mock<void>;
  lineTo: jest.Mock<void>;
  measureText: jest.Mock<{ width: number }, [string]>;
  moveTo: jest.Mock<void>;
  rect: jest.Mock<void>;
  restore: jest.Mock<void>;
  setTransform: jest.Mock<void>;
  save: jest.Mock<void>;
  stroke: jest.Mock<void>;
  strokeRect: jest.Mock<void>;
  translate: jest.Mock<void>;
  scale: jest.Mock<void>;
  createPattern: jest.Mock<void>;
}

export interface ClickOptions {
  ctrlKey?: boolean;
  shiftKey?: boolean;
  dblClick?: boolean;
  rightClick?: boolean;
}

class TestUtils {
  /**
   * Type assertion to "cast" a function to it's corresponding jest.Mock
   * function type. Note that this is a types only helper for type assertions.
   * It will not actually convert a non-mock function.
   *
   * e.g.
   *
   * // This is actually a jest.Mock fn, but the type annotation hides this.
   * const someFunc: (name: string) => number = jest.fn(
   *   (name: string): number => name.length
   * );
   *
   * // `asMock` will infer the type as jest.Mock<number, [string]> which gives
   * // us the ability to call `mockImplementation` in a type safe way.
   * TestUtils.asMock(someFunc).mockImplementation(name => name.split(',').length)
   */
  static asMock = <TResult, TArgs extends unknown[]>(
    fn: (...args: TArgs) => TResult
  ): jest.Mock<TResult, TArgs> => (fn as unknown) as jest.Mock<TResult, TArgs>;

  /**
   * Find the last mock function call matching a given predicate.
   * @param fn jest.Mock function
   * @param predicate Predicate function to match calls against
   */
  static findLastCall = <TResult, TArgs extends unknown[]>(
    fn: (...args: TArgs) => TResult,
    predicate: (args: TArgs) => boolean
  ) => TestUtils.asMock(fn).mock.calls.reverse().find(predicate);

  static makeMockContext(): MockContext {
    return {
      arc: jest.fn(),
      beginPath: jest.fn(),
      clip: jest.fn(),
      closePath: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      fill: jest.fn(),
      fillRect: jest.fn(),
      fillText: jest.fn(),
      lineTo: jest.fn(),
      measureText: jest.fn((str: string) => ({ width: str.length * 10 })),
      moveTo: jest.fn(),
      rect: jest.fn(),
      restore: jest.fn(),
      setTransform: jest.fn(),
      save: jest.fn(),
      stroke: jest.fn(),
      strokeRect: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      createPattern: jest.fn(),
    };
  }

  static REGULAR_USER = {
    name: 'test',
    operateAs: 'test',
    groups: ['allusers', 'test'],
    permissions: {
      isSuperUser: false,
      isQueryViewOnly: false,
      isNonInteractive: false,
      canUsePanels: true,
      canCreateDashboard: true,
      canCreateCodeStudio: true,
      canCreateQueryMonitor: true,
      canCopy: true,
      canDownloadCsv: true,
    },
  };

  static async click(
    user: ReturnType<typeof userEvent.setup>,
    element: Element,
    options: ClickOptions = {}
  ): Promise<void> {
    const {
      ctrlKey = false,
      shiftKey = false,
      dblClick = false,
      rightClick = false,
    } = options;

    if (ctrlKey) {
      await TestUtils.controlClick(user, element, dblClick, rightClick);
    } else if (shiftKey) {
      await TestUtils.shiftClick(user, element, dblClick, rightClick);
    } else if (dblClick) {
      await user.dblClick(element);
    } else if (rightClick) {
      await TestUtils.rightClick(user, element);
    } else {
      await user.click(element);
    }
  }

  static async rightClick(
    user: ReturnType<typeof userEvent.setup>,
    element: Element
  ) {
    await user.pointer([
      { target: element },
      { keys: '[MouseRight]', target: element },
    ]);
  }

  static async controlClick(
    user: ReturnType<typeof userEvent.setup>,
    element: Element,
    dblClick = false,
    rightClick = false
  ): Promise<void> {
    await user.keyboard('{Control>}');
    if (dblClick) {
      await user.dblClick(element);
    } else if (rightClick) {
      await TestUtils.rightClick(user, element);
    } else {
      await user.click(element);
    }
    await user.keyboard('{/Control}');
  }

  static async shiftClick(
    user: ReturnType<typeof userEvent.setup>,
    element: Element,
    dblClick = false,
    rightClick = false
  ): Promise<void> {
    await user.keyboard('{Shift>}');
    if (dblClick) {
      await user.dblClick(element);
    } else if (rightClick) {
      await TestUtils.rightClick(user, element);
    } else {
      await user.click(element);
    }
    await user.keyboard('{/Shift}');
  }

  /**
   * Creates a mock object for a type `T` using a Proxy object. Each prop can
   * optionally be set via the constructor. Any prop that is not set will be set
   * to a jest.fn() instance on first access with the exeption of "then" which
   * will not be automatically proxied.
   * @param overrides Optional props to explicitly set on the Proxy.
   * @returns
   */
  static createMockProxy<T>(overrides: Partial<T> = {}): T {
    /* eslint-disable no-underscore-dangle */
    return new Proxy(
      {
        // Set default values on certain properties so they don't get automatically
        // proxied as jest.fn() instances.
        __mockProxyDefaultProps: {
          // `Symbol.iterator` - returning a jest.fn() throws a TypeError
          // `then` - avoid issues with `await` treating object as "thenable"
          [Symbol.iterator]: undefined,
          then: undefined,
          // Jest makes calls to `asymmetricMatch`, `hasAttribute`, `nodeType`
          // `tagName`, and `toJSON`
          asymmetricMatch: undefined,
          hasAttribute: undefined,
          nodeType: undefined,
          tagName: undefined,
          toJSON: undefined,
        },
        __mockProxyOverrides: overrides,
        __mockProxyProxies: {} as Record<keyof T, jest.Mock>,
      },
      {
        get(target, name) {
          if (name === Symbol.toStringTag) {
            return 'Mock Proxy';
          }

          // Reserved attributes for the proxy
          if (String(name).startsWith('__mockProxy')) {
            return target[name as keyof typeof target];
          }

          // Properties that have been explicitly overriden
          if (name in target.__mockProxyOverrides) {
            return target.__mockProxyOverrides[name as keyof T];
          }

          // Properties that have defaults set
          if (name in target.__mockProxyDefaultProps) {
            return target.__mockProxyDefaultProps[
              name as keyof typeof target.__mockProxyDefaultProps
            ];
          }

          // Any other property access will create and cache a jest.fn() instance
          if (target.__mockProxyProxies[name as keyof T] == null) {
            // eslint-disable-next-line no-param-reassign
            target.__mockProxyProxies[name as keyof T] = jest
              .fn()
              .mockName(String(name));
          }

          return target.__mockProxyProxies[name as keyof T];
        },
        // Only consider explicitly defined props as "in" the proxy
        has(target, name) {
          return name in target.__mockProxyOverrides;
        },
      }
    ) as T;
    /* eslint-enable no-underscore-dangle */
  }

  /**
   * Attempt to extract the args for the nth call to a given function. This will
   * only work if the given fn is a jest.Mock function. Otherwise, it returns
   * null.
   * @param fn
   * @param callIndex Index of the function call.
   */
  static extractCallArgs = <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult,
    callIndex: number
  ): TArgs | null => {
    try {
      return ((fn as jest.Mock).mock.calls[callIndex] ?? null) as TArgs | null;
    } catch (err) {
      return null;
    }
  };
}

export default TestUtils;
