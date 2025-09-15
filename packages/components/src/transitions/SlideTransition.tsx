// SlideTransition class uses CSSTransition with slide-left and slide-right classNames, depending on the prop direction. The transition is 250ms long.
import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import type { CSSTransitionProps } from 'react-transition-group/CSSTransition';
import type { EndHandler } from 'react-transition-group/Transition';
import classNames from 'classnames';
import type { RemoveIndexSignature } from '@deephaven/utils';
import ThemeExport from '../ThemeExport';

type SlideDirection = 'left' | 'right';

type SlideTransitionProps =
  // We default the timeout, so user doesn't need to provide it
  // However, CSSTransitionProps get confused if you don't provide a timeout, it requires an endHandler
  // We're just making the endHandler optional here, as the timeout has a default
  Omit<
    RemoveIndexSignature<CSSTransitionProps<HTMLDivElement>>,
    'addEndHandler'
  > & {
    addEndHandler?: EndHandler<HTMLDivElement> | undefined;
    children?: React.ReactNode;
    /**
     * The direction of the slide transition. Defaults to left.
     */
    direction?: SlideDirection;

    timeout?: number;
  };

/**
 * Slides one component overtop of another component.
 * Defaults to sliding left, unless `direction='right'` is provided.
 * Timeout defaults to 200ms.
 */
function SlideTransition({
  direction = 'left',
  classNames: classNamesProp,
  children,

  /** Defaults to mid */
  timeout = ThemeExport.transitionMidMs,
  ...props
}: SlideTransitionProps): JSX.Element {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <CSSTransition
      nodeRef={nodeRef}
      timeout={timeout}
      classNames={classNames(`slide-${direction}`, classNamesProp)}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {children}
      </div>
    </CSSTransition>
  );
}

export default SlideTransition;
