import { CSSTransition } from 'react-transition-group';
import type { CSSTransitionProps } from 'react-transition-group/CSSTransition';
import type { EndHandler } from 'react-transition-group/Transition';
import classNames from 'classnames';
import ThemeExport from '../ThemeExport';

type FadeTransitionProps<Ref extends undefined | HTMLElement = undefined> =
  // We default the timeout, so user doesn't need to provide it
  // However, CSSTransitionProps get confused if you don't provide a timeout, it requires an endHandler
  // We're just making the endHandler optional here, as the timeout has a default
  Omit<CSSTransitionProps<Ref>, 'addEndHandler'> & {
    addEndHandler?: EndHandler<Ref> | undefined;
  };

/**
 * Fade between two components. Defaults to 150ms transition.
 */
function FadeTransition<Ref extends undefined | HTMLElement = undefined>({
  className,
  timeout = ThemeExport.transitionMs,
  ...props
}: FadeTransitionProps<Ref>): JSX.Element {
  return (
    <CSSTransition
      timeout={timeout}
      classNames={classNames('fade', className)}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

export default FadeTransition;
