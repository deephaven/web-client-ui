import React from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsCircleLargeOutline, vsLoading } from '@deephaven/icons';
import './LoadingSpinner.scss';

type LoadingSpinnerProps = {
  className?: string;
  'data-testid'?: string;
};

function LoadingSpinner({
  className = '',
  'data-testid': dataTestId,
}: LoadingSpinnerProps): JSX.Element {
  return (
    <div
      className={classNames('loading-spinner fa-layers', className)}
      data-testid={dataTestId}
    >
      <FontAwesomeIcon icon={vsCircleLargeOutline} className="text-white-50" />
      <FontAwesomeIcon icon={vsLoading} className="text-primary" spin />
    </div>
  );
}

export default LoadingSpinner;
