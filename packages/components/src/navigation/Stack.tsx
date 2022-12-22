import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CSSTransition } from 'react-transition-group';
import { usePrevious } from '@deephaven/react-hooks';
import ThemeExport from '../ThemeExport';
import './Stack.scss';

export type StackProps = {
  children: React.ReactNode | React.ReactNode[];
  'data-testid'?: string;
};

/**
 * Pass a full navigation stack of children, and then automatically does a sliding animation when the stack changes.
 * Adding items to the stack will do a "push" animation, and removing items from the stack will do a "pop" animation.
 */
export function Stack({
  children,
  'data-testid': dataTestId,
}: StackProps): JSX.Element {
  const childrenArray = useMemo(() => React.Children.toArray(children), [
    children,
  ]);
  const prevChildrenArray = usePrevious(childrenArray);
  const [mainView, setMainView] = useState<React.ReactNode>(
    childrenArray[childrenArray.length - 1]
  );

  const [pushingView, setPushingView] = useState<React.ReactNode>(null);
  const [poppingView, setPoppingView] = useState<React.ReactNode>(null);

  /**
   * To do the animation effect, we just need to set the proper pushing/popping views when the stack changes.
   * `mainView` - The main view of the stack, stationary, filling the container.
   * `pushingView` - A view that's currently being pushed. Slides from off screen right to overtop of `mainView`.
   * `poppingView` - A view that's currently being popped. Slides from overtop of `mainView` to right off screen.
   *
   * When the `pushingView` or `poppingView` is set, that will kick off their animation.
   * Completion of the animation is handled in `pushComplete` or `popComplete`, and then the stack is in an idle state again.
   */
  useEffect(
    function initAnimation() {
      if (
        prevChildrenArray === undefined ||
        childrenArray === prevChildrenArray
      ) {
        return;
      }
      const topChild = childrenArray[childrenArray.length - 1];
      if (
        childrenArray.length === prevChildrenArray.length ||
        prevChildrenArray.length === 0 ||
        pushingView !== null ||
        poppingView !== null
      ) {
        // 1) Stack is the same size, we've just mounted, or we're already in an animation - just update the view
        if (pushingView !== null && topChild !== pushingView) {
          // Stack was updated mid animation
          setPushingView(topChild);
        } else if (topChild !== poppingView && topChild !== mainView) {
          // Replace the current view
          setMainView(topChild);
        }
      } else if (childrenArray.length > prevChildrenArray.length) {
        // 2) Stack has grown - start the push animation
        setPushingView(topChild);
      } else if (childrenArray.length < prevChildrenArray.length) {
        // 3) Stack has shrunk - start the pop animation
        setMainView(topChild);
        setPoppingView(prevChildrenArray[prevChildrenArray.length - 1]);
      }
    },
    [childrenArray, prevChildrenArray, pushingView, poppingView, mainView]
  );

  const pushComplete = useCallback(() => {
    setMainView(pushingView);
    setPushingView(null);
  }, [pushingView]);

  const popComplete = useCallback(() => {
    setPoppingView(null);
  }, []);

  return (
    <div className="navigation-stack">
      <div className="main-view" data-testid={dataTestId}>
        {mainView}
      </div>

      <CSSTransition
        in={poppingView != null}
        timeout={ThemeExport.transitionMidMs}
        classNames="slide-right"
        onEntered={popComplete}
      >
        {/* Without the fragment, the transition doesn't work. Without the conditional render, the stack is blank */}
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <>
          {poppingView != null && (
            <div className="popping-view">{poppingView}</div>
          )}
        </>
      </CSSTransition>
      <CSSTransition
        in={pushingView != null}
        timeout={ThemeExport.transitionMidMs}
        classNames="slide-left"
        onEntered={pushComplete}
      >
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <>
          {pushingView != null && (
            <div className="pushing-view">{pushingView}</div>
          )}
        </>
      </CSSTransition>
    </div>
  );
}

export default Stack;
