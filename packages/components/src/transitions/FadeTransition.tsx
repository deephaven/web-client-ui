import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import type { CSSTransitionProps } from 'react-transition-group/CSSTransition';
import type { EndHandler } from 'react-transition-group/Transition';
import classNames from 'classnames';
import type { RemoveIndexSignature } from '@deephaven/utils';
import ThemeExport from '../ThemeExport';

type FadeTransitionProps =
  // We default the timeout, so user doesn't need to provide it
  // However, CSSTransitionProps get confused if you don't provide a timeout, it requires an endHandler
  // We're just making the endHandler optional here, as the timeout has a default
  Omit<
    RemoveIndexSignature<CSSTransitionProps<HTMLDivElement>>,
    'addEndHandler' | 'children'
  > & {
    addEndHandler?: EndHandler<HTMLDivElement> | undefined;
    children?: React.ReactNode;
  };

/**
 * Fade between two components. Defaults to 150ms transition.
 */
function FadeTransition({
  classNames: classNamesProp,
  timeout = ThemeExport.transitionMs,
  children,
  ...props
}: FadeTransitionProps): JSX.Element {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <CSSTransition
      nodeRef={nodeRef}
      timeout={timeout}
      classNames={classNames('fade', classNamesProp)}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {children}
      </div>
    </CSSTransition>
  );
}

export default FadeTransition;
