import { useLayoutEffect } from 'react';
import classNames from 'classnames';
import { DOMUtils } from '@deephaven/utils';
import './LoadingSpinner.scss';

type LoadingSpinnerProps = {
  className?: string;
  'data-testid'?: string;
};

function LoadingSpinner({
  className = '',
  'data-testid': dataTestId,
}: LoadingSpinnerProps): JSX.Element {
  useLayoutEffect(() => {
    // Ensure all of our loading spinner animations are synchronized based
    // on same start time.
    DOMUtils.syncAnimationStartTime('loading-spinner-rotate', 0);
  }, []);

  return (
    <div
      className={classNames('loading-spinner', className)}
      aria-label="Loading..."
      aria-valuemin={0}
      aria-valuemax={100}
      data-testid={dataTestId}
      role="progressbar"
    />
  );
}

export default LoadingSpinner;
