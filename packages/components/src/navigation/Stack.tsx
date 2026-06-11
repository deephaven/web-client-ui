import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePrevious } from '@deephaven/react-hooks';
import './Stack.scss';
import { SlideTransition } from '../transitions';

export type StackProps = {
  children: React.ReactNode | React.ReactNode[];
  'data-testid'?: string;
};

/**
 * Identifies a stack view by its React `key` rather than by element identity.
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
  const prevChildrenArray = usePrevious(childrenArray);

  // The animating views are tracked by `key`, not element identity, so that
  // frequent parent re-renders (which produce new-but-equivalent elements)
  // neither retrigger animations nor freeze content. The element actually
  // rendered is always looked up from the latest `childrenArray` via
  // `findViewByKey`, keeping each view's props live.
  const [mainViewKey, setMainViewKey] = useState<React.Key | null>(() =>
    getViewKey(childrenArray[childrenArray.length - 1])
  );

  const [pushingViewKey, setPushingViewKey] = useState<React.Key | null>(null);

  // The popping view has already been removed from `children`, so we keep the
  // element instance itself - it is only animating out and its content does not
  // need to stay live.
  const [poppingView, setPoppingView] = useState<React.ReactNode>(null);

  /**
   * To do the animation effect, we just need to set the proper pushing/popping views when the stack changes.
   * `mainView` - The main view of the stack, stationary, filling the container.
   * `pushingView` - A view that's currently being pushed. Slides from off screen right to overtop of `mainView`.
   * `poppingView` - A view that's currently being popped. Slides from overtop of `mainView` to right off screen.
   *
   * When the `pushingView` or `poppingView` is set, that will kick off their animation.
   * Completion of the animation is handled in `pushComplete` or `popComplete`, and then the stack is in an idle state again.
   *
   * Views are compared by `key` (see `getViewKey`) so that a parent that
   * re-renders with new element instances for the same logical view does not
   * retrigger animations or churn state on every render.
   */
  useEffect(
    function initAnimation() {
      if (
        prevChildrenArray === undefined ||
        childrenArray === prevChildrenArray
      ) {
        return;
      }
      const topChildKey = getViewKey(childrenArray[childrenArray.length - 1]);

      if (pushingViewKey !== null || poppingView !== null) {
        // We're mid-animation. Keep the animating view pointed at the current
        // top view, but don't start a new animation.
        if (pushingViewKey !== null) {
          if (topChildKey !== pushingViewKey) {
            // A different view was pushed mid-animation - animate to it instead
            setPushingViewKey(topChildKey);
          }
        } else if (topChildKey !== mainViewKey) {
          setMainViewKey(topChildKey);
        }
      } else if (
        childrenArray.length === prevChildrenArray.length ||
        prevChildrenArray.length === 0
      ) {
        // Stack is the same size or we've just mounted - just update the view
        if (topChildKey !== mainViewKey) {
          setMainViewKey(topChildKey);
        }
      } else if (childrenArray.length > prevChildrenArray.length) {
        // Stack has grown - start the push animation
        setPushingViewKey(topChildKey);
      } else {
        // Stack has shrunk - start the pop animation
        setMainViewKey(topChildKey);
        setPoppingView(prevChildrenArray[prevChildrenArray.length - 1]);
      }
    },
    [childrenArray, prevChildrenArray, pushingViewKey, poppingView, mainViewKey]
  );

  const pushComplete = useCallback(() => {
    setMainViewKey(pushingViewKey);
    setPushingViewKey(null);
  }, [pushingViewKey]);

  const popComplete = useCallback(() => {
    setPoppingView(null);
  }, []);

  const mainView = findViewByKey(childrenArray, mainViewKey);
  const pushingView = findViewByKey(childrenArray, pushingViewKey);

  return (
    <div className="navigation-stack">
      <div className="main-view" data-testid={dataTestId}>
        {mainView}
      </div>

      <SlideTransition
        direction="right"
        in={poppingView != null}
        onEntered={popComplete}
      >
        {/* Without the fragment, the transition doesn't work. Without the conditional render, the stack is blank */}
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <>
          {poppingView != null && (
            <div className="popping-view">{poppingView}</div>
          )}
        </>
      </SlideTransition>
      <SlideTransition in={pushingView != null} onEntered={pushComplete}>
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <>
          {pushingView != null && (
            <div className="pushing-view">{pushingView}</div>
          )}
        </>
      </SlideTransition>
    </div>
  );
}

export default Stack;
