/**
 * Adapted from https://www.npmjs.com/package/its-fine to support React 17.
 * The main change is using `nanoid` instead of `useId` which doesn't exist in React 17.
 * Also tweaked a bit of the code to match our style and removed the parts we don't use.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from 'nanoid';
import * as React from 'react';
import type ReactReconciler from 'react-reconciler';

/**
 * Represents a react-internal Fiber node.
 */
type Fiber<T = any> = Omit<ReactReconciler.Fiber, 'stateNode'> & {
  stateNode: T;
};

/**
 * Represents a {@link Fiber} node selector for traversal.
 */
type FiberSelector<T = any> = (
  /** The current {@link Fiber} node. */
  node: Fiber<T | null>
) => boolean | void;

/**
 * Traverses up or down a {@link Fiber}, return `true` to stop and select a node.
 */
function traverseFiber<T = any>(
  /** Input {@link Fiber} to traverse. */
  fiber: Fiber | undefined,
  /** Whether to ascend and walk up the tree. Will walk down if `false`. */
  ascending: boolean,
  /** A {@link Fiber} node selector, returns the first match when `true` is passed. */
  selector: FiberSelector<T>
): Fiber<T> | undefined {
  if (!fiber) {
    return;
  }
  if (selector(fiber) === true) {
    return fiber;
  }

  let child = ascending ? fiber.return : fiber.child;
  while (child) {
    const match = traverseFiber(child, ascending, selector);
    if (match) {
      return match;
    }

    child = ascending ? null : child.sibling;
  }
}

// In development, React will warn about using contexts between renderers.
// Hide the warning because its-fine fixes this issue
// https://github.com/facebook/react/pull/12779
function wrapContext<T>(context: React.Context<T>): React.Context<T> {
  try {
    return Object.defineProperties(context, {
      _currentRenderer: {
        get() {
          return null;
        },
        set() {
          /* no-op */
        },
      },
      _currentRenderer2: {
        get() {
          return null;
        },
        set() {
          /* no-op */
        },
      },
    });
  } catch (_) {
    return context;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
const FiberContext = /* @__PURE__ */ wrapContext(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  /* @__PURE__ */ React.createContext<Fiber>(null!)
);

/**
 * A react-internal {@link Fiber} provider. This component binds React children to the React Fiber tree. Call its-fine hooks within this.
 */
export class FiberProvider extends React.Component<{
  children?: React.ReactNode;
}> {
  private _reactInternals!: Fiber;

  render(): JSX.Element {
    const { children } = this.props;
    return (
      // eslint-disable-next-line no-underscore-dangle
      <FiberContext.Provider value={this._reactInternals}>
        {children}
      </FiberContext.Provider>
    );
  }
}

/**
 * Returns the current react-internal {@link Fiber}. This is an implementation detail of [react-reconciler](https://github.com/facebook/react/tree/main/packages/react-reconciler).
 */
export function useFiber(): Fiber<null> | undefined {
  const root = React.useContext(FiberContext);
  if (root === null) {
    throw new Error('useFiber must be called within a <FiberProvider />!');
  }

  const [id] = React.useState(() => nanoid());
  const actualFiber = React.useMemo(() => {
    // eslint-disable-next-line no-restricted-syntax
    for (const maybeFiber of [root, root?.alternate].filter(r => r != null)) {
      const fiber = traverseFiber<null>(maybeFiber, false, node => {
        let state = node.memoizedState;
        while (state != null) {
          if (state.memoizedState === id) {
            return true;
          }
          state = state.next;
        }
      });

      if (fiber) {
        return fiber;
      }
    }
  }, [root, id]);

  return actualFiber;
}
