import { useCallback, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import type { CSSTransitionProps } from 'react-transition-group/CSSTransition';
import type {
  EndHandler,
  EnterHandler,
} from 'react-transition-group/Transition';
import classNames from 'classnames';
import type { RemoveIndexSignature } from '@deephaven/utils';
import ThemeExport from '../ThemeExport';

const DISPLAY_CONTENTS = { display: 'contents' };

type FadeTransitionProps =
  // We default the timeout, so user doesn't need to provide it
  // However, CSSTransitionProps get confused if you don't provide a timeout, it requires an endHandler
  // We're just making the endHandler optional here, as the timeout has a default
  Omit<
    RemoveIndexSignature<CSSTransitionProps<HTMLElement>>,
    'addEndHandler' | 'children' | 'onEnter'
  > & {
    addEndHandler?: EndHandler<HTMLElement> | undefined;
    onEnter?: EnterHandler<undefined>;
    children?: React.ReactNode;
  };

/**
 * Fade between two components. Defaults to 150ms transition.
 */
function FadeTransition({
  classNames: classNamesProp,
  timeout = ThemeExport.transitionMs,
  children,
  onEnter,
  ...props
}: FadeTransitionProps): JSX.Element {
  const nodeRef = useRef<HTMLElement | null>(null);
  const handleOnEnter = useCallback(
    (isAppearing: boolean) => {
      const elem = nodeRef.current;
      if (!elem) {
        return;
      }
      onEnter?.(elem, isAppearing);
    },
    [onEnter]
  );

  // Mimics findDOMNode for CSSTransition
  // The ref should be set before CSSTransition does anything with it
  const setRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node?.firstElementChild as HTMLElement;
  }, []);

  return (
    <CSSTransition
      nodeRef={nodeRef}
      timeout={timeout}
      classNames={classNames('fade', classNamesProp)}
      onEnter={handleOnEnter}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      <div ref={setRef} style={DISPLAY_CONTENTS}>
        {children}
      </div>
    </CSSTransition>
  );
}

export default FadeTransition;
