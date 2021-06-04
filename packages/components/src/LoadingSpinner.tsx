import React from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsCircleLargeOutline, vsLoading } from '@deephaven/icons';
import './LoadingSpinner.scss';

type LoadingSpinnerProps = {
  className: string;
};

const LoadingSpinner = ({
  className = '',
}: LoadingSpinnerProps): JSX.Element => (
  <div className={classNames('loading-spinner fa-layers', className)}>
    <FontAwesomeIcon icon={vsCircleLargeOutline} className="text-white-50" />
    <FontAwesomeIcon icon={vsLoading} className="text-primary" spin />
  </div>
);

export default LoadingSpinner;
