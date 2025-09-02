import type userEvent from '@testing-library/user-event';
import createMockProxy from './MockProxy';
import { type Tuple } from './TypeUtils';

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
  altKey?: boolean;
  dblClick?: boolean;
  rightClick?: boolean;
}

/**
 * Filters a type down to only method properties.
 */
export type PickMethods<T> = {
  [K in keyof T as T[K] extends (...args: unknown[]) => unknown
    ? K
    : never]: T[K];
};

export type ConsoleMethodName = keyof PickMethods<Console>;

export class TestUtils {
  /**
   * jest.useFakeTimers mocks `process.nextTick` by default. Hold on to a
   * reference to the real function so we can still use it.
   */
  static realNextTick =
    typeof process !== 'undefined' ? process.nextTick : undefined;

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
   * @param fn The function to assert as a jest.Mock function.
   * @param mockName Optional name to assign to the mock function. Defaults to the
   * original function's name if it has one.
   */
  static asMock = <TResult, TArgs extends unknown[]>(
    fn: (...args: TArgs) => TResult,
    mockName = fn.name
  ): jest.Mock<TResult, TArgs> => {
    const mockFn = fn as unknown as jest.Mock<TResult, TArgs>;

    if (mockName) {
      return mockFn.mockName(mockName);
    }

    return mockFn;
  };

  /**
   * Selectively disable logging methods on `console` object. Uses spyOn so that
   * changes will be reverted after leaving the test scope that it is set in. If
   * no method names are given, all will be disabled.
   * @param methodNames The console methods to disable.
   */
  static disableConsoleOutput = (...methodNames: ConsoleMethodName[]): void => {
    if (methodNames.length === 0) {
      // eslint-disable-next-line no-param-reassign
      methodNames = Object.getOwnPropertyNames(console).filter(
        (name): name is ConsoleMethodName =>
          // eslint-disable-next-line no-console
          typeof console[name as keyof Console] === 'function'
      );
    }

    methodNames.forEach(methodName => {
      jest.spyOn(console, methodName).mockImplementation();
    });
  };

  /**
   * Find all call args for a given mock function that match a given predicate.
   * @param fn jest.Mock function to search calls on
   * @param predicate Predicate function to match calls against
   * @returns An array of arguments for each call that matches the predicate
   */
  static findCalls = <TResult, TArgs extends unknown[]>(
    fn: (...args: TArgs) => TResult,
    predicate: (args: TArgs) => boolean
  ): TArgs[] => TestUtils.asMock(fn).mock.calls.filter(predicate);

  /**
   * Find the last mock function call matching a given predicate.
   * @param fn jest.Mock function
   * @param predicate Predicate function to match calls against
   */
  static findLastCall = <TResult, TArgs extends unknown[]>(
    fn: (...args: TArgs) => TResult,
    predicate: (args: TArgs) => boolean
  ): TArgs | undefined =>
    TestUtils.asMock(fn).mock.calls.reverse().find(predicate);

  /**
   * Find all event handlers registered on the `window` object for an event type.
   * This will only return handlers registered via a mocked `window.addEventListener`.
   * @param type
   * @returns An array of event handlers for the given event type.
   */
  static findWindowEventHandlers = <TKey extends keyof WindowEventMap>(
    type: TKey
  ): ((event: WindowEventMap[TKey]) => void)[] =>
    TestUtils.findCalls(window.addEventListener, ([arg0]) => arg0 === type).map(
      ([, handler]) => handler as (event: WindowEventMap[TKey]) => void
    );

  /*
   * Generate all possible combinations of boolean values for a given number of
   * variables
   * @param n The number of boolean values to generate combinations for.
   * @returns An array of tuples representing all possible combinations
   * of boolean values for the given number of values.
   */
  static generateBooleanCombinations = <T extends number>(
    n: T
  ): Tuple<boolean, T>[] => {
    const combinations = 2 ** n;
    const result: Tuple<boolean, T>[] = [];

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < combinations; i++) {
      // eslint-disable-next-line no-bitwise
      const binary = (i >>> 0).toString(2).padStart(n, '0');
      const bitArray = Array.from(binary).map(bit => bit === '1');
      result.push(bitArray as Tuple<boolean, T>);
    }

    return result;
  };

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
      canUsePanels: true,
      canCopy: true,
      canDownloadCsv: true,
      canLogout: true,
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
      altKey = false,
      dblClick = false,
      rightClick = false,
    } = options;

    if (ctrlKey) {
      await TestUtils.controlClick(user, element, dblClick, rightClick);
    } else if (shiftKey) {
      await TestUtils.shiftClick(user, element, dblClick, rightClick);
    } else if (altKey) {
      await TestUtils.altClick(user, element, dblClick, rightClick);
    } else if (dblClick) {
      await user.dblClick(element);
    } else if (rightClick) {
      await TestUtils.rightClick(user, element);
    } else {
      await user.click(element);
    }
  }

  /**
   * Jest doesn't have a built in way to ensure native Promises have resolved
   * when using fake timers. We can mimic this behavior by using `process.nextTick`.
   * Since `process.nextTick` is mocked by default when using jest.useFakeTimers(),
   * we use the "real" process.nextTick stored in `TestUtils.realNextTick`.
   *
   * NOTE: Jest can be configured to leave `process.nextTick` unmocked, but this
   * requires devs to configure it on every test.
   * e.g.
   * jest.useFakeTimers({
   *   doNotFake: ['nextTick'],
   * });
   */
  static async flushPromises(): Promise<void> {
    await new Promise(TestUtils.realNextTick ?? (() => undefined));
  }

  static async rightClick(
    user: ReturnType<typeof userEvent.setup>,
    element: Element
  ): Promise<void> {
    await user.pointer([
      { target: element },
      { keys: '[MouseRight]', target: element },
    ]);
  }

  private static async clickWithModifier(
    user: ReturnType<typeof userEvent.setup>,
    element: Element,
    modifier: string,
    dblClick = false,
    rightClick = false
  ): Promise<void> {
    await user.keyboard(`{${modifier}>}`);
    if (dblClick) {
      await user.dblClick(element);
    } else if (rightClick) {
      await TestUtils.rightClick(user, element);
    } else {
      await user.click(element);
    }
    await user.keyboard(`{/${modifier}}`);
  }

  static async controlClick(
    user: ReturnType<typeof userEvent.setup>,
    element: Element,
    dblClick = false,
    rightClick = false
  ): Promise<void> {
    await TestUtils.clickWithModifier(
      user,
      element,
      'Control',
      dblClick,
      rightClick
    );
  }

  static async altClick(
    user: ReturnType<typeof userEvent.setup>,
    element: Element,
    dblClick = false,
    rightClick = false
  ): Promise<void> {
    await TestUtils.clickWithModifier(
      user,
      element,
      'Alt',
      dblClick,
      rightClick
    );
  }

  /**
   * Set up the mock for window.parent or window.opener, and return a cleanup function.
   * @param type Whether to mock window.parent or window.opener
   * @param mockPostMessage The mock postMessage function to use
   * @returns Cleanup function
   */
  static setupWindowParentMock = (
    type: 'parent' | 'opener',
    mockPostMessage: jest.Mock = jest.fn(),
    mockWindow?: Window
  ): (() => void) => {
    if (type !== 'parent' && type !== 'opener') {
      throw new Error(`Invalid type ${type}`);
    }

    if (type === 'parent') {
      const windowParentSpy = jest
        .spyOn(window, 'parent', 'get')
        .mockReturnValue(
          mockWindow ??
            TestUtils.createMockProxy<Window>({
              postMessage: mockPostMessage,
            })
        );
      return () => {
        windowParentSpy.mockRestore();
      };
    }

    const originalWindowOpener = window.opener;
    window.opener = mockWindow ?? { postMessage: mockPostMessage };
    return () => {
      window.opener = originalWindowOpener;
    };
  };

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
   */
  static createMockProxy = createMockProxy;

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
