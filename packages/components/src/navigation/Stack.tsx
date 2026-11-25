import React, {
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';
import './Stack.scss';
import { SlideTransition } from '../transitions';

export type StackProps = {
  /** Views to animate between. Each child needs a stable `key`; views are tracked by it. */
  children: React.ReactElement | React.ReactElement[];
  'data-testid'?: string;
};

/** Returns the React `key` of an element, or `null` for non-elements. */
function getViewKey(node: React.ReactNode): React.Key | null {
  return React.isValidElement(node) ? node.key : null;
}

/**
 * Finds the current element for `key`, so a view's props stay live when the
 * parent re-renders (e.g. undo/redo state in `VisibilityOrderingBuilder`).
 */
function findViewByKey(
  views: readonly React.ReactNode[],
  key: React.Key | null
): React.ReactNode {
  if (key == null) {
    return null;
  }
  return views.find(view => getViewKey(view) === key) ?? null;
}

// React 18's types don't include `inert`
const INERT_PROPS = { inert: '' } as React.HTMLAttributes<HTMLDivElement>;

/**
 * `key` identifies the child to render. `id` identifies the mounted instance:
 * it stays the same through pushing, main and popping, and a re-pushed key gets
 * a new one so it doesn't reuse the instance that is still animating out.
 */
type StackView = {
  key: React.Key;
  id: number;
};

/** Kept as an element because the popping view is already gone from `children`. */
type PoppingView = {
  element: React.ReactNode;
  id: number;
};

/**
 * `mainView` - The main view of the stack, stationary, filling the container.
 * `pushingView` - A view that's currently being pushed. Slides from off screen right to overtop of `mainView`.
 * `poppingView` - A view that's currently being popped. Slides from overtop of `mainView` to right off screen.
 *
 * Views are tracked by `key` rather than element identity, so parents that
 * re-render with equivalent elements don't retrigger animations.
 */
type StackState = {
  /** The children this state was derived from */
  childrenArray: readonly React.ReactNode[];
  nextViewId: number;
  mainView: StackView | null;
  pushingView: StackView | null;
  poppingView: PoppingView | null;
};

function getInitialState(
  childrenArray: readonly React.ReactNode[]
): StackState {
  const key = getViewKey(childrenArray[childrenArray.length - 1]);
  return {
    childrenArray,
    nextViewId: 1,
    mainView: key == null ? null : { key, id: 0 },
    pushingView: null,
    poppingView: null,
  };
}

/**
 * Sets the pushing/popping views when the stack changes, which starts their
 * animation. `pushComplete` and `popComplete` return the stack to idle.
 */
function getNextState(
  state: StackState,
  childrenArray: readonly React.ReactNode[]
): StackState {
  const { mainView, pushingView, poppingView } = state;
  const prevChildrenArray = state.childrenArray;
  const mainViewKey = mainView?.key ?? null;
  const topChildKey = getViewKey(childrenArray[childrenArray.length - 1]);
  const next: StackState = { ...state, childrenArray };

  const createView = (): StackView | null => {
    if (topChildKey == null) {
      return null;
    }
    const view = { key: topChildKey, id: next.nextViewId };
    next.nextViewId += 1;
    return view;
  };

  if (pushingView !== null) {
    // Mid-push: retarget the pushing view without starting a new animation
    if (topChildKey === mainViewKey) {
      // The stack went back to the main view before the push completed
      next.pushingView = null;
    } else if (topChildKey !== pushingView.key) {
      // A different view was pushed mid-animation - animate to it instead
      next.pushingView = createView();
    }
  } else if (topChildKey === mainViewKey) {
    // The top view is unchanged, so there is nothing to animate
  } else if (
    poppingView !== null ||
    childrenArray.length === prevChildrenArray.length ||
    prevChildrenArray.length === 0
  ) {
    // Mid-pop, or the stack is the same size or was empty - just update the
    // main view without starting a new animation
    next.mainView = createView();
  } else if (childrenArray.length > prevChildrenArray.length) {
    // Stack has grown - start the push animation
    next.pushingView = createView();
  } else {
    // Stack has shrunk - start the pop animation
    next.mainView = createView();
    const poppingElement = findViewByKey(prevChildrenArray, mainViewKey);
    if (mainView !== null && poppingElement != null) {
      next.poppingView = { element: poppingElement, id: mainView.id };
    }
  }

  return next;
}

/**
 * Pass a full navigation stack of children, and then automatically does a sliding animation when the stack changes.
 * Adding items to the stack will do a "push" animation, and removing items from the stack will do a "pop" animation.
 */
export function Stack({
  children,
  'data-testid': dataTestId,
}: StackProps): JSX.Element {
  const childrenArray = useMemo(
    () => React.Children.toArray(children),
    [children]
  );
  const [state, setState] = useState(() => getInitialState(childrenArray));

  // Adjusted during render rather than in an effect so a commit never has a
  // view key that is missing from `children`, which would unmount the view.
  let currentState = state;
  if (childrenArray !== state.childrenArray) {
    currentState = getNextState(state, childrenArray);
    setState(currentState);
  }
  const { mainView, pushingView, poppingView } = currentState;

  const pushComplete = useCallback(() => {
    setState(s => ({ ...s, mainView: s.pushingView, pushingView: null }));
  }, []);

  const popComplete = useCallback(() => {
    setState(s => ({ ...s, poppingView: null }));
  }, []);

  const mainViewRef = useRef<HTMLDivElement>(null);
  const poppingViewRef = useRef<HTMLDivElement>(null);
  const poppingViewId = poppingView?.id;
  useLayoutEffect(
    function moveFocusOffPoppingView() {
      if (poppingViewRef.current?.contains(document.activeElement) === true) {
        mainViewRef.current?.focus({ preventScroll: true });
      }
    },
    [poppingViewId]
  );

  const mainElement = findViewByKey(childrenArray, mainView?.key ?? null);
  const pushingElement = findViewByKey(childrenArray, pushingView?.key ?? null);

  // Views are keyed by `id` and keep the same inner `view-content` wrapper in
  // every role, so changing role only changes the outer class and the view
  // stays mounted. Only the popping `view-content` is inert; the outer wrapper
  // still absorbs pointer input so clicks don't reach the main view.
  return (
    <div className="navigation-stack">
      {(mainView == null || mainElement == null) && (
        <div
          className="main-view"
          data-testid={dataTestId}
          tabIndex={-1}
          ref={mainViewRef}
        />
      )}
      {mainView != null && mainElement != null && (
        <SlideTransition key={mainView.id} in>
          <div
            className="main-view"
            data-testid={dataTestId}
            tabIndex={-1}
            ref={mainViewRef}
          >
            <div className="view-content">{mainElement}</div>
          </div>
        </SlideTransition>
      )}
      {poppingView != null && (
        <SlideTransition
          key={poppingView.id}
          in={false}
          onExited={popComplete}
          unmountOnExit
        >
          <div className="popping-view" ref={poppingViewRef}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <div className="view-content" {...INERT_PROPS}>
              {poppingView.element}
            </div>
          </div>
        </SlideTransition>
      )}
      {pushingView != null && pushingElement != null && (
        <SlideTransition
          key={pushingView.id}
          in
          appear
          onEntered={pushComplete}
        >
          <div className="pushing-view">
            <div className="view-content">{pushingElement}</div>
          </div>
        </SlideTransition>
      )}
    </div>
  );
}

export default Stack;
