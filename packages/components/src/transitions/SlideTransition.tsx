// SlideTransition class uses CSSTransition with slide-left and slide-right classNames, depending on the prop direction. The transition is 250ms long.
//
import { CSSTransition } from 'react-transition-group';
import type { CSSTransitionProps } from 'react-transition-group/CSSTransition';
import type { EndHandler } from 'react-transition-group/Transition';

import classNames from 'classnames';
import ThemeExport from '../ThemeExport';

type SlideDirection = 'left' | 'right';

type SlideTransitionProps<Ref extends undefined | HTMLElement = undefined> =
  // We default the timeout, so user doesn't need to provide it
  // However, CSSTransitionProps get confused if you don't provide a timeout, it requires an endHandler
  // We're just making the endHandler optional here, as the timeout has a default
  Omit<CSSTransitionProps<Ref>, 'addEndHandler'> & {
    addEndHandler?: EndHandler<Ref> | undefined;
  } & {
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
  className,

  /** Defaults to mid */
  timeout = ThemeExport.transitionMidMs,
  ...props
}: SlideTransitionProps): JSX.Element {
  return (
    <CSSTransition
      timeout={timeout}
      classNames={classNames(`slide-${direction}`, className)}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

export default SlideTransition;
