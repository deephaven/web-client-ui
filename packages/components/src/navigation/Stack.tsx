import React, { useState, useMemo, useCallback } from 'react';
import './Stack.scss';
import { SlideTransition } from '../transitions';

export type StackProps = {
  /**
   * Stack views to animate between. Each child must be a React element with a
   * stable `key`; views are tracked by that key across re-renders (primitive
   * nodes such as strings/numbers are not supported).
   */
  children: React.ReactElement | React.ReactElement[];
  'data-testid'?: string;
};

/**
 * Returns the React `key` for an element, or `null` for non-elements.
 *
 * The parent that renders the stack may re-render frequently (e.g. an
 * `IrisGrid` re-renders on every table tick) and hand us brand-new element
 * objects that represent the same logical view. Tracking the animating views
 * by `key` (rather than by element reference) means those re-renders neither
 * retrigger the slide animation nor churn state every frame.
 *
 * Children are always run through `React.Children.toArray`, which assigns a
 * stable key to every element, so element views always have a key.
 */
function getViewKey(node: React.ReactNode): React.Key | null {
  return React.isValidElement(node) ? node.key : null;
}

/**
 * Finds the child that currently represents the view identified by `key`.
 *
 * Returning the *current* element (instead of a stored copy) keeps the rendered
 * view's content live: when a parent re-renders with a new element instance for
 * the same logical view, the view's latest props are forwarded to the mounted
 * component. This matters for prop-driven panels such as the "Organize Columns"
 * (`VisibilityOrderingBuilder`) sidebar, whose list contents and Undo/Redo state
 * arrive entirely via props from the grid - freezing those props would stop the
 * panel from reflecting moves, hides, groupings, and undo/redo.
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

/**
 * A view rendered by the stack. `key` identifies the child it renders, and `id`
 * identifies the mounted instance. A view keeps its `id` while it moves from
 * pushing to main to popping, so it stays mounted. A view that is popped and
 * put back on top gets a new `id`, so it mounts as a new page instead of
 * reusing the state of the instance that is still animating out.
 */
type StackView = {
  key: React.Key;
  id: number;
};

/**
 * The popping view has already been removed from `children`, so we keep the
 * element instance itself - it is only animating out and its content does not
 * need to stay live.
 */
type PoppingView = {
  element: React.ReactNode;
  id: number;
};

/**
 * `mainView` - The main view of the stack, stationary, filling the container.
 * `pushingView` - A view that's currently being pushed. Slides from off screen right to overtop of `mainView`.
 * `poppingView` - A view that's currently being popped. Slides from overtop of `mainView` to right off screen.
 *
 * The views are tracked by `key`, not element identity, so that frequent
 * parent re-renders (which produce new-but-equivalent elements) neither
 * retrigger animations nor freeze content. The element actually rendered is
 * always looked up from the latest children via `findViewByKey`, keeping each
 * view's props live.
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
 * Sets the proper pushing/popping views when the stack changes, which kicks
 * off their animation. Completion is handled in `Stack`'s `pushComplete` or
 * `popComplete`, and then the stack is in an idle state again.
 *
 * Views are compared by `key` (see `getViewKey`) so that a parent that
 * re-renders with new element instances for the same logical view does not
 * retrigger animations or churn state on every render.
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
    // We're mid-push. Keep the pushing view pointed at the current top view,
    // but don't start a new animation.
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

  // The state is adjusted while rendering rather than in an effect, so a render
  // where `children` changed is never committed with stale views. Committing
  // one would unmount a view whose key is missing from `children` and remount
  // it once an effect caught up.
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

  const mainElement = findViewByKey(childrenArray, mainView?.key ?? null);
  const pushingElement = findViewByKey(childrenArray, pushingView?.key ?? null);

  // Every view is rendered as a sibling in the same parent, keyed by its
  // instance `id` and ordered from the bottom of the stack to the top. When a
  // view changes role (pushing -> main -> popping) only its wrapper's class
  // changes, so React keeps the view mounted instead of remounting it.
  // Remounting would discard the view's internal state and rerun its mount
  // effects, and a popping view would rerun them with the stale props it was
  // rendered with before it was popped.
  return (
    <div className="navigation-stack">
      {(mainView == null || mainElement == null) && (
        <div className="main-view" data-testid={dataTestId} />
      )}
      {mainView != null && mainElement != null && (
        <SlideTransition key={mainView.id} in>
          <div className="main-view" data-testid={dataTestId}>
            {mainElement}
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
          <div className="popping-view">{poppingView.element}</div>
        </SlideTransition>
      )}
      {pushingView != null && pushingElement != null && (
        <SlideTransition
          key={pushingView.id}
          in
          appear
          onEntered={pushComplete}
        >
          <div className="pushing-view">{pushingElement}</div>
        </SlideTransition>
      )}
    </div>
  );
}

export default Stack;
