import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsCircleLargeOutline, vsLoading } from '@deephaven/icons';
import './LoadingSpinner.scss';

const LoadingSpinner = ({ className }) => (
  <div className={classNames('loading-spinner fa-layers', className)}>
    <FontAwesomeIcon icon={vsCircleLargeOutline} className="text-white-50" />
    <FontAwesomeIcon icon={vsLoading} className="text-primary" spin />
  </div>
);

LoadingSpinner.propTypes = {
  className: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  className: null,
};

export default LoadingSpinner;
